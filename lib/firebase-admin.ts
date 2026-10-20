/**
 * Firebase Admin SDK — SERVER ONLY.
 * Import only from Next.js API routes (app/api/**) or server actions.
 * Never import from client components or pages marked "use client".
 *
 * firebase-admin v12 uses named exports per service sub-package.
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function initAdmin(): void {
  if (getApps().length > 0) {
    // Already initialized — reuse existing instances
    const app = getApps()[0];
    _app = app;
    _auth = getAuth(app);
    _db = getFirestore(app);
    return;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.warn("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON not set. Admin routes will return 503.");
    return;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    _app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    _auth = getAuth(_app);
    _db = getFirestore(_app);
  } catch (e) {
    console.error("[firebase-admin] Initialization failed:", e);
  }
}

initAdmin();

/** Firebase Admin Auth — use for verifyIdToken() on admin API routes */
export const adminAuth: Auth | null = _auth;

/** Firebase Admin Firestore — use for privileged reads/writes */
export const adminDb: Firestore | null = _db;

/**
 * Verify a Firebase ID token and confirm the decoded email matches
 * the authorized administrator identity.
 * Throws with a descriptive message on failure.
 */
export async function verifyAdminToken(authHeader: string | null): Promise<void> {
  if (!adminAuth) {
    throw new Error("Admin SDK not initialized — FIREBASE_SERVICE_ACCOUNT_JSON missing.");
  }
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header.");
  }

  const idToken = authHeader.slice(7);
  let decoded: Awaited<ReturnType<Auth["verifyIdToken"]>>;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new Error("Invalid or expired ID token.");
  }

  // Requirement: verify both token validity AND authorized admin identity
  const authorizedEmail = "farhad@nofabusinessconsulting.com";
  if (decoded.email?.toLowerCase() !== authorizedEmail) {
    throw new Error("Access denied: not an authorized administrator.");
  }
}
