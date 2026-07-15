import { NextResponse } from "next/server";
import { fetchProductBySlugREST } from "@/lib/firestore-rest";
import { formatProduct } from "@/lib/product-api";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const raw = await fetchProductBySlugREST(slug);

    if (!raw) {
      return NextResponse.json(
        { error: "Product not found", slug },
        { status: 404, headers: CORS }
      );
    }

    return NextResponse.json(
      { product: formatProduct(raw) },
      { headers: CORS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch product", detail: String(err) },
      { status: 500, headers: CORS }
    );
  }
}
