# Owner and deployment handoff

Observed November 8, 2026: repository `perez234910/tonevault`, `main` at `6112d47080760c10728cd416581ff16710bf4417`, `protected: false`. CLI-visible collaborators: `perez234910` (admin), `shin-ieru` (write). No repository homepage or GitHub deployment was recorded. GitHub Pages lookup returned 404. This does not rule out an external deployment; the owner must provide its actual URL. No guessed Vercel URL is evidence.

Authorized repository owner:

1. Settings → Collaborators: invite instructor `knee-rel` and the five actual student accounts; confirm accepted invitations. Unknown handles must be supplied by the team.
2. Settings → Rules → Rulesets (or Branches): target `main`; require pull requests and at least one approval. Block force pushes; avoid author bypass. Human reviewer must actually run the code, comment substantively and approve.
3. Review proposed five-member ownership and `g2/mN-<feature>` / `[G2-MN]` course conventions in README/CONTRIBUTING. These are proposed for team consent through review.

Vercel deployment checklist (hosting owner):

1. Import the actual GitHub repository with the Next.js preset, using a reviewed branch/main; confirm build scripts and a compatible Node version.
2. Privately configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` in the correct preview/test/production environments. Values never belong in chat, logs or Git. PayMongo is not connected and needs no key for GC2.
3. Database owner verifies existing migrations in order and chooses a safe isolated test DB. Obtain explicit approval before any production migration, seed refresh or stock-consuming order request. No DB writes have been performed by this agent.
4. Build/deploy and record the actual public URL. Current local build compiles/typechecks but cannot collect product page data without Supabase configuration. Do not mask missing configuration with invented data.
5. Verify public `/`, `/browse`, Detail, filters, and non-destructive GET API 200/404/empty responses. Test loading/errors/retry and phone layouts. Record actual browser/HTTP results and screenshot context with resolved host.
6. On an authorized test DB, verify saved order persistence after restart, stock decrement/concurrency and the six Challenge 1 cases. Successful order POSTs consume stock; seed re-runs refresh listings. Human confirms deployed Postman evidence.

Captain: coordinate remaining Checkout/Confirmation, two revenue rules, Owner/metrics, architecture/baseline, ≤2-page final PDF and tag `gc2-v1.0` after actual human verification. The agent has not deployed, tagged, merged, or marked the shared checklist complete. Earlier contribution windows cannot be recreated; raise missed requirements honestly with the instructor before November 9, 2026, 11:59 PM Asia/Manila.
