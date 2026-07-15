import { NextRequest, NextResponse } from "next/server";
import { fetchPublishedProductsREST } from "@/lib/firestore-rest";
import { formatProduct, arrayContains, matchesQuery } from "@/lib/product-api";

const CORS = { "Access-Control-Allow-Origin": "*" };
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  const callId = Date.now().toString(36);
  const caller = req.headers.get("x-caller") ?? req.headers.get("user-agent") ?? "unknown";
  const referer = req.headers.get("referer") ?? "";

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

    console.log(JSON.stringify({
      type: "factory_api_call",
      callId,
      tool: "search_nofa_products",
      arguments: { q, industry, category, status, tag, businessProblem, limit },
      caller: caller.slice(0, 120),
      referer: referer.slice(0, 120),
      firestoreEndpoint: `projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
      timestamp: new Date().toISOString(),
    }));

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

    const returnedSlugs = results.slice(0, limit).map((p) => p.slug);
    console.log(JSON.stringify({
      type: "factory_api_response",
      callId,
      tool: "search_nofa_products",
      httpStatus: 200,
      totalMatched: results.length,
      returned: Math.min(results.length, limit),
      returnedSlugs,
      source: "live_api",
      fallbackActivated: false,
      timestamp: new Date().toISOString(),
    }));

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
    console.error(JSON.stringify({
      type: "factory_api_error",
      callId,
      tool: "search_nofa_products",
      error: String(err),
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json(
      { error: "Search failed", detail: String(err) },
      { status: 500, headers: CORS }
    );
  }
}
