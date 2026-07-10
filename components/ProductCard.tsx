"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import StatusBadge from "./StatusBadge";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-[#111827] hover:bg-[#1c2333] hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
      {/* Image or placeholder */}
      <div className="relative h-44 w-full bg-gradient-to-br from-blue-900/20 to-violet-900/20 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />
        ) : (
          <span className="text-5xl opacity-30">🤖</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-white leading-snug group-hover:text-blue-300 transition-colors">
            {product.name}
          </h3>
          <StatusBadge status={product.status} size="sm" />
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 flex-1">
          {product.shortDescription}
        </p>

        {/* Category chips */}
        {product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/[0.06]"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons — only shown when URLs are present */}
        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-white/[0.06]">
          {product.liveSaasUrl && (
            <a
              href={product.liveSaasUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              ✅ Visit Live SaaS
            </a>
          )}
          {product.prototypeUrl && (
            <a
              href={product.prototypeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
            >
              🚀 View Prototype
            </a>
          )}
          {product.judyUrl && (
            <a
              href={product.judyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
            >
              💬 Talk to Judy
            </a>
          )}
          <div className="flex gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="flex-1 flex items-center justify-center h-9 rounded-lg border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/20 text-sm transition-colors"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
