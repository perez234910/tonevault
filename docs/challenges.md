# Challenge 1 — existing evidence, not a new agent run

Inspected November 8, 2026. The six original images below visibly show the following requests/statuses. Every URL uses unresolved `{{base}}`, so **host/environment and deployed-course compliance need human verification**. Screenshot filenames and visible order timestamps are not evidence of when a student authored/merged code. No new order requests or database resets were executed.

| # | Request shown | Expected | Actual visible status / response | Screenshot | Fix / remaining verification |
| --- | --- | --- | --- | --- | --- |
| 1 | POST `/api/orders`, quantity -3, product/buyer UUIDs | 400 | 400 Bad Request; `VALIDATION_ERROR`, quantity must be greater than 0 | [00.42.34](<Screenshot 2026-11-08 at 00.42.34.png>) | Existing validation rejects negative quantity; zero is not shown. Verify on actual deployed host. |
| 2 | POST `/api/orders`, quantity 1, browser `total: 1` | 201 with server total, or 400 | 201 Created; order `total_amount: 325000`, quantity 1, escrow `pending`, listing `sold` | [01.15.46](<Screenshot 2026-11-08 at 01.15.46.png>) | Visible total differs from browser's 1; screenshot does not show the preceding catalog price. Compare against that price on authorized test DB; request consumes stock. No new fix claimed. |
| 3 | POST `/api/orders`, quantity 3 | 409 | 409 Conflict; `CONFLICT`, quantity exceeds stock or listing reserved | [01.08.27](<Screenshot 2026-11-08 at 01.08.27.png>) | Image alone cannot distinguish insufficient stock from previously sold slot. Existing RPC checks both; verify setup/host. |
| 4 | POST `/api/orders`, valid-shaped all-zero missing product UUID, quantity 1 | 404 | 404 Not Found; `NOT_FOUND`, Instrument not found | [01.07.08](<Screenshot 2026-11-08 at 01.07.08.png>) | Confirm UUID really absent in test environment; GET missing-ID evidence is not shown here. |
| 5 | POST `/api/orders`, quantity omitted | 400 | 400 Bad Request; `VALIDATION_ERROR`, quantity is required | [00.56.47](<Screenshot 2026-11-08 at 00.56.47.png>) | Existing required-field validation; verify deployed host. |
| 6 | GET `/api/products?search=zzzz-no-such-guitar-xyz` | 200 empty list | 200 OK; `ok: true`, `data: []`, `products: []`, `count: 0` | [01.10.31](<Screenshot 2026-11-08 at 01.10.31.png>) | Existing 200-empty behavior; verify deployed host. |

Import `docs/postman_collection.json`; set `baseUrl` to a real verified deployment and buyer/product variables to authorized demo records. The collection includes catalog list/detail plus the six cases and extra missing-product GET. Run read-only GETs first. Successful POSTs consume stock; do not run orders or reseed production without explicit approval. Record resolved URL, setup, expected/actual JSON/status, screenshot, and actual fix when rerunning. The wrong-total assertion now compares against the price captured by the preceding catalog GET; no new server behavior is claimed.

## Original images (preserved)

1.![An order with quantity 0 or -3](<Screenshot 2026-11-08 at 00.42.34.png>)
2.![An order where the browser sends a wrong total](<Screenshot 2026-11-08 at 01.15.46.png>)
3.![An order for more than the stock, or a taken slot](<Screenshot 2026-11-08 at 01.08.27.png>)
4.![An item id that does not exist](<Screenshot 2026-11-08 at 01.07.08.png>)
5.![An order with a required field missing](<Screenshot 2026-11-08 at 00.56.47.png>)
6.![A search that matches nothing](<Screenshot 2026-11-08 at 01.10.31.png>)

# Challenge 4 — The owner changes a rule

## Simulated owner request

> “Change ToneVault's seller commission from 8% to 9%.”

This challenge records the impact **without making the change**. The active value remains 8%.

## Audit before the change

I ran:

```bash
rg -n "commissionRateBps|280_000|850_000|8%|2,800|8,500" src app supabase tests docs README.md
nl -ba src/lib/pricing/rules.ts
```

The earlier audit found formulas, tests and written examples, plus a separate Member 3 pricing design in PR #37. At the reviewed commit 3f2cd23, #37 now uses Member 4's pricing contract. The remaining migration overlap concerns guest checkout, as explained in docs/business.md §3.4. Member 4 did not edit Member 3's branch.

## Runtime file and line to edit

Only one production value controls the active commission:

| File and verified line | Current value | Owner's requested value |
| --- | --- | --- |
| `src/lib/pricing/rules.ts:11` | `commissionRateBps: 800` (8%) | `commissionRateBps: 900` (9%) |

No other runtime file needs the new percentage. `calculateOrderPricing` reads the rule; `quoteCatalogPricing` calls that calculator; the order service passes its result to Postgres. The database stores the supplied rate and verifies the arithmetic but does not duplicate 8%. Existing orders keep their saved rate, so a future change would affect new quotes/orders only.

Tests and documents contain the old 8% amounts as expected results and GC2 evidence. After a real approved rule change, those assertions and examples should be refreshed and re-run, but they do not control application behavior and are not additional active rule sources.

## Refactor/PR evidence

[PR #40 — Add shared revenue pricing calculator](https://github.com/perez234910/tonevault/pull/40) introduces `ACTIVE_PRICING_RULES` as the single production source. PRs [#41](https://github.com/perez234910/tonevault/pull/41) and [#42](https://github.com/perez234910/tonevault/pull/42) consume it without repeating the active percentage. All are open and require human review; this document does not claim they are merged or deployed.
# Challenge 3 — Overrule the AI

The first-person observations and decisions below were supplied by me after personally reviewing the interface. The Git inspections and automated checks are the agent's technical verification; they do not imply that I ran those scripts or conducted additional usability tests.

## 1. Generic native dropdowns

**Original AI implementation:** The reviewed version used five visible HTML `<select>` controls for Brand, Price, Verification, Condition and Availability. See [the original source at 3807979](https://github.com/perez234910/tonevault/blob/38079794cd49cd0bd14dbe881c38b60a42453dbb/src/components/filter-bar.tsx) and its [preserved snapshot](evidence/challenge-3/before/native-filters-3807979.txt).

**My criticism and instruction:** I found the default browser dropdowns inconsistent with ToneVault's minimalist design and wanted custom interactions. I instructed the agent to replace them with accessible dropdown components using consistent styling, smooth opening/closing, and appropriate hover and selection states.

**Correction:** Commit `4640db5` / [PR #27](https://github.com/perez234910/tonevault/pull/27) replaced the visible native controls with the shared [StoreSelect](../src/components/ui/select.tsx), using Radix's focus, keyboard/typeahead, selection and collision-aware portal behavior. [FilterBar](../src/components/filter-bar.tsx) preserves query parameters. Radix's hidden native form bridges are not visible browser dropdowns.

**Verification and evidence:** [Earlier Browse](evidence/gc1-motion/before/1440-browse.png), [custom-filter screenshot](evidence/storefront-refinement/after/390-filter.png), and [eight actual storefront checks](evidence/complete-ui/real-storefront.json). These are agent-run checks, separate from my visual criticism. The focused Challenge 3 script also checks all five labeled controls and working filtering.

## 2. Unsatisfactory navigation hover behavior

**Original AI implementation:** The reviewed motion version at `3807979` tracked pointer/focus targets and translated one 96px background surface between Browse, Verified and Collection. See [original navigation](evidence/challenge-3/before/navigation-3807979.txt). This identifies the actual earlier treatment rather than claiming every earlier revision behaved identically.

**My criticism and instruction:** The interactive response did not match my intended design. My eventual decision was that these three triggers should remain visually stable, while dropdown options should provide smooth hover feedback. I instructed the agent to remove the distracting trigger treatment and retain restrained transitions for options.

**Correction:** `4640db5` / [PR #27](https://github.com/perez234910/tonevault/pull/27) removed the shared surface, target state and pointer-tracking handlers. [SiteHeader](../src/components/site-header.tsx) and [shared CSS](../app/globals.css) retain a quiet active underline and keyboard focus. Collection options retain smooth background/color transitions, selected/focused states, keyboard navigation and dismissal.

**Verification and evidence:** [Recorded storefront checks](evidence/complete-ui/real-storefront.json) verify stable trigger geometry/backgrounds and working dropdown interactions. The focused Challenge 3 checks compare trigger styles before/after hover and verify option feedback and reduced motion. This is my design revision, not a claim that the old treatment caused an accessibility or functional failure.

## 3. Missing search suggestions

**Original AI implementation:** At `55ddb50`, Header/mobile and Browse search were plain submission inputs, with no autocomplete request, suggestion list or combobox behavior. Original [Header](evidence/challenge-3/before/site-header.txt) and [Browse](evidence/challenge-3/before/filter-bar.txt) sources are preserved.

**My criticism and instruction:** When I typed `GI`, the interface did not suggest Gibson even though Gibson guitars existed in the catalog. I had to enter or submit a search without contextual suggestions. I wanted users to discover relevant brands and instruments while typing, so I instructed the agent to add responsive, accessible suggestions from actual catalog data.

**Before evidence:** Actual [desktop `GI`](evidence/challenge-3/before/1440-gi-no-suggestions.png) and [phone Browse `GI`](evidence/challenge-3/before/390-gi-no-suggestions.png) captures were taken before editing. [Recorded observations](evidence/challenge-3/before/observations.json) confirm no visible suggestion list or suggestion requests after typing, and a read-only API check confirmed Gibson records. These were agent checks, not additional tests attributed to me.

**Correction:** The shared [CatalogSearch](../src/components/catalog-search.tsx) and [catalog-search API adapter](../src/lib/catalog-search.ts) now provide real brand/listing suggestions across Header, mobile navigation and Browse. Requests use the own product GET API, a 200ms debounce and cancellation. Combobox/listbox semantics retain input focus; arrows, Enter, Escape, mouse/touch selection, loading/empty/error feedback, viewport positioning and reduced motion are supported. Unselected Enter still submits the typed search. Brand selection retains Browse filters while clearing obsolete keywords/pagination; listing selection opens its actual product ID.

**Verification and evidence:** Corrected and verified. Eight real-catalog Chrome/WebKit cases passed at desktop/phone widths with normal/reduced motion. Actual [desktop Gibson suggestions](evidence/challenge-3/after/1440-gi-header.png), [mobile-menu suggestions](evidence/challenge-3/after/390-gi-mobile.png), [Browse suggestions](evidence/challenge-3/after/390-gi-browse.png), and [recorded results](evidence/challenge-3/after/results.json) are preserved. The desktop Chrome case additionally verified the debounce, stale-request cancellation, empty results and an isolated injected-error response with normal submission still working. [Browser script](../scripts/test-search-suggestions.mjs), [unit tests](../tests/catalog-search.test.ts), and [evidence/reproduction notes](evidence/challenge-3/README.md) distinguish real catalog checks from technical fixtures. No database writes were performed.

## Evidence and scope

The three personal criticisms above are my selected examples. The agent's separate [technical-defect evidence](gc1-ui-findings.md) remains unchanged. No additional personal motivations, accessibility failures, human testing or screenshots are invented.

All three examples now have documented original implementations, my supplied observations/instructions, corrections and actual verification. This completes the requested Challenge 3 implementation/evidence scope; course evaluation and genuine human PR review are still required.

Integration update — 14 November 2026: foundational #19 is now merged. Challenge 1 retains main's expanded evidence and original six screenshots, and Challenge 5 remains human-only. The student-selected examples and their original source/screenshots are preserved. No Challenge 2/4 section was present in either input. The older workflow failures are retained separately below as technical history, not additional student-selected criticisms.

# Earlier AI workflow evidence — historical, not the selected Challenge 3 examples

These are tool/workflow failures, not demonstrated product defects. Student must decide whether they satisfy the course challenge and write/approve independent reasoning.

| Slot | Actual AI suggestion/action | Observed failure | Correction / evidence | Student reasoning |
| --- | --- | --- | --- | --- |
| 1 | Codex initially guessed GitHub `get_repo` arguments (`repo_full_name`, then `owner`/`repo`) | Tool returned `InvalidActionArgumentsError` twice | Read tool declaration from available metadata; used documented `repository_full_name` and retrieved repository permissions. Tool trace is in this execution; no product code change. | Needs human explanation/approval |
| 2 | Codex attempted delete/add of README as two operations targeting the same path in one patch | Tool rejected: `invalid patch: multiple operations target .../README.md`; no changes applied | Wrote revised README once, then applied distinct file updates. Tool trace is in this execution; no failed app test claimed. | Needs human explanation/approval |
| 3 | Codex's verification command used `git check-ignore node_modules/` in a worktree whose dependency directory was a symlink | Git rejected the trailing-slash path as beyond a symbolic link; the first Markdown check also ran before AI-USAGE.md existed | Rechecked with `node_modules` (no slash) after writing the required log: ignore checks, blank env and Markdown links passed. This was a verification-command error, not a product defect. | Needs human explanation/approval |

# Challenge 5 — human only

No predictions, personal challenge execution or recording were generated by the agent. Each student must independently write predictions before execution, run the function and film their own unedited ≤3-minute narrated recording without AI assistance.
