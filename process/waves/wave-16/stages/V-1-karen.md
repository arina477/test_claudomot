# V-1 — Karen source-claim verification (wave-16)

**Wave:** 16 — authed create-server browser E2E + storageState harness (test-infra, single-spec).
**Verified against:** merged `main` @ PR#28 (`6982ffe`). Deliverable IS a test.
**Verdict: APPROVE** — the E2E is genuinely real, selectors match the live components, it ran green 4/4 in CI against live prod, and no fixture credential is committed. Zero blocking findings.

---

## Per-claim findings

### Claim 1 — Files exist on main + 3-project config split → VERIFIED
- `apps/web/e2e/auth.setup.ts` and `apps/web/e2e/create-server.spec.ts` both present on merged `main`.
- `apps/web/playwright.config.ts:31-58` defines exactly three projects: `setup` (testMatch `.setup.ts`), `chromium-smoke` (testMatch `smoke.spec.ts`, no storageState → stays unauthenticated), `chromium-authed` (testIgnore `smoke.spec.ts` + testMatch `.spec.ts`, `dependencies: ['setup']`, `storageState: e2e/.auth/fixture.json`). Smoke isolation preserved (AC5 "does not weaken/skip the existing smoke spec").

### Claim 2 — E2E is REAL, not coverage-theater (THE check) → VERIFIED
The test drives a real authenticated flow end-to-end against the live deployment; every selector resolves against a real live component:
- **Genuine sign-in:** `auth.setup.ts` navigates `/login`, fills `#email`/`#password`, clicks `Sign In`, and gates on the authed app shell (`getByRole('navigation', {name:'Server rail'})` + `toHaveURL(/\/app\b/)`) before persisting `storageState`. Fails loud on missing env (throws) and on failed sign-in (no silent skip) — satisfies the AC edge-case + spec "fails LOUD".
- **Genuine create:** `create-server.spec.ts` clicks `getByRole('button',{name:'Add a server'})` → asserts `getByTestId('create-server-modal')` visible → fills `#server-name-input` → clicks `Create` inside the modal → asserts modal hidden.
- **Genuine asserts** against the just-created server: rail icon by accessible name (`serverRail.getByRole('button',{name: serverName, exact:true})`), then selects it, then asserts `general` in the channel sidebar.
- **Live-component spot-check — all match:**
  - `ServerRail.tsx:197` — `aria-label="Add a server"` on a real `<button type="button">`. ✓
  - `ServerRail.tsx:58` — server icon `<button aria-label={label}>` where `label` = server name → `getByRole('button',{name: serverName})` resolves. ✓
  - `ServerRail.tsx:101` — `aria-label="Server rail"` on the nav → authed-shell gate is real. ✓
  - `CreateServerModal.tsx:199` — `data-testid="create-server-modal"`; `:290` `id="server-name-input"`; `:373-398` submit `<button>` rendering text `Create` (scoped via `modal.getByRole('button',{name:'Create'})`). ✓
  - `ChannelSidebar.tsx:180` — `data-testid="channel-sidebar"`; `:99` channel name rendered as plain text node `{name}` inside a `<span>` (the `#` is a separate glyph icon) → `getByText('general',{exact:true})` matches the visible text, not the aria-label. The `.first()` scoping for the desktop-vs-mobile dual mount is correct and documented. ✓

  Not trivially-true / not always-pass: assertions are web-first `expect(locator).toBeVisible()/toBeHidden()` against specific, real selectors keyed to a unique runtime name. A broken flow (modal never opens, create fails, rail/general absent) fails the test.

### Claim 3 — Ran + passed in CI, not skipped/no-op; secrets wired → VERIFIED
- `.github/workflows/ci.yml:119` defines the `e2e` job; `:123` `E2E_BASE_URL` = live Railway prod URL; `:131` installs Chromium; `:132-136` runs `playwright test` with `E2E_FIXTURE_EMAIL`/`E2E_FIXTURE_PASSWORD` injected from `${{ secrets.* }}` — so the setup project can actually sign in.
- C-1 deliverable (`C-1-pr-ci-merge.md`): run `28437054848` all jobs `success`; e2e job log `Running 4 tests using 2 workers` → `4 passed`; fixture secrets injected + masked (`***`); PR#28 `MERGED` (commit `6982ffe`). Real run, not a skipped/no-op. 4 tests = setup + smoke + authed create-server + (config-derived) — consistent with the green claim.

### Claim 4 — Anti-flake discipline → VERIFIED
- `grep waitForTimeout|sleep|setTimeout` across `apps/web/e2e/` → **zero** real calls (only the doc-comment line `* - NO page.waitForTimeout / sleeps.`). No arbitrary sleeps.
- Web-first assertions only (`expect(locator).toBeVisible/toBeHidden/toHaveURL`); Playwright auto-waits.
- Unique name per run: `E2E ${Date.now()}` → no collision, no clean-DB reliance; assertions target it specifically (`exact: true`).
- Retry discipline: config `retries: CI ? 1 : 0`; spec comment commits to passing on first attempt (does not lean on the retry to mask flake). Acceptable — a single CI retry is standard and not failure-masking here.

### Claim 5 — SECURITY: no committed credential; storageState gitignored → VERIFIED
- `command-center/testing/test-accounts.md` is NOT git-tracked (`git ls-files` miss) — fixture creds stay gitignored.
- No literal fixture password anywhere in the merged tree: only `secrets.E2E_FIXTURE_PASSWORD` (ci.yml) and `process.env.E2E_FIXTURE_PASSWORD` (auth.setup.ts). The only `password` hits in committed e2e are DOM selectors (`#password`, `input[type="password"]` in smoke) — not secrets.
- `apps/web/.gitignore:2` `e2e/.auth/` → storageState `fixture.json` (httpOnly SuperTokens session cookies) never committed.
- `biome.json:55` `**/e2e/.auth/**` ignored (lint hygiene), consistent.

### Claim 6 — Antipatterns → CLEAN
- **Claimed-but-fake:** NO. The test passes because the flow really works, not because it asserts nothing (Claim 2).
- **Gold-plating:** NO. Happy-path only, as specified; empty-name validation explicitly deferred per spec edge-cases. Correctly scoped for a light test-infra wave.

---

## Summary
| Claim | Status |
|---|---|
| 1 Files + 3-project config | VERIFIED |
| 2 E2E genuinely real (THE check) | VERIFIED |
| 3 Ran green 4/4 in CI + secrets wired | VERIFIED |
| 4 Anti-flake (no sleeps, web-first, unique name) | VERIFIED |
| 5 No committed creds + storageState gitignored | VERIFIED |
| 6 Antipatterns (fake / gold-plating) | CLEAN |

**VERDICT: APPROVE.** All three load-bearing checks (genuinely real + ran green in CI + creds not committed) pass. 0 blocking, 0 non-blocking findings.
