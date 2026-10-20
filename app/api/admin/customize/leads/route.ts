import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/firebase-admin";
import { getLeads, updateLeadStatus } from "@/lib/firestore-customize";
import { LEAD_STATUSES, LeadStatus } from "@/types/customize";

function unauthorized(msg: string) {
  return NextResponse.json({ error: msg }, { status: 401 });
}

/** GET /api/admin/customize/leads?productSlug= — list all leads */
export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req.headers.get("authorization"));
  } catch (e) {
    return unauthorized(e instanceof Error ? e.message : "Unauthorized.");
  }
  try {
    const slug = req.nextUrl.searchParams.get("productSlug") ?? undefined;
    const leads = await getLeads(slug);
    return NextResponse.json({ leads, count: leads.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** PATCH /api/admin/customize/leads — update a lead's status */
export async function PATCH(req: NextRequest) {
  try {
    await verifyAdminToken(req.headers.get("authorization"));
  } catch (e) {
    return unauthorized(e instanceof Error ? e.message : "Unauthorized.");
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  const status = body.status as LeadStatus;

  if (!id) return NextResponse.json({ error: "Lead ID required." }, { status: 400 });
  if (!LEAD_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  try {
    await updateLeadStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
