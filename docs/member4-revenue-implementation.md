# ToneVault GC2 revenue pricing implementation

Date: 2026-11-08 (Asia/Manila)

Owner: Member 4

Repository: `perez234910/tonevault`

ToneVault uses two revenue features from the GC1 business model: an 8% marketplace commission and an optional verification add-on. The server calculates both features from the current catalog price, and an order stores the resulting pricing breakdown. Payment remains simulated for GC2.

## Purpose and boundaries

The implementation gives ToneVault a consistent way to calculate buyer totals, seller payouts and platform revenue. Pricing rules are owned by one server file so browser values cannot replace them.

Included work covers pricing rules, calculations, order validation, saved pricing fields, the order database transaction, a pricing-quote route, tests and supporting documentation.

Real payments, escrow, authentication, subscriptions, seller dashboards and deployed evidence are outside Member 4's scope. Member 2's customer-interface branches and Member 3's authentication/contact work remain separate integration responsibilities.

## Revenue rules

| Rule | Server behavior | Customer or owner result |
| --- | --- | --- |
| Marketplace commission | ToneVault records 8% of the product subtotal | The seller receives the subtotal minus commission |
| No verification | No add-on fee is charged | The buyer pays only the product subtotal |
| Remote verification | ₱2,800 is added once to the order | The buyer receives a lower-cost verification option |
| Physical verification | ₱8,500 is added once to the order | The buyer receives an in-person inspection option |
| Server authority | The current catalog price is used and browser totals are ignored | A changed or false browser total cannot control the saved amount |
| Atomic save | The order is saved only when stock can be reduced in the same transaction | Sold or insufficient-stock listings return a conflict |

The verification fee is charged once per order rather than once per quantity. Commission is deducted from the seller's product proceeds. The verification fee is added to the buyer's total and is not deducted a second time from the seller.

## Pricing results

| Result | Calculation |
| --- | --- |
| Product subtotal | Current unit price multiplied by quantity |
| Commission | Product subtotal multiplied by 8%, rounded to the nearest centavo |
| Buyer total | Product subtotal plus the selected verification fee |
| Seller payout | Product subtotal minus commission |
| Platform revenue | Commission plus verification fee |

Application calculations use integer centavos. Database amounts are stored as two-decimal peso values. This avoids floating-point errors in money calculations.

## File responsibilities

| File | Responsibility |
| --- | --- |
| `src/lib/pricing/rules.ts` | Stores the active commission rate and three verification fees |
| `src/lib/pricing/calculate.ts` | Produces the subtotal, commission, payout, platform revenue and buyer total |
| `src/lib/pricing/catalog.ts` | Loads the current catalog record and creates a server-owned quote |
| `src/lib/validators/catalog.ts` | Validates quantity and the selected verification option while removing unknown money fields |
| `app/api/pricing/quote/route.ts` | Accepts quote requests and returns the server-calculated breakdown |
| `src/lib/catalog/queries.ts` | Sends the verified pricing snapshot to the order transaction |
| `src/types/index.ts` and `src/types/database.ts` | Describe the request, response and saved-order pricing fields |
| `supabase/migrations/20261108081033_add_revenue_pricing.sql` | Adds pricing fields and replaces the order transaction |
| `tests/pricing*.test.ts` | Checks calculation, validation, catalog, route, type and migration behavior |

## Quote request flow

1. The browser sends a product ID, quantity and verification choice to the pricing-quote route.
2. Validation rejects missing or invalid fields.
3. The server loads the current product price and available stock from Supabase.
4. The shared calculator creates the pricing breakdown.
5. The route returns the quote without reserving stock or creating an order.

The quote response includes the current unit price, subtotal, commission, verification fee, seller payout, platform revenue and buyer total. A browser-supplied total is not accepted as an authority.

## Order flow

1. The order request supplies the product, buyer, quantity and verification choice.
2. Validation removes browser-supplied pricing fields and checks the required values.
3. The server reloads the current catalog price and calculates a new snapshot.
4. The database transaction locks the product row and checks availability, stock, buyer and seller rules.
5. The transaction confirms that the expected price still matches the locked catalog row.
6. The order and complete pricing snapshot are inserted while stock is reduced in the same transaction.
7. The saved order and listing status are returned to the application.

If the product price changes before the row is locked, the transaction rejects the stale snapshot. The customer must request a fresh quote.

## Stored order data

| Field | Purpose |
| --- | --- |
| `unit_price` | Catalog price used for the order |
| `subtotal_amount` | Unit price multiplied by quantity |
| `verification_option` | None, remote or physical |
| `verification_fee` | Add-on fee saved for the order |
| `commission_rate_bps` | Commission rate used when the order was created |
| `commission_amount` | ToneVault's commission on the subtotal |
| `seller_payout_amount` | Product proceeds remaining for the seller |
| `platform_revenue_amount` | Commission plus verification fee |
| `total_amount` | Final amount shown to the buyer |

These values are historical snapshots. A later change to the active rate or fees does not rewrite an earlier order.

## Validation and responses

| Status | Situation |
| --- | --- |
| 400 | Invalid JSON, missing field, invalid quantity or invalid verification choice |
| 403 | A seller attempts to buy their own listing |
| 404 | The requested product or buyer does not exist |
| 409 | Stock is insufficient, the listing is sold or the catalog price changed |
| 500 | An unexpected database or configuration failure occurs |

The order transaction is restricted to the server service role. The browser does not call the transaction directly and cannot supply trusted pricing values.

## Verification

Automated coverage checks all verification choices, commission and fee calculations, centavo rounding, invalid quantities, invalid options, ignored browser totals, saved pricing fields, stock atomicity, transaction permissions and quote-route responses.

The Member 4 branch has 17 passing tests. Type checking, changed-file lint and the production build pass. Full-repository lint still reports the existing cart effect error in `src/components/cart-context.tsx`; Member 4 does not modify that file.

A read-only live quote confirmed that a supplied total of 1 was ignored in favor of the database catalog price. The database migration has not been applied, and no live order, stock change, deployment, phone test or human review is claimed.

## Git and integration boundaries

Member 4 work is separated into four review units:

1. PR #40 contains shared pricing rules and calculations.
2. PR #41 adds the saved pricing snapshot and database transaction.
3. PR #42 adds the server pricing-quote endpoint.
4. PR #43 contains business, route, schema, challenge and submission documentation.

The intended review order is PR #40, PR #41, PR #42 and PR #43. All target `main`, and none is merged automatically.

Member 3 PR #37 also contains pricing logic. Integration should retain Member 3's authentication, contact and payment work while using Member 4's rules, snapshot fields and order transaction as the single pricing source.

## Documentation and individual work

Challenge 4 identifies the active commission value in `src/lib/pricing/rules.ts` as the only runtime edit required for a future rate change. Saved orders remain historical snapshots, while examples and documents are reporting evidence rather than active configuration.

For Challenge 5, Member 4 may use the pricing calculator but must personally choose three inputs, write predictions before running them, record the actual results, explain mismatches and make the unedited recording without AI assistance.

The shared Google Doc contains Member 4's monetization, business-value, revenue-feature and numerical-example sections. The two-page business summary reports what was built, how each feature supports the business model and how the worked numbers support the revenue strategy.

## Completion boundaries

The implementation is ready for group review when the pricing PRs are reviewed in order, the migration is approved and applied, the checkout work is reconciled with Member 3, and deployed API evidence is collected. Human approval, merge, deployment, Postman screenshots, phone testing and the individual recording remain separate requirements.
