"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function ensureFirebaseClient(): FirebaseClient {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}

const client = ensureFirebaseClient();

export const firebaseAuth = client.auth;
export const firestore = client.firestore;
