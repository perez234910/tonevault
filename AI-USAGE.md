# AI usage

| Date | Member | Tool | Purpose | Kept/changed | Verification |
| --- | --- | --- | --- | --- | --- |
| 2026-11-08 | Group 2 Member 3 | Codex | Used AI for planning and implementation assistance. | Authenticated checkout API, private shipping details, GC1 pricing migrations and backend tests; human review pending | Local API tests, disposable PostgreSQL assertions, TypeScript and changed-file lint; actual Supabase Auth/email and deployed browser flow remain unverified |
| 2026-11-08 | Group 2 Member 3 | Codex | Used AI for planning and implementation assistance. | Buyer sign-in/registration interface and checkout using the existing cart and Supabase client; no cart/catalog edits | TypeScript and changed-file lint; real account/email and browser submission remain pending |
| 2026-11-09 | Group 2 Member 3 | Codex | Used AI for planning and implementation assistance. | GC2 revision: guest checkout supported alongside optional accounts, private guest confirmation access, additive nullable-buyer migration | Unit tests, local HTTP creation/cookie/stock checks and disposable PostgreSQL guest/account/pricing assertions; shared Supabase unchanged |
| 2026-11-09 | Group 2 Member 3 | Codex | Used AI for planning and implementation assistance. | Removed the account gate from checkout while retaining optional sign-in | TypeScript and changed-file lint; guest API tested against disposable local database |
