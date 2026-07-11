import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Product, ProductStatus } from "@/types/product";

const COLLECTION = "products";

function toProduct(id: string, data: Record<string, unknown>): Product {
  const ts = (t: unknown) =>
    t instanceof Timestamp ? t.toDate().toISOString() : new Date().toISOString();
  return {
    id,
    name: (data.name as string) ?? "",
    slug: (data.slug as string) ?? "",
    shortDescription: (data.shortDescription as string) ?? "",
    description: (data.description as string) ?? "",
    status: (data.status as ProductStatus) ?? "concept",
    categories: (data.categories as string[]) ?? [],
    industry: (data.industry as string[]) ?? [],
    aiCategory: (data.aiCategory as string[]) ?? [],
    businessProblem: (data.businessProblem as string[]) ?? [],
    tags: (data.tags as string[]) ?? [],
    prototypeUrl: (data.prototypeUrl as string) ?? "",
    liveSaasUrl: (data.liveSaasUrl as string) ?? "",
    judyUrl: (data.judyUrl as string) ?? "",
    learnMoreUrl: (data.learnMoreUrl as string) ?? "",
    imageUrl: (data.imageUrl as string) ?? "",
    published: (data.published as boolean) ?? false,
    featured: (data.featured as boolean) ?? false,
    order: (data.order as number) ?? 0,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

/** All published products (client-side sorted by order) */
export async function getPublishedProducts(): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTION),
    where("published", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toProduct(d.id, d.data()))
    .sort((a, b) => a.order - b.order);
}

/** Featured published products only (client-side sorted by order) */
export async function getFeaturedProducts(): Promise<Product[]> {
  const q = query(
    collection(db, COLLECTION),
    where("published", "==", true),
    where("featured", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toProduct(d.id, d.data()))
    .sort((a, b) => a.order - b.order);
}

/** Single product by slug */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(collection(db, COLLECTION), where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return toProduct(d.id, d.data());
}

/** All products (admin view, including unpublished, client-side sorted) */
export async function getAllProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => toProduct(d.id, d.data()))
    .sort((a, b) => a.order - b.order);
}

/** Single product by ID (admin) */
export async function getProductById(id: string): Promise<Product | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toProduct(snap.id, snap.data());
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

/** Create a new product */
export async function createProduct(data: ProductInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update an existing product */
export async function updateProduct(
  id: string,
  data: Partial<ProductInput>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

/** Toggle published state */
export async function togglePublished(
  id: string,
  published: boolean
): Promise<void> {
  await updateProduct(id, { published });
}

/** Delete a product */
export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Duplicate a product (copies all fields, appends " (Copy)" to name, unpublishes) */
export async function duplicateProduct(id: string): Promise<string> {
  const product = await getProductById(id);
  if (!product) throw new Error("Product not found");
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = product;
  return createProduct({
    ...rest,
    name: `${rest.name} (Copy)`,
    slug: `${rest.slug}-copy-${Date.now()}`,
    published: false,
  });
}
