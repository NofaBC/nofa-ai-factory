import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Fetch product fields from Firestore REST API (no client SDK needed server-side) */
async function fetchProductMeta(
  slug: string
): Promise<{ name: string; shortDescription: string; imageUrl: string } | null> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "products" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "slug" },
                op: "EQUAL",
                value: { stringValue: slug },
              },
            },
            limit: 1,
          },
        }),
        next: { revalidate: 3600 },
      }
    );
    const data = await res.json();
    const fields = data[0]?.document?.fields;
    if (!fields) return null;
    return {
      name: fields.name?.stringValue ?? "",
      shortDescription: fields.shortDescription?.stringValue ?? "",
      imageUrl: fields.imageUrl?.stringValue ?? "",
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductMeta(slug);

  if (!product) {
    return {
      title: "Product Not Found — NOFA AI Factory™",
      description: "Explore AI products, prototypes, and live SaaS applications.",
    };
  }

  return {
    title: `${product.name} — NOFA AI Factory™`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      type: "website",
      ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription,
      ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
