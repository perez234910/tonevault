# Contributing to ToneVault

ToneVault is a team-owned marketplace. Keep changes small, reviewed, and aligned with the module ownership in the [README](./README.md#member-roster-and-ownership).

## Workflow

1. Create a branch from `main`.
2. Keep the change scoped to one concern (schema, API, UI, docs, or tooling).
3. Run `npm run typecheck`, `npm test`, and `npm run lint` before opening a PR once scripts from reviewed PR #2 or #18 land. Until then generate route types with `npx next typegen` before standalone `npx tsc --noEmit`. Record actual failures; do not silently suppress them.
4. If you touch listings or checkout, exercise the affected flow in the browser (`/`, `/browse`, `/products/[id]`).
5. Open a PR using the GitHub template. Do not merge your own PR.

## Branch naming

Proposed course convention, requiring owner/team consent in this PR: `g2/mN-<feature>` where N is the actual member number. Member 2 examples: `g2/m2-cart-state`, `g2/m2-cart-page`, `g2/m2-product-detail-ux`. PR titles start `[G2-MN]`, e.g. `[G2-M2] Add validated cart quantities and persistence`. This replaces the older `feat/`, `fix/`, `chore/`, `docs/`, `db/` convention after approval; never manufacture historical compliance.

Do not commit directly to `main`.

## Pull request rules

- One PR, one purpose. Do not mix a schema change with an unrelated UI restyle.
- Fill in the PR template completely, including the mandatory checklist and AI disclosure.
- Link a real Issue per screen/route/feature; file `Contract change: ...` for route/schema changes before implementation.
- Migrations live in `supabase/migrations/` and must be additive. Do not rewrite applied migration files.
- Never commit `.env.local`, service role keys, PayMongo secrets, or database passwords.
- Prefer `updateTag` / `revalidateTag` over ad-hoc client refetching when mutating catalog data.
- Request review from the owner of the module you changed (see the roster in the README). Schema changes need Member 1 (or current data owner) on the review.
- A genuine human must run the code, comment substantively and approve. AI review is supplemental; the Captain or authorized teammate merges. No self-approval/self-merge or force push.
- Each student owns their contributions. Member 2's foundation repairs do not count as Member 1's code PRs. Never backdate activity or fabricate missed contribution windows.

## Commit messages

Write in the imperative mood and say why the change exists:

```
Add pending escrow status so checkout can reserve a listing before payment
```

Avoid noisy commits such as `wip` or `fix stuff` on the branch that will be merged.

## Local database changes

1. Add a new timestamped SQL file under `supabase/migrations/`.
2. Have the database owner confirm an authorized test project before applying it; production changes require explicit approval.
3. Update TypeScript types in `src/types/` in the same PR.
4. Existing seed refreshes listings, including stock/status/price. Do not treat it as additive-only or blindly reset production. Successful order POSTs consume stock.

## AI-assisted work

AI tools may be used to draft code. You are still the author: you must understand the diff, keep secrets out of prompts where possible, and disclose AI assistance on the pull request.

Log meaningful uses in `AI-USAGE.md` with date/member/tool/request/changes/real verification. No fictional tests/feedback. Challenge 5 predictions, independent testing and unedited ≤3-minute voice recording must be done personally without AI. GC1 quotes and student-owned business/challenge reasoning require actual sources and human input.
