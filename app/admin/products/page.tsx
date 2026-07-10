"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getAllProducts,
  togglePublished,
  deleteProduct,
  duplicateProduct,
} from "@/lib/firestore";
import { Product } from "@/types/product";
import StatusBadge from "@/components/StatusBadge";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const all = await getAllProducts();
      setProducts(all);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggle(id: string, current: boolean) {
    setBusy(id);
    await togglePublished(id, !current);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, published: !current } : p))
    );
    setBusy(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setBusy(null);
  }

  async function handleDuplicate(id: string) {
    setBusy(id);
    const newId = await duplicateProduct(id);
    await load();
    setBusy(null);
    router.push(`/admin/products/${newId}/edit`);
  }

  async function handleSignOut() {
    await signOut(auth);
    // Clear the session cookie set at login
    document.cookie = "admin_auth=; max-age=0; path=/";
    router.push("/admin/login");
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Products</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {products.length} products total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Sign out
            </button>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              ➕ Add Product
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-20 text-center">
            <p className="text-zinc-600 mb-4">No products yet.</p>
            <Link
              href="/admin/products/new"
              className="text-sm text-blue-400 hover:underline"
            >
              Add your first product →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Published
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{p.name}</div>
                      <div className="text-xs text-zinc-600 mt-0.5 truncate max-w-xs">
                        {p.shortDescription}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => handleToggle(p.id, p.published)}
                        disabled={busy === p.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                          p.published ? "bg-green-500" : "bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                            p.published ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          disabled={busy === p.id}
                          title="Duplicate product"
                          className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 transition disabled:opacity-40"
                        >
                          ➕ Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={busy === p.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-900/40 text-red-500 hover:bg-red-900/20 transition disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
