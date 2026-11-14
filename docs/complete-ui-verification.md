# Combined UI status and verification

Current integration preparation is dated 14 November 2026 in [the integration report](owner-interface.md#integration-preparation--14-november-2026) and `docs/evidence/integration-step2/`. The November 8 narrative below is preserved historical evidence, including its then-current branch, catalog and fixture status; it is not a current deployment report. The retained fixture now has two distinct files from foundational #27, and current real-data motion checks do not replace API responses.

Continuation date: November 8, 2026 (Asia/Manila). The interrupted Owner documentation command had not executed. Its content was created with the normal patch editor; no permission or approval restriction was bypassed.

## Pages and data boundaries

| Page | Current behavior | Remaining integration |
| --- | --- | --- |
| Home | Smaller GC1 headline, photo-led featured collection, real Supabase catalog | Authentic listing photographs where only reference images exist |
| Browse | Real products, search and five accessible custom filters preserving URL queries | None for current public catalog filtering |
| Product Detail | Real own-API product/seller/verification data; gallery/fallbacks; stock-aware Add/Buy Now | Authentic listing views; checkout completion remains separate |
| Cart | Persisted local selection, bounded quantities, exact preview totals, remove/clear and checkout link | Final server pricing/reservation occurs only in a future order transaction |
| Checkout | Validated Contact/Shipping/simulated Payment/Review, back/edit, responsive summary; real catalog GET price/stock refresh | Authenticated cart/contact/shipping order submission; final button stays disabled |
| Confirmation | UUID lookup and genuine unavailable/access/missing states; saved layout gated on validated matching server record | Member 3 authorized GET /api/orders/:id; no live order success claimed |
| Owner | Five metric headings, responsive table/navigation, unavailable live data; loading boundary, retryable error boundary and distinct authorized-empty presentation | Member 5 authenticated order-list/metrics APIs and agreed metric definitions |

Before this continuation, storefront refinement, Checkout and Confirmation were committed as #27, #29 and #31. This continuation completes the Owner interface, adds/test-separates loading/error/empty/unavailable states, fixes browser-fixture assumptions, writes the previously interrupted documentation, and performs final combined verification. The final matrix also exposed a genuine residual WebKit dialog scroll leak; the shared shell now freezes/restores the body position and retains viewport geometry rather than relying only on overflow locks. Original source and failure evidence are preserved. Earlier work and PR histories remain intact.

## Real backend verification

Local credentials remain only in ignored `.env.local`, with restrictive file permissions. Values are not reproduced here. Read-only REST checks accepted repository-expected columns in users/products/orders, including stock/quantity. Counts on the final check: 2 users, 8 products, 3 existing orders; catalog status 5 available / 3 sold. All eight seed brand/model/year identities were compared by parsing the seed source, never running it. No private user/order rows were retrieved for this audit.

The order RPC is exposed in metadata but was never invoked. REST checks do not prove every SQL constraint, trigger, RLS policy or migration history. No migration, seed/reset, purchase, private service-role dashboard query or production write was performed. The server secret was absent from all 19 generated production browser JavaScript chunks.

## Implemented design and recovery

Tonely was found at `~/tonely` through read-only VS Code workspace history. Six model-reference assets and original credits were copied unchanged; compact filter, checkout-summary and owner-table patterns were adapted. The original project remains unchanged. References match brand/model/finish and are labeled as such, rather than presented as authentic listing/verification photographs. Unmatched listings show unavailable photography. Credits do not establish publication rights clearance.

The three main navigation triggers have no moving background or pointer tracking. Collection options and all five Radix filters retain keyboard/typeahead/focus/dismissal behavior. GC1 colors/DM Sans, restrained shared motion and reduced-motion support remain. No new animation library was added.

## Final checks

TypeScript (including standalone `tsc`), ESLint, 26 automated tests, and the production build passed. Eight final real-data storefront, eight Checkout, eight Confirmation and eight Owner Chrome/WebKit cases passed at 1440/390px with normal/reduced motion. Confirmation's positive/denied/missing contract cases use explicitly synthetic interception; they are not saved database records. Actual Confirmation screenshots show the unavailable integration.

Owner loading/error/authorized-empty/ready presentation was also checked through component tests. The live Owner route intentionally remains unavailable and requests no private data. Its former WebKit failure was an unreliable single-Tab test after navigation; the corrected check starts from the labeled reference input and verifies keyboard submission. The motion fixture also initially added a disallowed local-image query string; it now uses two explicitly synthetic slots of one valid asset without relaxing Next image restrictions or adding duplicate production photographs. These are harness corrections, not invented Challenge 3 UI defects.

Final offline regression passed four customer journeys and nine motion cases, for 45 passing browser cases across the combined matrices. [Structured results](evidence/complete-ui/verification-results.json) and original suite JSON files are in `docs/evidence/complete-ui/`. The development-only sample guard and isolated cart namespaces remain. Normal localhost operation was restored and its real-data response confirmed after isolated offline checks.

`npm audit` still reports eight moderate lint-tool dependency findings and no high/critical findings, tracked in #17. No forced audit fix or install-script approval was used.

## Review and human limits

New stack: #25 → #27 storefront → #29 Checkout → #31 Confirmation → Owner PR. Older dependencies #2 → #21 → #22 → #23 precede #25; #18/#19 remain separate. All remain subject to actual human run, substantive comment and approval. No PR was merged and main was not updated.

Member 3 must supply authenticated checkout and order reads; Member 5 authenticated orders/metrics; Member 4 agreed pricing/metric definitions. Owner/admin deployment and live RLS validation remain separate. Manual Safari/physical-phone and genuine human course evaluation/review remain pending. Safari automation was previously refused because Allow remote automation is disabled; WebKit is engine coverage, not a Safari-app or human usability claim.

See [storefront recovery](storefront-refinement.md), [Checkout handoff](checkout-integration.md), [Confirmation handoff](confirmation-integration.md), [Owner handoff](owner-interface.md), and [actual earlier AI UI defects](gc1-ui-findings.md). Personal Challenge 3 reasoning remains human-owned.
