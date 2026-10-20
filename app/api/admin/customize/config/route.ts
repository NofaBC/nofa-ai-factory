import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/firebase-admin";
import { getCustomizeConfig, saveCustomizeConfig } from "@/lib/firestore-customize";

function unauthorized(msg: string) {
  return NextResponse.json({ error: msg }, { status: 401 });
}

/** GET /api/admin/customize/config — returns full config including notifyEmail and calendlyUrl */
export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req.headers.get("authorization"));
  } catch (e) {
    return unauthorized(e instanceof Error ? e.message : "Unauthorized.");
  }
  try {
    const config = await getCustomizeConfig();
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** PUT /api/admin/customize/config — saves full config */
export async function PUT(req: NextRequest) {
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

  // Validate required fields
  if (typeof body.masterEnabled !== "boolean") {
    return NextResponse.json({ error: "masterEnabled must be boolean." }, { status: 400 });
  }
  const buttonText = String(body.buttonText ?? "").trim().slice(0, 200);
  const introMessage = String(body.introMessage ?? "").trim().slice(0, 1000);
  const calendlyUrl = String(body.calendlyUrl ?? "").trim().slice(0, 500);
  const notifyEmail = String(body.notifyEmail ?? "").trim().slice(0, 254);
  if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
    return NextResponse.json({ error: "Invalid notification email." }, { status: 400 });
  }

  try {
    await saveCustomizeConfig({
      masterEnabled: body.masterEnabled as boolean,
      buttonText: buttonText || "Customize This for My Business",
      introMessage,
      calendlyUrl,
      notifyEmail: notifyEmail || "supportdesk@nofabusinessconsulting.com",
      newProductDefault: body.newProductDefault === true,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
