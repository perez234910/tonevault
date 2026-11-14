## Summary

<!-- What changed and why. 1–3 bullets. -->

-

## Test plan

<!-- How a reviewer can verify this. Check every item you actually ran. -->

- [ ] `npx tsc --noEmit`
- [ ] `npm run typecheck` (generates Next route types)
- [ ] `npm test` (record actual passed/failed counts)
- [ ] `npm run lint`
- [ ] Exercised the affected UI or API path

## Mandatory checklist

- [ ] This PR has a single, stated purpose
- [ ] Course branch `g2/mN-<feature>` and title `[G2-MN]` (owner/team confirms convention)
- [ ] Real Issue linked; route/schema changes have a `Contract change: ...` issue
- [ ] I did not commit `.env.local`, API keys, or other secrets
- [ ] Schema changes include a new migration **and** matching TypeScript types
- [ ] Catalog or checkout changes were verified in the browser (`/`, `/browse`, and/or `/products/[id]`)
- [ ] RLS / escrow behavior was considered if this touches `users`, `products`, or `orders`
- [ ] The module owner listed in the README is a reviewer
- [ ] Genuine human ran the branch, commented and approved; author/agent does not self-merge
- [ ] All test/deployment/screenshot claims reflect actual evidence; limitations are explicit

## AI-assisted development disclosure

- [ ] I used AI assistance on this PR: **Yes / No** — tools and scope:
- Date/member, kept/changed output and actual verification (also update `AI-USAGE.md`):

<!-- Example: Yes — Cursor (Grok) drafted the filter bar; I reviewed types, RLS impact, and tested /browse. -->
