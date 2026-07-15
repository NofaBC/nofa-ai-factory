import { NextResponse } from "next/server";
import { fetchProductBySlugREST } from "@/lib/firestore-rest";
import { formatProduct } from "@/lib/product-api";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const callId = Date.now().toString(36);
  const caller = (req as Request & { headers: Headers }).headers.get("x-caller") ?? (req as Request & { headers: Headers }).headers.get("user-agent") ?? "unknown";

  try {
    const { slug } = await params;

    console.log(JSON.stringify({
      type: "factory_api_call",
      callId,
      tool: "get_nofa_product",
      arguments: { slug },
      caller: caller.slice(0, 120),
      timestamp: new Date().toISOString(),
    }));
    const raw = await fetchProductBySlugREST(slug);

    if (!raw) {
      console.log(JSON.stringify({
        type: "factory_api_response",
        callId,
        tool: "get_nofa_product",
        httpStatus: 404,
        returned: 0,
        returnedSlugs: [],
        source: "live_api",
        fallbackActivated: false,
        timestamp: new Date().toISOString(),
      }));
      return NextResponse.json(
        { error: "Product not found", slug },
        { status: 404, headers: CORS }
      );
    }

    const product = formatProduct(raw);
    console.log(JSON.stringify({
      type: "factory_api_response",
      callId,
      tool: "get_nofa_product",
      httpStatus: 200,
      returned: 1,
      returnedSlugs: [product.slug],
      source: "live_api",
      fallbackActivated: false,
      timestamp: new Date().toISOString(),
    }));

    return NextResponse.json(
      { product },
      { headers: CORS }
    );
  } catch (err) {
    console.error(JSON.stringify({
      type: "factory_api_error",
      callId,
      tool: "get_nofa_product",
      error: String(err),
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json(
      { error: "Failed to fetch product", detail: String(err) },
      { status: 500, headers: CORS }
    );
  }
}
