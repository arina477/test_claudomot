# Wave 14 — B-5 Verify
```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: deferred-to-CI-boot-probe
flakes_documented:
  - "server-roles.test 'renders loading skeleton' — flaky (timing); passed on re-run (known wave-10 flake). 131/131 web on re-run."
```
- Lint: 0 errors (6 warnings ok) across new presence surfaces.
- Build: all packages SUCCESS (web vite build green after fixing the runtime value-import from shared CJS dist).
- Tests: 220 api + 131 web = 351 pass.
- B-5 fix-forward cycles (all routed to react-specialist as B-3 defects, re-verified):
  1. lint: inert <li tabIndex> removed; unnecessary Fragment removed.
  2. self-exclusion: dead uuid-vs-username client filter removed (server-side getTypers(excludeUserId) enforces).
  3. BUILD-BREAK: presenceSocket imported PRESENCE_EVENTS as runtime value from CJS shared dist (rollup can't resolve named value export — all other web files import shared type-only). Fixed: type-only import + local const of literal event strings (matches messagingSocket convention).
  4. lint: typing-indicator <div role=status> → <output> (semantic).
- Dev-smoke: presence is realtime (two-client); deferred to CI boot-probe + C-2 live verify (consistent with wave-12/13 realtime waves).
