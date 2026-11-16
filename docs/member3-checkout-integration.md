# Member 3 checkout integration

PR #38 wires the four-step checkout from Member 2’s #29 to Member 4’s quote endpoint and Member 3’s order API. Each checkout submits all units in one selected cart line. Other lines stay in the cart. After a successful save, checkout subtracts the purchased units from the current cart and opens `/confirmation/:id`, which uses the protected read endpoint from #39.

Checkout collects a phone number and sends street, city, postal code and country as a single delivery address. It supports simulated card and GCash payments with explicit acknowledgement. Verification is selected in Review. The order API computes its own total. If it differs from the buyer’s reviewed total, the API returns 409 before writing and checkout refreshes the quote for review.

Guest checkout is the default. Optional account checkout sends a verified buyer token. Guests receive a private per-order confirmation cookie. Checkout and confirmation need the full reviewed stack for an end-to-end deployment.

## Database order

Apply `20261108081033_add_revenue_pricing.sql` before `20261109063222_member3_checkout_details.sql`. The latter keeps Member 4’s price checks and stored snapshot and changes the buyer existence check to permit guests. Apply the order-write restriction migration from #39 last. Coordinate the rollout with the replacement application because the pricing migration removes the legacy three-argument order function.

Seller tracking writes are outside GC2 checkout. Order writes go through the server, and adding tracking updates requires an authorized server endpoint.
