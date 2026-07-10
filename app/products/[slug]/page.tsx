"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { getProductBySlug } from "@/lib/firestore";
import StatusBadge from "@/components/StatusBadge";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getProductBySlug(slug)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <span className="text-5xl">🔭</span>
        <p className="text-zinc-500">Product not found.</p>
        <Link href="/catalog" className="text-blue-400 hover:underline text-sm">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  const actions = [
    product.liveSaasUrl && {
      href: product.liveSaasUrl,
      label: "Visit Live SaaS",
      icon: "✅",
      className: "bg-blue-600 hover:bg-blue-500 text-white",
    },
    product.prototypeUrl && {
      href: product.prototypeUrl,
      label: "View Prototype",
      icon: "🚀",
      className: "bg-violet-700 hover:bg-violet-600 text-white",
    },
    product.judyUrl && {
      href: product.judyUrl,
      label: "Talk to Judy",
      icon: "💬",
      className: "bg-teal-700 hover:bg-teal-600 text-white",
    },
    product.learnMoreUrl && {
      href: product.learnMoreUrl,
      label: "Learn More",
      icon: "📖",
      className: "border border-white/10 hover:bg-white/5 text-white",
    },
  ].filter(Boolean) as {
    href: string;
    label: string;
    icon: string;
    className: string;
  }[];

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/catalog"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8 inline-flex items-center gap-1"
        >
          ← Back to catalog
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Image */}
            {product.imageUrl && (
              <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-white/[0.06]">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Title + status */}
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-3xl font-bold text-white">{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>

            {/* Short description */}
            <p className="text-lg text-zinc-300 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Full description */}
            {product.description && (
              <div className="rounded-xl border border-white/[0.06] bg-[#111827] p-6">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  About this product
                </h2>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Taxonomy */}
            {[
              { label: "Industry", values: product.industry },
              { label: "AI Category", values: product.aiCategory },
              { label: "Business Problem", values: product.businessProblem },
              { label: "Tags", values: product.tags },
            ]
              .filter((t) => t.values.length > 0)
              .map(({ label, values }) => (
                <div key={label}>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    {label}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {values.map((v) => (
                      <span
                        key={v}
                        className="text-xs px-3 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/[0.06]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Right: sticky action panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-white/[0.08] bg-[#111827] p-6 flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Get Started
              </h2>

              {actions.length > 0 ? (
                actions.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-colors ${action.className}`}
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-zinc-600">
                  No links available yet. Check back soon.
                </p>
              )}

              <div className="mt-2 pt-4 border-t border-white/[0.06]">
                <StatusBadge status={product.status} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
