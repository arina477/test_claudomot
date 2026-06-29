# Wave 6 — P-3 Plan
## Approach (devops-engineer)
- Add a `boot-probe` job to .github/workflows/ci.yml: checkout@v5, pnpm@v6, setup-node@v5, install, `pnpm build`; spin a `postgres:16` service (mirror the `test` job); start `node apps/api/dist/src/main.js` in background with env: DATABASE_URL→the throwaway PG, SUPERTOKENS_CONNECTION_URI→dummy (e.g. http://localhost:3567 unreachable is fine — lazy), NODE_ENV=production, PORT=3000, plus any other env main.ts reads at boot (inspect apps/api/src/main.ts + config). Poll `curl -fsS localhost:3000/health` in a retry loop (~30 tries × 1s); on 200 → pass + kill the process; on timeout/crash → print logs + exit 1.
- Optional tiny `scripts/wait-for-health.sh` (or inline bash). Prefer `node dist` vehicle (matches Railway). 
- Make `boot-probe` a REQUIRED status check: add it to the branch-protection required contexts (gh api, like the existing 5) so a boot crash blocks merge.
## Files: .github/workflows/ci.yml (+ maybe a small script). No app code. Specialist: devops-engineer (AGENTS.md ✓).
## Verify: the job must FAIL on a deliberately-broken boot (sanity) + PASS on main. Don't break the existing 6 jobs.
## Self-consistency: AC→job step. Inspect main.ts boot env before locking the env list (P-4 Karen will check).
