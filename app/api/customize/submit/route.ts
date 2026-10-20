import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";
import {
  getCustomizeConfig,
  isCustomizeEligible,
  checkAndRecordRateLimit,
  isDuplicateSubmission,
  createLead,
} from "@/lib/firestore-customize";
import { adminDb } from "@/lib/firebase-admin";

const ALLOWED_TIMELINES = [
  "As soon as possible",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "Flexible / Exploring",
];

function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    // Fail hard: an unconfigured secret would make all hashes predictable.
    throw new Error("IP_HASH_SECRET environment variable is not set.");
  }
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

/**
 * POST /api/customize/submit
 *
 * Accepts a customization inquiry. Validates all fields server-side,
 * checks honeypot, rate limits, and duplicate submissions.
 * Saves the lead to Firestore BEFORE attempting email.
 * Returns the Calendly URL only on success.
 */
export async function POST(req: NextRequest) {
  // ── Content-type guard ──────────────────────────────────────────────────
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 415 });
  }

  // ── Body size guard (~10 KB max) ────────────────────────────────────────
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

  // ── Honeypot check ──────────────────────────────────────────────────────
  if (body._hp) {
    // Bot filled the hidden honeypot field — silently accept but do not save
    return NextResponse.json({ success: true });
  }

  // ── Field extraction and sanitization ──────────────────────────────────
  const productSlug = sanitize(body.productSlug, 120);
  const fullName = sanitize(body.fullName, 200);
  const businessEmail = sanitize(body.businessEmail, 254);
  const company = sanitize(body.company, 200);
  const industry = sanitize(body.industry, 200);
  const requirements = sanitize(body.requirements, 2000);
  const timeline = sanitize(body.timeline, 100);
  const utmSource = sanitize(body.utmSource, 100);
  const utmMedium = sanitize(body.utmMedium, 100);
  const utmCampaign = sanitize(body.utmCampaign, 100);

  // ── Required field validation ───────────────────────────────────────────
  if (!productSlug) return NextResponse.json({ error: "Missing product." }, { status: 400 });
  if (!fullName) return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  if (!businessEmail || !isValidEmail(businessEmail)) {
    return NextResponse.json({ error: "A valid business email is required." }, { status: 400 });
  }
  if (!requirements) {
    return NextResponse.json({ error: "Please describe what you'd like customized." }, { status: 400 });
  }
  if (timeline && !ALLOWED_TIMELINES.includes(timeline)) {
    return NextResponse.json({ error: "Invalid timeline value." }, { status: 400 });
  }

  // ── Rate limiting (atomic) ──────────────────────────────────
  let ipHash: string;
  try {
    ipHash = hashIp(getClientIp(req));
  } catch (err) {
    // IP_HASH_SECRET not set — refuse all submissions to protect integrity
    console.error("[customize/submit] IP_HASH_SECRET not configured:", err);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const blocked = await checkAndRecordRateLimit(ipHash);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
  } catch {
    // Rate limit check failed — continue to avoid blocking legitimate users
  }

  // ── Duplicate detection ──────────────────────────────────────────────────
  try {
    if (await isDuplicateSubmission(businessEmail, productSlug)) {
      return NextResponse.json(
        {
          success: true,
          duplicate: true,
          message:
            "We already received your inquiry for this product. We'll be in touch soon!",
        },
        { status: 200 }
      );
    }
  } catch {
    // Duplicate check failed — continue
  }

  // ── Server-side product eligibility verification ─────────────────────────
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

  if (
    !isCustomizeEligible(
      {
        isClientOwned: productData.isClientOwned === true,
        clientCustomizationAuthorized: productData.clientCustomizationAuthorized === true,
        customizeEnabled:
          typeof productData.customizeEnabled === "boolean"
            ? productData.customizeEnabled
            : undefined,
      },
      config.masterEnabled,
      config.newProductDefault
    )
  ) {
    return NextResponse.json(
      { error: "Customization is not available for this product." },
      { status: 403 }
    );
  }

  const productUrl = `https://nofaaifactory.com/products/${productSlug}`;

  // ── Save lead to Firestore FIRST ─────────────────────────────────────────
  let leadId: string;
  let emailSent = false;

  try {
    // Rate limit was already recorded atomically in checkAndRecordRateLimit.
    leadId = await createLead(
      {
        productId,
        productName,
        productSlug,
        productUrl,
        fullName,
        businessEmail,
        company,
        industry,
        requirements,
        timeline,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
      },
      false // emailSent = false until confirmed
    );
  } catch (err) {
    console.error("[customize/submit] Failed to save lead:", err);
    return NextResponse.json({ error: "Failed to save inquiry. Please try again." }, { status: 500 });
  }

  // ── Send notification email ──────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const { error } = await resend.emails.send({
        from: "NOFA AI Factory <notifications@nofabusinessconsulting.com>",
        to: [config.notifyEmail],
        subject: `New Customization Inquiry — ${productName}`,
        html: buildEmailHtml({
          fullName,
          businessEmail,
          company,
          industry,
          requirements,
          timeline,
          productName,
          productUrl,
          leadId,
        }),
      });

      if (!error) {
        emailSent = true;
        // Update the lead's emailSent flag
        await adminDb.collection("customizeLeads").doc(leadId).update({ emailSent: true }).catch(() => {});
      } else {
        console.error("[customize/submit] Resend error:", error);
      }
    } catch (err) {
      console.error("[customize/submit] Email send failed:", err);
    }
  }

  // ── Return success with calendlyUrl ──────────────────────────────────────
  return NextResponse.json({
    success: true,
    leadId,
    emailSent,
    calendlyUrl: config.calendlyUrl || null,
  });
}

// ── Email template ────────────────────────────────────────────────────────────

function buildEmailHtml(d: {
  fullName: string;
  businessEmail: string;
  company: string;
  industry: string;
  requirements: string;
  timeline: string;
  productName: string;
  productUrl: string;
  leadId: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0f;color:#e4e4e7;padding:32px;max-width:600px;margin:0 auto">
  <div style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:28px">
    <h2 style="color:#3b82f6;margin:0 0 4px">🔧 New Customization Inquiry</h2>
    <p style="color:#71717a;margin:0 0 24px;font-size:13px">Lead ID: ${esc(d.leadId)}</p>

    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px;width:160px">Product</td>
          <td style="padding:8px 0"><a href="${esc(d.productUrl)}" style="color:#60a5fa">${esc(d.productName)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px">Name</td>
          <td style="padding:8px 0">${esc(d.fullName)}</td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px">Email</td>
          <td style="padding:8px 0"><a href="mailto:${esc(d.businessEmail)}" style="color:#60a5fa">${esc(d.businessEmail)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px">Company</td>
          <td style="padding:8px 0">${esc(d.company) || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px">Industry</td>
          <td style="padding:8px 0">${esc(d.industry) || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#a1a1aa;font-size:13px">Timeline</td>
          <td style="padding:8px 0">${esc(d.timeline) || "—"}</td></tr>
    </table>

    <div style="margin-top:20px;background:#1c2333;border-radius:8px;padding:16px">
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px">Requirements</p>
      <p style="margin:0;white-space:pre-line">${esc(d.requirements)}</p>
    </div>

    <p style="margin-top:20px;font-size:12px;color:#52525b">
      Submitted via NOFA AI Factory™ Customize • View leads at
      <a href="https://nofaaifactory.com/admin/leads" style="color:#60a5fa">Admin → Leads</a>
    </p>
  </div>
</body>
</html>`;
}
