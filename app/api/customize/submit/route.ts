import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import nodemailer from "nodemailer";
import {
  getCustomizeConfig,
  isCustomizeEligible,
  checkAndRecordRateLimit,
  isDuplicateSubmission,
  createLead,
  markEmailSending,
  markEmailDelivered,
  markEmailFailed,
  markSlackSent,
  markSlackFailed,
} from "@/lib/firestore-customize";
import type { SlackDeliveryState } from "@/types/customize";
import { adminDb } from "@/lib/firebase-admin";
import { callSlackApi } from "@/lib/slack";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) throw new Error("IP_HASH_SECRET environment variable is not set.");
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function sanitize(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Accept digits, spaces, dashes, parens, plus — at least 7 chars after stripping
  return phone.replace(/[\s\-().+]/g, "").length >= 7;
}

// ── Slack helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the Slack channel ID for the current environment.
 * Production → SLACK_CHANNEL_ID (real channel)
 * Preview    → SLACK_TEST_CHANNEL_ID (optional separate test channel, or skip)
 * Other      → skip
 * Never exposes the token in logs or responses.
 */
function getSlackConfig(): { token: string; channel: string } | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;

  const env = process.env.VERCEL_ENV; // "production" | "preview" | undefined
  if (env === "production") {
    const channel = process.env.SLACK_CHANNEL_ID;
    return channel ? { token, channel } : null;
  }
  if (env === "preview") {
    const channel = process.env.SLACK_TEST_CHANNEL_ID;
    return channel ? { token, channel } : null;
  }
  // Local dev: skip Slack unless both vars are set (useful for local testing)
  const channel = process.env.SLACK_CHANNEL_ID ?? process.env.SLACK_TEST_CHANNEL_ID;
  return channel ? { token, channel } : null;
}

// ── Gmail SMTP transport ──────────────────────────────────────────────────────

function createTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS via STARTTLS on 587
    auth: { user, pass },
  });
}

function buildEmailHtml(d: {
  leadId: string;
  fullName: string;
  businessEmail: string;
  phone: string;
  businessWebsiteUrl: string;
  requirements: string;
  productName: string;
  productUrl: string;
  submittedAt: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0f;color:#e4e4e7;padding:32px;max-width:600px;margin:0 auto">
  <div style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:28px">
    <h2 style="color:#3b82f6;margin:0 0 4px">🔧 New Customization Request</h2>
    <p style="color:#71717a;margin:0 0 24px;font-size:13px">Reference: ${esc(d.leadId)} · ${esc(d.submittedAt)}</p>

    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px;width:160px;vertical-align:top">Product</td>
          <td style="padding:8px 0"><a href="${esc(d.productUrl)}" style="color:#60a5fa">${esc(d.productName)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px;vertical-align:top">Full Name</td>
          <td style="padding:8px 0">${esc(d.fullName)}</td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px;vertical-align:top">Email</td>
          <td style="padding:8px 0"><a href="mailto:${esc(d.businessEmail)}" style="color:#60a5fa">${esc(d.businessEmail)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px;vertical-align:top">Phone</td>
          <td style="padding:8px 0">${esc(d.phone)}</td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px;vertical-align:top">Business Website</td>
          <td style="padding:8px 0">${d.businessWebsiteUrl ? `<a href="${esc(d.businessWebsiteUrl)}" style="color:#60a5fa">${esc(d.businessWebsiteUrl)}</a>` : "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px;vertical-align:top">Source URL</td>
          <td style="padding:8px 0"><a href="${esc(d.productUrl)}" style="color:#60a5fa">${esc(d.productUrl)}</a></td></tr>
    </table>

    ${d.requirements ? `
    <div style="margin-top:20px;background:#1c2333;border-radius:8px;padding:16px">
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px">Customization Requirements</p>
      <p style="margin:0;white-space:pre-line">${esc(d.requirements)}</p>
    </div>` : ""}

    <p style="margin-top:20px;font-size:12px;color:#52525b">
      Lead reference: <strong>${esc(d.leadId)}</strong><br>
      Submitted via NOFA AI Factory™ Customize
    </p>
  </div>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

/**
 * POST /api/customize/submit
 *
 * Validates all fields server-side, checks honeypot, rate limits, and
 * duplicate submissions. Saves the lead to Firestore FIRST. Then attempts
 * SMTP delivery via Gmail with atomic delivery-state tracking to prevent
 * duplicate sends on uncertain state. Returns the Calendly URL on success.
 */
export async function POST(req: NextRequest) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 415 });
  }

  const raw = await req.text();
  if (raw.length > 10_000) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Honeypot
  if (body._hp) {
    return NextResponse.json({ success: true });
  }

  // Field extraction
  const productSlug = sanitize(body.productSlug, 120);
  const fullName = sanitize(body.fullName, 200);
  const businessEmail = sanitize(body.businessEmail, 254);
  const phone = sanitize(body.phone, 30);
  const businessWebsiteUrl = sanitize(body.businessWebsiteUrl, 500);
  const requirements = sanitize(body.requirements, 2000);
  const utmSource = sanitize(body.utmSource, 100);
  const utmMedium = sanitize(body.utmMedium, 100);
  const utmCampaign = sanitize(body.utmCampaign, 100);

  // Required field validation
  if (!productSlug) return NextResponse.json({ error: "Missing product." }, { status: 400 });
  if (!fullName) return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  if (!businessEmail || !isValidEmail(businessEmail)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  }

  // Rate limiting (atomic)
  let ipHash: string;
  try {
    ipHash = hashIp(getClientIp(req));
  } catch (err) {
    console.error("[customize/submit] IP_HASH_SECRET not configured:", err);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }

  try {
    if (await checkAndRecordRateLimit(ipHash)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
  } catch { /* continue */ }

  // Duplicate detection
  try {
    if (await isDuplicateSubmission(businessEmail, productSlug)) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "We already received your inquiry for this product. We'll be in touch soon!",
      });
    }
  } catch { /* continue */ }

  // Product eligibility (server-side)
  if (!adminDb) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const [config, productSnap] = await Promise.all([
    getCustomizeConfig(),
    adminDb
      .collection("products")
      .where("slug", "==", productSlug)
      .where("published", "==", true)
      .limit(1)
      .get(),
  ]);

  if (productSnap.empty) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const productData = productSnap.docs[0].data();
  const productId = productSnap.docs[0].id;
  const productName = productData.name ?? "";

  if (!isCustomizeEligible(
    {
      isClientOwned: productData.isClientOwned === true,
      clientCustomizationAuthorized: productData.clientCustomizationAuthorized === true,
      hasStripeSubscription: productData.hasStripeSubscription === true,
      customizeEnabled: typeof productData.customizeEnabled === "boolean"
        ? productData.customizeEnabled : undefined,
    },
    config.masterEnabled,
    config.newProductDefault
  )) {
    return NextResponse.json(
      { error: "Customization is not available for this product." },
      { status: 403 }
    );
  }

  const productUrl = `https://nofaaifactory.com/products/${productSlug}`;

  // ── Save lead to Firestore FIRST ──────────────────────────────────────────

  const slackCfg = getSlackConfig();
  const initialSlackState: SlackDeliveryState = slackCfg ? "pending" : "not_configured";

  let leadId: string;
  try {
    leadId = await createLead({
      productId,
      productName,
      productSlug,
      productUrl,
      fullName,
      businessEmail,
      phone,
      businessWebsiteUrl,
      requirements,
      slackDeliveryState: initialSlackState,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
    });
  } catch (err) {
    console.error("[customize/submit] Failed to save lead:", err);
    return NextResponse.json({ error: "Failed to save inquiry. Please try again." }, { status: 500 });
  }

  // ── Slack notification (fire-and-forget, never blocks ticket creation) ────

  if (slackCfg) {
    (async () => {
      const sent = await callSlackApi(slackCfg.token, slackCfg.channel, {
        leadId, productName, productUrl, fullName, businessEmail, phone,
      });
      if (sent) {
        await markSlackSent(leadId).catch(() => {});
      } else {
        console.error("[customize/submit] Slack alert failed for lead", leadId);
        await markSlackFailed(leadId).catch(() => {});
      }
    })().catch(() => {});
  }

  // ── Atomic delivery-state gate + SMTP ────────────────────────────────────

  try {
    const action = await markEmailSending(leadId);

    if (action === "proceed") {
      const transport = createTransport();
      if (transport) {
        const submittedAt = new Date().toUTCString();
        const { error: smtpError } = await (async () => {
          try {
            await transport.sendMail({
              from: `NOFA AI Factory <${process.env.SMTP_USER}>`,
              to: config.notifyEmail,
              subject: "customization", // exact — CommandDesk routes on this
              html: buildEmailHtml({
                leadId,
                fullName,
                businessEmail,
                phone,
                businessWebsiteUrl,
                requirements,
                productName,
                productUrl,
                submittedAt,
              }),
            });
            return { error: null };
          } catch (e) {
            return { error: e };
          }
        })();

        if (!smtpError) {
          await markEmailDelivered(leadId).catch(() => {});
        } else {
          console.error("[customize/submit] SMTP failed:", smtpError);
          await markEmailFailed(leadId).catch(() => {});
        }
      } else {
        // SMTP not configured — mark as failed so admin can see it
        await markEmailFailed(leadId).catch(() => {});
        console.warn("[customize/submit] SMTP_USER or SMTP_APP_PASSWORD not configured.");
      }
    }
    // "skip" = already delivered or uncertain — do nothing
  } catch (err) {
    console.error("[customize/submit] Delivery-state error:", err);
    // Lead is saved; email state may be inconsistent — admin can review
  }

  return NextResponse.json({
    success: true,
    leadId,
    calendlyUrl: config.calendlyUrl || null,
  });
}
