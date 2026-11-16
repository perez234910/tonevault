# Member 4 revenue handoff

## What is ready

1. [PR #40](https://github.com/perez234910/tonevault/pull/40) — single active rules file and centavo calculator.
2. [PR #41](https://github.com/perez234910/tonevault/pull/41) — validation, pricing snapshot fields and atomic order RPC.
3. [PR #42](https://github.com/perez234910/tonevault/pull/42) — read-only server pricing quote endpoint.

All three PRs are merged after genuine human review. The shared database exposes the PR #41 pricing fields and 12-argument order function, and the `main` deployment containing PR #42 succeeded.

## Member 3 coordination before rollout

At the reviewed commit 3f2cd23, Member 3 PR #37 uses Member 4's pricing contract:

- placeCheckoutOrder calls quoteCatalogPricing.
- place_checkout_order calls the 12-argument place_catalog_order.
- The earlier checkout_pricing_rules and order_pricing definitions and three-argument RPC call are no longer present.

ACTIVE_PRICING_RULES remains the single source for the 8% commission and the verification fees: none, ₱2,800 remote, and ₱8,500 physical.

The remaining migration overlap is that #37 re-creates place_catalog_order to allow a null buyer_id for guest checkout.

The Member 4 migration is already applied. Coordinate with Member 3 before applying the later guest-checkout migration:

1. Keep the existing Member 4 migration before Member 3's guest-checkout migration.
2. Ensure the final place_catalog_order preserves pricing validation, pricing snapshot storage, atomic stock reduction and guest-checkout support.
3. Apply Member 3's migration with the integrated checkout rollout.
4. Place a guest order and read it back to verify the saved pricing breakdown and stock change.

The Member 3 guest-checkout migration and deployed integration test remain pending. No Member 3 branch was edited by Member 4.

When PR #39 synchronizes after this documentation PR, keep the `POST /api/pricing/quote` section from Member 4 and replace the current-main order rows with PR #39's guest/account checkout and protected order-read contract.

## Still requires people or deployment access

- Run the six deployed Postman challenge requests on the final integrated checkout deployment.
- Merge and deploy the Member 3 checkout/confirmation stack in the agreed order.
- Obtain human review and merge this documentation PR.
- Member 4 reports that the required human-only Challenge 5 recording is complete; it remains a separate submission item rather than repository evidence.
- Rotate the Supabase service key after this work because it was shared in chat; never place it in Git or a `NEXT_PUBLIC_` variable.
