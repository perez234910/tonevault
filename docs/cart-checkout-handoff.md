# Cart → checkout handoff

This branch is explicitly stacked on `g2/m2-local-preview`, which is stacked on unmerged cart-state PR #2. No existing PR is merged. `/cart` uses the shared cart helper/store rather than duplicating totals. It provides item prices, quantity bounds, line subtotals and a total preview; persisted samples remain isolated from real cart storage.

`CartItem` retains `{ id, title, price, image, finish, quantity, stock }`. Missing legacy stock is unknown (null), capped at one with an explanatory note. `useCart()` exposes hydration, add/remove/clear/quantity updates and derived totals. The real storage key stays `tonevault-cart`; preview uses `tonevault-cart-preview`. Cart data is a display preview, not a stock reservation or server price authority.

The existing `POST /api/orders` accepts one product per order, not a multi-product cart. Member 3 must agree the checkout selection contract and revalidate product IDs, integer quantities, current inventory, authenticated buyer and final server-calculated totals. Preserve the cart on failed checkout and clear only a confirmed purchased selection. Do not trust stored prices or create a saved-order confirmation from browser state.

No `/checkout` exists, so the Cart screen disables the CTA with an explanation rather than linking to a missing page. Sample preview blocks order creation entirely. The dedicated Cart and Detail UI do not add payment, order/schema changes, migrations or live DB writes.

Human review: run typecheck, lint, tests and the sample customer journey; verify quantities at one and at dynamic maximum, keyboard focus, invalid numeric edits, remove/empty/clear and refresh. Browser automation is Chromium evidence, not a real phone test or a claim that Safari has been manually verified.
