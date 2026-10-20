/**
 * Server-side Firestore helpers for NOFA Customize™.
 * All functions use the Firebase Admin SDK — import only from API routes.
 */

import { adminDb } from "./firebase-admin";
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

function assertDb(): asserts adminDb is NonNullable<typeof adminDb> {
  if (!adminDb) throw new Error("Firebase Admin not initialized.");
}

function toTs(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === "string") return val;
  return new Date().toISOString();
}

// ── Config ─────────────────────────────────────────────────────────────────

export async function getCustomizeConfig(): Promise<CustomizeConfig> {
  assertDb();
  const snap = await adminDb.doc(CONFIG_DOC).get();
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
  assertDb();
  await adminDb.doc(CONFIG_DOC).set(
    { ...data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

// ── Eligibility ────────────────────────────────────────────────────────────

/**
 * Server-side eligibility check — enforced on every form submission.
 * Client-owned products are excluded unless customizeEnabled is explicitly true.
 */
export function isCustomizeEligible(
  product: { isClientOwned: boolean; customizeEnabled?: boolean },
  masterEnabled: boolean
): boolean {
  if (!masterEnabled) return false;
  if (product.isClientOwned && product.customizeEnabled !== true) return false;
  if (product.customizeEnabled === false) return false;
  return true;
}

// ── Rate limiting ──────────────────────────────────────────────────────────

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
const RATE_MAX = 3;

export async function isRateLimited(ipHash: string): Promise<boolean> {
  assertDb();
  const snap = await adminDb.doc(`${RATE_COL}/${ipHash}`).get();
  if (!snap.exists) return false;
  const d = snap.data()!;
  const lastTs = d.lastSubmitAt as Timestamp | undefined;
  if (!lastTs) return false;
  const elapsed = Date.now() - lastTs.toMillis();
  if (elapsed > RATE_WINDOW_MS) return false;
  return (d.count ?? 0) >= RATE_MAX;
}

export async function recordRateLimitHit(ipHash: string): Promise<void> {
  assertDb();
  const ref = adminDb.doc(`${RATE_COL}/${ipHash}`);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ lastSubmitAt: FieldValue.serverTimestamp(), count: 1 });
    return;
  }
  const lastTs = snap.data()?.lastSubmitAt as Timestamp | undefined;
  const elapsed = lastTs ? Date.now() - lastTs.toMillis() : Infinity;
  if (elapsed > RATE_WINDOW_MS) {
    await ref.set({ lastSubmitAt: FieldValue.serverTimestamp(), count: 1 });
  } else {
    await ref.update({
      lastSubmitAt: FieldValue.serverTimestamp(),
      count: FieldValue.increment(1),
    });
  }
}

// ── Duplicate detection ────────────────────────────────────────────────────

const DUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function isDuplicateSubmission(
  businessEmail: string,
  productSlug: string
): Promise<boolean> {
  assertDb();
  const cutoff = Timestamp.fromMillis(Date.now() - DUPE_WINDOW_MS);
  const snap = await adminDb
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
  assertDb();
  const ref = await adminDb.collection(LEADS_COL).add({
    ...data,
    businessEmail: data.businessEmail.toLowerCase().trim(),
    status: "New" as LeadStatus,
    emailSent,
    submittedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getLeads(productSlug?: string): Promise<CustomizeLead[]> {
  assertDb();
  let q = adminDb.collection(LEADS_COL).orderBy("submittedAt", "desc") as FirebaseFirestore.Query;
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
  assertDb();
  await adminDb.collection(LEADS_COL).doc(id).update({ status });
}
