"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { PublicCustomizeConfig } from "@/types/customize";
import { Product } from "@/types/product";

const CustomizeModal = lazy(() => import("./CustomizeModal"));

interface Props {
  product: Pick<Product, "id" | "name" | "slug" | "isClientOwned" | "customizeEnabled">;
  /** Pre-fetched config (from parent page). If not provided, fetches itself. */
  prefetchedConfig?: PublicCustomizeConfig | null;
  /** If true, renders as a compact inline button (for ProductCard) */
  compact?: boolean;
}

function fireGA4Click(productId: string, productName: string) {
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as { gtag: (...a: unknown[]) => void }).gtag(
      "event",
      "customize_click",
      { product_id: productId, product_name: productName }
    );
  }
}

export default function CustomizeButton({ product, prefetchedConfig, compact = false }: Props) {
  const [config, setConfig] = useState<PublicCustomizeConfig | null>(
    prefetchedConfig ?? null
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (prefetchedConfig !== undefined) return; // parent already provided it
    // Fetch public config for this specific product
    fetch(`/api/customize/config?slug=${encodeURIComponent(product.slug)}`)
      .then((r) => r.json())
      .then((data: PublicCustomizeConfig) => setConfig(data))
      .catch(() => setConfig(null));
  }, [product.slug, prefetchedConfig]);

  // Not yet loaded or disabled
  if (!config?.enabled) return null;

  function handleOpen() {
    fireGA4Click(product.id, product.name);
    setOpen(true);
  }

  if (compact) {
    return (
      <>
        <button
          onClick={handleOpen}
          className="flex items-center justify-center gap-2 h-9 w-full rounded-lg border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 text-sm font-medium transition-colors"
        >
          🔧 {config.buttonText}
        </button>
        {open && (
          <Suspense fallback={null}>
            <CustomizeModal
              product={product}
              introMessage={config.introMessage}
              onClose={() => setOpen(false)}
            />
          </Suspense>
        )}
      </>
    );
  }

  // Full-width panel (for product detail page)
  return (
    <>
      <div className="rounded-2xl border border-blue-500/20 bg-blue-900/10 p-6 text-center flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Like This AI Solution?</h3>
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
            NOFA AI Factory™ can customize this solution for your business, industry,
            workflows, and specific requirements.
          </p>
        </div>
        <button
          onClick={handleOpen}
          className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
        >
          🔧 {config.buttonText}
        </button>
      </div>
      {open && (
        <Suspense fallback={null}>
          <CustomizeModal
            product={product}
            introMessage={config.introMessage}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
