"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { getFeaturedProducts, getPublishedProducts } from "@/lib/firestore";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = [
  { icon: "🏗️", label: "Operations" },
  { icon: "📊", label: "Analytics" },
  { icon: "💬", label: "Customer Service" },
  { icon: "⚖️", label: "Legal & Compliance" },
  { icon: "💰", label: "Finance" },
  { icon: "🏥", label: "Healthcare" },
  { icon: "🏢", label: "Real Estate" },
  { icon: "🎓", label: "Education" },
];

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [stats, setStats] = useState({ total: 0, live: 0, prototypes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [feat, all] = await Promise.all([
          getFeaturedProducts(),
          getPublishedProducts(),
        ]);
        setFeatured(feat);
        setStats({
          total: all.length,
          live: all.filter((p) => p.status === "live_saas").length,
          prototypes: all.filter(
            (p) => p.status === "live_prototype" || p.status === "prototype_ready"
          ).length,
        });
      } catch {
        // Firebase not yet configured
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-blue-600/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
            </span>
            Live AI Products Available Now
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Explore the{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Factory
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-zinc-400 leading-relaxed">
            Find an AI solution. Test it live.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-500">
            A curated showroom of AI products, working prototypes, and live SaaS
            applications — built for real business problems.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/catalog"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-8 py-3.5 text-base font-semibold text-white transition-colors shadow-lg shadow-blue-600/20"
            >
              Browse All AI Products →
            </Link>
            <a
              href="https://usejudy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition-colors"
            >
              💬 Talk to Judy
            </a>
          </div>
          {!loading && stats.total > 0 && (
            <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-center">
              {[
                { value: stats.total, label: "AI Products" },
                { value: stats.live, label: "Live SaaS" },
                { value: stats.prototypes, label: "Prototypes Ready" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl font-bold text-white">{value}</div>
                  <div className="text-sm text-zinc-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-y border-white/[0.04] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-8">
            Browse by Industry
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map(({ icon, label }) => (
              <Link
                key={label}
                href={`/catalog?industry=${encodeURIComponent(label)}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-[#111827] hover:bg-[#1c2333] hover:border-blue-500/30 p-4 transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-300 text-center transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-white">Featured Products</h2>
              <p className="text-sm text-zinc-500 mt-1">Hand-picked AI solutions ready to explore</p>
            </div>
            <Link href="/catalog" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
              <p className="text-zinc-600 text-sm">
                No featured products yet.{" "}
                <Link href="/admin" className="text-blue-400 hover:underline">Add products via the admin dashboard.</Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-violet-900/20 p-12 text-center">
          <h2 className="text-2xl font-bold text-white">Don&apos;t see what you need?</h2>
          <p className="mt-3 text-zinc-400">
            New AI products are added continuously. Talk to Judy — our AI assistant — to find the right solution or get a custom build.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://usejudy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              💬 Talk to Judy
            </a>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 hover:bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
