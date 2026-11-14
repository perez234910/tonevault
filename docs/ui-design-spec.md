# ToneVault GC1 design and motion system

Current refinement: see [storefront refinement](storefront-refinement.md). The latest user instruction removes the earlier sliding nav surface, simplifies Home/labels and replaces native filters with Radix Select. Historical PR #25 test results remain unchanged.

Source: complete local `agent-instructions/GC1_GROUP 2.pdf`, all 14 pages read; pages 9–14 visually inspected at high resolution. It remains excluded from Git. The mockups define visual identity; planned checkout, seller, payment and escrow features in that document are not claims about working GC2 backend features.

## GC1 versus previous implementation

| Area | GC1 reference | Previous Member 2 UI | Restored treatment |
| --- | --- | --- | --- |
| Palette | Pages 9–14: white, light neutral, charcoal, forest green | Brown/black surfaces and gold | White canvas, pale-neutral photo/summary areas, forest-green accents |
| Type | Pages 9–10: compact sans-serif hierarchy | Newsreader serif display with mixed sans | Local variable DM Sans; regular body and medium headings |
| Navigation | Pages 9–10: restrained wordmark, search, small links and bag | Minimal dark header, no dropdown/mobile menu | Search, shared sliding hover surface, separate active rule, collection dropdown, mobile sheet, quick cart |
| Product | Page 10: image-led two-column layout, rectangular actions, thin rules | Rounded gallery and bordered panels | Square photo field, small-corner green actions and divided detail sections |
| Cart summary | Pages 11–12: pale summary field, exact item/total hierarchy | Large rounded cards | Clean separated list and pale rectangular summary, accurate preview totals |
| Feedback | Restrained visual language; motion not specified in still mockups | Abrupt image/item changes and no quick-cart overlay | Shared functional entrance/exit, gallery crossfade, toast, number feedback and focus-safe surfaces |

Page 9 informs the editorial Home and collection hierarchy. Page 10 is the direct Product Detail reference. Pages 11–12 inform summary/form geometry only; this work does not implement checkout. Pages 13–14 reinforce whitespace, rules and muted progress/status styling; no Owner, payout or order workflow is added.

## Tonely search

Read-only bounded directory searches looked for folders named `Tonely`/`tonely` in `~/Projects`, `~/Desktop`, and `~/Documents` through five folder levels, pruning dependency/Git/cache directories; a Spotlight filename search also found no match. No Tonely source/assets could be inspected or reused. This is not a claim that no copy exists elsewhere. No original project, credentials, env file or DB configuration was modified/imported.

## Interaction references consulted

- [Beautiful UI](https://www.beautifului.dev/): inspected the live page and its navigation/state grouping. Adapted compact hierarchy, legible status feedback and restrained surfaces, not its AI-product content or dark theme.
- [Transitions.dev library](https://transitions.dev/library.html): inspected dropdown/modal/panel examples and the published sliding-tab, badge, toast and skeleton descriptions. Adapted origin-aware surface motion, a shared indicator, opacity/transform transitions and distinct entrances/exits. No Pro code, proprietary implementation or dependency was copied.
- [EasyUI Gooey Menu](https://easyui.site/components/gooey-menu): read the component description and controlled open/selection API; inspected the accessible page. Its preview interaction could not be reliably isolated from the site's Home navigation. Adapted the connected-surface idea to the shared nav background, not the SVG metaball/filter or spring library. A literal goo effect was omitted to keep text crisp and avoid costly filters or playful movement that conflicts with GC1.

These are references for principles, not imported component sources or a claim of exact recreation.

## Visual tokens

| Token | Value / use |
| --- | --- |
| Canvas | `#ffffff` |
| Text | `#252a25` |
| Secondary text | `#626b60` |
| Accent / hover | `#294c36` / `#1d3c2a` |
| Accent surface | `#edf2e9` |
| Panel / photo field | `#f6f7f3` / `#eef0ea` |
| Separator | `#dfe3da` |
| Controls | 3px radius, 44px main target height, outlined focus |
| Corners | Mostly square photography, 2–4px controls/surfaces; no oversized rounded cards |
| Typography | DM Sans local variable font, 400 body / 500 headings / 600 emphasis; wordmark 750; tabular price/count feedback |
| Container | 1152px customer content, 1248px header; phone gutters 16px |

Nominal foreground/secondary/primary-action contrast ratios are recorded in `docs/evidence/gc1-motion/token-contrast.json`. This token check is not a claim of a complete accessibility certification. The font is bundled with its SIL OFL license; no runtime font network call is needed. Legacy `gold` color names remain compatibility aliases to green for unchanged components, not a second palette.

## Motion tokens — app/globals.css

| Token | Value | Use |
| --- | --- | --- |
| `--motion-micro` | 160ms | Press feedback, count/price emphasis, thumbnail selection |
| `--motion-hover` | 220ms | Shared navigation movement, gallery crossfade, modest photo hover |
| `--motion-overlay` | 240ms | Dropdown, drawer, toast and item entrances |
| `--motion-exit` | 180ms | Surface and cart-row exits |
| `--motion-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Shared ease-out |

Favor transform and opacity. No `transition-all`, large blur/filter animations, page-scale parallax or perpetual decoration. Color/border transitions use the same micro/hover tokens. Toast's five-second reading time is a content hold, not an animation duration. Money commits immediately and exactly; number motion is a short fade/translation, not a misleading interpolated total.

## Navigation and overlays

Desktop links occupy fixed 96px slots. One pale-green surface moves using transform; route selection keeps a separate thin green underline, and keyboard focus uses a 2px outline. Hover/focus/route are distinguishable. Text sits outside any filter and stays crisp. Collection links point only to implemented Browse queries. No Sell/Saved/Account placeholder routes were added.

The collection dropdown uses ordinary links inside a labeled region, not a pretend application menu. Button click/ArrowDown opens; Escape returns focus; outside pointer/focus dismisses. Its mounted closing surface fades without abruptly removing positioning geometry; hidden content is inert and excluded from accessibility.

Mobile navigation and quick cart share `ModalShell` and native `<dialog>` semantics. Background is inert; explicit complete DOM-order Tab/Shift+Tab cycling supplements platform behavior. Close button, Escape and desktop backdrop dismiss. The opener is recorded explicitly, including Safari clicks that do not focus a button. Focus returns after native close, except intentional route navigation. Both root and body overflow are locked and their original values restored after exit/unmount; stable scrollbar gutter prevents horizontal jumps; `100dvh` and an independently scrolling content area keep close/summary controls accessible. Full-width mobile sheets use their close button/Escape, as there is no outside backdrop region to tap.

Cart drawer uses existing quantity/store operations and a real `/cart` review link. It never enables checkout. The overlay retains its content type during closing, avoiding cart-to-menu flicker. Add actions show a dismissible live status toast and an in-place confirmation rather than unexpectedly opening a modal.

## Detail and Cart behavior

Gallery retains the old image until a selected image loads, then crossfades opacity. Thumbnail pressed state and Left/Right/Home/End remain supported. Loading, empty and failed-image states remain explicit. Buy Now's pending state represents the actual route transition, not a fabricated payment request.

Cart data, stock limits, quantity validation, peso precision and server pricing authority are preserved. Rows fade/translate before removal; exiting rows are inert. Empty content enters naturally; exact totals/counts get short feedback. No height/layout tween is required. Existing local-sample and real-cart namespaces remain separate.

Cart consumers subscribe directly to the external store so a late Suspense boundary receives its own stable server snapshot. This fixes the persisted-cart header hydration mismatch discovered during real browser regression.

## Reduced motion

`prefers-reduced-motion: reduce` disables CSS animation and transition for all surfaces and controls. State, selection and focus indicators remain available. Exit helpers and modal close logic complete immediately instead of waiting for animation events. No smooth programmatic scrolling is introduced.

## Evidence and verification

Before images: `docs/evidence/gc1-motion/before/` — six actual prior desktop/phone Browse, Detail and Cart screenshots. After images/results: `docs/evidence/gc1-motion/after/`. Original failures/corrections: [GC1 UI findings](gc1-ui-findings.md).

Automated checks: TypeScript, ESLint, cart/sample/API tests, a binary font-variation regression, customer journey and focused motion suites. The focused suite covers desktop/mobile menus, indicator geometry, gallery, toast, cart modal Tab cycles/focus return/Escape/backdrop/scroll lock, quantity/refresh/removal, reduced motion and overflow. See [actual test results](ui-motion-test-results.md) for completed runs and limits.

Actual Safari WebDriver session creation was refused because “Allow remote automation” is disabled. No browser setting was changed. Chrome uses the installed Chrome executable; WebKit is Safari-engine coverage, not a manually operated Safari app or physical phone/outside tester. A human Safari app check remains pending unless that permission is enabled by the user.

## Git and backend boundaries

Branch `g2/m2-gc1-design-motion` is explicitly stacked on `g2/m2-product-detail-ux` / PR #23. Existing PRs #2/#18/#19/#21/#22/#23 remain unmerged and retain their histories. Source prompts/PDF, `.env.local` and credentials stay excluded. No framework/animation dependency was added. No catalog API contract, production guard, Supabase client, migrations, seed or order RPC was changed; no database or production write was performed. Actual teammate review and authorized merge are required before integration.
