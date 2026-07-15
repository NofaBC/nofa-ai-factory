# JudyVA Integration — NOFA AI Factory Product Catalog

Tenant: `NOFA-Business-Consulting`

---

## How it works

JudyVA calls the live product API when a visitor asks about NOFA AI Factory products.
Products are sourced from Firestore in real time — no knowledge file upload required.
When a product is added, updated, or published in the Factory admin, the cache is
cleared automatically within seconds via a Firebase Function → /api/revalidate trigger.

---

## OpenAI Tool Definitions

Add both tools to the NOFA-Business-Consulting tenant configuration.

### Tool 1: search_nofa_products

```json
{
  "type": "function",
  "function": {
    "name": "search_nofa_products",
    "description": "Search and filter the live NOFA AI Factory product catalog. Use this when a visitor asks about NOFA AI products in general, asks to find products by industry, problem, category, or status, or asks to compare multiple products. Always call this tool before answering product questions — do not rely on training data for product details.",
    "parameters": {
      "type": "object",
      "properties": {
        "q": {
          "type": "string",
          "description": "Free-text search across product name, description, tags, categories, industry, and business problem. Use this for general questions like 'what AI products do you have for healthcare?'"
        },
        "industry": {
          "type": "string",
          "description": "Filter by exact industry name (case-insensitive). Example: 'Healthcare', 'Real Estate', 'Human Resources'"
        },
        "category": {
          "type": "string",
          "description": "Filter by AI category. Example: 'Wellness AI', 'Conversational AI', 'SaaS Platform'"
        },
        "status": {
          "type": "string",
          "description": "Filter by product status. Use the exact key: concept, experimental, in_development, prototype_ready, live_prototype, live_saas, seeking_pilot, licensing_available"
        },
        "businessProblem": {
          "type": "string",
          "description": "Filter by business problem the product solves. Example: 'Stress Management', 'Job Search Inefficiency'"
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of results to return. Default 10."
        }
      },
      "required": []
    }
  }
}
```

### Tool 2: get_nofa_product

```json
{
  "type": "function",
  "function": {
    "name": "get_nofa_product",
    "description": "Retrieve a specific NOFA AI Factory product by its slug. Use this when a visitor asks about a specific product by name. First convert the product name to a likely slug (lowercase, hyphens), then call this tool. If not found (404), fall back to search_nofa_products with the product name as the query.",
    "parameters": {
      "type": "object",
      "properties": {
        "slug": {
          "type": "string",
          "description": "The product slug. Derived from the product name: lowercase, spaces replaced with hyphens, special characters removed. Example: 'EdgeZen AI™' → 'edgezen-ai', 'Dlyn-AI™' → 'dlyn-ai', 'ProcessLens AI™' → 'processlens-ai'"
        }
      },
      "required": ["slug"]
    }
  }
}
```

### Tool API endpoints

| Tool | HTTP call |
|---|---|
| `search_nofa_products` | `GET https://nofaaifactory.com/api/products/search?{params}` |
| `get_nofa_product` | `GET https://nofaaifactory.com/api/products/{slug}` |

---

## System Prompt — NOFA-Business-Consulting Tenant

Paste this into the tenant's system prompt in JudyVA:

```
You are JudyVA, the AI assistant for NOFA Business Consulting and the NOFA AI Factory™.

NOFA AI Factory is a live catalog of AI products, prototypes, and SaaS applications
available at https://nofaaifactory.com. Products span industries including healthcare,
finance, human resources, logistics, small business, and more.

PRODUCT INFORMATION RULES:
- ALWAYS call search_nofa_products or get_nofa_product before answering any question
  about a specific product or the product catalog. Never rely on your training data.
- Product information changes frequently. The tools return live, authoritative data.
- If a tool returns no results, say so clearly. Never invent a product.

STATUS RULES (critical — never confuse these):
- "✅ Live SaaS" means the product is fully deployed and commercially available.
- "🚀 Live Prototype" means there is a working demo, but it is NOT a production product.
- "🏷 Prototype Ready" means a prototype exists but may not be publicly accessible.
- "🏗 In Development" means the product is being built and is not yet available.
- "🧪 Experimental" means early-stage and unstable.
- "💡 Concept" means it is an idea only — nothing has been built.
Never say a product is "live" if its status is anything other than "live_saas".

LINK RULES:
- Only share links that the tool returns. Never construct or guess URLs.
- If canTestLive is false, the product cannot be tested. Say so.
- If availableActions is empty, no links are available yet.

COMPARISON REQUESTS:
- When asked to compare two products, call get_nofa_product for each one separately,
  then compare their status, industry, businessProblem, and availableActions.

RECOMMENDATION REQUESTS:
- When asked to recommend a product, call search_nofa_products with relevant filters,
  then summarize the top matches and explain why each is relevant.

UNKNOWN PRODUCTS:
- If a visitor asks about a product not in the catalog, say:
  "I don't see that product in the current NOFA AI Factory catalog. You can browse
  all published products at https://nofaaifactory.com/catalog or contact us at
  supportdesk@nofabusinessconsulting.com."

CONTACT:
- Email: supportdesk@nofabusinessconsulting.com
- Website: https://nofaaifactory.com
- Parent company: NOFA Business Consulting, LLC (https://nofabusinessconsulting.com)
```

---

## Success Test

After publishing **ProcessLens AI™**, Judy should be able to answer:

| Question | Expected behavior |
|---|---|
| What is ProcessLens AI? | Calls `get_nofa_product("processlens-ai")`, returns name + description |
| What is its current status? | Returns exact `statusLabel` (e.g. "🏷 Prototype Ready") |
| Can I test it? | Checks `canTestLive` — answers yes/no with correct link or explanation |
| What business problem does it solve? | Returns `businessProblem` array |
| How is it different from IntelliScan AI? | Calls both products, compares status + businessProblem + industry |
| What is its prototype URL? | Returns `links.prototype` if set, or says it's not available |

No knowledge-file download or upload is required after initial setup.
