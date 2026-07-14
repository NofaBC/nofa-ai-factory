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

/** Fetch all published products via Firestore REST API (no auth required with public rules). */
export async function fetchPublishedProductsREST(): Promise<Record<string, unknown>[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
    next: { revalidate: 300 }, // cache 5 minutes
  });

  const rows: { document?: { name: string; fields: Record<string, FirestoreValue> } }[] =
    await res.json();

  return rows
    .filter((r) => r.document)
    .map((r) => {
      const data = parseDoc(r.document!);
      // Extract document ID from the name path
      const id = r.document!.name.split("/").pop() ?? "";
      return { id, ...data };
    });
}
