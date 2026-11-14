# Schema from committed SQL

Source files, applied in filename order:

1. `supabase/migrations/20241107000000_init_core_tables.sql` — enums, three tables, indexes, RLS, auth sync and validation triggers.
2. `20241107143000_add_pending_escrow_status.sql` — adds enum value `pending`.
3. `20241107143001_place_catalog_order.sql` — original two-argument service-role order RPC.
4. `20241108003000_order_quantity_and_stock.sql` — stock/quantity columns, constraints; replaces RPC with three arguments.
5. `20261108081033_add_revenue_pricing.sql` — unmerged Member 4 migration; adds the verification enum and order pricing snapshot, and replaces the RPC with the service-owned 12-argument pricing contract.

These filenames are not proof that a migration was applied. The Member 4 migration is committed on PR #41 but **has not been applied to the shared database**. Live schema, seeding and persistence require an authorized test environment and team review.

## Fields and constraints

| Table | Fields |
| --- | --- |
| `public.users` | `id uuid PK → auth.users.id ON DELETE CASCADE`; `email text NOT NULL UNIQUE`; `full_name text NOT NULL`; `role user_role NOT NULL DEFAULT buyer`; `created_at timestamptz NOT NULL DEFAULT now()` |
| `public.products` | `id uuid PK DEFAULT gen_random_uuid()`; `seller_id uuid NOT NULL → users.id ON DELETE RESTRICT`; `brand`, `model` text NOT NULL; nullable `year integer`, `finish text`; `price numeric(12,2) NOT NULL CHECK >=0`; `verification_status NOT NULL DEFAULT Unverified`; nullable `tonevault_score integer CHECK 1..100`; nullable `condition_notes text`; `status NOT NULL DEFAULT available`; `images text[] NOT NULL DEFAULT '{}'`; `created_at NOT NULL DEFAULT now()`; latest migration adds `stock integer NOT NULL DEFAULT 1 CHECK >=0` |
| `public.orders` | `id uuid PK DEFAULT gen_random_uuid()`; `product_id uuid NOT NULL → products.id ON DELETE RESTRICT`; `buyer_id uuid NOT NULL → users.id ON DELETE RESTRICT`; `quantity integer NOT NULL DEFAULT 1 CHECK >0`; `unit_price`, `subtotal_amount`, `verification_fee`, `commission_amount`, `seller_payout_amount`, `platform_revenue_amount`, `total_amount` as `numeric(12,2) NOT NULL` with nonnegative checks; `verification_option NOT NULL`; `commission_rate_bps integer NOT NULL CHECK 0..10000`; `escrow_status NOT NULL DEFAULT paid` at table level; nullable `tracking_number text`; `created_at NOT NULL DEFAULT now()` |

Enums: `user_role = buyer | seller | admin | luthier`; `product_status = available | sold`; `verification_status = Unverified | Remote Verified | Fully Verified`; `verification_option = none | remote | physical`; `escrow_status = pending | paid | awaiting_shipment | shipped | delivered | approved | payout_released`.

The table default remains `paid`; the actual catalog RPC **explicitly inserts `pending`**. Those labels are data states, not proof of live payment/escrow. No PayMongo client is implemented.

Relationships: Auth user → public profile → seller's products; buyer profile → orders → product. Many products may belong to one seller; many orders may reference a product when stock permits. There is no order header/line-items table or multi-product order contract. Indexes cover product seller/status/verification and order product/buyer/escrow status.

## Behavior and access

Auth inserts sync to public users as buyers (`handle_new_user`). Product updates retain old verification/score unless `is_admin()` succeeds. An order trigger prevents self-purchase. Role upgrades are controlled by profile policies.

RLS is enabled on all three tables. Public policies allow available products and seller/luthier/admin profiles; users see their own profiles, and product/order participants plus admins have additional access. Authenticated sellers may create unverified listings; orders have participant read/update policies. See the full SQL for exact grants and predicates.

**Application distinction:** catalog handlers use `createAdminClient()` with a server service role, which bypasses ordinary RLS. The public list can request `status=sold`, and Detail can query any matching UUID; SQL RLS does not by itself restrict these handlers. The order handler currently accepts `buyer_id` from JSON. Member 3 must agree/authenticate order access and Member 5 owner access before adding order-reading/metrics routes. No speculative access migration was applied.

The Member 4 RPC is `place_catalog_order(product, buyer, quantity, verification option, expected unit price, subtotal, verification fee, commission rate bps, commission amount, seller payout, platform revenue, total) RETURNS public.orders`. It uses `SECURITY INVOKER`; execution is revoked from `PUBLIC`, `anon`, and `authenticated` and granted only to `service_role`.

The function locks the product row with `FOR UPDATE`, validates positive quantity, product existence, self-purchase, buyer existence, available status and sufficient stock. It rejects a changed database price and verifies each pricing equation before inserting the snapshot, decrementing stock, and marking the listing sold at zero inside the same transaction. Historical rows are backfilled as zero-commission, no-verification snapshots so a new rule is not applied retroactively. Exceptions are mapped in `src/lib/catalog/queries.ts`; see [routes](routes.md).

**Coordination note:** At the reviewed commit 3f2cd23, Member 3 PR #37 uses Member 4's pricing contract; the earlier order_pricing table/trigger and three-argument call are no longer present. Its migration re-creates place_catalog_order to allow a null buyer_id for guest checkout. Coordinate the migrations so the final function preserves pricing validation, saved pricing snapshots, atomic stock reduction and guest-checkout support. The schema above describes Member 4's migration before that integration.

`scripts/seed.ts` defines eight demo guitars, each stock one, and ensures demo buyer/seller profiles. Re-running it **refreshes** matching listings, including stock/status/price; it is not an additive-only seed and must not be used to reset production blindly. Seeded photography/verification descriptions are demonstration data, not independent inspection evidence.
