import { NextRequest, NextResponse } from "next/server";
import { fetchPublishedProductsREST } from "@/lib/firestore-rest";
import { formatProduct, arrayContains, matchesQuery } from "@/lib/product-api";

const CORS = { "Access-Control-Allow-Origin": "*" };
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const q = url.searchParams.get("q")?.trim() ?? "";
    const industry = url.searchParams.get("industry")?.trim() ?? "";
    const category = url.searchParams.get("category")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const tag = url.searchParams.get("tag")?.trim() ?? "";
    const businessProblem = url.searchParams.get("businessProblem")?.trim() ?? "";
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "10", 10) || 10,
      MAX_LIMIT
    );

    const raw = await fetchPublishedProductsREST();
    let results = raw.map(formatProduct);

    // Full-text search across name, description, tags, categories
    if (q) results = results.filter((p) => matchesQuery(p, q));

    // Exact filter: industry
    if (industry) results = results.filter((p) => arrayContains(p.industry, industry));

    // Exact filter: AI category OR category
    if (category)
      results = results.filter(
        (p) => arrayContains(p.aiCategory, category) || arrayContains(p.categories, category)
      );

    // Exact filter: status
    if (status)
      results = results.filter(
        (p) => p.status === status || p.statusLabel.toLowerCase().includes(status.toLowerCase())
      );

    // Exact filter: tag
    if (tag) results = results.filter((p) => arrayContains(p.tags, tag));

    // Exact filter: business problem
    if (businessProblem)
      results = results.filter((p) => arrayContains(p.businessProblem, businessProblem));

    return NextResponse.json(
      {
        results: results.slice(0, limit),
        count: results.length,
        limit,
        filters: { q, industry, category, status, tag, businessProblem },
      },
      { headers: CORS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Search failed", detail: String(err) },
      { status: 500, headers: CORS }
    );
  }
}
