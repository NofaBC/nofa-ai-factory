import { NextRequest, NextResponse } from "next/server";
import { getCustomizeConfig, isCustomizeEligible } from "@/lib/firestore-customize";

const CORS = { "Access-Control-Allow-Origin": "*" };

/**
 * GET /api/customize/config?slug={productSlug}
 *
 * Returns the MINIMUM public configuration required for the CTA to render.
 * Never exposes notifyEmail or calendlyUrl.
 *
 * If a slug is provided, per-product eligibility is also evaluated using
 * the product's own Firestore fields (fetched server-side).
 */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug") ?? "";
    const config = await getCustomizeConfig();

    let perProductEnabled = true;

    if (slug) {
      // Fetch just the eligibility fields for this product from Admin Firestore
      const { adminDb } = await import("@/lib/firebase-admin");
      if (adminDb) {
        const snap = await adminDb
          .collection("products")
          .where("slug", "==", slug)
          .where("published", "==", true)
          .limit(1)
          .get();

        if (!snap.empty) {
          const d = snap.docs[0].data();
          perProductEnabled = isCustomizeEligible(
            {
              isClientOwned: d.isClientOwned === true,
              customizeEnabled:
                typeof d.customizeEnabled === "boolean" ? d.customizeEnabled : undefined,
            },
            config.masterEnabled,
            config.newProductDefault  // ← controls eligibility for products with no explicit override
          );
        } else {
          // Unknown or unpublished product — not eligible
          perProductEnabled = false;
        }
      }
    }

    // Minimum public response — no sensitive fields
    return NextResponse.json(
      {
        enabled: config.masterEnabled && perProductEnabled,
        buttonText: config.buttonText,
        introMessage: config.introMessage,
      },
      { headers: CORS }
    );
  } catch (err) {
    console.error("[/api/customize/config]", err);
    // Fail safe: return disabled so no CTA shows on error
    return NextResponse.json(
      { enabled: false, buttonText: "", introMessage: "" },
      { headers: CORS }
    );
  }
}
