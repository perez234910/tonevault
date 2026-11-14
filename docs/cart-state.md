# Cart state review

Run `npm test`, `npm run typecheck` (generates Next route types, then runs TypeScript), and `npm run lint`. The test script uses the existing `tsx` loader with Node's test runner; no new dependencies or install-script approvals are required.

`src/lib/cart.ts` contains pure operations. Items retain product display fields, quantity and API stock. A legacy item without stock has `stock: null` and quantity limited to one until refreshed from the API. This is an unknown inventory preview, not a claim that one unit remains. Sold/zero-stock API products cannot be added. A repeated addition refreshes display data and caps quantity at fresh API stock.

`src/lib/cart-store.ts` hydrates the unchanged `tonevault-cart` key before any write. The provider uses `useSyncExternalStore` with a stable empty server snapshot so saved browser items do not cause hydration mismatches. Rapid actions read current store state. Privacy/quota failures retain an in-memory cart; persistence across tabs is not synchronized in this change.

`useCart()` exposes `items`, `addItem(product)`, `setQuantity(id, quantity)`, `removeItem(id)`, `clearCart()`, `totalQuantity`, `subtotal`, and the existing dropdown controls. `addItem` expects current `stock` and `status` and returns whether the item was accepted. Totals are previews only. Product data in storage is untrusted and never sets the order total.

Checkout remains unavailable and its button is disabled with an explanation. Member 3 owns that screen and the order contract. The existing `POST /api/orders` accepts one product per order; this cart does not change the API or save any orders. Cart page and Buy Now navigation follow after genuine review/merge of the state interface.

Human review: read the diff, run all checks and test two rapid additions/removals, refresh persistence, unavailable storage, and sold/out-of-stock actions in a configured app. A real phone test and outside tester remain pending. Do not run seed or order POSTs against production as part of this review.
