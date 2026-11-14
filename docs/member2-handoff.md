# Member 2 handoff — November 8, 2026

Base main SHA: `6112d47080760c10728cd416581ff16710bf4417` (same as supplied snapshot). Course group confirmed by user: **2**. Verified GitHub CLI and plugin login: `shin-ieru`; author/committer for agent commits uses that confirmed account's numeric-ID noreply address. Main was not committed to, force-pushed, approved or merged by the agent. `agent-instructions/` stays local/untracked.

## Task matrix

| Category | Factual state / evidence |
| --- | --- |
| implemented (branch code only) | Cart helpers/store/context, stock payloads, preview totals and corrected cart copy in [PR #2](https://github.com/perez234910/tonevault/pull/2), issue #1. Seven meaningful tests pass; typecheck and lint pass there. |
| implemented (branch code only) | Browse own-API fetch/URL/transform/loading/empty/error/retry/cancellation in [PR #18](https://github.com/perez234910/tonevault/pull/18), issue #3. Five helper/fetch tests pass; typecheck and changed-file lint pass. |
| partial | Home/Browse/Detail exist on base. Detail still uses server action and maps all failures to not-found. Header cart on base has no quantities; PR #2 addresses state/count, not a Cart screen. |
| missing | `/cart` (#5), Detail API/mobile UX (#6), Checkout (#7), Confirmation (#8), GET order by ID (#9), GET orders (#10), GET metrics (#11), Owner (#12), two revenue features (#13/#14). |
| needs live validation | Public deployment/GET checks, DB persistence, actual seed count, browser/mobile/keyboard/no-console checks; no configured Supabase environment or public URL supplied. Existing six screenshots show statuses but unresolved host. |
| needs human | Real PR run/comment/approval/merge; admin invites/protection (#15); hosting/test DB access (#16); original GC1 and student reasoning; personal reviews/video; final captain package. |
| blocked | Dependent Member 2 Cart/Detail PRs must follow genuine review/merge of cart-state under the execution prompt. Build page-data collection blocked by missing Supabase env. npm lint-tool upgrade requires compatibility review (#17), not forced fix. |

## Cart → checkout interface for Member 3

PR #2 exports `CartItem`, `CartProduct`, pure operations from `src/lib/cart.ts`; store from `src/lib/cart-store.ts`; provider operations from `src/components/cart-context.tsx`. An item is `{ id, title, price, image, finish, quantity, stock }`. Unknown legacy stock is null and quantity stays at one until refreshed. Current API stock determines new-item/duplicate maximum; sold/zero-stock products are refused. Storage key remains `tonevault-cart`.

`useCart()` provides `addItem`, `setQuantity`, `removeItem`, `clearCart`, `totalQuantity`, `subtotal`, items and dropdown controls. Cart data/price/stock are untrusted display previews, never reservations or checkout authority. Member 3 must re-fetch/validate current items, stock and customer identity and calculate final totals server-side. Only clear purchased selection after a saved order is confirmed; preserve cart on validation/conflict/network failures.

The existing POST accepts **one product per order** (`product_id`, `buyer_id`, `quantity`), not a multi-product cart. Team must agree a contract before enabling all-cart checkout. No order-schema/API changes were made. `/checkout` does not exist; PR #2 disables checkout with an explanation. Dedicated `/cart` navigation and Buy Now handoff remain pending reviewed dependent work. See [routes](routes.md) and [schema](schema.md).

## Real checks and evidence limits

- Initial npm audit: 8 moderate development-tool findings; no forced fix or lockfile change. Installation warnings and root cause are in [npm audit](npm-audit.md).
- Initial TypeScript failed on generated Next route types; `next typegen` then typecheck passed. `npm run typecheck` reproduces this setup.
- Cart branch: 7 tests passed; full lint/typecheck/diff check passed. Build compiled and passed TypeScript, then failed for missing Supabase env while collecting product page data.
- Browse branch: 5 tests passed; full typecheck and changed-file lint passed. Full lint still reports the baseline cart effect error, fixed independently in PR #2.
- No order POST, seed, migration, production mutation, deployment, fresh UI screenshot, browser/phone/outside-tester run, or persisted DB check was performed. All remain pending unless a later human record supplies actual evidence.

## Human test plan after review and secure setup

Run the checks, then Browse filters → Detail → cart dropdown and refresh. Test rapid additions, stock-one cap, out-of-stock/sold refusal, corrupted legacy storage and denied storage. Once Cart/Detail PRs exist, test 320/390px and desktop, keyboard/gallery focus, quantity controls, remove/empty/continue-shopping and meaningful Buy Now navigation. Check browser console/network requests and confirm no service-role data reaches the browser. Ask an outside human tester for real observations; do not invent them.

## Remaining owners

Member 1: approve foundation docs/conventions; own their genuine code PRs/reviews; deploy and verify catalog/seed/persistence; resolve actual GC1/baseline/architecture/evidence and admin coordination. Member 2: personally understand/run PRs, obtain human reviews, then deliver Cart and Detail PRs; two substantive human reviews and own no-AI video remain personal tasks. Members 3–5 own the issues listed above. Captain handles reviewed final package, ≤2-page PDF and `gc2-v1.0` tag. Earlier contribution windows are past and cannot be manufactured. Deadline: November 9, 2026, 11:59 PM Asia/Manila.
