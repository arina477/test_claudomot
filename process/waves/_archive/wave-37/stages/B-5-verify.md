# Wave 37 — B-5 Verify
Lint: exit 0 (7 pre-existing warnings). Unit tests: api + web green (web 330). Build: 3/3. New notifications-authz.spec.ts (6 real-PG tests) skips locally (no local test DB on 5433, same as all integration specs) — runs in CI via test:ci DATABASE_URL_TEST passthrough (T-4 verifies executed). Build validates no runtime break.
