# Installation and baseline audit — November 8, 2026

Environment observed: Node `v26.7.0`, npm `11.19.0`. Retained install log `2026-11-08T01_15_04_728Z-debug-0.log` ended with exit 0. Only warning/error lines were inspected; no credentials/environment files were read.

- `eslint@9.39.5` was marked deprecated/unsupported. A major lint upgrade is separate compatibility work, not an automatic deadline change.
- `esbuild@0.28.2` postinstall and optional Darwin `fsevents@2.3.3` install scripts were not covered by npm `allowScripts`. `npm install-scripts ls` confirms them. No scripts were blanket-approved. Existing esbuild/tsx works through `node --import tsx`; the tsx CLI's IPC socket is blocked by the sandbox, not by a demonstrated missing binary.
- `npm audit` initially could not resolve the registry in the sandbox; rerun with network access completed and exited 1: **8 moderate findings**, all via `minimatch@10.2.6` under `@typescript-eslint/typescript-estree` → `typescript-eslint` → `eslint-config-next`. These are development-tool findings, not eight independently identified app exploits.
- Advisory [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) identifies affected versions `>=7.0.0,<11.0.1` and patch `11.0.1`. The installed parent range uses major 10. npm proposes forced downgrade to `eslint-config-next@15.5.29`; it was **not run**. No dependency/lockfile changes, overrides or forced fixes were made. Review an upstream-compatible upgrade separately and run the lint/type/build checks.

Baseline `npx tsc --noEmit` failed with three missing generated `PageProps`/`LayoutProps` names. `npx next typegen` followed by TypeScript passed. Added `npm run typecheck` makes this reproducible from a fresh checkout. Baseline `npm run lint` fails on synchronous effect hydration in `cart-context.tsx`; independent cart-state PR #2 fixes it. The Browse remediation does not duplicate that cart change.

The cart branch's `npm run build` compiled and passed TypeScript, then failed collecting `/products/[id]` data because Supabase URL/service role configuration was absent. No credentials were supplied and no seed/POST/database writes were run. Branch-specific current verification is recorded in the PRs; do not represent this build as passing or deployed evidence.
