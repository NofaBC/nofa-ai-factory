import { NextResponse } from "next/server";
import { fetchPublishedProductsREST } from "@/lib/firestore-rest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await fetchPublishedProductsREST();

    return NextResponse.json(
      { products, count: products.length, updatedAt: new Date().toISOString() },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch products", detail: String(err) },
      { status: 500 }
    );
  }
}
