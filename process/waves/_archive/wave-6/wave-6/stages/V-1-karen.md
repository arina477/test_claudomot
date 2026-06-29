# V-1 Karen — wave-6 source-claim verification (CI boot-probe)

**Verdict: APPROVE**

Scope: SMALL CI-only wave. Verified against LIVE merged state — `main @ 75e7d9d` (PR#16), repo `arina477/test_claudomot`. Evidence gathered from the merged `ci.yml` on `origin/main`, live `gh run` data (run 28378682349 push + 28378572564 PR), live branch-protection API, and the live job log.

---

## Per-claim findings

### Claim 1 — `boot-probe` job exists in merged `ci.yml`, boots the compiled artifact: **VERIFIED**
Read from `origin/main:.github/workflows/ci.yml`. The `boot-probe` job is present and matches every sub-claim:
- Boots the **compiled** artifact: `node apps/api/dist/src/main.js &> /tmp/api-boot.log &` — runs `dist/` output, NOT `tsx`/`ts-node`/`src`. Real artifact.
- Runs `pnpm build` before boot (compiles first).
- Throwaway `postgres:16` service with `pg_isready` healthcheck.
- Dummy env injected (`DATABASE_URL`, `SUPERTOKENS_CONNECTION_URI`, `SUPERTOKENS_API_KEY: dummy-key-probe`, `API_ORIGIN`, `WEB_ORIGIN`, `PORT: '3000'`).
- **Bounded** poll: `for i in $(seq 1 30)` against `/health`, grepping `'"status":"ok"'`, 1s sleeps, `exit 1` after 30s with `cat /tmp/api-boot.log` on failure (crash → fail, logs dumped).
- Cleanup `if: always()` → `pkill -f 'apps/api/dist/src/main.js' || true`.

### Claim 2 — ran GREEN + is a real cold boot (not false-green): **VERIFIED**
- `gh run view 28378682349` (main push): `boot-probe in 54s` = **success**. All 7 jobs green.
- `gh run list` confirms PR run `28378572564` (wave-6-ci-boot-probe, pull_request) = **success**.
- The log is the decisive evidence of a **real cold boot**, not a stubbed pass:
  - `attempt 1` → `curl: (7) Failed to connect to localhost port 3000 after 0 ms: Couldn't connect to server` → `boot-probe: attempt 1 — not ready yet, sleeping 1s`
  - `attempt 2` → `boot-probe: /health returned ok on attempt 2`
  - The connection-refused-then-ok transition proves the process was genuinely starting up and the probe waited for a real `/health` 200 from the booting compiled artifact. A fake/always-green probe would not show attempt-1 refusal. The job also exits 0 immediately on success (exit at attempt 2), so the 54s wall time is dominated by `pnpm install`/`pnpm build`, consistent with a real build-then-boot.

### Claim 3 — `boot-probe` is a required check on `main`: **VERIFIED**
`gh api .../branches/main/protection`: `required_status_checks.contexts` = `["lint","typecheck","test","build","secret-scan","boot-probe"]` — 6 contexts, `boot-probe` included. `strict: true`. `required_approving_review_count: 0`. `enforce_admins.enabled: false` (bot-merge path preserved). All sub-claims match exactly.

Note (non-blocking): the `e2e` job runs in CI but is NOT in the required-contexts list — so a red `e2e` would not block merge. This is pre-existing and outside wave-6 scope (wave-6 added `boot-probe`, which IS required). Flagging for awareness only.

### Claim 4 — CI-only, no app code changed: **VERIFIED**
`git diff --stat 75e7d9d^ 75e7d9d`: the only functional change is `.github/workflows/ci.yml` (+43). Everything else is `process/waves/**` docs and wave-2/wave-5 archive moves (renames, 0 content delta). Zero `apps/` or `packages/` source touched. CI-only confirmed.

### Claim 5 — antipattern scan: **VERIFIED (clean)**
- **Gold-plating: NONE.** One job, single `node dist` boot, no matrix, no multi-OS/multi-node fan-out, no over-instrumentation. Minimal viable boot probe. Appropriate for the stated job (catch artifacts that compile but crash on boot).
- **Claimed-but-fake: NONE.** The probe is provably real per the live log cold-boot signature (claim 2). Not a hardcoded green, not a skipped step, not a `|| true`-swallowed failure on the assertion path (the `|| true` is correctly scoped to the cleanup `pkill` only, not the health assertion).

---

## Summary
All five claims VERIFIED against the live merged state. The boot-probe is real (cold-boot evidenced in the log), green on both the PR and the main push run, wired as a required check with bot-merge preserved, and the wave is genuinely CI-only with no app-code drift. No gold-plating, no false-green. Nothing to rework.

**APPROVE.**
