# ToneVault GC2 revenue pricing design

Date: 2026-11-08 (Asia/Manila)  
Owner: Member 4  
Repository: `perez234910/tonevault`  
Approved direction: 8% marketplace commission plus an optional verification add-on

## 1. Purpose

ToneVault needs two GC2 revenue features that match the GC1 business model, are enforced by the server, and are stored with each order. The implementation must be simple enough for Member 4 to explain and must not overwrite the unmerged work of other members.

The selected features are:

1. An 8% marketplace commission charged to the seller on the product subtotal.
2. An optional verification add-on selected by the buyer: none, remote verification for ₱2,800, or physical verification for ₱8,500.

These rules use the original GC1 commission and Philippine verification-fee values. Payment remains simulated, as required for GC2.

## 2. Scope and boundaries

### In scope

- One shared server-side pricing module with the three editable rule values.
- Integer-centavo calculations for subtotal, commission, verification fee, buyer total, seller payout, and platform revenue.
- Request validation for the verification option.
- Server-authoritative order pricing based on the current database product price.
- An atomic database operation that saves the order and reduces stock.
- Persisted pricing snapshots on the order so later rule changes do not rewrite old orders.
- Unit tests for pricing and validation.
- A pricing-quote API that can be consumed by checkout without trusting browser totals.
- Member 4 sections in `docs/business.md`, Challenge 4 evidence, AI disclosure, route/schema documentation, the shared Google Doc placeholders, and a maximum two-page PDF.
- A clear handoff for Member 4's individual Challenge 5 recording.

### Out of scope

- Real payments, PayMongo, real escrow, authentication, subscriptions, boosted-listing purchases, and seller dashboards.
- Changing Member 2's unmerged customer-interface branches.
- Implementing Member 3's order-read routes or Member 5's metrics route.
- Claiming deployed/Postman/phone evidence that has not actually been collected.
- Producing Member 4's predictions or recording. The student must do those personally before running their chosen three inputs.

## 3. Isolation and Git approach

Implementation will start from `main` in separate `g2/m4-*` branches. Member 2's open branches remain unchanged. Small integration points on `main` are allowed only where the revenue features require them: pricing files, order validation/query code, order route contract, database migration, generated TypeScript database types, tests, and relevant documentation.

The work is divided into three code-review units:

1. `g2/m4-pricing-engine`: pricing rules, pure calculator, and unit tests.
2. `g2/m4-order-pricing`: database fields/RPC and order-route persistence.
3. `g2/m4-pricing-quote`: read-only quote endpoint and customer-integration handoff.

Each PR targets `main` and must be merged in that order. Later branches may be based on the earlier branch, but their PRs still target `main`; after the earlier PR merges, GitHub will reduce the later diff. Human review, approval, and merging remain group responsibilities.

## 4. Pricing rules and calculations

The single editable rules object will live in `src/lib/pricing/rules.ts`:

- Commission rate: 800 basis points = 8%.
- Remote verification fee: 280,000 centavos = ₱2,800.
- Physical verification fee: 850,000 centavos = ₱8,500.

The calculator will accept:

- unit product price in centavos;
- positive integer quantity; and
- verification option: `none`, `remote`, or `physical`.

It will return:

- `subtotalCentavos = unitPriceCentavos × quantity`;
- `commissionCentavos = round(subtotalCentavos × 800 ÷ 10,000)`;
- `verificationFeeCentavos` from the selected option;
- `buyerTotalCentavos = subtotalCentavos + verificationFeeCentavos`;
- `sellerPayoutCentavos = subtotalCentavos - commissionCentavos`; and
- `platformRevenueCentavos = commissionCentavos + verificationFeeCentavos`.

The add-on is paid by the buyer. The commission is deducted from the seller's product proceeds. The verification fee is therefore not deducted a second time from the seller.

All JavaScript calculations use integer centavos. Conversion to Postgres `numeric(12,2)` happens at the server/database boundary.

## 5. Request and data flow

### Quote flow

1. The browser sends product ID, quantity, and verification option to `POST /api/pricing/quote`.
2. Zod rejects missing/invalid fields with 400.
3. The server fetches the current product price and availability from Supabase.
4. The shared calculator produces the breakdown.
5. The API returns the server quote. It does not reserve stock or create an order.

### Order flow

1. The browser sends product ID, buyer ID, quantity, and verification option to `POST /api/orders`.
2. Unknown browser fields such as `total`, `commission`, or `verification_fee` are ignored by the validated contract.
3. The server loads the current database price and calls the shared calculator.
4. The service-role-only RPC locks the product row.
5. The RPC confirms that the product remains available, stock is sufficient, the buyer exists, the buyer is not the seller, and the expected unit price still matches the locked database row.
6. The RPC inserts the complete pricing snapshot, decrements stock, and marks the listing sold when stock reaches zero in the same transaction.
7. The API returns 201 with the saved order and listing status.

If the product price changes between the server quote and the row lock, the RPC returns a price-change conflict. The client must request a fresh quote instead of saving stale money values.

## 6. Database changes

A new migration will extend `public.orders` with:

- `unit_price`;
- `subtotal_amount`;
- `verification_option` (`none`, `remote`, or `physical`);
- `verification_fee`;
- `commission_rate_bps`;
- `commission_amount`;
- `seller_payout_amount`; and
- `platform_revenue_amount`.

`total_amount` remains the amount shown to the buyer and becomes `subtotal_amount + verification_fee`.

The fields are snapshots. For example, an order created at 8% keeps 8% even if the owner later changes the active rate. This makes owner metrics and past receipts reproducible.

The replacement `place_catalog_order` RPC remains executable only by the Supabase service role. It receives a server-calculated snapshot plus the expected unit price, validates the locked listing, and performs the insert and stock update atomically. The browser never calls Supabase or supplies trusted money fields.

## 7. Business rules to document

The owner-language rules will be:

1. "ToneVault keeps 8% of the guitar subtotal when an order is saved."
2. "A buyer may add no verification, remote verification for ₱2,800, or physical verification for ₱8,500."
3. "The verification fee is added once per order, not once per guitar quantity."
4. "The server always uses the current catalog price and ignores totals sent by the browser."
5. "An order and its pricing breakdown are saved only when stock can be reduced in the same transaction."

Each rule will name the enforcing server function/database statement and the customer-facing result.

## 8. Worked examples

The documentation will use real seed prices:

### Feature 1: 8% marketplace commission

For the ₱168,000 PRS Custom 24 with no add-on:

- Product subtotal: ₱168,000.
- Commission: ₱168,000 × 8% = ₱13,440.
- Buyer total: ₱168,000.
- Seller payout: ₱154,560.
- ToneVault revenue: ₱13,440.

Conclusion: the commission earns revenue only when a sale completes, so ToneVault benefits from reducing buyer uncertainty and checkout abandonment.

### Feature 2: physical verification add-on

For the ₱195,000 Gibson ES-335 with physical verification:

- Product subtotal: ₱195,000.
- Verification fee: ₱8,500.
- Buyer total: ₱203,500.
- Commission: ₱15,600.
- Seller payout: ₱179,400.
- ToneVault revenue: ₱15,600 + ₱8,500 = ₱24,100.

Conclusion: the add-on increases platform revenue by ₱8,500 while directly supporting ToneVault's trust promise. It should remain optional because not every buyer needs another inspection.

Actual results will be added only after tests or API calls run against the implemented code.

## 9. Error handling

- 400: invalid JSON, missing field, non-positive/non-integer quantity, or invalid verification option.
- 404: product or buyer not found.
- 403: seller attempts to buy their own listing.
- 409: insufficient stock, sold/taken listing, or price changed before the transaction.
- 500: unexpected database/configuration failure with a concise client message.

The quote endpoint has loading, error, and stale-selection handling in its integration contract. It never presents a quote as a saved order.

## 10. Verification

Automated checks will include:

- exact commission, fee, total, payout, and platform-revenue outputs;
- all three verification options;
- quantity validation and centavo rounding;
- invalid verification option rejection;
- browser-supplied total not becoming authoritative;
- type checking, linting, build, and `git diff --check`;
- migration/RPC contract inspection; and
- API checks when an authorized Supabase environment is available.

No live database write, deployment claim, or screenshot will be invented. If credentials or deployment are unavailable, local unit checks will be reported separately from pending live evidence.

## 11. Challenge 4 and Challenge 5

For Challenge 4, the pre-refactor audit will identify every hard-coded rule location. The final design keeps active values only in `src/lib/pricing/rules.ts`. Changing 8% to another rate or changing an add-on fee therefore requires one rule-file edit; database order rows retain their historical snapshots.

For Challenge 5, Member 4 can use the pure `calculateOrderPricing` function. The repository will include tests and a plain-language explanation, but the student must choose three inputs, write predictions before executing them, run them, explain any mismatch, and make the unedited recording without AI assistance.

## 12. Completion criteria

The design is complete when:

- both rules are enforced by server code and reflected in the service-role transaction;
- saved orders contain the complete pricing snapshot;
- stock and order persistence remain atomic;
- calculator and validation tests pass;
- three scoped code PRs are ready for genuine human review;
- the repository documentation and shared Google Doc match the implemented behavior;
- the two-page PDF fits the submission limit; and
- all uncollected evidence is clearly labelled pending instead of being fabricated.
