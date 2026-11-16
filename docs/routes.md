# Route contract

Contract for the integrated checkout in PRs #37–#39. “Implemented” describes the code on the integration branch. Shared deployment requires the pricing and checkout migrations.

| Core endpoint | State | Handler | Responses |
| --- | --- | --- | --- |
| `GET /api/products` | Implemented | `app/api/products/route.ts` → `queryProducts` | 200 including empty; 400 invalid filters; 500 query failure |
| `GET /api/products/:id` | Implemented | `app/api/products/[id]/route.ts` → `queryProductById` | 200; 404 invalid/missing UUID or absent product; 500 query failure |
| `POST /api/orders` | Implemented (one cart line) | `app/api/orders/route.ts` → `placeCheckoutOrder` | 201 saved; 400 invalid input; 401 invalid login or unauthenticated legacy request; 403 self-purchase or read-only preview; 404 missing product/buyer; 409 stock or price conflict; 500 save failure |
| `GET /api/orders/:id` | Implemented — Member 3 | `app/api/orders/[id]/route.ts` | 200 accessible saved order; 401 missing access or invalid login; 404 invalid ID, missing order or order outside the caller’s access; 500 lookup failure |
| `POST /api/pricing/quote` | Implemented — Member 4 | `app/api/pricing/quote/route.ts` → `quoteCatalogPricing` | 200 quote; 400 invalid JSON/fields/quantity/option; 404 missing product; 409 unavailable/insufficient stock; 500 JSON `INTERNAL_ERROR` |
| `GET /api/orders` | Implemented — Member 5 | `app/api/orders/route.ts` → `requireAdmin` | 200 saved orders, including empty; 401 missing/invalid session; 403 authenticated non-admin; 500 configuration/query failure |
| `GET /api/metrics` | Implemented — Member 5 | `app/api/metrics/route.ts` → `requireAdmin`, `calculateOwnerMetrics` | 200 owner metrics; 401 missing/invalid session; 403 authenticated non-admin; 500 configuration/query failure |

Catalog/Detail/Order functions and validation: `src/lib/catalog/queries.ts`, `src/lib/validators/catalog.ts`. Status mapping: `src/lib/catalog/http.ts`. Pricing uses `src/lib/pricing/rules.ts`, `calculate.ts`, and `catalog.ts`. The quote route returns JSON for unexpected pricing failures. Checkout derives buyer identity from a verified session. Guest orders have a null buyer ID.

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

## Pricing quote — read-only

Request JSON:

```json
{
  "product_id": "<product UUID>",
  "quantity": 1,
  "verification_option": "none"
}
```

`verification_option` is optional and defaults to `none`; accepted values are `none`, `remote`, and `physical`. The server reads the current product price and active rules. Unknown browser money fields such as `total`, `commission_amount`, and `verification_fee` are stripped. Success (200) shape:

```json
{
  "ok": true,
  "data": {
    "product_id": "<product UUID>",
    "quantity": 1,
    "pricing": {
      "unit_price": 168000,
      "subtotal_amount": 168000,
      "verification_option": "none",
      "verification_fee": 0,
      "commission_rate_bps": 800,
      "commission_amount": 13440,
      "seller_payout_amount": 154560,
      "platform_revenue_amount": 13440,
      "total_amount": 168000
    }
  }
}
```

The quote does not insert an order, reduce stock, or reserve an instrument. The shown shape is a contract/example verified by automated tests; it is not a claim that this exact product was quoted on a deployment.

## Create order — simulated payment only

Send `Content-Type: application/json`. For account checkout, add `Authorization: Bearer <buyer access token>`. Omit the authorization header for a guest order.

```json
{
  "product_id": "<product UUID>",
  "quantity": 1,
  "verification_option": "none",
  "customer": {
    "full_name": "Test Buyer",
    "email": "buyer@example.invalid",
    "phone": "09123456789",
    "address": "123 Test Street, Quezon City, 1100, Philippines"
  },
  "payment_method": "simulated_card",
  "payment_confirmed": true
}
```

Quantity must be a positive integer. Verification accepts `none`, `remote`, or `physical`. Payment accepts `simulated_card` or `simulated_gcash`. To check the price the buyer reviewed, include the quote’s `total_amount` as `expected_total_amount`. A mismatch returns 409 before saving. The server calculates the saved price and ignores browser-supplied `buyer_id`, `total`, and `total_amount`.

Checkout returns 201 with `{ "ok": true, "data": { "order": Order } }`. The transaction saves the price breakdown and checkout details and decrements stock. Guest checkout sets an order-specific HttpOnly cookie. Use an authorized test database for stock-consuming Postman requests.

### Read a saved order

`GET /api/orders/:id` accepts the guest browser’s order cookie or the verified buyer’s bearer token. Responses are private and uncached. Success returns `{ "ok": true, "data": { "order": Order } }` with the buyer’s saved prices and order status. The order POST and GET responses omit commission, seller payout, and platform revenue. Private checkout details and the guest token hash are excluded. Use `/confirmation/:id` for the customer page.

See [Member 3 checkout and order details](member3-orders.md) for the complete pricing and response contract.

## Owner dashboard — administrator endpoints

Both endpoints require an administrator's Supabase access token:

`Authorization: Bearer <admin access token>`

### List saved orders

`GET /api/orders` returns the saved orders accessible to the administrator.

Success (200):

`{ "ok": true, "orders": [Order] }`

An empty order list returns 200 with `"orders": []`. Missing or invalid authentication returns 401; an authenticated non-admin returns 403.

### Owner metrics

`GET /api/metrics` returns calculated owner dashboard metrics based on saved orders and product records.

Success (200):

`{ "ok": true, "metrics": { ... } }`

The metrics are calculated as follows:

| Metric | Calculation |
| --- | --- |
| Total orders | Number of saved orders |
| Total order value | Sum of saved `total_amount` values |
| Platform revenue | Sum of saved `platform_revenue_amount` values |
| Average order value | Total order value divided by the number of saved orders; returns 0 when there are no orders |
| Top-selling guitars | Sum of saved order quantities per product; includes all products tied for the highest quantity |
| Low-stock listings | Available products with stock at or below the configured threshold, currently 2 units |

Missing or invalid authentication returns 401. An authenticated non-admin returns 403. Supabase configuration or database failures return 500.

Both owner endpoints (`GET /api/orders` and `GET /api/metrics`) require an administrator's Supabase access token in the `Authorization: Bearer <token>` header. They expose private owner data and must not be treated as public catalog endpoints.

Sample mode does not display owner metrics or sample sales figures.
## Screens

| Route | State / owner |
| --- | --- |
| `/` | Implemented Home — Member 1; featured collection still uses server action |
| `/browse` | Implemented; separate unmerged PR #18 uses Fetch → validate/transform → render `/api/products` JSON — Member 1 repair authored by Member 2 |
| `/products/[id]` | Implemented action-based Detail; own-API and state UX work pending — Member 2 |
| `/cart` | Cart with quantity and stock controls |
| `/checkout` | Four-step guest or account checkout |
| `/confirmation` and `/confirmation/:id` | Order lookup and protected confirmation |
| `/owner` | Implemented — Member 5; administrator sign-in, saved orders and owner metrics; sample mode displays a read-only notice |
