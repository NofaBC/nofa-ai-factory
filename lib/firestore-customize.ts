/**
 * Server-side Firestore helpers for NOFA Customize™.
 * All functions use the Firebase Admin SDK — import only from API routes.
 */

import { adminDb } from "./firebase-admin";
import type { Firestore, Transaction, Query, DocumentData } from "firebase-admin/firestore";
import {
  CustomizeConfig,
  CustomizeLead,
  LeadStatus,
  DEFAULT_CUSTOMIZE_CONFIG,
} from "@/types/customize";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const CONFIG_DOC = "customizeConfig/global";
const LEADS_COL = "customizeLeads";
const RATE_COL = "rateLimits";

/** Returns the Firestore instance or throws if Admin SDK is not initialized. */
function getDb(): Firestore {
  if (!adminDb) throw new Error("Firebase Admin not initialized.");
  return adminDb;
}

function toTs(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === "string") return val;
  return new Date().toISOString();
}

// ── Config ─────────────────────────────────────────────────────────────────

export async function getCustomizeConfig(): Promise<CustomizeConfig> {
  const db = getDb();
  const snap = await db.doc(CONFIG_DOC).get();
  if (!snap.exists) return { ...DEFAULT_CUSTOMIZE_CONFIG };
  const d = snap.data()!;
  return {
    masterEnabled: d.masterEnabled ?? DEFAULT_CUSTOMIZE_CONFIG.masterEnabled,
    buttonText: d.buttonText ?? DEFAULT_CUSTOMIZE_CONFIG.buttonText,
    introMessage: d.introMessage ?? DEFAULT_CUSTOMIZE_CONFIG.introMessage,
    calendlyUrl: d.calendlyUrl ?? "",
    notifyEmail: d.notifyEmail ?? DEFAULT_CUSTOMIZE_CONFIG.notifyEmail,
    newProductDefault: d.newProductDefault ?? DEFAULT_CUSTOMIZE_CONFIG.newProductDefault,
    updatedAt: toTs(d.updatedAt),
  };
}

export async function saveCustomizeConfig(
  data: Omit<CustomizeConfig, "updatedAt">
): Promise<void> {
  const db = getDb();
  await db.doc(CONFIG_DOC).set(
    { ...data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

// ── Eligibility ────────────────────────────────────────────────────────────

/**
 * Server-side eligibility check — enforced on every form submission and config endpoint.
 *
 * Rules (in priority order):
 * 1. masterEnabled = false → never eligible.
 * 2. isClientOwned = true → ineligible UNLESS customizeEnabled is explicitly true.
 *    (Separate explicit authorization required for client-owned products.)
 * 3. customizeEnabled = false (force-off) → ineligible.
 * 4. customizeEnabled = undefined (inherit) → apply newProductDefault.
 * 5. Otherwise eligible.
 */
export function isCustomizeEligible(
  product: { isClientOwned: boolean; customizeEnabled?: boolean },
  masterEnabled: boolean,
  newProductDefault = true
): boolean {
  if (!masterEnabled) return false;
  // Client-owned: requires SEPARATE explicit authorization (customizeEnabled = true)
  if (product.isClientOwned && product.customizeEnabled !== true) return false;
  // Admin forced off for this product
  if (product.customizeEnabled === false) return false;
  // No explicit override — apply the admin-configured new-product default
  if (product.customizeEnabled === undefined && !newProductDefault) return false;
  return true;
}

// ── Rate limiting (atomic Firestore transaction) ──────────────────────────

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
const RATE_MAX = 3;

/**
 * Atomically checks the rate limit and, if not exceeded, records the hit.
 * Returns true if the request should be blocked (rate limit exceeded).
 * The check-and-record is a single Firestore transaction to eliminate TOCTOU races.
 */
export async function checkAndRecordRateLimit(ipHash: string): Promise<boolean> {
  const db = getDb();
  const ref = db.doc(`${RATE_COL}/${ipHash}`);
  let blocked = false;

  await db.runTransaction(async (txn: Transaction) => {
    const snap = await txn.get(ref);

    if (!snap.exists) {
      // First submission from this IP — create record
      txn.set(ref, { lastSubmitAt: FieldValue.serverTimestamp(), count: 1, windowStart: FieldValue.serverTimestamp() });
      return;
    }

    const d = snap.data()!;
    const lastTs = d.lastSubmitAt as Timestamp | undefined;
    const elapsed = lastTs ? Date.now() - lastTs.toMillis() : Infinity;

    if (elapsed > RATE_WINDOW_MS) {
      // Window has expired — reset counter
      txn.set(ref, { lastSubmitAt: FieldValue.serverTimestamp(), count: 1, windowStart: FieldValue.serverTimestamp() });
      return;
    }

    const count = (d.count as number) ?? 0;
    if (count >= RATE_MAX) {
      blocked = true; // Do not increment — just signal blocked
      return;
    }

    // Within window and under limit — increment (plain arithmetic inside txn)
    txn.update(ref, {
      lastSubmitAt: FieldValue.serverTimestamp(),
      count: count + 1,
    });
  });

  return blocked;
}

// ── Duplicate detection ────────────────────────────────────────────────────

const DUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function isDuplicateSubmission(
  businessEmail: string,
  productSlug: string
): Promise<boolean> {
  const db = getDb();
  const cutoff = Timestamp.fromMillis(Date.now() - DUPE_WINDOW_MS);
  const snap = await db
    .collection(LEADS_COL)
    .where("businessEmail", "==", businessEmail.toLowerCase().trim())
    .where("productSlug", "==", productSlug)
    .where("submittedAt", ">=", cutoff)
    .limit(1)
    .get();
  return !snap.empty;
}

// ── Leads ──────────────────────────────────────────────────────────────────

export type LeadInput = Omit<CustomizeLead, "id" | "submittedAt" | "status" | "emailSent">;

export async function createLead(
  data: LeadInput,
  emailSent: boolean
): Promise<string> {
  const db = getDb();
  const ref = await db.collection(LEADS_COL).add({
    ...data,
    businessEmail: data.businessEmail.toLowerCase().trim(),
    status: "New" as LeadStatus,
    emailSent,
    submittedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getLeads(productSlug?: string): Promise<CustomizeLead[]> {
  const db = getDb();
  let q: Query<DocumentData> = db.collection(LEADS_COL).orderBy("submittedAt", "desc");
  if (productSlug) q = q.where("productSlug", "==", productSlug);

  const snap = await q.limit(200).get();
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      productId: r.productId ?? "",
      productName: r.productName ?? "",
      productSlug: r.productSlug ?? "",
      productUrl: r.productUrl ?? "",
      fullName: r.fullName ?? "",
      businessEmail: r.businessEmail ?? "",
      company: r.company ?? "",
      industry: r.industry ?? "",
      requirements: r.requirements ?? "",
      timeline: r.timeline ?? "",
      status: (r.status ?? "New") as LeadStatus,
      emailSent: r.emailSent === true,
      submittedAt: toTs(r.submittedAt),
      utmSource: r.utmSource,
      utmMedium: r.utmMedium,
      utmCampaign: r.utmCampaign,
    } satisfies CustomizeLead;
  });
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const db = getDb();
  await db.collection(LEADS_COL).doc(id).update({ status });
}
