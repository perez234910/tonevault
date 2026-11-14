# Customer UI preview and actual verification

Open **http://localhost:3000** with the local flag configured. The current `g2/m2-product-detail-ux` branch contains the complete development stack; no Supabase access is required. If the existing dev server is stopped, run `npm run dev` from this repository. Keep the server in development mode; production intentionally continues to require the real backend.

## Review stack

| Branch / PR | Base | Scope |
| --- | --- | --- |
| `g2/m2-cart-state` / #2 | main | Existing unmerged validated cart operations and storage |
| `g2/m2-local-preview` / #21 | cart-state | Eight read-only development fixtures, source guard, labeling, sample storage isolation and local photos |
| `g2/m2-cart-page` / #22 | local-preview | Dedicated Cart, quantities/totals/persistence/navigation and blocked checkout |
| `g2/m2-product-detail-ux` | cart-page | Product JSON loading/error/404/retry, gallery keyboard controls, Buy Now handoff, search/availability UI and real browser evidence |

These are explicitly stacked branches authorized by the user. They do not merge or change existing PRs #2, #18 or #19. Captain/authorized teammate must obtain a genuine run/comment/approval for each diff. After reviewed parents merge, retarget child PRs and bring reviewed main forward with ordinary merge commits or a new branch; do not force-push published history. Member 1's personal contributions remain their responsibility.

PR #18 remains the independent Browse-own-JSON implementation; this stack keeps the existing Browse server-action component and only forwards missing search/status/offset fields. Both read the same preview-aware server query. When integrating the reviewed PR #18, retain its API component and this branch's search/availability UI; its query builder already supports those fields. No API implementation from #18 was copied into this stack. PR #19 remains the independent foundation documentation/copy proposal; small Home/layout/footer overlaps need ordinary review when bringing branches together.

## Completed UI

Home, Browse, Detail and `/cart` work from fictional sample data. Filter/search URLs persist; sold-only browsing exposes the unavailable fixture. Detail fetches `GET /api/products/:id` and distinguishes 404 from server/network/malformed failures. Loading is announced; errors offer Retry. Gallery thumbnails announce selected state and support Left/Right/Home/End; next/previous controls and no-photo/broken-photo fallbacks are available.

Add to Cart respects current stock and disables at the limit. Buy Now adds a missing selection or opens an existing one without increasing quantity. Cart supports bounded numeric/step controls, validation, price/line/total previews, remove/clear, saved hydration and empty state. Prices preserve cents when needed. No stock is reserved. Checkout is explicitly unavailable; no order confirmation, payment or saved order is invented. Server pricing authority and the existing single-product order contract remain unchanged.

## Actual results — November 8, 2026, Asia/Manila

- `npm run typecheck`, `npx tsc --noEmit` after generated route types, and `npm run lint`: passed.
- `npm test`: 17 passed, 0 failed, including inherited cart, sample filter/guard/storage/API tests and four Detail response/failure tests.
- Chromium desktop 1440px, phone widths 390px and 320px: Home → Browse → Detail → Cart; search/brand/price/verification/condition filters; gallery keys/selection; Add/Buy Now; quantity limits and invalid edits; exact totals; refresh; remove/clear/empty; sold-only browsing and unavailable actions; image decoding; no horizontal overflow or unexpected main-flow console/page errors.
- Playwright WebKit at 390px: same successful main journey/interactions. This is Safari-engine coverage, **not** a claim of manually operating Safari or a physical phone/outside tester.
- Explicit negative browser cases (Chromium desktop): delayed API showed loading; injected HTTP 500 showed an error then recovered with Retry; unknown ID showed not-found; empty/broken photographs showed their fallbacks; preview POST order returned 403 read-only. Injected errors are test cases, not actual backend failures or saved orders.
- Actual production/flag-off child-process tests intentionally blank backend env and receive the original missing-credential error from real query paths instead of sample data. No live DB is contacted. No production build success, deployment, persistence or Supabase verification is claimed.

Actual screenshots/results are in [evidence](evidence/local-preview/README.md). Two verified illustrations are reused; no eight unique authenticated instrument photos are claimed. [Observed AI asset error](preview-ai-evidence.md) preserves the actual failed mapping and correction. Initial browser harness issues involved hidden Next Activity content and label text/route-announcer selectors; accessible role/visible-route selectors corrected the harness. These are not invented UI defect cases. Student evaluation/reasoning remains pending.

## Reproduce browser tests

Browser tooling was installed outside the app dependencies at `/private/tmp/tonevault-browser-tools`. This does not alter package.json or the lockfile. With the sample dev server running, a reviewer can supply their own Playwright installation and browsers, or use the local tool directory:

```bash
TONEVAULT_PLAYWRIGHT_MODULE=file:///private/tmp/tonevault-browser-tools/node_modules/playwright/index.mjs \
TONEVAULT_BROWSER_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
TONEVAULT_TEST_ENGINES=chromium,webkit \
node scripts/test-customer-preview.mjs
```

The script refuses its order rejection test unless the local product API identifies `local-sample`. It uses fresh isolated browser contexts and no real customer data. Physical-phone and outside-tester evidence, actual GC1 quotes/business reasoning, genuine GitHub reviews, personal no-AI Challenge 5 recording, backend checkout/orders/revenue/owner work and real deployment remain human/team tasks.
