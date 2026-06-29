# B-6 Review — Gate Verdict (wave-6 CI boot-probe)

**Block:** B (Build) — wave-6 `wave-6-ci-boot-probe`
**Scope:** SMALL, CI-only single-spec wave. One job added to `.github/workflows/ci.yml` (commit `8d0c339`). No app code change. Single-spec → Action 6 (commit-discipline) SKIPPED per dispatch.
**Gate:** head-builder, fresh spawn.

---

## Verdict: APPROVED

Hand off to C-block (C-1 PR & CI). The live PR CI run is the final proof that `boot-probe` goes green; the job is correct as authored.

---

## Evidence walked (load-bearing artifacts, not inference)

**Job correctness — the whole point: boots the COMPILED artifact, not src.**
- Start cmd: `node apps/api/dist/src/main.js` (ci.yml:94). Not `tsx`/src. PASS.
- Path verified against build reality: `nest-cli.json sourceRoot=src` + `tsconfig outDir=dist` → compiled entry is exactly `dist/src/main.js`. Confirmed the artifact exists locally at `apps/api/dist/src/main.js`. The start path AND the `pkill -f 'apps/api/dist/src/main.js'` cleanup pattern both match this exact path. PASS — this is precisely the wave-5 MODULE_NOT_FOUND class of gap a tsx-based probe would have masked.

**Postgres service mirrors `test` job.** Identical `postgres:16`, same env block (`POSTGRES_USER/PASSWORD/DB=test/test/studyhall_test`), same `pg_isready` health options, same `5432:5432` mapping (ci.yml:79-85 vs 38-44). PASS.

**Bounded poll — won't hang CI.** `for i in $(seq 1 30)` × `sleep 1` = 30s cap, plus outer `timeout-minutes: 10`. Two independent bounds. PASS.

**Dumps logs on failure.** API started with `&> /tmp/api-boot.log`; on timeout the loop runs `cat /tmp/api-boot.log` before `exit 1` (ci.yml:112-114). A boot crash (e.g. MODULE_NOT_FOUND) is visible in the job output. PASS.

**Cleanup `if: always()`.** `pkill -f 'apps/api/dist/src/main.js' || true` (ci.yml:115-117). Runs regardless of poll outcome; `|| true` keeps the verdict owned by the poll step, not the cleanup. PASS.

**Fails the build on a boot crash + passes on healthy boot.**
- FAIL path: `curl -fsS` (`-f` → non-zero on non-2xx) + grep for `"status":"ok"`; if never satisfied in 30 attempts → `exit 1`. Build fails. PASS.
- PASS path: first attempt that returns the body matching `"status":"ok"` → `exit 0`. Verified against `health.controller.ts` — `@Get('health')` returns `{ status: 'ok', service: 'studyhall-api', version }`, exactly the literal the grep asserts. PASS.

**Env envelope.**
- `PORT: '3000'` present (P-4 Karen's load-bearing note). `main.ts:123` reads `process.env.PORT ?? 3000` and listens; poll targets `localhost:3000`. Consistent. PASS.
- Dummy `SUPERTOKENS_CONNECTION_URI` / `SUPERTOKENS_API_KEY` won't false-fail: SuperTokens init is lazy (P-4-confirmed) — the dummy URI is never dialed during boot/`/health`, and `/health` is `@SkipThrottle()`-exempt so the poll cannot be rate-limited. PASS.
- `DATABASE_URL` is a throwaway pointing at the service Postgres; `API_ORIGIN`/`WEB_ORIGIN` set for CORS. PASS.

**Existing 6 jobs intact.** Diff is purely additive — `lint`/`typecheck`/`test`/`build`/`secret-scan`/`e2e` are byte-for-byte unchanged (the `e2e` job follows the new block at ci.yml:119, untouched). PASS.

**Branch protection (queried live).** `contexts: [lint, typecheck, test, build, secret-scan, boot-probe]` (6, `boot-probe` added as required), `strict: true`, `approvals: 0`, `enforce_admins: false`. Matches the claimed posture exactly — bot merge flow preserved. PASS.

**Not gold-plated.** One job, single runner, `node dist` directly, no matrix, no Redis/queue/multi-replica. Scale-discipline held. PASS.

---

## Phase 2 — focused secret/diff pass (gstack /review is interactive; focused pass suffices for a CI-yml-only change)

- Secret-grep over the diff: the only credential-shaped token is the throwaway Postgres service password `test`, identical to the pre-existing `test` job — not a real secret.
- `dummy-key-probe` is an intentional placeholder; lazy SuperTokens init means it is never used.
- No `secrets.*` exfiltration, no `pull_request_target`, no untrusted-input shell interpolation. `permissions: contents: read` (file-level) unchanged.
- Verdict: clean.

---

## Anti-pattern sweep (B-block failure modes)
- Boots-src-not-dist — NOT present (boots `dist/src/main.js`). The named wave-5 failure class is exactly what this probe catches.
- Unbounded/hang — NOT present (30s loop + 10m job cap).
- False-fail on good build — NOT present (lazy ST init, SkipThrottle, correct `"status":"ok"` literal).
- Doesn't-fail-on-crash — NOT present (`-f` curl + `exit 1` on timeout, logs dumped).
- Scale gold-plating — NOT present.

## Failed checks
None.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers: {}   # single-spec CI-only wave; focused head diff pass + live branch-protection query in lieu of interactive reviewer pool
  failed_checks: []
  rationale: >
    The boot-probe job is correct on every load-bearing dimension: it boots the COMPILED
    artifact at the verified path apps/api/dist/src/main.js (not tsx/src — the wave-5
    MODULE_NOT_FOUND class this probe exists to catch), mirrors the test job's postgres:16
    service, polls /health with a bounded 30s loop under a 10m job cap (cannot hang CI),
    dumps /tmp/api-boot.log on timeout so a boot crash is visible, cleans up with
    pkill if:always, fails the build on a never-healthy boot (exit 1) and passes on the
    exact "status":"ok" literal the health controller returns. Env envelope carries PORT
    (load-bearing) and the dummy SuperTokens vars are safe because ST init is lazy and
    /health is SkipThrottle-exempt. The six existing jobs are untouched; branch protection
    queried live confirms boot-probe added as a 6th required check with strict=true,
    0 approvals, enforce_admins=false (bot merge flow preserved). Not gold-plated — one
    node-dist job, no matrix. Secret pass clean (only the throwaway test Postgres password).
    Single-spec so Action 6 commit-discipline is SKIP per dispatch.
  next_action: PROCEED_TO_C-1
```
