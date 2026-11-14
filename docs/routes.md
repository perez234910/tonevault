# Route contract

Source audit: November 8, 2026; base `6112d47080760c10728cd416581ff16710bf4417`. “Implemented” means a handler exists in source, not that deployment or database access was verified. Proposed documentation requires team review.

| Core endpoint | State | Handler | Responses |
| --- | --- | --- | --- |
| `GET /api/products` | Implemented | `app/api/products/route.ts` → `queryProducts` | 200 including empty; 400 invalid filters; 500 query failure |
| `GET /api/products/:id` | Implemented | `app/api/products/[id]/route.ts` → `queryProductById` | 200; 404 invalid/missing UUID or absent product; 500 query failure |
| `POST /api/orders` | Implemented (single product) | `app/api/orders/route.ts` → `placeCatalogOrder` | 201; 400 invalid JSON/fields/quantity; 403 self-purchase; 404 missing product/buyer; 409 sold/insufficient stock; 500 query failure |
| `GET /api/orders/:id` | Planned — Member 3 | No handler | Required 200/404; shape/authentication needs agreement |
| `GET /api/orders` | Planned — Member 3 | No GET export | Required 200 list including empty; shape/authentication needs agreement |
| `GET /api/metrics` | Planned — Member 5 | No handler | Required 200; calculations/shape/owner access need agreement |

Catalog/Detail/Order functions and validation: `src/lib/catalog/queries.ts`, `src/lib/validators/catalog.ts`. Status mapping: `src/lib/catalog/http.ts`. Missing server environment configuration currently throws outside the result envelope; do not claim all configuration failures return the JSON below. API authentication for orders needs Member 3 review: the existing handler accepts browser-supplied `buyer_id` and uses a service-role RPC.

## Product list

No request body. Query fields: `brand`, `minPrice`, `maxPrice`, `verificationStatus`, `condition`, `query` or `search`, `status` (default `available`), `limit` (1–100, default 24), `offset` (integer ≥0, default 0). Prices must be finite and nonnegative, minimum ≤ maximum. Verification values: `Unverified`, `Remote Verified`, `Fully Verified`. Status: `available` or `sold`. Search matches brand/model/finish/condition notes, case-insensitively; `%_,()` are sanitized.

Example request: `GET /api/products?brand=Fender&maxPrice=500000&limit=24`.

Success shape: `{ "ok": true, "data": [Product], "products": [Product], "count": number }`. `data` and `products` contain the same returned page; `count` is the total filtered count. Empty: `{ "ok": true, "data": [], "products": [], "count": 0 }`.

`Product` fields (see [schema](schema.md)): `id`, `seller_id`, `brand`, `model`, `year`, `finish`, numeric `price`, `verification_status`, nullable `tonevault_score`, `condition_notes`, `status`, integer `stock`, `images`, `created_at`. Example shapes use type names as notation, not literal JSON values or fabricated API runs.

## Product detail

No request body. Path ID must be a UUID. Success: `{ "ok": true, "data": ProductDetail }`. `ProductDetail` contains all Product fields plus:

- `seller`: null or `{ id, full_name, role, created_at }` (no email).
- `inspection`: `{ verification_status, tonevault_score, score_scale: 100, condition_notes, is_verified, inspection_level }`. Level maps Fully Verified → `in_person`, Remote Verified → `remote`, Unverified → `none`.

Malformed and absent product IDs return `{ "ok": false, "code": "NOT_FOUND", "error": "Instrument not found." }` with 404. Database errors are 500, not 404, at the API; the existing Detail UI still treats every action error as not-found until Member 2's separate UX PR.

## Create order — simulated payment only

Request JSON template (replace placeholder IDs with authorized test records):

```json
{
  "product_id": "<product UUID>",
  "buyer_id": "<test buyer UUID>",
  "quantity": 1
}
```

Both IDs are required valid UUIDs. Quantity is required and must be a positive integer; numeric strings are coerced. Unknown fields, including browser totals, are stripped by Zod. Server/DB computes `price × quantity`. Success (201) shape: `{ "ok": true, "data": { "order": Order, "listing_status": "available" | "sold" } }`. `Order` contains `id`, `product_id`, `buyer_id`, `quantity`, `total_amount`, `escrow_status`, `tracking_number`, `created_at`; RPC sets `escrow_status: "pending"`. No payment provider is contacted.

Error shape: `{ "ok": false, "code": CatalogErrorCode, "error": string, "issues"?: [{ "path": string, "message": string }] }`. See table for statuses. The RPC locks the product, checks buyer/self-purchase/stock, inserts the order and decrements stock atomically. POST consumes stock. Never run it against production without explicit approval.

Multi-product orders, GET order responses and metrics shapes are **not defined by this documentation**. File/review a `Contract change: ...` issue before implementing them; Member 3 owns checkout/order decisions and Member 5 metrics.

## Screens

| Route | State / owner |
| --- | --- |
| `/` | Implemented Home — Member 1; featured collection still uses server action |
| `/browse` | Implemented; separate unmerged PR #18 uses Fetch → validate/transform → render `/api/products` JSON — Member 1 repair authored by Member 2 |
| `/products/[id]` | Implemented action-based Detail; own-API and state UX work pending — Member 2 |
| `/cart` | Missing — Member 2; waits for reviewed cart-state interface |
| `/checkout` | Missing — Member 3 |
| Confirmation route | Missing; final route name must be agreed — Member 3 |
| Owner route | Missing; final route name must be agreed — Member 5 |
