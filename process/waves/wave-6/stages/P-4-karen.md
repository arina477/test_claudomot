# P-4 Phase 2 — Karen source-claim verification (wave-6 CI boot-probe)

**Verdict: APPROVE**

Pre-build plan. Every load-bearing source claim in the spec + P-3 plan checks out against live code. The probe targets the real prod artifact, boots it for real, and cannot false-pass or false-fail on a good/bad build. No gold-plating. The recurring outage class is genuine. One scope boundary is correctly documented (not a defect).

---

## Per-claim findings

### Claim 1 — prod entrypoint IS the compiled artifact `apps/api/dist/src/main.js` → VERIFIED
- `apps/api/package.json:9` — `"start": "node dist/src/main.js"` (run from `apps/api/` ⇒ `apps/api/dist/src/main.js`).
- `apps/api/Dockerfile:23` — `CMD ["node", "apps/api/dist/src/main.js"]` (run from `/app` repo-root WORKDIR ⇒ same file).
- Both prod launch paths resolve to the identical compiled file. Spec AC-1 and P-3-plan.md:3 (`node apps/api/dist/src/main.js`) target the real artifact. Booting `dist` (not `tsx`/`nest start`) is what makes the probe catch the compiled-output class (version.ts require, shared-pkg resolution) — VERIFIED.

### Claim 2 — boot probe reaches /health 200 on good build (no false-fail) + genuinely boots compiled artifact (no false-pass) → VERIFIED
Sub-claims:
- **supertokens.init only registers config, no socket at init** → VERIFIED. `supertokens.config.ts:17-100` is a single `supertokens.init({...})` call: appInfo + connectionURI string + recipe `.init()` registrations. No `.fetch`/connect call in the function body. `connectionURI` defaults to `http://localhost:3567` (`:26`) and is merely stored. A dummy/unreachable `SUPERTOKENS_CONNECTION_URI` is held as a string, not dialed at init — boot will not crash. VERIFIED.
- **/health is unauth + invokes no SDK/DB** → VERIFIED. `health.controller.ts:9-19`: `@Controller()` + `@Get('health')` + `@SkipThrottle()`. Returns a static object whose only dynamic field is `API_VERSION` (`:4,17`) — the exact wave-5 crash surface (version.ts require). No `verifySession`, no `db`, no supertokens call. The endpoint exercises the precise module-load path that broke in prod. VERIFIED — and this is the no-false-pass guarantee: a version.ts/shared-pkg resolution failure crashes the compiled boot before /health can 200.
- **db pool is lazy** → VERIFIED. `db/index.ts:5-35`: `_pool`/`_db` created on first access via `getPool()`/`getDb()` behind a `Proxy` (`:31`); the comment at `:18-19` states importing without `DATABASE_URL` does not throw. /health touches no db, so the pool is never resolved during the probe — no false-fail from a missing live DB. (Spec still provisions throwaway PG per edge-case so a real connection-time crash is *also* catchable on demand.) VERIFIED.
- **init-order is real (bootstrap calls initSuperTokens before NestFactory.create)** → confirmed at `main.ts:82-84`; `bootstrap().catch(... process.exit(1))` at `main.ts:129-132` means any boot throw exits non-zero — exactly the signal the probe's retry-loop/exit-code check keys on. VERIFIED.

### Claim 3 — ci.yml `test` job already spins postgres:16 (pattern to mirror) → VERIFIED
- `.github/workflows/ci.yml:35-46` — `test` job has `services.postgres.image: postgres:16`, env block, `ports: ['5432:5432']`, and `--health-cmd pg_isready` options. P-3-plan.md:3 mirrors this exactly for the throwaway PG. VERIFIED.

### Claim 4 — devops-engineer in AGENTS.md → VERIFIED
- `command-center/AGENTS.md:85` — `devops-engineer | Monorepo tooling (Turborepo/pnpm/Biome), CI, Railway deploy wiring | infra / CI / monorepo tooling | (pre-built — VoltAgent)`. Correct specialist for a CI-job-only wave. VERIFIED.

### Claim 5 — antipatterns → VERIFIED (clean)
- **Gold-plating: none.** P-3-plan.md:3-5 scopes ONE `boot-probe` job (build → throwaway PG → `node dist` → bounded curl poll → kill). No node-version matrix, no full prod-parity harness, no docker-HEALTHCHECK build (spec edge-case explicitly prefers `node dist`, defers docker "only if it better matches prod — don't over-build"). Bounded timeout (~30 tries × 1s) prevents CI hang. Proportionate to a SMALL single-spec wave. VERIFIED.
- **Claimed-but-fake: the outage class is real.** wave-5's `version.ts` require → MODULE_NOT_FOUND is the live crash surface still wired into /health via `API_VERSION` (`health.controller.ts:4,17`). Source-level lint/typecheck/test/build (`ci.yml:13-64`) operate on TS source, not the compiled `dist` boot; the `e2e` job hits a deployed URL (`ci.yml:80`) — structurally *after* a bad deploy, not before merge. The gap the spec closes genuinely exists. VERIFIED.

---

## Gemini flag (dummy-URI relies on lazy-init) — adjudication
NOT a defect. `supertokens.config.ts:17` registers config only; the probe's declared scope is the **boot / module-load** failure class (the recurring prod-outage class), and full SuperTokens connectivity belongs to the deploy/e2e job. Confirmed documented as a scope boundary in spec edge-cases ("If init eagerly connects, point it at a stub or accept the boot reaches past module-load") and P-3-plan.md:3. The brittleness is a *future* SDK-upgrade risk (if supertokens-node ever eager-connects at init), not a current-code defect — appropriate to note, not to block. Concurs with the prompt's framing.

---

## Build-time note for devops-engineer (non-blocking)
- The plan's env list (`main.ts` boot reads) must include `PORT` (`main.ts:123`); `WEB_ORIGIN`/`API_ORIGIN` have safe defaults (`main.ts:97`, `supertokens.config.ts:21-22`), `CROSS_ORIGIN_PROD`/`SUPERTOKENS_API_KEY` are optional. P-3-plan.md:8 already commits to inspecting `main.ts` before locking the env list — keep that step. None of these block the probe reaching /health, so this is a polish note, not a gate condition.

**APPROVE — clear to enter B-block.**
