# Selected Challenge 3 evidence

The student's three observations/instructions were supplied in the current request. The agent polished their wording without adding motivations or claiming the student ran technical tests. [Challenge 3 narrative](../../challenges.md) is authoritative for the selected examples. Earlier independent technical-defect notes remain unchanged.

## Historical evidence

- `3807979`: five native filters and the translated navigation surface; exact source snapshots are in `before/native-filters-3807979.txt` and `before/navigation-3807979.txt`.
- `4640db5` / PR #27: Radix filters and stable main navigation. Existing screenshot/test artifacts are linked in the narrative; a still image alone is not claimed to prove animation.
- `55ddb50` / PR #33: search before autocomplete. Exact Header and FilterBar sources are in `before/site-header.txt` and `before/filter-bar.txt`.
- Before editing, the agent typed `GI` without submitting at 1440px Header and 390px Browse. `before/observations.json` records zero visible suggestion lists and zero suggestion requests after 600ms, while a real GET query confirmed Gibson records. Corresponding screenshots are genuine captures.

## Correction and verification

One shared editable combobox serves Header, mobile navigation and Browse. It requests only the own `/api/products` GET endpoint, with a 200ms debounce, limit 6, availability status and AbortController. Response validation and keyed state prevent malformed/stale data from becoming selectable suggestions. Matching brand names are deduplicated from returned products; listings follow the existing API search semantics, which also search condition notes. Thus `GI` can also match notes containing “original”; it does not imply every returned listing is Gibson.

DOM focus stays on the input, with active-descendant selection and Arrow/Enter/Escape support. Enter without a selected option retains normal search submission. Brand selection clears obsolete keywords/pagination while retaining Browse filters; a listing opens its validated actual product ID. Portals remain within the native dialog for mobile navigation, avoid clipping, and reposition with viewport/scroll changes. Inputs enable after hydration so editing cannot precede their event handlers. No new dependency, server key, API contract or database write is introduced.

The implementation follows [W3C's editable combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) using manual suggestion selection; no example implementation was copied. Automated browser/keyboard checks do not establish universal assistive-technology support or constitute a manual Safari/physical-phone test.

Eight focused cases passed: Chrome/WebKit × 1440/390px × normal/reduced motion. All use the real Supabase-backed catalog and confirm actual Gibson records. Main-flow console/page errors and non-GET API requests must be absent. Checks cover keyboard/pointer/touch selection, normal submission, outside/Escape dismissal, menu reuse, popup bounds, retained custom filters and stable trigger/animated-option distinction. Desktop Chrome additionally tests short-query/debounce behavior, cancellation of a delayed old request, actual empty results and an injected 500 with usable normal submission. Injected failures are technical fixtures, not additional student criticisms or real backend failures.

`after/results.json` contains actual cases; the four after PNGs show real results, not mocked suggestions. Unit tests cover validated/deduplicated response data, no fabricated brands, bounded own-API requests/cancellation forwarding, and safe filter-preserving URLs. See `verification.json` for the final aggregate and additional regression results.

## Reproduce

With the existing real-data development server on localhost:3000:

```sh
npm run typecheck
npx tsc --noEmit
npm run lint
npm test
npm run build
node scripts/test-search-suggestions.mjs
```

The browser script uses external Playwright tooling rather than adding it to app dependencies. This run used `TONEVAULT_PLAYWRIGHT_MODULE=file:///private/tmp/tonevault-browser-tools/node_modules/playwright/index.mjs` and `TONEVAULT_BROWSER_EXECUTABLE=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Chrome and WebKit binaries must be available. Optional engine/width/evidence overrides are defined in the script. It refuses sample data for its real-catalog evidence and performs no API writes.

## Review boundaries

Branch `g2/m2-search-challenge3` is explicitly stacked on #33. Existing Challenge 1 text and `docs/gc1-ui-findings.md` were checked byte-for-byte against the base. No Challenge 2/4 section was present on this branch. Unmerged PR #19 has a different earlier Challenge 3 draft; genuine integration review should keep the student's selected examples here and preserve unrelated sections from that PR. No PR was merged and no earlier evidence was rewritten.

## Integration preparation — 14 November 2026

Updated #33 is incorporated by normal merge. The selected student-supplied observations/instructions, original screenshots and source snapshots remain intact. `docs/challenges.md` now keeps main's expanded Challenge 1 and human-only Challenge 5, retains the selected three UI examples, and archives #19's earlier workflow failures under a separate historical heading. No new first-person evaluation was generated.

For read-only current-app verification without any runtime response replacement, run `TONEVAULT_TEST_REAL_ONLY=true node scripts/test-search-suggestions.mjs` with the usual browser/base/evidence overrides. This mode skips the historical delayed/error interception block; it still uses actual Gibson records and exercises keyboard, pointer/touch, mobile dialog, filters, option hover and reduced motion. Existing default fixture tests and their historical evidence are preserved, not represented as current real API outcomes. Current structured results are stored separately in `docs/evidence/integration-step2/`.

Current synchronized revision: 35/35 automated tests, typecheck, lint and configured production build passed. Real-only autocomplete matrix passed 8/8 with actual catalog responses, zero injected/delayed/error responses and zero API writes. Final real-data motion matrix passed 9/9. The storefront Chrome matrix passed 4/4; desktop WebKit logs RSC-prefetch access-control console errors in both deployed main and local production and is recorded as failed, not hidden. See the separate integration results for the final diagnostic outcomes. Server credential was absent from all 19 production browser JavaScript files. The preserved two-image fixture is not claimed as a new browser run.
