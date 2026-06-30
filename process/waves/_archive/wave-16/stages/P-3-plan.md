# Wave 16 — P-3 Plan

## Approach

### Architecture / test-harness deltas
**New: authenticated Playwright E2E project (apps/web/e2e/).** The suite today runs only unauthenticated public-route smoke against `E2E_BASE_URL` (live prod default). This wave adds the first *authed* browser flow.

- **Authed-session harness — chosen: a `setup` project + `storageState`** (the canonical Playwright authed pattern; reusable by every future authed E2E, vs a per-test sign-in that each new test would duplicate).
  - `apps/web/e2e/auth.setup.ts` — a setup test that goes to `/login`, fills the verified-fixture email+password, submits, waits (web-first `expect`) for the authenticated app shell (server rail visible), and saves `storageState` to `apps/web/e2e/.auth/fixture.json` (gitignored).
  - `playwright.config.ts` — add a `setup` project (testMatch `**/*.setup.ts`) and make the `chromium` project depend on it + consume `storageState: e2e/.auth/fixture.json`. Keep the existing unauthenticated smoke working — either it runs in a project WITHOUT storageState, or it tolerates an authed session (it tests public routes; an authed session doesn't break `/` and `/login` rendering — but to keep the smoke genuinely unauthenticated, give it its own project with no storageState, and the create-server test the authed project). *Implementer picks the cleanest project split; do not regress the smoke spec.*
  - *Alternative considered:* in-test sign-in per test. Rejected — every future authed E2E would re-sign-in (slow + duplicated); storageState signs in once.
- **Credentials via CI secret (load-bearing):** the verified fixture password lives ONLY in the gitignored `command-center/testing/test-accounts.md` — it is NOT in the repo, so CI cannot read it from disk. The harness reads `E2E_FIXTURE_EMAIL` + `E2E_FIXTURE_PASSWORD` from env (locally exported from the gitignored file; in CI from GitHub Actions secrets). **Orchestrator sets the repo secrets via `gh secret set` from the gitignored file (ops action, rule 6 — these are test-account creds we provisioned, not account-issued).** Never commit the password.
- **Target:** runs against `E2E_BASE_URL` (live prod) like the smoke suite — the verified fixtures are prod fixtures. Created servers use a UNIQUE name per run (`E2E srv <timestamp>`) so prod state doesn't collide/accumulate ambiguously; assertions target the just-created name. (Cleanup-on-prod is best-effort/tolerated — unique names keep runs independent; a teardown that deletes the created server is a nice-to-have if a delete-server affordance exists, else accept accumulation of uniquely-named test servers.)

### Data / API / deps
**None.** No schema, no API, no new dep (@playwright/test exists). Pure test-infra.

### Anti-flake contract (P-0 carry — load-bearing)
- Web-first assertions only (`await expect(locator).toBeVisible()` etc.) — Playwright auto-waits; **NO `page.waitForTimeout`/sleeps.**
- Deterministic: unique server name per run; no reliance on a clean/seeded DB; target the created server specifically by its unique name.
- **No retry-masking:** the test must pass on the FIRST attempt deterministically. The config's `retries: 1` (CI) is a pre-existing safety net, not a flake licence — the new test must not depend on it. (Optionally set `retries: 0` for the authed project to surface flakiness, implementer's call; minimum bar = first-attempt-green.)
- Selectors: prefer role/text/`getByRole`/`getByLabel` over brittle CSS (mirror smoke.spec's `getByRole`).

## Plan

### File-level steps (single B-stage band — test-infra)
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| .github (repo secrets) | set | `gh secret set E2E_FIXTURE_EMAIL` + `E2E_FIXTURE_PASSWORD` from the gitignored test-accounts.md | orchestrator (ops) | first |
| apps/web/e2e/auth.setup.ts | create | sign in as fixture via /login, save storageState to e2e/.auth/fixture.json | test-automator | after secrets |
| apps/web/playwright.config.ts | modify | add `setup` project + authed `chromium` project (depends on setup, storageState); keep smoke unauthenticated | test-automator | with setup |
| apps/web/e2e/create-server.spec.ts | create | authed: open create-server modal → create unique-named server → assert server in rail + #general in sidebar (web-first, anti-flake) | test-automator | after config |
| apps/web/.gitignore (or root) | modify | gitignore `e2e/.auth/` (storageState holds a live session — never commit) | test-automator | with setup |
| .github/workflows/ci.yml | modify | pass `E2E_FIXTURE_EMAIL`/`E2E_FIXTURE_PASSWORD` secrets into the `e2e` job env | test-automator | last |

### Specialist routing (validated vs AGENTS.md)
- `test-automator` (Playwright E2E + CI test wiring) — present.
- Secret-setting is an orchestrator ops action (gh CLI), not a sub-agent.

### Parallelization
Serial chain (each depends on the prior): secrets → auth.setup + config → create-server.spec → ci.yml env. Single specialist; no parallel batch.

### B-block note
- B-0: branch + NO schema (test-infra). B-1 Contracts SKIP (no contract surface). B-2 Backend SKIP (no backend). B-3 Frontend = the E2E test authoring (test code lives under apps/web but is not product frontend; treat as the implementation stage). B-4 wiring = config + CI env. B-5 verify = run the authed E2E locally/green + the existing suite untouched. B-6 head-builder gate.
- D-block SKIPS (design_gap_flag false).

### Self-consistency sweep
1. Every AC → step: authed E2E spec (AC1,4), authed harness/storageState (AC2), anti-flake (AC3 → web-first/no-sleep/no-retry-mask), CI-green + smoke-untouched (AC5 → ci.yml + project split). ✓
2. Specialist on each step. ✓ 3. No file in two batches. ✓ 4. design_gap false → D skips. ✓ 5. Trade-off named (storageState vs per-test). ✓ 6. No data/API contracts (test-only). ✓ 7. No new dep. ✓ 8. SDK n/a. ✓
