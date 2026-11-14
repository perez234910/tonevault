# WebKit RSC-prefetch investigation — 14 November 2026

**Conclusion:** the recorded access-control errors come from WebKit's handling of same-origin loads started during document replacement. Normal Next.js prefetch work overlaps the test's hard navigation/reload. The engine classifies the refused load as AccessControl, and Playwright surfaces that native diagnostic as a `pageerror`. This is not evidence of a ToneVault CORS/configuration defect. No application fix is justified by these results; strict WebKit browser acceptance still fails.

## Direct evidence

- The unchanged `scripts/test-storefront.mjs` reproduced the failure with the earlier Playwright 1.63 / WebKit r2388 combination. That pairing was unsupported: 1.63 expects r2359.
- Installing Playwright **1.65.0** outside the repository matched the existing **WebKit r2388 / 27.2** binary. The unchanged strict scenario still failed. Correcting the tooling mismatch did not fix or explain away the error.
- In the observation-only ToneVault trace, hard navigation begins at sequence 182. Seven same-origin RSC fetches start while the old document is still active; seven access-control `pageerror`s appear before its `pagehide` at sequence 205. The first corresponding fetch starts at 184 and errors at 185. See [trace](tonevault-trace.json). Fetches, responses and rejections were forwarded unchanged; no API response or console event was replaced or filtered.
- The separate [GET-only lifecycle control](lifecycle.mjs) requires a successful no-navigation control before proceeding. The control fetch reaches its local server and returns HTTP 200 with no errors. During held document replacement, the same-origin fetch rejects with `TypeError: Load failed`, never reaches the server, and produces the same access-control `pageerror` even though its rejection is caught. This uses no Next.js, ToneVault, credentials, database, request interception, CORS restriction or CSP. See [actual result](lifecycle.json).

These independent observations establish the document-replacement mechanism for this failure signature. They do not turn every similarly worded browser error into an ignorable event.

## Classification and source support

| Possibility | Finding |
| --- | --- |
| ToneVault application/CORS defect | Not supported: the requests are same-origin, the independent no-navigation control succeeds, and the mechanism reproduces without the application. No security headers or permissions were relaxed. |
| Next.js prefetch behavior | Ordinary background route fetching exposes the timing window. Installed Next 16.4.5's `segment-cache/cache.js` calls `createFetch`; `router-reducer/fetch-server-response.js` uses same-origin credentials. No framework files were patched. |
| WebKit engine behavior | The independent control and old-document trace reproduce refusal during provisional document replacement, not a server CORS rejection. A native diagnostic is exposed through Playwright's page-error channel. |
| Playwright setup/version mismatch | The original pairing was unsupported and was corrected for this investigation. The failure persists with the matching pair, so mismatch alone is ruled out. No real Safari/physical-phone run is claimed. |

Upstream support: the Playwright maintainer identifies the same WebCore cancellation classification in [issue #43120](https://github.com/microsoft/playwright/issues/43120). The inspected WebKit source refuses loads in provisional/stopping frames in [CachedResource.cpp](https://github.com/WebKit/WebKit/blob/56453fdfe0b0ca6258c23e6453b34f70b885d13f/Source/WebCore/loader/cache/CachedResource.cpp) and maps immediate null/cancelled failures to AccessControl in [CachedResourceLoader.cpp](https://github.com/WebKit/WebKit/blob/56453fdfe0b0ca6258c23e6453b34f70b885d13f/Source/WebCore/loader/cache/CachedResourceLoader.cpp). This is source/mechanism correspondence, not a claim to have rebuilt or exactly symbol-mapped the installed engine. The issue links WebKit bug 329152; its current status could not be independently read, so no released fix is claimed.

[Playwright's browser guidance](https://playwright.dev/docs/browsers) requires matching client/browser versions. [Next's navigation documentation](https://nextjs.org/docs/app/getting-started/linking-and-navigating) describes automatic Link prefetching. These support the setup/behavior distinctions; the local observations supply the ToneVault attribution.

## Complete matrix results

Both complete reruns used the matching Playwright/WebKit pair and real catalog data. All original route, filter, image/fallback, keyboard, cart, reload, overflow, console/page-error and no-write assertions stayed unchanged.

| Browser | Width | Motion | Local production | Deployed foundation |
| --- | --- | --- | --- | --- |
| Chrome | 1440 | Normal | Passed | Passed |
| Chrome | 1440 | Reduced | Passed | Passed |
| Chrome | 390 | Normal | Passed | Passed |
| Chrome | 390 | Reduced | Passed | Passed |
| WebKit | 1440 | Normal | Failed error assertion | Failed error assertion |
| WebKit | 1440 | Reduced | Failed error assertion | Failed error assertion |
| WebKit | 390 | Normal | Passed | Passed |
| WebKit | 390 | Reduced | Passed | Passed |

**Each matrix: 6/8 passed, 2/8 failed, exit code 1.** Log copies normalize trailing whitespace only; every error message is retained. See [local results](local-matrix.json), [local log](local-matrix.log), [deployed results](deployed-matrix.json) and [deployed log](deployed-matrix.log). The prior evidence remains untouched; varying earlier outcomes are consistent with the measured timing window, not a proven motion/media-query defect.

The original test stops at the first failure. [run-complete-matrix.mjs](run-complete-matrix.mjs) creates a temporary copy with only an outer per-case failure collector: each original assertion still executes/throws, failed cases stay failed, all eight cases run, and an AggregateError produces exit 1 afterward. It does not continue past a failed assertion within a case. The repository's original test script is unchanged. [Environment/source hashes](environment.json) and [assertion preservation](assertion-preservation.json) record this boundary.

A client-Link navigation experiment was also rejected as a workaround: it still hit the error at the required cart reload. No navigation changes, sleeps, disabled prefetch, weakened guards, error allowlist, ignored events or intercepted successful responses were adopted. No application, UI, dependency/lockfile, production configuration, other PR branch or database was changed.

## Reproduction

Use an external Playwright 1.65.0 install with its matching WebKit r2388 binary. Do not force a different binary with a wrapper. No app dependency installation is needed. With the existing configured production build running, set these environment values to your own paths:

```sh
export TONEVAULT_PLAYWRIGHT_MODULE=file:///absolute/path/to/playwright/index.mjs
export TONEVAULT_BROWSER_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export TONEVAULT_TEST_BASE=http://127.0.0.1:3109
export TONEVAULT_STOREFRONT_EVIDENCE=/private/tmp/tonevault-prefetch-matrix
node docs/evidence/webkit-prefetch-investigation/run-complete-matrix.mjs
```

To isolate the engine mechanism without the application:

```sh
TONEVAULT_LIFECYCLE_OUTPUT=/private/tmp/tonevault-lifecycle.json \
node docs/evidence/webkit-prefetch-investigation/lifecycle.mjs
```

The lifecycle process exits 0 when collection completes; its result shows an intentional engine reproduction, not a passing no-error browser test. All requests are GETs to its owned loopback HTTP server. The storefront matrices only read the public catalog and alter browser-local cart state; no order submission, private Owner read, migration or database write occurs.

## Review readiness

All four Member 2 PRs remain suitable for substantive teammate review with their existing backend dependencies. The strict WebKit storefront acceptance condition remains **not satisfied** in r2388. Keep these failures visible and retest an upstream-corrected engine when one is validated. No application workaround, merge approval or human/course review has been invented.
