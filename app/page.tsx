"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { getFeaturedProducts, getPublishedProducts } from "@/lib/firestore";
import ProductCard from "@/components/ProductCard";

// Map keywords → emoji for dynamic industry/problem tiles
const INDUSTRY_ICONS: [string, string][] = [
  ["finance", "💰"], ["financial", "💰"], ["banking", "🏦"],
  ["healthcare", "🏥"], ["health", "🏥"], ["medical", "🏥"], ["wellness", "🌿"],
  ["real estate", "🏢"], ["property", "🏢"], ["construction", "🏗️"],
  ["logistics", "📦"], ["distribution", "📦"], ["supply", "📦"], ["wholesale", "🚚"],
  ["human resources", "👥"], ["career", "👥"], ["recruiting", "🎯"], ["employment", "👥"],
  ["legal", "⚖️"], ["compliance", "⚖️"],
  ["education", "🎓"], ["learning", "🎓"],
  ["marketing", "📢"], ["advertising", "📢"],
  ["e-commerce", "🛒"], ["ecommerce", "🛒"], ["retail", "🛒"],
  ["consulting", "💼"], ["professional", "💼"],
  ["small business", "🏪"], ["bakery", "🥐"], ["food", "🍽️"], ["beverage", "🥤"],
  ["technology", "💻"], ["software", "💻"],
  ["operations", "⚙️"],
];

const PROBLEM_ICONS: [string, string][] = [
  ["automation", "⚙️"], ["workflow", "⚙️"],
  ["customer support", "💬"], ["customer service", "💬"],
  ["analytics", "📊"], ["analysis", "📊"], ["reporting", "📊"],
  ["planning", "📋"], ["budgeting", "📋"], ["forecasting", "📋"],
  ["recruitment", "🎯"], ["hiring", "🎯"], ["lead gen", "🎯"],
  ["compliance", "🔐"], ["risk", "🔐"],
  ["sales", "📈"], ["revenue", "📈"],
  ["decision", "💡"],
  ["tracking", "📍"], ["monitoring", "📍"],
  ["job search", "🔍"], ["matching", "🔍"],
  ["debt", "💳"], ["savings", "💳"],
  ["productivity", "⚡"], ["efficiency", "⚡"],
  ["interview", "🎤"],
];

function pickIcon(label: string, map: [string, string][]): string {
  const lower = label.toLowerCase();
  for (const [key, icon] of map) {
    if (lower.includes(key)) return icon;
  }
  return "🤖";
}

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [industryTiles, setIndustryTiles] = useState<string[]>([]);
  const [problemTiles, setProblemTiles] = useState<string[]>([]);
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
        setLatest(all.slice(0, 6));
        setStats({
          total: all.length,
          live: all.filter((p) => p.status === "live_saas").length,
          prototypes: all.filter(
            (p) => p.status === "live_prototype" || p.status === "prototype_ready"
          ).length,
        });
        // Derive unique industries and business problems from actual products
        const uniqueIndustries = [...new Set(all.flatMap((p) => p.industry))].sort();
        const uniqueProblems = [...new Set(all.flatMap((p) => p.businessProblem))].sort();
        setIndustryTiles(uniqueIndustries.slice(0, 12));
        setProblemTiles(uniqueProblems.slice(0, 10));
      } catch {
        // Firebase not yet configured
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Show featured if available, otherwise fall back to latest published products
  const displayProducts = featured.length > 0 ? featured : latest;
  const sectionLabel = featured.length > 0 ? "Featured Products" : "Latest Products";
  const sectionSub = featured.length > 0
    ? "Hand-picked AI solutions ready to explore"
    : "Our most recently added AI solutions";

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

      {/* ── Browse by Industry + Business Function ── */}
      {!loading && (industryTiles.length > 0 || problemTiles.length > 0) && (
        <section className="px-4 py-16 sm:px-6 lg:px-8 border-y border-white/[0.04] bg-white/[0.01] space-y-14">
          <div className="mx-auto max-w-7xl">
            {/* Industries */}
            {industryTiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-semibold text-white">Browse by Industry</h2>
                    <p className="text-xs text-zinc-600 mt-0.5">Find AI solutions built for your sector</p>
                  </div>
                  <Link href="/catalog" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    See all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {industryTiles.map((label) => (
                    <Link
                      key={label}
                      href={`/catalog?industry=${encodeURIComponent(label)}`}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111827] hover:bg-[#1c2333] hover:border-blue-500/30 px-4 py-3 transition-all group"
                    >
                      <span className="text-xl shrink-0">{pickIcon(label, INDUSTRY_ICONS)}</span>
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 leading-tight transition-colors">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Business Functions */}
            {problemTiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-semibold text-white">Browse by Business Problem</h2>
                    <p className="text-xs text-zinc-600 mt-0.5">Start with the problem you need to solve</p>
                  </div>
                  <Link href="/catalog" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    See all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {problemTiles.map((label) => (
                    <Link
                      key={label}
                      href={`/catalog?businessProblem=${encodeURIComponent(label)}`}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111827] hover:bg-[#1c2333] hover:border-violet-500/30 px-4 py-3 transition-all group"
                    >
                      <span className="text-xl shrink-0">{pickIcon(label, PROBLEM_ICONS)}</span>
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 leading-tight transition-colors">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-white">{sectionLabel}</h2>
              <p className="text-sm text-zinc-500 mt-1">{sectionSub}</p>
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
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Have an AI Idea? ── */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">
        {/* Blueprint grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[600px] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 to-blue-950/60 backdrop-blur-sm p-12 sm:p-16 text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-1.5 text-sm text-violet-300">
              🏗 Custom AI Development
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Have an AI idea?{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                Let&apos;s build it.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed">
              If you have a repetitive task, workflow, business problem, or original AI idea,
              NOFA AI Factory™ can help turn it into a working prototype or custom AI solution.
            </p>

            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
              Explore what we have already built — or bring us the next idea.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://nofabusinessconsulting.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 hover:bg-violet-500 px-8 py-3.5 text-base font-semibold text-white transition-colors shadow-lg shadow-violet-600/20"
              >
                🚀 Submit Your AI Idea
              </a>
              <a
                href="https://usejudy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition-colors"
              >
                💬 Talk to Judy
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
