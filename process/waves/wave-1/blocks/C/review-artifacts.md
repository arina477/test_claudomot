# Wave 1 — C-block (CI/CD) — BLOCKED at entry on founder credentials

**Block:** C (CI/CD) · **Wave topic:** Bootstrap monorepo + dark app shell + CI (M1 seed)
**Status:** blocked — awaiting founder-account credentials (rule 6 exception)

## Why blocked
The wave is built and locally green (B-block gate PASS; `/health` → 200; lint/typecheck/test/build all pass on branch `wave-1-foundation-scaffold`). Shipping it requires external accounts only the founder can provision:

| Need | Stage | State |
|---|---|---|
| Git remote | C-1 | NONE (local-only repo) |
| Valid GitHub token / repo access | C-1 | `GH_TOKEN` invalid (`gh auth status` fails) — needed to push, open PR, run CI, merge |
| `RAILWAY_TOKEN` | C-2 (Action 0) | NOT set — needed to provision + deploy (bring-your-own) |

"Never deploy from local" (DISPATCHER op-rule) forbids any local-deploy workaround.

## Resume
Founder provides GitHub repo access (valid token, or authorizes `gh repo create`) + a Railway API token; export them; set `STATUS: RUNNING` in `process/session/status-check.yaml` (or ESC + chat). Then C-1 → push/PR/CI/merge, C-2 → provision/deploy/verify, and the wave continues to T → V → L → N.

## Built this wave (ready to ship)
Turborepo+pnpm monorepo: `apps/api` (NestJS `/health` → HealthResponse), `apps/web` (Vite+React 19 dark app shell — server rail + channel sidebar + main column + ConnectionStateIndicator), `packages/shared` (Zod HealthResponse). Biome clean, 11 tests pass, `.nvmrc`=22, CI workflow ready. Branch: `wave-1-foundation-scaffold` (commits 3530e75 → b51c39c).
