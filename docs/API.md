# NOFA AI Factory — Product API Reference

Base URL: `https://nofaaifactory.com`

All endpoints are public, read-only, CORS-enabled, and return JSON.
Cache: 60-second ISR, invalidated immediately on any product write via Firebase trigger.

---

## GET /api/products

Returns all published products.

**Response**
```json
{
  "count": 12,
  "products": [ ...PublicProduct ]
}
```

---

## GET /api/products/:slug

Returns a single published product by slug.

**Example:** `GET /api/products/edgezen-ai`

**Response (200)**
```json
{
  "product": { ...PublicProduct }
}
```

**Response (404)**
```json
{ "error": "Product not found", "slug": "unknown-slug" }
```

---

## GET /api/products/search

Search and filter published products.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `q` | string | Full-text search: name, description, tags, categories, industry, business problem |
| `industry` | string | Exact industry match (case-insensitive) |
| `category` | string | Exact AI category or category match |
| `status` | string | Exact status key or label substring |
| `tag` | string | Exact tag match |
| `businessProblem` | string | Exact business problem match |
| `limit` | number | Max results (default: 10, max: 50) |

**Example:** `GET /api/products/search?q=wellness&status=live_prototype`

**Response**
```json
{
  "results": [ ...PublicProduct ],
  "count": 3,
  "limit": 10,
  "filters": { "q": "wellness", "status": "live_prototype", ... }
}
```

---

## POST /api/revalidate

Manually clears the products cache. Called automatically by the Firestore trigger.

**Auth:** `x-revalidate-secret: <REVALIDATE_SECRET>` header

**Response**
```json
{ "revalidated": true, "tag": "products", "timestamp": "..." }
```

---

## PublicProduct shape

```json
{
  "name": "EdgeZen AI™",
  "slug": "edgezen-ai",
  "shortDescription": "AI-powered wellness companion...",
  "description": "Full description...",
  "status": "live_prototype",
  "statusLabel": "🚀 Live Prototype",
  "canTestLive": true,
  "availableActions": ["View Prototype", "Talk to Judy"],
  "links": {
    "productPage": "https://nofaaifactory.com/products/edgezen-ai",
    "liveSaas": null,
    "prototype": "https://edgezen-ai.vercel.app/",
    "judy": "https://judyva.vercel.app/?tenant=NOFA-Business-Consulting",
    "learnMore": "https://edgezen-ai.vercel.app/"
  },
  "categories": ["Wellness", "Mindfulness"],
  "industry": ["Healthcare", "Employee Wellness"],
  "aiCategory": ["Wellness AI", "Conversational AI"],
  "businessProblem": ["Stress Management", "Mental Fatigue"],
  "tags": ["AI wellness", "mindfulness AI", "stress relief"],
  "imageUrl": "https://firebasestorage.googleapis.com/..."
}
```

**Status keys and their meaning:**

| Key | Label | Meaning |
|---|---|---|
| `concept` | 💡 Concept | Idea stage only. Not built. |
| `experimental` | 🧪 Experimental | Early-stage, unstable. |
| `in_development` | 🏗 In Development | Being built. Not yet available. |
| `prototype_ready` | 🏷 Prototype Ready | Prototype exists, may not be publicly accessible. |
| `live_prototype` | 🚀 Live Prototype | Working demo. NOT a production product. |
| `live_saas` | ✅ Live SaaS | Fully deployed commercial product. |
| `seeking_pilot` | 🤝 Seeking Pilot Customer | Ready for pilot, not yet public. |
| `licensing_available` | 💰 Licensing Available | Available for licensing. |
