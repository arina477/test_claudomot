# B-6 Phase-2 Review — wave-16 (authed create-server E2E + harness)

**Scope:** `git diff main...wave-16-create-server-e2e` — TEST-INFRA only (no product code).
**Files reviewed:** `apps/web/e2e/auth.setup.ts`, `apps/web/e2e/create-server.spec.ts`,
`apps/web/playwright.config.ts`, `apps/web/.gitignore`, `.github/workflows/ci.yml`, `biome.json`.
**Mode:** READ-ONLY. **Verdict input for B-6 gate:** see severity buckets below.

---

## Critical
**None.**

Credential-leak surface checked end-to-end and is clean:
- `apps/web/.gitignore:2` ignores `e2e/.auth/` (the live-session storageState); `git check-ignore`
  confirms `apps/web/e2e/.auth/fixture.json` is ignored, and `git ls-files` shows no `.auth` /
  `fixture.json` / `test-accounts.md` is tracked.
- **No artifact upload anywhere** — `grep` across `.github/workflows/` finds zero
  `actions/upload-artifact` / `store_artifacts` steps. The storageState and `test-results/`
  (which holds `screenshot: 'only-on-failure'` captures) are never exfiltrated from the runner.
- **No `pull_request_target`** — workflow triggers are `pull_request` + `push` only
  (`ci.yml:3-7`), so secrets are not exposed to fork PR code in an elevated context.
- Credentials are env-only (`auth.setup.ts:31-32`), never logged. The thrown error
  (`auth.setup.ts:35-40`) prints variable *names*, never values. `password` is `.fill()`-ed,
  not echoed.
- The test is **not** an always-pass: `auth.setup.ts` asserts the authed server-rail nav AND
  `toHaveURL(/\/app\b/)`; `create-server.spec.ts` asserts a uniquely-named icon + `#general`.
  A failed sign-in throws → `setup` project fails → `chromium-authed` dependents do not run
  (Playwright `dependencies` hard-skip on setup failure), so there is no silent green.

---

## High
**None blocking.** One item to confirm operationally (not a code defect):

- **H-1 (operational, confirm-only) — fork PRs will fail the authed suite, by design but
  un-guarded.** `secrets.E2E_FIXTURE_EMAIL/PASSWORD` (`ci.yml:133-135`) are empty for PRs from
  forks. `auth.setup.ts:34` then throws → `setup` fails → `chromium-authed` is skipped →
  **the `e2e` job goes red on every fork PR.** For a solo/internal repo (PRs from branches on
  the same repo, which is this project's model) secrets ARE available and this never fires, so
  it is not breakage today. If external contributions are ever accepted this becomes a
  guaranteed red check. Recommended (non-blocking) follow-up: gate the `setup`/`chromium-authed`
  projects (or the env block) on secret presence, or split CI so forks run only
  `chromium-smoke`. Not a B-6 blocker — file as tech-debt.

---

## Medium

- **M-1 — `chromium-authed` `testMatch` is broad; `auth.setup.ts` is excluded only by
  extension luck.** `playwright.config.ts:40-41` selects `*.spec.ts` minus `smoke.spec.ts`.
  `auth.setup.ts` is `.setup.ts` (not `.spec.ts`) so it is correctly NOT picked up by the authed
  project — good. But any *future* `*.spec.ts` automatically joins the authed project and runs
  with the fixture session. That is the intended default, just note it: a new unauth test must be
  named to match `smoke.spec.ts`'s ignore or the ignore glob widened. Low-risk but worth a
  one-line comment in the config. Not blocking.

- **M-2 — `storageState` path is config-relative; correct here, fragile if `testDir` moves.**
  `playwright.config.ts:45` uses `'e2e/.auth/fixture.json'` and `auth.setup.ts:14` writes the
  same literal. Playwright resolves `storageState` relative to the config file dir
  (`apps/web/`), and the setup runs with cwd `apps/web/` in CI (`pnpm --filter @studyhall/web
  exec`), so both resolve to `apps/web/e2e/.auth/fixture.json` consistently local + CI. Correct
  today; the duplicated string literal is the only smell — a shared const would prevent
  path-drift between writer and reader. Not blocking.

- **M-3 — hardcoded prod base URL + 20s/30s timeouts couple the suite to prod cold-start.**
  `playwright.config.ts:20` defaults `baseURL` to the live Railway URL; `auth.setup.ts:48,52`
  use 20s waits and global `timeout: 30_000` (`config:16`). Against shared *prod* this is a
  deliberate trade (see "depends on prod state" below). The unique-name strategy
  (`create-server.spec.ts:24` `E2E ${Date.now()}`) correctly avoids DB-collision, so the suite
  does not assume a clean DB — good anti-flake. Residual risk is prod latency / outage flaking
  the run, mitigated by `retries: 1` in CI (`config:17`). Acceptable for test-infra; note that
  running E2E that *creates real servers* against production accumulates throwaway `E2E <ts>`
  servers in the prod DB over time — recommend a follow-up cleanup task or a dedicated test env.
  Not a B-6 blocker.

---

## Low

- **L-1 — `create-server.spec.ts:55` relies on undocumented DOM ordering of the two
  `channel-sidebar` mounts.** It scopes to `.first()` because AppShell renders the sidebar twice
  (desktop inline + mobile drawer) and the desktop one is first in the DOM. The comment documents
  this, and at the default desktop viewport it is the visible instance, so the assertion is
  sound. Flagged only because it leans on render order rather than a viewport/visibility filter;
  if AppShell's mount order ever flips, this silently targets the hidden drawer.
  `toBeVisible()` would then fail loudly (not false-pass), so risk is low.

- **L-2 — comment in `auth.setup.ts:24` says the name input "is focused"; the test does not
  assert focus.** `create-server.spec.ts:38` `.fill('#server-name-input')` works regardless of
  focus, so this is a stale/aspirational comment only. Cosmetic.

- **L-3 — biome.json: the diff is clean — ONLY artifact ignores + a whitespace reformat.**
  Verified line-by-line: `organizeImports` was collapsed-to-expanded object form (semantically
  identical, no rule change), and three ignore globs added
  (`**/e2e/.auth/**`, `**/test-results/**`, `**/playwright-report/**`, `biome.json:55-57`).
  **No lint rule, severity, or `files`/`formatter` behavior changed** beyond ignoring generated
  Playwright artifacts. Clean.

- **L-4 — `apps/web/.gitignore` is new and scoped to the web app; root `.gitignore` has no
  e2e/.auth entry.** Confirmed the per-package ignore fully covers the sensitive paths
  (`git check-ignore` passes for all three). No action needed; just noting the protection lives
  in the package-level file, not root.

---

## Selector / harness verification (evidence the test is real, not always-pass)

All test selectors were cross-checked against live app source:
- `auth.setup.ts` `#email` / `#password` → `apps/web/src/pages/LoginPage.tsx:86,98`. ✅
- `Server rail` nav → `apps/web/src/shell/ServerRail.tsx:101` (`aria-label="Server rail"`). ✅
- `Add a server` button → `ServerRail.tsx:197`. ✅
- `create-server-modal` testid / `#server-name-input` →
  `apps/web/src/shell/CreateServerModal.tsx:199,290`. ✅
- Server icon accessible name = full server name → `ServerRail.tsx:58` `aria-label={label}`,
  `label={s.name}` (`ServerRail.tsx:182`), so `getByRole('button',{name:serverName,exact:true})`
  in `create-server.spec.ts:48` targets the real icon. ✅
- `channel-sidebar` testid → `apps/web/src/shell/ChannelSidebar.tsx:180`. ✅

Anti-flake contract holds: web-first `expect(locator)` assertions throughout, **zero
`waitForTimeout`/sleeps** in either test file, unique per-run name, no clean-DB assumption,
smoke project stays unauthenticated (no `storageState`, no `setup` dependency — `config:31-36`).

---

## B-6 disposition
**No Critical or High blockers.** H-1 (fork-PR red) is design-correct for this repo's
same-repo-PR model and recommended as a follow-up tech-debt item, not a rework gate.
Medium/Low items are advisory. The harness correctly fails-loud on missing creds and
hard-skips dependents on setup failure, the live session is gitignored and never
artifact-uploaded, and biome carries no hidden config change. **Recommend B-6 PASS.**
