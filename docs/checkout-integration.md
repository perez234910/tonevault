# Checkout interface and Member 3 handoff

`/checkout` adapts GC1 pages 11–12 and Tonely's split form/pale summary into route-based Contact → Shipping → Payment → Review UI. The cart links to the form; Add/Buy Now still preserve stock and persistence. Empty cart, field errors, focus, back/edit navigation, payment selection, reduced motion and responsive summary are implemented. Required details remain in React memory only; neither localStorage, URLs nor a backend receives the contact/address. Refresh intentionally clears form details and preserves the existing cart.

This is a form preview, not a working order-placement flow. The final button is disabled. It never calls POST /api/orders, creates an order reference, clears the cart on fake success or claims payment/escrow. Shipping/fees are uncalculated rather than fabricated as free.

On entry/selection changes, GET /api/products/:id refreshes catalog prices and stock. The amount shown is still a preview; no frontend amount is submitted. The final order server must determine all prices, quantities, shipping/fees and atomic availability again at submission. Unavailable stock or GET errors produce visible summary feedback.

## Existing backend and missing integration

Current POST /api/orders accepts one product_id, buyer_id and quantity and calls the database RPC. It does not provide an authenticated cart-wide contact/shipping/payment contract. Do not send a browser-chosen buyer ID, simulate multi-item success with sequential writes, or trust frontend totals. No production RPC was invoked while building this interface.

Member 3 must agree the authenticated checkout contract, derive buyer identity from the session, support the chosen multi-item/atomic policy, validate and persist appropriate contact/shipping fields, apply server-owned prices/fees and return saved order IDs only after a successful transaction. Confirmation needs an authorized order-read API. Error handling must retain the selection and not report success on a partial failure. Coordinate pricing extensions with Member 4. No schema, RPC, auth policy or backend endpoint is changed by this UI PR.

The sample-data development guard and isolated cart namespaces remain intact. This branch is explicitly stacked on `g2/m2-storefront-polish` (PR #27); it does not merge any dependency. Human Member 3/module-owner review is needed before integration.

Validation: TypeScript, ESLint and 21 automated tests passed. The dedicated browser script tests empty/contact/shipping/payment/review, validation/focus, back/edit values, catalog quote refresh, no PII storage and no API writes across Chrome/WebKit desktop/phone with normal/reduced motion. See `docs/evidence/checkout-interface/results.json` for actual completed cases and real screenshots. Test contact details in screenshots are synthetic, not saved customer records.

## Integration preparation — 14 November 2026

Updated against foundational main `3bcd3dbad2a8e826dd0b6a72edd1190a9cf0eac3` using a normal merge. The four-step interface is preserved, including in-memory contact/address, catalog GET refresh and disabled submission. Main's stock-limit regression, fixed-body WebKit dialog lock and corrected two-distinct-file gallery fixture are retained.

Read-only source inspection (not backend execution):

| Source | Observed contract | Required integration decision |
| --- | --- | --- |
| Member 3 #37 `3f2cd23`, #38 `358893d` | POST `/api/orders` accepts one `product_id`, quantity, `verification_option`, `customer: {full_name,email,phone,address}`, `payment_method: simulated_card / simulated_gcash`, and `payment_confirmed: true`. Guest buyer is null; an optional bearer token supplies account identity. A successful guest response sets a private order-specific cookie. | Keep this four-step layout. Agree single-item checkout versus an atomic multi-item contract; do not submit the cart through sequential order writes. Add phone, explicit simulation acknowledgement and a deliberate payment mapping before enabling submission. This preview's bank-transfer value has no backend equivalent. Member 3's current UI fixes quantity to one and navigates to `/orders/:id`; reconcile it with cart quantities and `/confirmation/:id`. |
| Member 4 #40 `158acd0`, #41 `febe851`, #42 `32a2a5d` | POST `/api/pricing/quote` takes `product_id`, quantity and optional `verification_option` (`none`, `remote`, `physical`). The server returns `{ok:true,data:{product_id,quantity,pricing}}`. Pricing is persisted in server-owned order snapshots. | Catalog GET totals here remain previews, not final quotes. Connect the quote endpoint after its reviewed integration; validate product/quantity/option before displaying it. Do not calculate final fees in the browser or submit a browser total. |

Current pricing source uses 800 basis points commission, with remote/physical service fees of PHP 2,800 / PHP 8,500. Commission comes out of seller proceeds; buyer total is subtotal plus the verification fee. These are inspected source rules, not a claim of deployed configuration. Shipping remains uncalculated. No quote POST, order submission, database write or migration was performed for this inspection.

This PR is ready for teammate review as a checkout interface. End-to-end order placement remains blocked on the above contracts and Member 3/4 integration; merging the UI alone does not enable purchases.
