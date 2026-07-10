export type ProductStatus =
  | "concept"
  | "experimental"
  | "in_development"
  | "prototype_ready"
  | "live_prototype"
  | "live_saas"
  | "seeking_pilot"
  | "licensing_available";

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: ProductStatus;

  // Categorization
  categories: string[];
  industry: string[];
  aiCategory: string[];
  businessProblem: string[];
  tags: string[];

  // Links (all optional — action buttons are shown only when populated)
  prototypeUrl?: string;
  liveSaasUrl?: string;
  judyUrl?: string;
  learnMoreUrl?: string;
  imageUrl?: string;

  // Visibility
  published: boolean;
  featured: boolean;
  order: number;

  // Timestamps (stored as Firestore Timestamp, serialized to ISO string for client)
  createdAt: string;
  updatedAt: string;
}

export const STATUS_META: Record<
  ProductStatus,
  { label: string; emoji: string; color: string }
> = {
  concept: {
    label: "Concept",
    emoji: "💡",
    color: "bg-zinc-700 text-zinc-300",
  },
  experimental: {
    label: "Experimental",
    emoji: "🧪",
    color: "bg-purple-900/60 text-purple-300",
  },
  in_development: {
    label: "In Development",
    emoji: "🏗",
    color: "bg-amber-900/60 text-amber-300",
  },
  prototype_ready: {
    label: "Prototype Ready",
    emoji: "🏷",
    color: "bg-blue-900/60 text-blue-300",
  },
  live_prototype: {
    label: "Live Prototype",
    emoji: "🚀",
    color: "bg-blue-800/60 text-blue-200",
  },
  live_saas: {
    label: "Live SaaS",
    emoji: "✅",
    color: "bg-green-900/60 text-green-300",
  },
  seeking_pilot: {
    label: "Seeking Pilot Customer",
    emoji: "🤝",
    color: "bg-teal-900/60 text-teal-300",
  },
  licensing_available: {
    label: "Licensing Available",
    emoji: "💰",
    color: "bg-yellow-900/60 text-yellow-300",
  },
};

export const ALL_STATUSES = Object.keys(STATUS_META) as ProductStatus[];
