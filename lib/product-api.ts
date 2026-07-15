/**
 * Public product API formatter.
 * Converts raw Firestore document data into the clean, Judy-readable shape
 * used by all public API endpoints. Internal fields are never exposed.
 */

export const STATUS_LABELS: Record<string, string> = {
  concept: "💡 Concept",
  experimental: "🧪 Experimental",
  in_development: "🏗 In Development",
  prototype_ready: "🏷 Prototype Ready",
  live_prototype: "🚀 Live Prototype",
  live_saas: "✅ Live SaaS",
  seeking_pilot: "🤝 Seeking Pilot Customer",
  licensing_available: "💰 Licensing Available",
};

export interface PublicProduct {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: string;
  statusLabel: string;
  /**
   * true when the product has at least one testable link (Live SaaS or Prototype).
   * Judy uses this to answer "Can I try/test it?" accurately.
   */
  canTestLive: boolean;
  /**
   * Human-readable list of actions available for this product.
   * Only includes actions where the corresponding URL is set.
   */
  availableActions: string[];
  links: {
    productPage: string;
    liveSaas: string | null;
    prototype: string | null;
    judy: string | null;
    learnMore: string | null;
  };
  categories: string[];
  industry: string[];
  aiCategory: string[];
  businessProblem: string[];
  tags: string[];
  imageUrl: string | null;
}

function toArr(val: unknown): string[] {
  if (Array.isArray(val)) return (val as unknown[]).map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function toStr(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

export function formatProduct(raw: Record<string, unknown>): PublicProduct {
  const slug = toStr(raw.slug);
  const liveSaas = toStr(raw.liveSaasUrl) || null;
  const prototype = toStr(raw.prototypeUrl) || null;
  const judy = toStr(raw.judyUrl) || null;
  const learnMore = toStr(raw.learnMoreUrl) || null;

  const availableActions: string[] = [];
  if (liveSaas) availableActions.push("Visit Live SaaS");
  if (prototype) availableActions.push("View Prototype");
  if (judy) availableActions.push("Talk to Judy");
  if (learnMore) availableActions.push("Learn More");

  const status = toStr(raw.status) || "concept";

  return {
    name: toStr(raw.name),
    slug,
    shortDescription: toStr(raw.shortDescription),
    description: toStr(raw.description),
    status,
    statusLabel: STATUS_LABELS[status] ?? status,
    canTestLive: !!(liveSaas || prototype),
    availableActions,
    links: {
      productPage: `https://nofaaifactory.com/products/${slug}`,
      liveSaas,
      prototype,
      judy,
      learnMore,
    },
    categories: toArr(raw.categories),
    industry: toArr(raw.industry),
    aiCategory: toArr(raw.aiCategory),
    businessProblem: toArr(raw.businessProblem),
    tags: toArr(raw.tags),
    imageUrl: toStr(raw.imageUrl) || null,
  };
}

/** Case-insensitive check if a string[] contains a given value. */
export function arrayContains(arr: string[], value: string): boolean {
  const v = value.trim().toLowerCase();
  return arr.some((s) => s.toLowerCase() === v);
}

/** Case-insensitive substring search across multiple string[] fields. */
export function matchesQuery(product: PublicProduct, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    product.name.toLowerCase().includes(lower) ||
    product.shortDescription.toLowerCase().includes(lower) ||
    product.description.toLowerCase().includes(lower) ||
    product.tags.some((t) => t.toLowerCase().includes(lower)) ||
    product.categories.some((c) => c.toLowerCase().includes(lower)) ||
    product.industry.some((i) => i.toLowerCase().includes(lower)) ||
    product.aiCategory.some((a) => a.toLowerCase().includes(lower)) ||
    product.businessProblem.some((b) => b.toLowerCase().includes(lower))
  );
}
