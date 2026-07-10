"use client";

import ProductForm from "@/components/ProductForm";
import { createProduct, ProductInput } from "@/lib/firestore";

export default function NewProductPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-8">Add New Product</h1>
        <ProductForm
          submitLabel="Create Product"
          onSubmit={(data: ProductInput) => createProduct(data).then(() => {})}
        />
      </div>
    </div>
  );
}
