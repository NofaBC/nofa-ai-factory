"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProductById, updateProduct, ProductInput } from "@/lib/firestore";
import { Product } from "@/types/product";
import ProductForm from "@/components/ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getProductById(id)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-zinc-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-8">Edit: {product.name}</h1>
        <ProductForm
          initial={product}
          submitLabel="Save Changes"
          onSubmit={(data: ProductInput) => updateProduct(id, data)}
        />
      </div>
    </div>
  );
}
