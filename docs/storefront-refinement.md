# Storefront refinement and recovered Tonely

This work supersedes the sliding navigation treatment in PR #25 at the user's explicit request. Browse, Verified and Collection now retain stable backgrounds/positions; a quiet active underline and focus outline remain. Only dropdown surfaces/options animate. Collection supports ArrowDown to open, ArrowUp/Down/Home/End within links, Escape, outside-click and focus dismissal.

The five Browse filters share Radix Select, with portaled collision-aware positioning, typeahead, full keyboard/focus handling, scroll controls and token-based entrances/exits. Search, unrelated query parameters, pagination reset and min/max price semantics remain. Compact visible values replace repetitive label rows; accessible names remain Brand, Price, Verification, Condition and Availability. No new animation framework is used.

Home keeps the exact GC1 headline at 30–42px, a short introduction and featured instruments. Repeated editorial labels and explanatory sections were removed. Shared typography, white/neutral surfaces and forest-green actions remain.

## Tonely recovery

A broader bounded read-only scan covered Projects/Desktop/Documents/Downloads/Developer/Development/Code/Sites/repos/src (444 directories within six levels, dependency/system folders pruned). Spotlight found no indexed match. VS Code workspaceStorage and read-only recent-workspace database entries identified `~/tonely`; its Git working tree was clean before inspection. No file in that original project was written, executed, installed, moved or deleted.

Read its single-page prototype, CSS, headless Select wrapper and image credits. Useful patterns: compact Pick filters, photo-led cards, Contact → Shipping → Payment → Review split with pale summary, and a restrained owner sidebar/table. These layouts inform route-based React components here; its client-only fake order success, fabricated dashboard metrics, legacy vinext/hosting stack, database configuration and environment files are not reused.

Six user-provided local model-reference assets were copied unchanged from `public/guitars` with the original `image-credits.txt`. Credits name third-party sources and explicitly do not establish a publication license; the files are reference illustrations, not verified listing photographs. This recovery is not a claim of rights clearance for public deployment. Their models were visually checked. References match brand/model/finish before presentation; a white Strat does not stand in for the 1954 Sunburst, and no SG photo is invented. Missing matches show an unavailable state.

A presentation adapter replaces only the known unrelated Unsplash/local-preview stock images. It does not change database URLs, API JSON, seller-uploaded imagery or stock. A single recovered reference is not repeated to manufacture gallery views. Product cards, Detail, persisted legacy carts and summaries use consistent references, contain sizing and explicit labels. Authentic seller photographs and any additional verified views remain a team content requirement.

## Supabase read-only verification

Local `.env.local` was checked and updated from the user's supplied configuration without displaying values; permissions restricted to the local user. It remains ignored. Mock mode is false for normal localhost use; its development-only path remains available for isolated offline tests.

Read-only PostgREST checks accepted all repository-expected columns in users/products/orders, including products.stock and orders.quantity. Counts at verification: 2 users, 8 products, 3 orders. The eight brand/model/year identities match the seed set; current status is 5 available / 3 sold, so existing order activity is preserved. No user/order row contents were retrieved for this audit. The order RPC is advertised by OpenAPI, but it was not invoked. REST metadata cannot prove all SQL constraints, triggers, RLS or migration history; no SQL/catalog privilege escalation was attempted.

No migrations, seeds, resets, order submissions or database writes were run. Home/Browse/Detail and GET catalog API checks use real data. Missing order-read/list/metrics HTTP APIs and authenticated access remain Member 3/5 integration work; possession of a server key is not permission to expose private orders in a public UI.

Before/after images and actual structured browser results live in `docs/evidence/storefront-refinement/`. Installation added only Radix Select and its dependencies. npm reports the existing eight moderate lint-tool vulnerabilities; esbuild/fsevents install scripts remain unapproved (listed read-only). No forced audit fix or install-script policy change was made.

Verification: `npm run typecheck`, full ESLint and 20 automated tests passed. Eight real-data storefront browser cases passed: Chrome/WebKit × 1440/390px × normal/reduced motion. They assert custom filter selection/typeahead/Escape/focus/outside dismissal/collision bounds, stable nav triggers, real GET catalog/detail, reference photo decoding/contain sizing, drawer, cart persistence, no overflow, no unexpected errors and no non-GET API requests. The scripts use synthetic gallery fixtures only where an additional view is needed to test interaction; no extra listing photography is invented. Final evidence includes settled Home/Browse and open-filter captures. Older PR #25's recorded results remain historical.
