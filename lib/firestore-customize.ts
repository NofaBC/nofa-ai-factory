/**
 * Server-side Firestore helpers for NOFA Customize™.
 * All functions use the Firebase Admin SDK — import only from API routes.
 */

import { adminDb } from "./firebase-admin";
import type { Firestore, Transaction, Query, DocumentData } from "firebase-admin/firestore";
import {
  CustomizeConfig,
  CustomizeLead,
  EmailDeliveryState,
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
 * 2. isClientOwned = true → requires BOTH:
 *    a. clientCustomizationAuthorized = true  (contractual authorization from the client)
 *    b. customizeEnabled ≠ false              (admin has not force-disabled this product)
 *    These are independent checks. Neither alone is sufficient for client-owned products.
 * 3. Non-client-owned:
 *    a. customizeEnabled = false → ineligible.
 *    b. customizeEnabled = undefined → apply newProductDefault.
 *    c. customizeEnabled = true → eligible.
 */
export function isCustomizeEligible(
  product: {
    isClientOwned: boolean;
    clientCustomizationAuthorized: boolean;
    customizeEnabled?: boolean;
  },
  masterEnabled: boolean,
  newProductDefault = true
): boolean {
  if (!masterEnabled) return false;

  if (product.isClientOwned) {
    if (!product.clientCustomizationAuthorized) return false;
    if (product.customizeEnabled === false) return false;
    return true;
  }

  if (product.customizeEnabled === false) return false;
  if (product.customizeEnabled === undefined && !newProductDefault) return false;
  return true;
}

// ── Rate limiting (atomic Firestore transaction) ──────────────────────────

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;

export async function checkAndRecordRateLimit(ipHash: string): Promise<boolean> {
  const db = getDb();
  const ref = db.doc(`${RATE_COL}/${ipHash}`);
  let blocked = false;

  await db.runTransaction(async (txn: Transaction) => {
    const snap = await txn.get(ref);

    if (!snap.exists) {
      txn.set(ref, { lastSubmitAt: FieldValue.serverTimestamp(), count: 1, windowStart: FieldValue.serverTimestamp() });
      return;
    }

    const d = snap.data()!;
    const lastTs = d.lastSubmitAt as Timestamp | undefined;
    const elapsed = lastTs ? Date.now() - lastTs.toMillis() : Infinity;

    if (elapsed > RATE_WINDOW_MS) {
      txn.set(ref, { lastSubmitAt: FieldValue.serverTimestamp(), count: 1, windowStart: FieldValue.serverTimestamp() });
      return;
    }

    const count = (d.count as number) ?? 0;
    if (count >= RATE_MAX) {
      blocked = true;
      return;
    }

    txn.update(ref, { lastSubmitAt: FieldValue.serverTimestamp(), count: count + 1 });
  });

  return blocked;
}

// ── Duplicate detection ────────────────────────────────────────────────────

const DUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

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

export type LeadInput = Omit<CustomizeLead, "id" | "submittedAt" | "status" | "emailDeliveryState" | "emailAttemptedAt">;

export async function createLead(data: LeadInput): Promise<string> {
  const db = getDb();
  const ref = await db.collection(LEADS_COL).add({
    ...data,
    businessEmail: data.businessEmail.toLowerCase().trim(),
    status: "New" as LeadStatus,
    emailDeliveryState: "pending" as EmailDeliveryState,
    submittedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/**
 * Atomically transitions a lead's email delivery state from "pending" or "failed"
 * to "sending" before the SMTP call is made.
 *
 * Returns "proceed" if the SMTP call should be attempted.
 * Returns "skip" if the email was already delivered or is in an uncertain "sending" state.
 *
 * This prevents duplicate sends and avoids auto-retry on uncertain delivery.
 */
export async function markEmailSending(leadId: string): Promise<"proceed" | "skip"> {
  const db = getDb();
  const ref = db.collection(LEADS_COL).doc(leadId);
  let action: "proceed" | "skip" = "skip";

  await db.runTransaction(async (txn: Transaction) => {
    const snap = await txn.get(ref);
    if (!snap.exists) throw new Error(`Lead ${leadId} not found.`);

    const state = (snap.data()?.emailDeliveryState ?? "pending") as EmailDeliveryState;

    if (state === "delivered") {
      action = "skip"; // Already sent — do not re-send
      return;
    }

    if (state === "sending") {
      // Uncertain state: a previous attempt started but outcome is unknown.
      // Do NOT auto-retry — surface to admin for manual review.
      action = "skip";
      return;
    }

    // "pending" or "failed" → safe to proceed
    action = "proceed";
    txn.update(ref, {
      emailDeliveryState: "sending" as EmailDeliveryState,
      emailAttemptedAt: FieldValue.serverTimestamp(),
    });
  });

  return action;
}

export async function markEmailDelivered(leadId: string): Promise<void> {
  const db = getDb();
  await db.collection(LEADS_COL).doc(leadId).update({
    emailDeliveryState: "delivered" as EmailDeliveryState,
  });
}

export async function markEmailFailed(leadId: string): Promise<void> {
  const db = getDb();
  await db.collection(LEADS_COL).doc(leadId).update({
    emailDeliveryState: "failed" as EmailDeliveryState,
  });
}

export async function getLeads(productSlug?: string): Promise<CustomizeLead[]> {
  const db = getDb();
  let q: Query<DocumentData> = db.collection(LEADS_COL).orderBy("submittedAt", "desc");
  if (productSlug) q = q.where("productSlug", "==", productSlug);

  const snap = await q.limit(200).get();
  return snap.docs.map((d) => {
    const r = d.data();
    // Backward compat: old docs have emailSent boolean
    const legacyEmailSent = r.emailSent === true;
    const deliveryState: EmailDeliveryState =
      r.emailDeliveryState ?? (legacyEmailSent ? "delivered" : "pending");

    return {
      id: d.id,
      productId: r.productId ?? "",
      productName: r.productName ?? "",
      productSlug: r.productSlug ?? "",
      productUrl: r.productUrl ?? "",
      fullName: r.fullName ?? "",
      businessEmail: r.businessEmail ?? "",
      phone: r.phone ?? "",
      businessWebsiteUrl: r.businessWebsiteUrl ?? "",
      requirements: r.requirements ?? "",
      status: (r.status ?? "New") as LeadStatus,
      emailDeliveryState: deliveryState,
      emailAttemptedAt: r.emailAttemptedAt ? toTs(r.emailAttemptedAt) : undefined,
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
