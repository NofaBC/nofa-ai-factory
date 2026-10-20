/**
 * Firebase Admin SDK — SERVER ONLY.
 * Import only from Next.js API routes (app/api/**) or server actions.
 * Never import from client components or pages marked "use client".
 */

import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    // In development without credentials, skip initialization gracefully.
    // API routes that require admin will return 503.
    console.warn("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON not set.");
    return;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (e) {
    console.error("[firebase-admin] Failed to initialize:", e);
  }
}

initAdmin();

/** Firebase Admin Auth — use for verifyIdToken() on admin API routes */
export const adminAuth = admin.apps.length ? admin.auth() : null;

/** Firebase Admin Firestore — use for privileged reads/writes */
export const adminDb = admin.apps.length ? admin.firestore() : null;

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
  let decoded;
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
