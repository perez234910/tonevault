# Challenge 1 — existing evidence, not a new agent run

Inspected November 8, 2026. The six original images below visibly show the following requests/statuses. Every URL uses unresolved `{{base}}`, so **host/environment and deployed-course compliance need human verification**. Screenshot filenames and visible order timestamps are not evidence of when a student authored/merged code. No new order requests or database resets were executed.

| # | Request shown | Expected | Actual visible status / response | Screenshot | Fix / remaining verification |
| --- | --- | --- | --- | --- | --- |
| 1 | POST `/api/orders`, quantity -3, product/buyer UUIDs | 400 | 400 Bad Request; `VALIDATION_ERROR`, quantity must be greater than 0 | [00.42.34](<Screenshot 2026-11-08 at 00.42.34.png>) | Existing validation rejects negative quantity; zero is not shown. Verify on actual deployed host. |
| 2 | POST `/api/orders`, quantity 1, browser `total: 1` | 201 with server total, or 400 | 201 Created; order `total_amount: 325000`, quantity 1, escrow `pending`, listing `sold` | [01.15.46](<Screenshot 2026-11-08 at 01.15.46.png>) | Visible total differs from browser's 1; screenshot does not show the preceding catalog price. Compare against that price on authorized test DB; request consumes stock. No new fix claimed. |
| 3 | POST `/api/orders`, quantity 3 | 409 | 409 Conflict; `CONFLICT`, quantity exceeds stock or listing reserved | [01.08.27](<Screenshot 2026-11-08 at 01.08.27.png>) | Image alone cannot distinguish insufficient stock from previously sold slot. Existing RPC checks both; verify setup/host. |
| 4 | POST `/api/orders`, valid-shaped all-zero missing product UUID, quantity 1 | 404 | 404 Not Found; `NOT_FOUND`, Instrument not found | [01.07.08](<Screenshot 2026-11-08 at 01.07.08.png>) | Confirm UUID really absent in test environment; GET missing-ID evidence is not shown here. |
| 5 | POST `/api/orders`, quantity omitted | 400 | 400 Bad Request; `VALIDATION_ERROR`, quantity is required | [00.56.47](<Screenshot 2026-11-08 at 00.56.47.png>) | Existing required-field validation; verify deployed host. |
| 6 | GET `/api/products?search=zzzz-no-such-guitar-xyz` | 200 empty list | 200 OK; `ok: true`, `data: []`, `products: []`, `count: 0` | [01.10.31](<Screenshot 2026-11-08 at 01.10.31.png>) | Existing 200-empty behavior; verify deployed host. |

Import `docs/postman_collection.json`; set `baseUrl` to a real verified deployment and buyer/product variables to authorized demo records. The collection includes catalog list/detail plus the six cases and extra missing-product GET. Run read-only GETs first. Successful POSTs consume stock; do not run orders or reseed production without explicit approval. Record resolved URL, setup, expected/actual JSON/status, screenshot, and actual fix when rerunning. The wrong-total assertion now compares against the price captured by the preceding catalog GET; no new server behavior is claimed.

## Original images (preserved)

1.![An order with quantity 0 or -3](<Screenshot 2026-11-08 at 00.42.34.png>)
2.![An order where the browser sends a wrong total](<Screenshot 2026-11-08 at 01.15.46.png>)
3.![An order for more than the stock, or a taken slot](<Screenshot 2026-11-08 at 01.08.27.png>)
4.![An item id that does not exist](<Screenshot 2026-11-08 at 01.07.08.png>)
5.![An order with a required field missing](<Screenshot 2026-11-08 at 00.56.47.png>)
6.![A search that matches nothing](<Screenshot 2026-11-08 at 01.10.31.png>)

# Challenge 3 — observed AI workflow failures

These are tool/workflow failures, not demonstrated product defects. Student must decide whether they satisfy the course challenge and write/approve independent reasoning.

| Slot | Actual AI suggestion/action | Observed failure | Correction / evidence | Student reasoning |
| --- | --- | --- | --- | --- |
| 1 | Codex initially guessed GitHub `get_repo` arguments (`repo_full_name`, then `owner`/`repo`) | Tool returned `InvalidActionArgumentsError` twice | Read tool declaration from available metadata; used documented `repository_full_name` and retrieved repository permissions. Tool trace is in this execution; no product code change. | Needs human explanation/approval |
| 2 | Codex attempted delete/add of README as two operations targeting the same path in one patch | Tool rejected: `invalid patch: multiple operations target .../README.md`; no changes applied | Wrote revised README once, then applied distinct file updates. Tool trace is in this execution; no failed app test claimed. | Needs human explanation/approval |
| 3 | Codex's verification command used `git check-ignore node_modules/` in a worktree whose dependency directory was a symlink | Git rejected the trailing-slash path as beyond a symbolic link; the first Markdown check also ran before AI-USAGE.md existed | Rechecked with `node_modules` (no slash) after writing the required log: ignore checks, blank env and Markdown links passed. This was a verification-command error, not a product defect. | Needs human explanation/approval |

# Challenge 5 — human only

No predictions, personal challenge execution or recording were generated by the agent. Each student must independently write predictions before execution, run the function and film their own unedited ≤3-minute narrated recording without AI assistance.
