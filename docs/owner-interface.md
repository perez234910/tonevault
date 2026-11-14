# Owner interface and Member 5 handoff

`/owner` follows the GC1 pages 13–14 seller-studio/sidebar and restrained table structure. It includes functional Overview/Orders anchors, storefront navigation, a saved-order lookup link, a responsive orders table, and all five required metrics: Total orders, Total revenue, Average order value, Top-selling instrument, Low-stock instruments.

All figures explicitly say **Unavailable**, rather than zero or invented sample revenue. No fictitious orders, seller identity, tracking actions, payouts or inventory management are presented as working. Footer links lead to implemented Order status and Owner routes.

The repository has no authenticated owner session, GET /api/orders or GET /api/metrics implementation. This route is a public UI shell and requests no private business data. A supplied service key must not substitute for owner authentication. This interface does not bypass RLS, fetch orders directly from Supabase, or implement Member 5 backend endpoints.

## Loading, empty and error handling

The route has a loading skeleton and a real Next error boundary with retry. `OwnerOrders` distinguishes unavailable, loading, error, and authorized ready/empty results. Only a supplied ready result containing an empty array can show “No orders yet.” An absent API or failed request cannot be misrepresented as zero orders. The live route selects unavailable until the authenticated integration exists; the other presentation states are tested independently without adding fake live metrics or a production preview switch.

Member 5 must provide authenticated owner/admin authorization, session-derived scope, agreed order-list and five-metric contracts, pagination and live loading/error transitions. Agree metric definitions with Member 4: revenue status/time range, refunds/fees, average value, top-selling quantity/ties, and low-stock threshold. Then replace unavailable with validated own-API data. The presentation row type is an integration aid, not an implemented HTTP contract.

Member 3 provides the authorized saved-order lookup used by the functional link. These interfaces create no orders and modify no metrics. Database records and real server pricing remain untouched.

Branch `g2/m2-owner-interface` is explicitly stacked on Confirmation PR #31, so all seven routes can be inspected together locally while the dashboard diff remains separately reviewable. No dependencies were merged. Human owner/Member 5 review remains required.

Actual results and screenshots are recorded in `docs/evidence/owner-interface/`. The browser script checks all five unavailable metrics, table, anchors/lookup navigation, keyboard input, responsive bounds and zero owner private-data requests. Component checks distinguish unavailable/error from an authorized empty result. No real metrics or authenticated-owner results are claimed. WebKit coverage is not a manual Safari or physical-phone test.

All eight Owner cases passed (Chrome/WebKit × 1440/390px × normal/reduced motion). The final combined verification also caught and corrected a residual shared-dialog WebKit scroll leak. Its original source, actual failure and intermediate header-position correction are preserved in the evidence folder; see [combined results](complete-ui-verification.md). That fix changes no Owner API or business data.

## Integration preparation — 14 November 2026

Incorporated updated #31 with an ordinary merge. Preserved the dashboard markup and unavailable/loading/error/ready distinctions. Resolved the motion-test conflict in favor of foundational #27's two distinct local files (`/guitars/prs-custom24.jpg`, `/preview/guitar-7-detail.jpg`), successful-underlying-response assertion and exact gallery-source check. The fixed-body WebKit scroll lock remains identical to foundational main; do not restore the duplicate-image fixture from the old Owner branch.

Read-only inspection of Member 5 #44 `bfeddf9` found:

| API / surface | Observed contract | Integration requirement |
| --- | --- | --- |
| GET `/api/orders` | `Authorization: Bearer <access_token>`; `requireAdmin` validates Auth plus `is_admin` RPC. Returns `{ok:true,orders:[...]}` with joined `product`/`buyer` or null, newest first. Quantity and total are normalized. | Keep the existing table, validate the envelope, map product brand/model to the `instrument` column and preserve missing relations. Do not call it without an approved admin session or use a server credential. This is administrator-wide data, not an implemented seller-only scope. No pagination contract is present. |
| GET `/api/metrics` | Same administrator gate; returns `{ok:true,metrics}` with `totalOrders`, `totalOrderValue`, `averageOrderValue`, `platformRevenue`, `revenueStatus`, tied `topSellingItems`, `lowStockThreshold`, and `lowStockItems`. | `platformRevenue` is currently null with `pending_revenue_fields`. Keep Total revenue unavailable until Member 4/5 agree recognition/status rules and stored pricing snapshots. Never label total order value as platform revenue. Agree list/tie presentation for the existing Top-selling heading and the provisional low-stock threshold of 2. |
| `/owner` | Member 5 also changes the route and supplies a separate dashboard UI. | Retain this established light-mode layout during later integration and connect validated data to its states; do not silently replace it with the alternative page. |
| Order links and shared orders route | Member 3 #39 permits a matching buyer token or private guest cookie; its GET does not currently grant a separate admin-order-read capability. Member 5 also changes POST `/api/orders` from an older base. | An admin table link cannot imply access to another buyer's confirmation. Agree an authorized admin detail policy. When integrating the shared route, preserve Member 3's reviewed guest/account POST logic and add the admin GET deliberately; do not take Member 5's older POST over it. |

No Member 5 code was copied, no private dashboard requests were sent, and no database state was read or changed by this compatibility inspection. This PR is ready for teammate review as the dashboard interface; live business data remains an explicit dependency.

Current verification: 30/30 automated tests, typecheck, full lint and configured production build passed. Owner browser matrix 8/8 passed with zero private-data requests. The separate `scripts/test-integration-motion.mjs` matrix passed 9/9 with the real catalog, no API interception or writes, at Chrome 1440/390/320 and WebKit 1440/390 widths with normal/reduced motion. It checks navigation, white/DM Sans styling, dialog focus containment, fixed background/header, internal drawer scrolling, scroll/style restoration, cart-route position, invalid quantities, stock limits and refresh persistence. The chosen real listing has one gallery image; two-view keyboard assertions were not exercised. The preserved foundational fixture source is identical to main, but no new synthetic two-image run is claimed. Results: `docs/evidence/integration-step2/owner.json` and `motion.json`.
