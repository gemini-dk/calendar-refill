import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function requireDebugAccess(req: Request) {
  if (process.env.NODE_ENV !== "production") return;

  const expected = process.env.DEBUG_TRIGGER_TOKEN?.trim();
  const provided = req.headers.get("x-debug-token")?.trim();
  if (!expected || !provided || expected !== provided) {
    throw new Error("Forbidden");
  }
}

export async function POST(req: Request) {
  try {
    requireDebugAccess(req);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessionId = crypto.randomUUID();
  const fiscalYear = String(new Date().getFullYear());
  const calendarId = "debug-calendar";
  const userId = `debug-user-${sessionId.slice(0, 8)}`;
  const buyerEmail = "debug@example.com";
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();

  if (!bucketName) {
    return NextResponse.json(
      { error: "FIREBASE_STORAGE_BUCKET is not configured" },
      { status: 500 },
    );
  }

  const db = getDb();
  await db.collection("stripe_sessions").doc(sessionId).set(
    {
      sessionId,
      userId,
      fiscalYear,
      calendarId,
      buyerEmail,
      BUCKET: bucketName,
      status: "paid_processing",
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({ sessionId, userId });
}
