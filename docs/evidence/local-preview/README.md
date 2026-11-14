# Local sample UI evidence

Actual automated browser screenshots from November 8, 2026, Asia/Manila, against http://localhost:3000. All inventory/customer fields are fictional local fixtures. These are not deployed, physical-phone or outside-tester evidence.

- `browser-results.json`: actual successful engine/width runs. Chromium 1440/390/320 and WebKit 390 are described in the handoff.
- `chromium-1440-home.png`, `chromium-1440-browse.png`, `chromium-1440-detail.png`, `chromium-1440-cart.png`: desktop views.
- `chromium-390-cart.png`, `chromium-320-cart.png`, `chromium-390-empty-cart.png`, `chromium-390-sold-out.png`: phone-width views.
- `webkit-390-cart.png`: Playwright WebKit phone-width view, not manually operated Safari.

Tests use `scripts/test-customer-preview.mjs`. The injected loading/500/404/empty/broken-photo scenarios are explicitly synthetic browser tests, not fabricated backend incidents. Main-flow console/page errors and overflow checks passed. Challenge 3 asset evidence is factual; student reasoning is not supplied by the agent.
