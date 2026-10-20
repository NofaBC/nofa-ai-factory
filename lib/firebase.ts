import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase client SDK.
 * Wrapped in try/catch so the production build succeeds in environments where
 * NEXT_PUBLIC_FIREBASE_* env vars are not set (e.g. CI, local builds without .env.local).
 * At runtime on Vercel the env vars are present and all exports are fully initialized.
 */
let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

try {
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
} catch {
  // Suppress: build environments without Firebase config.
  // Runtime usage will always have valid env vars via Vercel.
}

export const app = _app as FirebaseApp;
export const auth = _auth as Auth;
export const db = _db as Firestore;
export default app;
