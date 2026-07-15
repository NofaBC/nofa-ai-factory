/**
 * Server-side Firestore access via REST API.
 * Used in Next.js API routes and Server Components where the Firebase
 * client SDK is unavailable. Requires Firestore rules: allow read: if true.
 */

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { nullValue: null };

function parseValue(val: FirestoreValue): unknown {
  if ("stringValue" in val) return val.stringValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return val.doubleValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val)
    return (val.arrayValue.values ?? []).map(parseValue);
  if ("mapValue" in val) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields)) {
      out[k] = parseValue(v);
    }
    return out;
  }
  return null;
}

function parseDoc(doc: { fields?: Record<string, FirestoreValue> }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) {
    out[k] = parseValue(v);
  }
  return out;
}

const PROJECT_ID = () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const QUERY_URL = () =>
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID()}/databases/(default)/documents:runQuery`;

async function runQuery(
  body: object,
  fetchOptions: RequestInit = {}
): Promise<Record<string, unknown>[]> {
  const res = await fetch(QUERY_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    next: { revalidate: 60, tags: ["products"] }, // 60s ISR + on-demand invalidation tag
    ...fetchOptions,
  });
  const rows: { document?: { name: string; fields: Record<string, FirestoreValue> } }[] =
    await res.json();
  return rows
    .filter((r) => r.document)
    .map((r) => {
      const id = r.document!.name.split("/").pop() ?? "";
      return { id, ...parseDoc(r.document!) };
    });
}

/** Fetch all published products (60s ISR cache, tag: "products"). */
export async function fetchPublishedProductsREST(): Promise<Record<string, unknown>[]> {
  return runQuery({
    structuredQuery: {
      from: [{ collectionId: "products" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "published" },
          op: "EQUAL",
          value: { booleanValue: true },
        },
      },
    },
  });
}

/** Fetch a single published product by slug (60s ISR cache, tag: "products"). */
export async function fetchProductBySlugREST(
  slug: string
): Promise<Record<string, unknown> | null> {
  const results = await runQuery({
    structuredQuery: {
      from: [{ collectionId: "products" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: "published" },
                op: "EQUAL",
                value: { booleanValue: true },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: "slug" },
                op: "EQUAL",
                value: { stringValue: slug },
              },
            },
          ],
        },
      },
      limit: 1,
    },
  });
  return results[0] ?? null;
}
