# GC1 customer UI redesign — actual verification

Run date: November 8, 2026 (Asia/Manila). Branch: `g2/m2-gc1-design-motion`, stacked on PR #23 (`g2/m2-product-detail-ux`). Tracking: [Issue #24](https://github.com/perez234910/tonevault/issues/24). All HTTP/browser checks target the local development preview at `http://localhost:3000`.

## Completed checks

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | Passed; Next route types generated and TypeScript passed |
| `npx tsc --noEmit` | Passed |
| `npm run lint` | Passed; no reported errors or warnings |
| `npm test` | 18 passed, 0 failed, 0 skipped |
| `git diff --check` | Passed |
| Customer journey | 4 passed: installed Chrome 1440/390/320px and Playwright WebKit 390px |
| Focused navigation/motion | 9 passed: Chrome 1440/390/320px normal motion + 1440/390px reduced; WebKit 1440/390px normal + reduced |
| Console/page failures | No unexpected errors in the final main journeys or focused motion cases |
| `npm audit --json` | Exit 1: 8 moderate lint-tool dependency findings; no high/critical. Existing issue #17 tracks remediation; package manifest/lock unchanged, no forced fix |

The earlier installation/security follow-up is tracked in [Issue #17](https://github.com/perez234910/tonevault/issues/17). This UI branch did not reinstall or change application dependencies. Browser tooling was installed outside the application in a temporary directory during the earlier local-preview work.

Customer coverage: Home/Browse/Detail/Cart, search, brand/verification/availability and price filters, decoding of sample photos, gallery keyboard controls, Add/Buy Now, capped quantity edits and invalid input, exact line/total previews, populated refresh hydration, remove/clear/empty and sold-out states. The desktop Chrome case also exercises delayed Detail loading, retry after injected 500, 404, missing/failed photos and the sample order endpoint's read-only rejection. Expected injected failures are separate from the main-flow error assertions.

Focused coverage: white canvas and loaded DM Sans, 96px gliding nav surface with subpixel tolerance, distinct active underline, collection dropdown keyboard/outside dismissal and real links, mobile touch menu and focus cycling, gallery opacity transition, dismissible Add toast clear of the action, drawer focus/Tab/Shift+Tab/Escape/backdrop/opener return, background wheel blocking and restored root overflow, stable viewport width, cart quantity/count/refresh/removal, no horizontal overflow, and reduced-motion transition disabling.

Guard tests execute the real data-access module with isolated environments: development plus explicit `true` returns the validated eight-guitar catalog; production with the flag set and development without it still require genuine Supabase credentials. Preview API envelopes/IDs and read-only order behavior remain intact. This is not a live production database test. No API contract, Supabase code, migration, seed or order RPC changed in this redesign.

## Reproduction

Use the existing local development-only flag and `npm run dev`. Do not add credentials or enable sample mode in a deployed environment. Both browser scripts assert the sample response header before their journeys.

```sh
npm run typecheck
npx tsc --noEmit
npm run lint
npm test
node scripts/test-customer-preview.mjs
node scripts/test-ui-motion.mjs
```

Browser scripts require Playwright tooling available to Node; it is deliberately not a new application dependency. For this run `TONEVAULT_PLAYWRIGHT_MODULE` pointed at `file:///private/tmp/tonevault-browser-tools/node_modules/playwright/index.mjs`, and `TONEVAULT_BROWSER_EXECUTABLE` at the installed Chrome executable. The journey also used `TONEVAULT_TEST_ENGINES=chromium,webkit`. Browser binaries must be installed for WebKit. See each script for evidence-directory overrides.

## Actual screenshots and results

- [Before Browse desktop](evidence/gc1-motion/before/1440-browse.png) / [after](evidence/gc1-motion/after/1440-browse.png)
- [Before Detail phone](evidence/gc1-motion/before/390-detail.png) / [after](evidence/gc1-motion/after/390-detail.png)
- [Before Cart desktop](evidence/gc1-motion/before/1440-cart.png) / [after](evidence/gc1-motion/after/1440-cart.png)
- [Restored Home](evidence/gc1-motion/after/1440-home.png), [dropdown](evidence/gc1-motion/after/1440-dropdown.png), [mobile navigation](evidence/gc1-motion/after/390-mobile-menu.png), [quick cart](evidence/gc1-motion/after/390-drawer.png), [empty cart](evidence/gc1-motion/after/390-empty-cart.png)
- [Customer results](evidence/gc1-motion/after/customer-results.json) / [nine-case motion results](evidence/gc1-motion/after/motion-results.json)
- [Real AI UI defects and corrections](gc1-ui-findings.md); student's evaluation remains pending

Before images are actual captures of the base Member 2 UI before this restoration; after images come from the redesigned local sample application. Sample instruments and repeated illustrative photos are fictional, as the visible banner states. These development screenshots include Next's development indicator; no production deployment or real inventory is implied.

## Human and external limits

Safari WebDriver session creation was attempted and refused: “You must enable 'Allow remote automation' in the Developer section of Safari Settings to control Safari via WebDriver.” No setting was changed. Automated WebKit passed; it is not a manual Safari-app or physical-phone test. The user can inspect `http://localhost:3000` directly in Safari; permission for Safari automation or an actual human check remains necessary for that evidence.

The bounded read-only Tonely search found no match; see [design specification](ui-design-spec.md). No older project was modified.

Human reviewer must run this branch, leave a substantive comment and approve before authorized integration. Existing PRs #2/#18/#19/#21/#22/#23 remain unmerged. Supabase credentials/live inventory validation, Member 3 checkout/order persistence, Members 4–5 work, owner deployment/admin actions, outside-phone usability and personal course reasoning/recording remain human/team tasks. No checkout success, saved order, payment or live database result is claimed.
