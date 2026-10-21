// ── NOFA Customize™ type definitions ──────────────────────────────────────────

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Consultation Scheduled"
  | "Proposal Sent"
  | "Won"
  | "Lost";

/**
 * Tracks the SMTP delivery lifecycle for each lead.
 * Replaces the simple emailSent boolean to prevent uncertain-state auto-retry.
 *
 * State machine:
 *   pending  → sending (atomic, before SMTP call)
 *   sending  → delivered | failed (after SMTP outcome)
 *
 * "sending" with a stale emailAttemptedAt (>5 min) = uncertain; do NOT auto-retry.
 */
export type EmailDeliveryState = "pending" | "sending" | "delivered" | "failed";

/** Stored in Firestore: customizeConfig/global */
export interface CustomizeConfig {
  masterEnabled: boolean;
  buttonText: string;
  introMessage: string;
  /** Calendly booking URL — editable in admin, never hardcoded */
  calendlyUrl: string;
  /** Notification email — editable in admin */
  notifyEmail: string;
  /** Default customizeEnabled value for newly published products */
  newProductDefault: boolean;
  updatedAt?: string; // ISO timestamp (serialized from Firestore Timestamp)
}

/** Minimum configuration returned to public clients.
 *  Never includes notifyEmail or calendlyUrl.
 */
export interface PublicCustomizeConfig {
  /** Whether customization is globally and per-product enabled */
  enabled: boolean;
  buttonText: string;
  introMessage: string;
}

/** Stored in Firestore: customizeLeads/{autoId} */
export interface CustomizeLead {
  id: string;
  // Product attribution
  productId: string;
  productName: string;
  productSlug: string;
  productUrl: string;
  // Prospect info
  fullName: string;
  businessEmail: string;
  phone: string;
  businessWebsiteUrl: string;
  requirements: string; // optional in form — stored as empty string when omitted
  // Status & delivery tracking
  status: LeadStatus;
  emailDeliveryState: EmailDeliveryState;
  emailAttemptedAt?: string; // ISO timestamp — set when state → "sending"
  submittedAt: string; // ISO timestamp
  // Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/** Default config applied when no Firestore document exists yet */
export const DEFAULT_CUSTOMIZE_CONFIG: CustomizeConfig = {
  masterEnabled: false, // OFF by default — enable in Admin after testing
  buttonText: "Customize This for My Business",
  introMessage:
    "NOFA AI Factory™ can customize this AI solution for your business, industry, workflows, and specific requirements.",
  calendlyUrl: "",
  notifyEmail: "supportdesk@nofabusinessconsulting.com",
  newProductDefault: true,
};

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Consultation Scheduled",
  "Proposal Sent",
  "Won",
  "Lost",
];
