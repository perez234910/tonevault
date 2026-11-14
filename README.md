# ToneVault

A university prototype marketplace for pre-owned and vintage guitars, with product photography, condition notes, verification labels and Philippine peso pricing. **GC2 payment is simulated. PayMongo and real escrow are not connected.** Seeded descriptions/grades are demo data, not real instrument inspection evidence.

## Member roster and ownership

Proposed five-person course assignments, subject to team review. Real names/remaining handles need team confirmation; assignments do not establish authorship of earlier commits.

| Member | Assignment | Main surfaces |
| --- | --- | --- |
| Member 1 — name/handle to confirm | Foundation / Catalog | Schema, seed, product APIs, Home/Browse, foundations/docs, deployment/admin coordination |
| Member 2 — shin-ieru; name to confirm | Product Detail / Cart / UX | Detail/gallery/purchase bar, cart state and screen, responsive/accessibility checks |
| Member 3 — name/handle to confirm | Checkout / Orders | Simulated checkout, confirmation, order APIs and cart handoff |
| Member 4 — name/handle to confirm | Revenue / Pricing | Two agreed server/DB-enforced revenue features and worked examples |
| Member 5 — name/handle to confirm | Owner Dashboard | Saved orders, metrics, owner screen and decisions |

Shared-foundation repairs authored by Member 2 remain Member 2's contributions. Each person owns their genuine code PRs, human reviews and individual no-AI recording. Never invent earlier activity or mark generated/unmerged work complete in the source checklist.

## Tech stack

Installed versions audited November 8, 2026 (lockfile authoritative):

| Layer | Version | Reason |
| --- | --- | --- |
| Next.js App Router | 16.4.5 | Screens and own JSON route handlers in one app |
| React / React DOM | 19.3.0 | Component UI and client interaction |
| Tailwind CSS / turbopack integration | 4.3.5 | Responsive utility styling and shared design tokens |
| Supabase JS / Postgres | 2.119.0 / DB version unverified | Persistent relational catalog and transactional inventory RPC |
| Zod | 4.6.7 | Request input and Browse JSON validation |
| TypeScript / tsx | 5.9.3 / 4.23.15 | Static checks, seed and Node test loader |
| ESLint / eslint-config-next | 9.39.5 / 16.4.5 | Lint and React/accessibility rules; see [audit](docs/npm-audit.md) |

Vercel is the intended hosting option. **No public deployment URL has been verified.** See [deployment handoff](docs/deployment-handoff.md).

## Local setup

Use Node/npm versions compatible with the locked packages. The audited machine uses Node 26.7.0 / npm 11.19.0. Do not assume an older major satisfies every dependency.

```bash
git clone https://github.com/perez234910/tonevault.git
cd tonevault
npm ci
cp .env.example .env.local
```

Have the database owner configure these values privately in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Service role stays server-only. `.env.example` has blank values; `.env*` remains ignored except that example. PayMongo has no code reference and needs no key. Never share credentials in chat, logs or Git.

### Database

The owner must confirm the intended **test** project before applying existing migrations in timestamp order. Review [schema](docs/schema.md) for fields, constraints, RLS and RPC behavior. No speculative production migrations or blind inventory resets.

On an authorized test environment only, `npm run seed` ensures demo buyer/seller profiles and inserts or **refreshes** eight listings. Re-running resets matching stock/status/price; it is not additive-only. Every demo listing starts at stock 1:

| Guitar | Price (PHP) |
| --- | --- |
| 1965 Fender Stratocaster — Olympic White | ₱485,000 |
| 1959 Gibson Les Paul Standard — Cherry Sunburst | ₱2,850,000 |
| 1972 Fender Telecaster — Olympic White | ₱265,000 |
| 1964 Gibson ES-335 — Cherry | ₱195,000 |
| 2016 PRS Custom 24 — Cobalt Blue | ₱168,000 |
| 1968 Fender Jazzmaster — Aquamarine Blue | ₱325,000 |
| 1954 Fender Stratocaster — Sunburst | ₱3,450,000 |
| 1961 Gibson SG Standard — Cherry | ₱420,000 |

Seed output is not proof of deployed configuration or persistence. No seed was run in this execution.

### Scripts

Test/typecheck scripts below are delivered in the separate cart-state PR #2 and Browse PR #18. This documentation branch starts independently from main; until either code PR is genuinely reviewed and merged, use `npx next typegen` then `npx tsc --noEmit` for its typecheck.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local app, normally http://localhost:3000 |
| `npm run typecheck` | Generate Next route types, then `tsc --noEmit` |
| `npm test` | Node tests through existing tsx loader |
| `npm run lint` | ESLint; baseline cart error is handled in separate PR #2 |
| `npm run build` / `npm start` | Production build/server; page-data collection needs configured Supabase |
| `npm run seed` | Authorized test DB only; may refresh inventory |
| `npm audit` | Dependency findings; never `npm audit fix --force` |

## Routes and database

[docs/routes.md](docs/routes.md) is the implemented/planned route table and JSON contract; [docs/schema.md](docs/schema.md) is the migration-backed schema. Three core handlers exist: product list, detail and single-product order creation. Order-reading/metrics routes, Checkout, Confirmation and Owner screens are missing at the audited base. Dedicated Cart and Detail API UX depend on Member 2 review work; do not count them as delivered here.

Browse in the separate, unmerged PR #18 fetches `/api/products`, validates/transforms JSON, then renders loading/empty/error/retry states with cancellation. Home and current Detail retain server-action paths. The order RPC locks inventory, calculates `price × quantity`, inserts `pending`, decrements stock and marks sold at zero. No funds are captured or held.

Architecture: `Browser Browse → own JSON API → catalog validation/queries → server Supabase client → Postgres`. `auth.users → public.users → products (seller)` and `public.users → orders (buyer) → products`. Server service role bypasses RLS; application authorization still requires review before order-reading/owner endpoints.

## Evidence and remaining deliverables

- [Challenge evidence](docs/challenges.md) records visible screenshot facts; resolved deployment remains unverified.
- Import [Postman collection](docs/postman_collection.json), set the actual `baseUrl` and authorized test buyer. Read stock-consuming POST guidance first. Localhost cannot substitute for deployed course evidence.
- [Business documentation](docs/business.md): GC1 traceability and customer funnel (Member 2, approved 8 November 2026); revenue rules and examples (Member 4) and dashboard metric decisions (Member 5) remain pending in this branch.
- [Member 2 handoff](docs/member2-handoff.md) identifies PRs, dependencies and validation limits.
- [AI-USAGE.md](AI-USAGE.md) records actual assistance and verification; disclose scope on every assisted PR.

## Changes since GC1

The original GC1 proposal is mapped to the implementation, with page-referenced quotes, in [business documentation](docs/business.md) §1. Current source demonstrates three DB tables, eight seed definitions, three JSON API handlers, Home/Browse/Detail screens and initial cart functionality. These proposed changes add source-backed documentation here and Browse API consumption in separate PR #18. These are current artifacts, not proof of GC1 differences or merged/deployed completion.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [PR template](.github/pull_request_template.md). Proposed convention: `g2/mN-<feature>` and `[G2-MN]`. Work needs a genuine human run/comment/approval; an authorized teammate merges. Never commit to main, self-approve, self-merge or force-push. Deadline: November 9, 2026, 11:59 PM Asia/Manila. Missed historical contribution windows need honest instructor discussion.
