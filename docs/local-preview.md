# Local sample preview

This branch is stacked on the unmerged cart-state PR #2. No existing PR is merged. It adds a read-only development data source at the existing catalog query boundary; Home/server actions and both product JSON APIs see the same fixtures. Browse API PR #18 remains separate and will work through this same query boundary after human review.

Local `.env.local` contains only `TONEVAULT_MOCK_DATA=true`. `npm run dev` enables fixtures **only when NODE_ENV is development and the flag is exactly true**. Production and flag-off modes retain the original Supabase calls and require genuine credentials. This is not a production fallback or a substitute database. Do not set NODE_ENV to development on a production server.

A page-wide banner identifies fictional inventory, sample grades, illustrative photos and disabled orders. Product API responses include `X-ToneVault-Data-Source: local-sample` and `Cache-Control: no-store` in preview. Responses otherwise preserve the existing JSON contract. Eight deterministic sample IDs cover search/filters, seven available instruments (including one stock-three quantity fixture), and one sold-out instrument. No random data or real user profiles are used.

Order creation is blocked at the query boundary before calling Supabase; no order ID, payment or persistence success is fabricated. Preview cart storage uses `tonevault-cart-preview`; real mode retains `tonevault-cart`, preventing samples from leaking into a real cart. Turning the flag off requires real backend configuration. Do not run seeds or migrations to use this preview.

The local env file and personal agent instructions are excluded from Git. Public preview photos are illustrative copies of the repository's existing Unsplash sources; details are cropped from the same illustration, not documentary photos of these vintage instruments. See `public/preview/README.md`.

Verification includes guard truth-table tests, actual query/handler tests under development and production child processes with deliberately blank backend configuration, stock/filter/pagination tests, and separate cart storage tests. Production-mode tests verify the original missing-credential error, rather than returning fixtures or contacting a database. Browser checks and final results are recorded with the UI PRs.
