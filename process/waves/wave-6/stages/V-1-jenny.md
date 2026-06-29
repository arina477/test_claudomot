# V-1 Semantic-Spec Verification (jenny) — Wave 6: CI compiled-artifact boot probe

**Verdict: APPROVE**

Spec: `tasks.da242f6b-bce7-49c7-a7cc-69ca4849fc6e` (spec-id `wave-6-ci-boot-probe`, single-spec).
Deployed: `main @ 75e7d9d` ("ci: pre-merge compiled-artifact boot probe (#wave-6) (#16)").
Verified against the LIVE merged state — `git show origin/main:.github/workflows/ci.yml`, `gh api .../branches/main/protection`, and the merge-commit CI run (id 28378682349).

## Per-AC findings

### AC1 — boots COMPILED artifact + probes /health pre-merge — MATCHES
`boot-probe` job runs on `pull_request` + `push` to main (workflow `on:` block). It `pnpm build`s then starts the prod entrypoint verbatim: `node apps/api/dist/src/main.js`. It then polls `/health`. This is the literal prod vehicle (matches Railway `node dist/src/main.js`), so module-load/init-order/shared-pkg-resolution crashes surface here.
- Concretely catches the wave-5 class: `apps/api/src/version.ts` uses a runtime `require` of `package.json` with a try-both-paths strategy; `health.controller.ts` returns `version: API_VERSION`. A MODULE_NOT_FOUND on the dist path would crash boot and the probe would fail — exactly the class source-level lint/typecheck/test/build cannot see.

### AC2 — throwaway Postgres + minimal/dummy env to reach /health 200 without external services — MATCHES
- `services.postgres` = `postgres:16` with pg_isready healthcheck (same shape as the `test` job).
- Env supplied to the started process: `DATABASE_URL`→throwaway PG; `SUPERTOKENS_CONNECTION_URI: http://localhost:3567` + `SUPERTOKENS_API_KEY: dummy-key-probe` (dummy placeholders — `/health` is unauth and the SDK connects lazily); plus `PORT`, `API_ORIGIN`, `WEB_ORIGIN`. No external service is contacted. The real PG is provided so a connection-time crash would also be caught (per the spec edge-case).

### AC3 — bounded-timeout poll → assert 200 → FAIL build on crash → stop cleanly — MATCHES
- Bounded retry loop: `for i in $(seq 1 30)` with `sleep 1` (≈30s cap, within the spec's ~30-45s).
- Asserts success via `curl -fsS .../health | grep -q '"status":"ok"'`. The live `/health` returns `{"status":"ok","service":"studyhall-api","version":...}`, so the grep matches the real contract. `curl -fsS` also fails on non-2xx.
- On never-healthy: dumps `/tmp/api-boot.log` and `exit 1` → build fails. Hung boot fails fast at the cap.
- Clean stop: a separate `if: always()` step `pkill -f 'apps/api/dist/src/main.js' || true`.

### AC4 — REQUIRED status check (branch protection) blocks merge on boot crash — MATCHES
`gh api repos/.../branches/main/protection/required_status_checks` returns `strict: true` and `contexts: [lint, typecheck, test, build, secret-scan, boot-probe]` — 6 contexts, `boot-probe` present. A boot crash fails the required check and blocks merge. This is the load-bearing point of the wave (prevent the wave-5-class prod outage).

### Scope / gold-plating — MATCHES (clean)
- Merge-commit diff (`75e7d9d^..75e7d9d`) touches exactly ONE non-process file: `.github/workflows/ci.yml`. Zero changes under `apps/` or `packages/` — no app code change, as the spec's `contracts.api` mandates ("no code change to the app").
- Exactly one new CI job (`boot-probe`); chose `node dist` over docker+HEALTHCHECK per the edge-case guidance ("prefer node dist; don't over-build"). No creep, no gold-plating.

### Faithful to wave-5 L-2 lesson — MATCHES
The job enforces BUILD rule 1 (boot the prod artifact before merge) at the pipeline level, exactly as the spec body states. It closes the recurring "CI-green-but-crashes-at-prod-first-boot" class that source-level checks + deployed-URL e2e structurally miss.

## Live evidence
- Merge-commit CI run 28378682349 @ 75e7d9d: conclusion `success`; `boot-probe` job conclusion `success` (all 7 jobs green).
- Branch protection: 6 required contexts incl `boot-probe`, strict mode on.
- `/health` source confirms `status: 'ok'` literal → probe grep is correct, not a false-positive matcher.

## Issues
None (Critical/High/Medium/Low: 0/0/0/0).

**APPROVE** — all 4 ACs MATCH the live merged state; scope is exactly one CI-only job with no app code change.
