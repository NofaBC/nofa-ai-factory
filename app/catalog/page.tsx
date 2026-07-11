"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Product, ProductStatus, STATUS_META, ALL_STATUSES } from "@/types/product";
import { getPublishedProducts } from "@/lib/firestore";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";

const PAGE_SIZE = 12;

function unique(arr: string[][]): string[] {
  return [...new Set(arr.flat())].sort();
}

// useSearchParams() must live inside a Suspense boundary in Next.js 16
export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string[]>([]);
  const [selectedAI, setSelectedAI] = useState<string[]>([]);
  const [selectedBusinessProblem, setSelectedBusinessProblem] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus[]>([]);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Read URL params and pre-apply filters
  useEffect(() => {
    const industry = searchParams.get("industry");
    const problem = searchParams.get("businessProblem");
    const tag = searchParams.get("tag");
    if (industry) setSelectedIndustry([industry]);
    if (problem) setSelectedBusinessProblem([problem]);
    if (tag) setSelectedTags([tag]);
  }, [searchParams]);

  useEffect(() => {
    getPublishedProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const industries = useMemo(
    () => unique(products.map((p) => p.industry)),
    [products]
  );
  const aiCategories = useMemo(
    () => unique(products.map((p) => p.aiCategory)),
    [products]
  );
  const businessProblems = useMemo(
    () => unique(products.map((p) => p.businessProblem)),
    [products]
  );
  const tags = useMemo(
    () => unique(products.map((p) => p.tags)),
    [products]
  );

  // Case-insensitive, trimmed array membership check
  function arrayMatch(productValues: string[], filterValues: string[]): boolean {
    if (filterValues.length === 0) return true;
    const norm = (s: string) => s.trim().toLowerCase();
    return filterValues.some((fv) =>
      productValues.some((pv) => norm(pv) === norm(fv))
    );
  }

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        (Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().includes(q))) ||
        (Array.isArray(p.industry) && p.industry.some((i) => i.toLowerCase().includes(q))) ||
        (Array.isArray(p.businessProblem) && p.businessProblem.some((b) => b.toLowerCase().includes(q)));
      const matchIndustry = arrayMatch(p.industry, selectedIndustry);
      const matchAI = arrayMatch(p.aiCategory, selectedAI);
      const matchProblem = arrayMatch(p.businessProblem, selectedBusinessProblem);
      const matchTags = arrayMatch(p.tags, selectedTags);
      const matchStatus =
        selectedStatus.length === 0 || selectedStatus.includes(p.status);
      return matchSearch && matchIndustry && matchAI && matchProblem && matchTags && matchStatus;
    });

    return result;
  }, [products, search, selectedIndustry, selectedAI, selectedBusinessProblem, selectedTags, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setSelectedIndustry([]);
    setSelectedAI([]);
    setSelectedBusinessProblem([]);
    setSelectedTags([]);
    setSelectedStatus([]);
    setPage(1);
  };

  const activeFilterCount =
    selectedIndustry.length + selectedAI.length +
    selectedBusinessProblem.length + selectedTags.length + selectedStatus.length;

  const hasFilters = !!(search || activeFilterCount);

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Product Catalog</h1>
            <p className="text-zinc-500 mt-1">
              {loading ? "Loading..." : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          {/* Mobile filter button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111827] px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition"
          >
            🎛 Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, industry, or keyword…"
            className="w-full rounded-xl border border-white/[0.08] bg-[#111827] pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
          />
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-zinc-600 shrink-0">Active:</span>
            {selectedIndustry.map((s) => (
              <button key={s} onClick={() => { setSelectedIndustry((v) => v.filter((x) => x !== s)); setPage(1); }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition">
                🏢 {s} <span className="opacity-60">×</span>
              </button>
            ))}
            {selectedAI.map((s) => (
              <button key={s} onClick={() => { setSelectedAI((v) => v.filter((x) => x !== s)); setPage(1); }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 transition">
                🤖 {s} <span className="opacity-60">×</span>
              </button>
            ))}
            {selectedBusinessProblem.map((s) => (
              <button key={s} onClick={() => { setSelectedBusinessProblem((v) => v.filter((x) => x !== s)); setPage(1); }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-teal-600/20 border border-teal-500/40 text-teal-300 hover:bg-teal-600/30 transition">
                📋 {s} <span className="opacity-60">×</span>
              </button>
            ))}
            {selectedTags.map((s) => (
              <button key={s} onClick={() => { setSelectedTags((v) => v.filter((x) => x !== s)); setPage(1); }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-zinc-700/60 border border-zinc-600/40 text-zinc-300 hover:bg-zinc-700 transition">
                🏷 {s} <span className="opacity-60">×</span>
              </button>
            ))}
            {selectedStatus.map((s) => (
              <button key={s} onClick={() => { setSelectedStatus((v) => v.filter((x) => x !== s)); setPage(1); }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition">
                {STATUS_META[s].emoji} {STATUS_META[s].label} <span className="opacity-60">×</span>
              </button>
            ))}
            <button onClick={resetFilters} className="text-xs text-zinc-600 hover:text-zinc-400 transition ml-1">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:flex flex-col gap-6 w-56 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-400">Filters</span>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Clear all
                </button>
              )}
            </div>

            <CategoryFilter
              label="Industry"
              options={industries}
              selected={selectedIndustry}
              onChange={(v) => { setSelectedIndustry(v); setPage(1); }}
            />
            <CategoryFilter
              label="AI Category"
              options={aiCategories}
              selected={selectedAI}
              onChange={(v) => { setSelectedAI(v); setPage(1); }}
            />
            <CategoryFilter
              label="Business Problem"
              options={businessProblems}
              selected={selectedBusinessProblem}
              onChange={(v) => { setSelectedBusinessProblem(v); setPage(1); }}
            />
            <CategoryFilter
              label="Tags"
              options={tags}
              selected={selectedTags}
              onChange={(v) => { setSelectedTags(v); setPage(1); }}
            />

            {/* Status filter */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Status
              </span>
              <div className="flex flex-col gap-1.5">
                {ALL_STATUSES.map((s) => {
                  const meta = STATUS_META[s];
                  const active = selectedStatus.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedStatus(
                          active
                            ? selectedStatus.filter((x) => x !== s)
                            : [...selectedStatus, s]
                        );
                        setPage(1);
                      }}
                      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
                        active
                          ? "border-blue-500 bg-blue-600/20 text-white"
                          : "border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/10"
                      }`}
                    >
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">

        {/* Mobile filter drawer */}
        {drawerOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setDrawerOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-full bg-[#0d1117] border-l border-white/[0.08] flex flex-col lg:hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="font-semibold text-white text-sm">Filters</span>
                <button onClick={() => setDrawerOpen(false)} className="text-zinc-400 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                <CategoryFilter label="Industry" options={industries} selected={selectedIndustry} onChange={(v) => { setSelectedIndustry(v); setPage(1); }} />
                <CategoryFilter label="AI Category" options={aiCategories} selected={selectedAI} onChange={(v) => { setSelectedAI(v); setPage(1); }} />
                <CategoryFilter label="Business Problem" options={businessProblems} selected={selectedBusinessProblem} onChange={(v) => { setSelectedBusinessProblem(v); setPage(1); }} />
                <CategoryFilter label="Tags" options={tags} selected={selectedTags} onChange={(v) => { setSelectedTags(v); setPage(1); }} />
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</span>
                  <div className="flex flex-col gap-1.5">
                    {ALL_STATUSES.map((s) => {
                      const meta = STATUS_META[s];
                      const active = selectedStatus.includes(s);
                      return (
                        <button key={s} onClick={() => { setSelectedStatus(active ? selectedStatus.filter((x) => x !== s) : [...selectedStatus, s]); setPage(1); }}
                          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${active ? "border-blue-500 bg-blue-600/20 text-white" : "border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/10"}`}>
                          <span>{meta.emoji}</span><span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-white/[0.06] flex flex-col gap-2">
                <button onClick={() => setDrawerOpen(false)}
                  className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition">
                  Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </button>
                {hasFilters && (
                  <button onClick={() => { resetFilters(); setDrawerOpen(false); }}
                    className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition py-1">
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </>
        )}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <span className="text-5xl mb-4">🔭</span>
                <p className="text-zinc-500">No products match your filters.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 text-sm text-blue-400 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginated.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-zinc-600">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
