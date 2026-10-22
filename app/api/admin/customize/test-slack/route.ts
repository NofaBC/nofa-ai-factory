import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/firebase-admin";
import {
  getLeadById,
  markSlackRetrying,
  markSlackSent,
  markSlackFailed,
} from "@/lib/firestore-customize";
import { callSlackApi } from "@/lib/slack";

function unauthorized(msg: string) {
  return NextResponse.json({ error: msg }, { status: 401 });
}

/**
 * POST /api/admin/customize/test-slack
 *
 * Admin-only. Two modes:
 *
 * TEST mode (no body, or body without leadId):
 *   Sends a clearly-marked [TEST] Slack message. No Firestore record created.
 *   Safe to call at any time without affecting real data.
 *
 * RETRY mode (body: { leadId: string }):
 *   Looks up the real lead and retries the Slack alert.
 *   Uses markSlackRetrying() atomic transaction to prevent concurrent duplicates.
 *   Only proceeds if slackDeliveryState === "failed".
 */
export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  try {
    await verifyAdminToken(req.headers.get("authorization"));
  } catch (e) {
    return unauthorized(e instanceof Error ? e.message : "Unauthorized.");
  }

  // ── Resolve Slack config ──────────────────────────────────────────────────
  const token = process.env.SLACK_BOT_TOKEN;
  // Allow any configured channel for admin test (prefer real channel in prod)
  const channel =
    process.env.SLACK_CHANNEL_ID ??
    process.env.SLACK_TEST_CHANNEL_ID;

  if (!token || !channel) {
    return NextResponse.json(
      { error: "Slack not configured. SLACK_BOT_TOKEN and SLACK_CHANNEL_ID (or SLACK_TEST_CHANNEL_ID) are required." },
      { status: 503 }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch { /* empty body is fine */ }

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : null;

  // ── RETRY mode ────────────────────────────────────────────────────────────
  if (leadId) {
    const lead = await getLeadById(leadId).catch(() => null);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    // Atomic lock: only proceeds if state is "failed"
    let action: "proceed" | "skip";
    try {
      action = await markSlackRetrying(leadId);
    } catch (err) {
      return NextResponse.json({ error: `Retry lock failed: ${String(err)}` }, { status: 500 });
    }

    if (action === "skip") {
      return NextResponse.json({
        skipped: true,
        reason: `Current state is "${lead.slackDeliveryState}" — retry only available when state is "failed".`,
      });
    }

    const sent = await callSlackApi(token, channel, {
      prefix: "[RETRY] ",
      leadId,
      productName: lead.productName,
      productUrl: lead.productUrl,
      fullName: lead.fullName,
      businessEmail: lead.businessEmail,
      phone: lead.phone,
    });

    if (sent) {
      await markSlackSent(leadId).catch(() => {});
      return NextResponse.json({ success: true, retried: true, leadId });
    } else {
      await markSlackFailed(leadId).catch(() => {});
      return NextResponse.json({ error: "Slack API call failed. State reset to failed." }, { status: 502 });
    }
  }

  // ── TEST mode (no leadId) ─────────────────────────────────────────────────
  const sent = await callSlackApi(token, channel, {
    prefix: "[TEST] ",
    leadId: `TEST-${Date.now()}`,
    productName: "Test Product",
    productUrl: "https://nofaaifactory.com",
    fullName: "Test Submission",
    businessEmail: "test@example.com",
    phone: "+1 000 000 0000",
  });

  if (sent) {
    return NextResponse.json({ success: true, test: true });
  } else {
    return NextResponse.json(
      { error: "Slack API call failed. Check SLACK_BOT_TOKEN and channel membership." },
      { status: 502 }
    );
  }
}
