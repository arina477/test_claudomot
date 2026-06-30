# V-1 — jenny (semantic spec verification) — wave-16

**Task:** 46f16288-4c13-4d8c-ad68-6925d1f51d84 — Browser E2E for the authed create-server flow (single-spec, test-infra)
**Merged:** main @ 6982ffe (PR#28). Verified at HEAD 3235f83 (T-9 journey regen).
**Verdict: APPROVE** — every AC MATCHES; no drift. Test intent (authed browser E2E closing the wave-7 carry) faithfully implemented.

---

## Per-AC

**AC1 — sign-in fixture → /app → open create-server modal → create uniquely-named server → assert in rail AND #general in sidebar — MATCHES.**
`create-server.spec.ts` does exactly the spec'd flow: `goto('/app')` + assert `Server rail` nav (L26-28) → click `Add a server` → assert `create-server-modal` (L31-35) → fill `#server-name-input` + click `Create` → assert modal hidden (L38-42) → assert new server icon visible in rail by exact accessible name (L46-47) → select it (L51) → assert `general` in `channel-sidebar` (L58-59). Both the rail assertion AND the #general sidebar assertion are present. Server-name aria-label / desktop-vs-mobile sidebar disambiguation handled.

**AC2 — genuinely AUTHENTICATED session via authed-session harness using verified-fixture creds — MATCHES.**
storageState approach: `auth.setup.ts` signs in ONCE via the real `/login` UI with `E2E_FIXTURE_EMAIL`/`E2E_FIXTURE_PASSWORD`, waits web-first for the AppShell server rail (proves live SuperTokens session, L45-47), guards on `/app` URL (L50), then persists httpOnly cookies to `e2e/.auth/fixture.json` (L53). `playwright.config.ts` `chromium-authed` project depends on `setup` and consumes the storageState (L37-47). The spec starts already-signed-in — not faked. Creds sourced from gitignored test-accounts.md locally / CI secrets.

**AC3 — anti-flake (web-first, no sleeps, no retry-masking) — MATCHES.**
Web-first `expect(locator).toBeVisible()/toBeHidden()` throughout; auto-waiting only. No `waitForTimeout`/sleeps anywhere (setup uses an explicit `timeout` on a web-first assertion for prod cold-start — legitimate, not a sleep). No retry-masking: comment L18 states it must pass on first attempt; config `retries: CI?1:0` (L17) is a standard CI flake buffer, not a correctness crutch, and setup fails loud on missing creds / failed sign-in (no silent skip). Deterministic fixture state via unique name.

**AC4 — unique server name per run — MATCHES.**
`const serverName = \`E2E ${Date.now()}\`` (L23); all rail/select assertions target that exact name (`exact: true`, L46). No clean-DB assumption — explicitly noted for shared prod state.

**AC5 — runs green in CI + does NOT weaken/skip the unauthenticated smoke spec — MATCHES.**
CI `e2e` job (ci.yml L119-136) installs chromium and runs the full Playwright suite against live prod, with fixture creds from repo secrets; journey map records 4/4 green vs prod (PR#28). The smoke spec is untouched (still 2 shallow public-route checks) and isolated in its own `chromium-smoke` project — `testMatch: /smoke\.spec\.ts/`, **no storageState, no `setup` dependency** (config L32-36) — so it still runs UNAUTHENTICATED. The authed project `testIgnore: /smoke\.spec\.ts/` (L41) keeps smoke out of the authed lane. Smoke is neither weakened nor skipped.

---

## Scope / intent checks

- **Single happy-path authed E2E, no edge-case ballooning — MATCHES.** One test, one happy path. Empty-name / API-failure / max-servers explicitly deferred (spec edge-cases + journey map). No real-PG tier / PG-rollback built (correctly out of scope).
- **Does NOT touch product code — MATCHES.** Changes are confined to `apps/web/e2e/` (new spec + setup), `playwright.config.ts`, ci.yml e2e job, .gitignore (`e2e/.auth/`), and journey-map annotation. No app/src/API/schema/migration change.
- **Closes wave-7 carry + journey-map E2E-covered — MATCHES.** Spec preamble + journey map confirm this is the first authed browser test, closing the long-carried "no authed-browser e2e on create-server" gap. Journey map (v wave-16, L80 + L213) now marks create-server `✅ E2E-covered (wave-16)`. `e2e/.auth/` is gitignored (live session cookie never committed) — verified.
- **Test-infra wave, does NOT advance/claim an M3 feature — MATCHES.** Pure test coverage of the already-LIVE M2 create-server flow; no feature work, no M3 advance.

---

## DRIFTS
None blocking. Observations (non-blocking, already recorded as wave-16 carries, NOT V-1 findings against this spec):
- Broad `chromium-authed` `testMatch: /.*\.spec\.ts/` (minus smoke) — any future authed spec auto-joins; fine for now (M-1 carry).
- Prod test-server accumulation (no teardown until `DELETE /servers/:id` ships) — spec explicitly tolerates this via unique naming (M-3 carry; spec edge-case "tolerated").

**APPROVE — implementation matches task intent with no spec drift.**
