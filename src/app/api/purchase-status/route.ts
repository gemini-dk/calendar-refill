import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeDocument = {
  status?: string;
  downloadUrl?: {
    url?: string;
  };
};

type StripeSessionDocument = {
  userId?: string;
  sessionId?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const db = getDb();

  try {
    const sessionSnap = await db.collection("stripe_sessions").doc(sessionId).get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ status: "processing" });
    }

    const sessionData = sessionSnap.data() as StripeSessionDocument | undefined;
    const userId = sessionData?.userId?.trim();

    if (!userId) {
      return NextResponse.json({ error: "stripe_sessions document is missing userId" }, { status: 500 });
    }

    const stripeSnap = await db.collection("stripe").doc(userId).get();
    const stripeData = stripeSnap.exists ? (stripeSnap.data() as StripeDocument) : undefined;

    return NextResponse.json({
      status: stripeData?.status ?? "processing",
      downloadUrl: stripeData?.downloadUrl ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch purchase status", error);
    return NextResponse.json({ error: "Failed to fetch purchase status" }, { status: 500 });
  }
}
