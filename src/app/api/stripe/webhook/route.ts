import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const FIVE_MINUTES_IN_SECONDS = 60 * 5;

const SUPPORTED_EVENT_TYPES = new Set<StripeEventType>([
  "checkout.session.completed",
]);

type StripeEventType = "checkout.session.completed";

type StripeEvent = {
  id: string;
  type: StripeEventType | string;
  data: {
    object: {
      id?: string;
      metadata?: Record<string, string | null | undefined>;
      customer_email?: string | null;
      customer_details?: {
        email?: string | null;
      };
    } & Record<string, unknown>;
  };
};

type StripeSignature = {
  timestamp: number;
  signatures: string[];
};

type PaymentMetadata = {
  userId: string;
  calendarId: string;
  fiscalYear: string;
  sessionId?: string;
  buyerEmail?: string;
};

function parseStripeSignatureHeader(header: string | null): StripeSignature | null {
  if (!header) return null;

  const parts = header.split(",");
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;

    if (key === "t") {
      timestamp = Number(value);
    } else if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) return null;

  return { timestamp, signatures };
}

function timingSafeEqual(expected: string, actual: string) {
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);

  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function verifyStripeSignature(rawBody: string, header: StripeSignature, secret: string) {
  const payload = `${header.timestamp}.${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const withinTolerance =
    Math.abs(Math.floor(Date.now() / 1000) - header.timestamp) <= FIVE_MINUTES_IN_SECONDS;

  if (!withinTolerance) return false;

  return header.signatures.some((sig) => timingSafeEqual(expectedSig, sig));
}

function extractMetadata(event: StripeEvent): PaymentMetadata | null {
  const metadata = event.data?.object?.metadata;

  if (!metadata) return null;

  const userId = metadata.userId?.trim();
  const calendarId = metadata.calendarId?.trim();
  const fiscalYear = metadata.fiscalYear?.trim();
  const sessionId = metadata.sessionId?.trim() || event.data.object.id;
  const buyerEmail =
    event.data.object.customer_details?.email?.trim() ||
    event.data.object.customer_email?.trim() ||
    undefined;

  if (!userId || !calendarId || !fiscalYear) return null;

  return { userId, calendarId, fiscalYear, sessionId, buyerEmail };
}

async function enqueuePdfGenerationJob(metadata: PaymentMetadata) {
  const queueUrl =
    process.env.PDF_GENERATION_QUEUE_URL || process.env.PDF_FULL_GENERATION_QUEUE_URL;
  const queueToken = process.env.PDF_GENERATION_QUEUE_TOKEN;

  if (!queueUrl) return false;

  const response = await fetch(queueUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(queueToken ? { Authorization: `Bearer ${queueToken}` } : {}),
    },
    body: JSON.stringify({
      userId: metadata.userId,
      calendarId: metadata.calendarId,
      fiscalYear: metadata.fiscalYear,
      sessionId: metadata.sessionId,
      buyerEmail: metadata.buyerEmail,
      source: "stripe_webhook",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to enqueue PDF generation job: ${response.status} ${text}`);
  }

  return true;
}

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured" },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  const signatureHeader = parseStripeSignatureHeader(req.headers.get("stripe-signature"));

  if (!signatureHeader || !verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch (error) {
    console.error("Failed to parse webhook payload", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!SUPPORTED_EVENT_TYPES.has(event.type as StripeEventType)) {
    return NextResponse.json({ received: true });
  }

  const metadata = extractMetadata(event);
  if (!metadata) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ??
    null;

  const db = getDb();
  const userDocRef = db.collection("stripe").doc(metadata.userId);
  const sessionDocRef = metadata.sessionId
    ? db.collection("stripe_sessions").doc(metadata.sessionId)
    : null;
  let isDuplicate = false;

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userDocRef);
      const data = snap.data() ?? {};
      const processedEventIds = Array.isArray((data as { processedEventIds?: unknown }).processedEventIds)
        ? ((data as { processedEventIds?: string[] }).processedEventIds ?? [])
        : [];

      if (processedEventIds.includes(event.id)) {
        isDuplicate = true;
        return;
      }

      const baseUpdate = {
        status: "paid_processing",
        statusUpdatedAt: FieldValue.serverTimestamp(),
        sessionId: metadata.sessionId,
        calendarId: metadata.calendarId,
        fiscalYear: metadata.fiscalYear,
        BUCKET: bucketName,
        buyerEmail: metadata.buyerEmail ?? null,
        lastEventId: event.id,
        processedEventIds: FieldValue.arrayUnion(event.id),
      };

      tx.set(userDocRef, baseUpdate, { merge: true });

      if (sessionDocRef && metadata.sessionId) {
        tx.set(
          sessionDocRef,
          {
            userId: metadata.userId,
            ...baseUpdate,
          },
          { merge: true },
        );
      }
    });
  } catch (error) {
    console.error("Failed to update Firestore", error);
    return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 });
  }

  if (isDuplicate) {
    return NextResponse.json({ received: true });
  }

  try {
    const enqueued = await enqueuePdfGenerationJob(metadata);
    if (!enqueued) {
      console.warn(
        "PDF generation queue endpoint is not configured; skipping enqueue and relying on out-of-band processor (e.g. Firestore trigger).",
      );
    }
  } catch (error) {
    console.error("Failed to enqueue PDF generation job", error);
    return NextResponse.json({ error: "Failed to enqueue job" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
