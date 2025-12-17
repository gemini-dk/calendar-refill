import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;

function initializeFirebaseApp() {
  if (!privateKey || !clientEmail) {
    throw new Error("Firebase admin credentials are not fully configured.");
  }

  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getDb() {
  const app = initializeFirebaseApp();
  return getFirestore(app);
}

export function getStorageBucket() {
  const app = initializeFirebaseApp();
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new Error("FIREBASE_STORAGE_BUCKET is not configured.");
  }

  return getStorage(app).bucket(bucketName);
}
