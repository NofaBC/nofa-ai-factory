import { NextResponse } from "next/server";
import { fetchPublishedProductsREST } from "@/lib/firestore-rest";
import { formatProduct } from "@/lib/product-api";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  try {
    const raw = await fetchPublishedProductsREST();
    const products = raw.map(formatProduct);
    return NextResponse.json(
      { products, count: products.length },
      { headers: CORS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch products", detail: String(err) },
      { status: 500, headers: CORS }
    );
  }
}
