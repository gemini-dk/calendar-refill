import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const ensureFirebaseApp = (): FirebaseApp => {
  const requiredKeys: Array<[keyof typeof firebaseConfig, string | undefined]> = [
    ["apiKey", firebaseConfig.apiKey],
    ["authDomain", firebaseConfig.authDomain],
    ["projectId", firebaseConfig.projectId],
    ["appId", firebaseConfig.appId],
  ];

  const missing = requiredKeys
    .filter(([, value]) => !value)
    .map(([key]) => key)
    .join(", ");

  if (missing) {
    throw new Error(`Missing Firebase config values: ${missing}`);
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
};

export const firebaseApp = ensureFirebaseApp();
export const firestore = getFirestore(firebaseApp);
