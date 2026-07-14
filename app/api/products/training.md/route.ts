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
      "# NOFA AI Factory™ — Product Catalog",
      "",
      `> **Generated:** ${new Date().toUTCString()}  `,
      `> **Total published products:** ${products.length}  `,
      `> **Source:** [nofaaifactory.com](https://nofaaifactory.com)`,
      "",
      "This document describes all currently published AI products, prototypes, and SaaS applications built by NOFA AI Factory™.",
      "",
      "---",
      "",
    ];

    for (const p of products) {
      const status = STATUS_LABELS[str(p.status)] ?? str(p.status);
      const productUrl = `https://nofaaifactory.com/products/${str(p.slug)}`;

      lines.push(`## ${str(p.name)}`);
      lines.push("");
      lines.push(`**Status:** ${status}  `);
      lines.push(`**Product Page:** [${productUrl}](${productUrl})`);
      lines.push("");

      if (str(p.shortDescription)) {
        lines.push(`> ${str(p.shortDescription)}`);
        lines.push("");
      }

      if (str(p.description)) {
        lines.push("### Description");
        lines.push("");
        lines.push(str(p.description));
        lines.push("");
      }

      lines.push("### Details");
      lines.push("");
      if (arr(p.industry))
        lines.push(`- **Industry:** ${arr(p.industry)}`);
      if (arr(p.aiCategory))
        lines.push(`- **AI Category:** ${arr(p.aiCategory)}`);
      if (arr(p.categories))
        lines.push(`- **Categories:** ${arr(p.categories)}`);
      if (arr(p.businessProblem))
        lines.push(`- **Business Problem Solved:** ${arr(p.businessProblem)}`);
      if (arr(p.tags))
        lines.push(`- **Tags:** ${arr(p.tags)}`);
      lines.push("");

      const hasLinks =
        str(p.liveSaasUrl) || str(p.prototypeUrl) ||
        str(p.judyUrl) || str(p.learnMoreUrl);

      if (hasLinks) {
        lines.push("### Links");
        lines.push("");
        if (str(p.liveSaasUrl))
          lines.push(`- ✅ **Live SaaS:** [${str(p.liveSaasUrl)}](${str(p.liveSaasUrl)})`);
        if (str(p.prototypeUrl))
          lines.push(`- 🚀 **Prototype:** [${str(p.prototypeUrl)}](${str(p.prototypeUrl)})`);
        if (str(p.judyUrl))
          lines.push(`- 💬 **Talk to Judy:** [${str(p.judyUrl)}](${str(p.judyUrl)})`);
        if (str(p.learnMoreUrl))
          lines.push(`- 📖 **Learn More:** [${str(p.learnMoreUrl)}](${str(p.learnMoreUrl)})`);
        lines.push("");
      }

      lines.push("---");
      lines.push("");
    }

    lines.push("*End of NOFA AI Factory™ product catalog.*");

    const markdown = lines.join("\n");

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="nofa-ai-factory-catalog-${Date.now()}.md"`,
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
