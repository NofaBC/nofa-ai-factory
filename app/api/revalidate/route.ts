import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * POST /api/revalidate
 * Called by the Firestore Firebase Function when any product is written.
 * Clears the "products" cache tag so the next API request fetches fresh data.
 *
 * Requires header: x-revalidate-secret: <REVALIDATE_SECRET env var>
 * OR query param:  ?secret=<REVALIDATE_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET not configured" },
      { status: 500 }
    );
  }

  const provided =
    req.headers.get("x-revalidate-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Next.js 16: revalidateTag requires a second argument.
  // { expire: 0 } = immediate expiry (Read-Your-Own-Writes),
  // so the very next API request gets fresh Firestore data.
  revalidateTag("products", { expire: 0 });

  return NextResponse.json({
    revalidated: true,
    tag: "products",
    timestamp: new Date().toISOString(),
  });
}
