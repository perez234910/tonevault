# Member 4 revenue handoff

## What is ready

1. [PR #40](https://github.com/perez234910/tonevault/pull/40) — single active rules file and centavo calculator.
2. [PR #41](https://github.com/perez234910/tonevault/pull/41) — validation, pricing snapshot fields and atomic order RPC.
3. [PR #42](https://github.com/perez234910/tonevault/pull/42) — read-only server pricing quote endpoint.

All three PRs are open, unmerged and need genuine human review. Merge them in order. Because Member 4 does not have upstream push access, later PRs are stacked against `main` and temporarily show earlier commits too.

## Member 3 coordination before merge

At the reviewed commit 3f2cd23, Member 3 PR #37 uses Member 4's pricing contract:

- placeCheckoutOrder calls quoteCatalogPricing.
- place_checkout_order calls the 12-argument place_catalog_order.
- The earlier checkout_pricing_rules and order_pricing definitions and three-argument RPC call are no longer present.

ACTIVE_PRICING_RULES remains the single source for the 8% commission and the verification fees: none, ₱2,800 remote, and ₱8,500 physical.

The remaining migration overlap is that #37 re-creates place_catalog_order to allow a null buyer_id for guest checkout.

Coordinate with Member 3 before applying the migrations:

1. Agree on the migration order.
2. Ensure the final place_catalog_order preserves pricing validation, pricing snapshot storage, atomic stock reduction and guest-checkout support.
3. Apply the coordinated migrations to a test database.
4. Place a guest order and read it back to verify the saved pricing breakdown and stock change.

Migration application and integration testing remain pending. No Member 3 branch was edited by Member 4.

## Still requires people or deployment access

- Apply the reviewed migration to an authorized test database, then run the six deployed Postman challenge requests.
- Connect the checkout UI after Member 2/3 changes are reconciled.
- Obtain real human PR comments/approvals and merge in order.
- Member 4 must personally write Challenge 5 predictions before running the function and make the unedited voiced recording without AI assistance.
- Rotate the Supabase service key after this work because it was shared in chat; never place it in Git or a `NEXT_PUBLIC_` variable.
