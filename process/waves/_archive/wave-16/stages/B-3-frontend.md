# Wave 16 — B-3 (test authoring — via ui-comprehensive-tester, karen swap for absent test-automator)
```yaml
skipped: false
specialists_spawned: [ui-comprehensive-tester]   # rule-11 swap: test-automator absent from AGENTS.md
files_implemented:
  - apps/web/e2e/auth.setup.ts (sign in as fixture via /login, save storageState)
  - apps/web/e2e/create-server.spec.ts (authed: create unique-named server, assert rail + #general)
  - apps/web/playwright.config.ts (3-project split: setup / chromium-smoke unauthenticated / chromium-authed storageState)
  - apps/web/.gitignore (e2e/.auth, test-results, playwright-report)
  - .github/workflows/ci.yml (E2E_FIXTURE_EMAIL/PASSWORD secrets → e2e job env)
deviations:
  - "ui-comprehensive-tester spawned in place of test-automator (absent from AGENTS.md) — karen P-4 swap, rule 11"
  - "#general assertion scoped to channel-sidebar.first() (AppShell mounts desktop+mobile sidebars) — fixed against real DOM"
  - "new server not auto-selected on create → test clicks it to select (surfaces #general) — matches AppShell/ServerContext"
  - "local --with-deps dropped (sandbox no root); CI runs --with-deps (ubuntu sudo) — no file change"
simplify_applied: true
```
- Selectors read from component source: login #email/#password/'Sign in'; rail nav aria-label='Server rail' + 'Add a server' button; modal data-testid='create-server-modal' + #server-name-input + 'Create'; new server by exact aria-label name; #general via channel-sidebar getByText('general').
- Anti-flake: web-first expect only, NO sleeps, unique name `E2E ${Date.now()}`, retries:0 local. Fixture creds from env (CI secrets); never committed; storageState gitignored.
- LOCAL RUN: 4/4 green against live prod (setup + 2 smoke + create-server), twice (deterministic).
