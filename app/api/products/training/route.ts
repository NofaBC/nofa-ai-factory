import { NextResponse } from "next/server";
import { fetchPublishedProductsREST } from "@/lib/firestore-rest";

export const dynamic = "force-dynamic";

function arr(val: unknown): string {
  if (Array.isArray(val)) return val.filter(Boolean).join(", ");
  if (typeof val === "string") return val;
  return "";
}

function str(val: unknown): string {
  return typeof val === "string" ? val : "";
}

const STATUS_LABELS: Record<string, string> = {
  concept: "💡 Concept",
  experimental: "🧪 Experimental",
  in_development: "🏗 In Development",
  prototype_ready: "🏷 Prototype Ready",
  live_prototype: "🚀 Live Prototype",
  live_saas: "✅ Live SaaS",
  seeking_pilot: "🤝 Seeking Pilot Customer",
  licensing_available: "💰 Licensing Available",
};

export async function GET() {
  try {
    const products = await fetchPublishedProductsREST();

    const lines: string[] = [
      "=== NOFA AI FACTORY™ — PRODUCT CATALOG ===",
      `Generated: ${new Date().toUTCString()}`,
      `Total published products: ${products.length}`,
      "",
      "This document describes all currently published AI products, prototypes,",
      "and SaaS applications available at nofaaifactory.com.",
      "",
      "=".repeat(60),
      "",
    ];

    for (const p of products) {
      const status = STATUS_LABELS[str(p.status)] ?? str(p.status);
      lines.push(`PRODUCT: ${str(p.name)}`);
      lines.push(`Status: ${status}`);
      lines.push(`Slug / URL: https://nofaaifactory.com/products/${str(p.slug)}`);
      lines.push("");

      if (str(p.shortDescription)) {
        lines.push(`Summary: ${str(p.shortDescription)}`);
        lines.push("");
      }

      if (str(p.description)) {
        lines.push("Full Description:");
        lines.push(str(p.description));
        lines.push("");
      }

      if (arr(p.industry))
        lines.push(`Industry: ${arr(p.industry)}`);
      if (arr(p.aiCategory))
        lines.push(`AI Category: ${arr(p.aiCategory)}`);
      if (arr(p.categories))
        lines.push(`Categories: ${arr(p.categories)}`);
      if (arr(p.businessProblem))
        lines.push(`Business Problem Solved: ${arr(p.businessProblem)}`);
      if (arr(p.tags))
        lines.push(`Tags: ${arr(p.tags)}`);

      lines.push("");
      lines.push("Links:");
      if (str(p.liveSaasUrl))
        lines.push(`  Live SaaS: ${str(p.liveSaasUrl)}`);
      if (str(p.prototypeUrl))
        lines.push(`  Prototype: ${str(p.prototypeUrl)}`);
      if (str(p.judyUrl))
        lines.push(`  Talk to Judy: ${str(p.judyUrl)}`);
      if (str(p.learnMoreUrl))
        lines.push(`  Learn More: ${str(p.learnMoreUrl)}`);

      lines.push("");
      lines.push("-".repeat(60));
      lines.push("");
    }

    lines.push("=== END OF CATALOG ===");

    const text = lines.join("\n");

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="nofa-ai-factory-catalog-${Date.now()}.txt"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    return new NextResponse(`Error generating training document: ${String(err)}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
