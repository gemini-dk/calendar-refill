import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  try {
    requireDebugAccess(req);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId")?.trim();
  const userId = searchParams.get("userId")?.trim();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: "sessionId and userId are required" }, { status: 400 });
  }

  const db = getDb();
  const [sessionSnap, stripeSnap] = await Promise.all([
    db.collection("stripe_sessions").doc(sessionId).get(),
    db.collection("stripe").doc(userId).get(),
  ]);

  const sessionData = sessionSnap.exists ? (sessionSnap.data() as Record<string, unknown>) : {};
  const stripeData = stripeSnap.exists ? (stripeSnap.data() as Record<string, unknown>) : {};

  const status = typeof sessionData.status === "string" ? sessionData.status : null;
  const errorMessage =
    typeof sessionData.errorMessage === "string" ? sessionData.errorMessage : null;

  const downloadUrl =
    typeof stripeData.downloadUrl === "object" && stripeData.downloadUrl !== null
      ? (stripeData.downloadUrl as { url?: unknown }).url
      : null;

  return NextResponse.json({
    status,
    errorMessage,
    downloadUrl: typeof downloadUrl === "string" ? downloadUrl : null,
  });
}

