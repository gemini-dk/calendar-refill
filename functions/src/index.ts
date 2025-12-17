import { initializeApp, getApps } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import PDFDocument from "pdfkit";

import { registerPdfFonts } from "./system-notebook/fonts";
import { generateSystemNotebookPdfBuffer } from "./system-notebook/pdf";

type StripeSessionDocument = {
  userId?: string;
  sessionId?: string;
  calendarId?: string;
  fiscalYear?: string;
  buyerEmail?: string;
  status?: string;
  BUCKET?: string;
  bucket?: string;
};

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp();
}

function getBucket(bucketName: string) {
  const storage = getStorage(getAdminApp());
  return storage.bucket(bucketName);
}

export const onStripeSessionPaid = onDocumentWritten(
  {
    region: "asia-northeast1",
    document: "stripe_sessions/{sessionId}",
    timeoutSeconds: 300,
    memory: "1GiB",
  },
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;

    const sessionId = String(event.params.sessionId ?? "").trim();
    const data = after.data() as StripeSessionDocument | undefined;

    const userId = data?.userId?.trim();
    const fiscalYear = data?.fiscalYear?.trim();
    const calendarId = data?.calendarId?.trim();
    const buyerEmail = data?.buyerEmail?.trim();
    const status = data?.status?.trim();
    const bucketName = (data?.BUCKET ?? data?.bucket)?.trim();

    if (!sessionId || !userId || !fiscalYear || !calendarId) return;

    const db = getFirestore(getAdminApp());
    const sessionDocRef = db.collection("stripe_sessions").doc(sessionId);
    const stripeDocRef = db.collection("stripe").doc(userId);

    if (status !== "paid_processing") return;
    if (!bucketName) {
      logger.error("Missing BUCKET field in stripe_sessions document");
      await Promise.allSettled([
        sessionDocRef.set(
          {
            status: "failed",
            statusUpdatedAt: FieldValue.serverTimestamp(),
            errorMessage: "Missing BUCKET field",
          },
          { merge: true },
        ),
        stripeDocRef.set(
          {
            status: "failed",
            statusUpdatedAt: FieldValue.serverTimestamp(),
            errorMessage: "Missing BUCKET field",
          },
          { merge: true },
        ),
      ]);
      return;
    }

    let shouldProcess = false;
    try {
      await db.runTransaction(async (tx) => {
        const fresh = await tx.get(sessionDocRef);
        const freshStatus = (fresh.data() as StripeSessionDocument | undefined)?.status?.trim();
        if (freshStatus !== "paid_processing") return;

        shouldProcess = true;
        const update = {
          status: "generating_pdf",
          statusUpdatedAt: FieldValue.serverTimestamp(),
        };
        tx.set(sessionDocRef, update, { merge: true });
        tx.set(stripeDocRef, update, { merge: true });
      });
    } catch (error) {
      logger.error("Failed to transition status to generating_pdf", error);
      return;
    }

    if (!shouldProcess) return;

    try {
      const pdfDoc = new PDFDocument({ autoFirstPage: false, margin: 0 });
      const fonts = await registerPdfFonts({ bucket: getBucket(bucketName), doc: pdfDoc });
      const pdfBuffer = await generateSystemNotebookPdfBuffer({
        doc: pdfDoc,
        fiscalYear,
        calendarId,
        buyerEmail,
        fonts,
      });

      const bucket = getBucket(bucketName);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      const filePath = `system-notebook/${userId}/${fiscalYear}-${calendarId}-${Date.now()}.pdf`;
      const file = bucket.file(filePath);
      const downloadToken = crypto.randomUUID();

      await file.save(pdfBuffer, {
        contentType: "application/pdf",
        resumable: false,
        metadata: {
          metadata: { userId, fiscalYear, calendarId, firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
        bucketName,
      )}/o/${encodeURIComponent(filePath)}?alt=media&token=${encodeURIComponent(downloadToken)}`;

      await Promise.all([
        sessionDocRef.set(
          {
            status: "completed",
            statusUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        stripeDocRef.set(
          {
            status: "completed",
            statusUpdatedAt: FieldValue.serverTimestamp(),
            downloadUrl: {
              url: downloadUrl,
              expiresAt: Timestamp.fromDate(expiresAt),
              path: filePath,
            },
            downloadUrlUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      ]);
    } catch (error) {
      logger.error("Failed to generate or save PDF", error);
      await Promise.allSettled([
        sessionDocRef.set(
          {
            status: "failed",
            statusUpdatedAt: FieldValue.serverTimestamp(),
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          { merge: true },
        ),
        stripeDocRef.set(
          {
            status: "failed",
            statusUpdatedAt: FieldValue.serverTimestamp(),
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          { merge: true },
        ),
      ]);
    }
  },
);
