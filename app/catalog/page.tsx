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
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus[]>([]);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const industry = searchParams.get("industry");
    if (industry) setSelectedIndustry([industry]);
  }, [searchParams]);

  useEffect(() => {
    getPublishedProducts()
      .then((data) => {
        console.log("[Catalog] fetched product count:", data.length);
        console.log("[Catalog] fetched products:", JSON.parse(JSON.stringify(data)));
        setProducts(data);
      })
      .catch((err) => console.error("[Catalog] fetch error:", err))
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

  // Case-insensitive, trimmed array membership check
  function arrayMatch(productValues: string[], filterValues: string[]): boolean {
    if (filterValues.length === 0) return true;
    const norm = (s: string) => s.trim().toLowerCase();
    return filterValues.some((fv) =>
      productValues.some((pv) => norm(pv) === norm(fv))
    );
  }

  const filtered = useMemo(() => {
    console.log("[Catalog] computing filtered — products:", products.length,
      "| search:", JSON.stringify(search),
      "| industry:", selectedIndustry,
      "| ai:", selectedAI,
      "| status:", selectedStatus);

    const result = products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        (Array.isArray(p.categories) && p.categories.some((c) => c.toLowerCase().includes(q))) ||
        (Array.isArray(p.industry) && p.industry.some((i) => i.toLowerCase().includes(q)));
      const matchIndustry = arrayMatch(p.industry, selectedIndustry);
      const matchAI = arrayMatch(p.aiCategory, selectedAI);
      const matchStatus =
        selectedStatus.length === 0 || selectedStatus.includes(p.status);
      return matchSearch && matchIndustry && matchAI && matchStatus;
    });

    console.log("[Catalog] filtered result count:", result.length);
    return result;
  }, [products, search, selectedIndustry, selectedAI, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setSelectedIndustry([]);
    setSelectedAI([]);
    setSelectedStatus([]);
    setPage(1);
  };

  const hasFilters =
    search || selectedIndustry.length || selectedAI.length || selectedStatus.length;

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">AI Product Catalog</h1>
          <p className="text-zinc-500 mt-1">
            {loading
              ? "Loading..."
              : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, industry, or keyword…"
            className="w-full rounded-xl border border-white/[0.08] bg-[#111827] pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
          />
        </div>

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
