# Wave 23 — B-5 Verify

## Action 1 — Lint (auto-fix)
`pnpm lint` (biome 1.9.4) → exit 0 (green from B-4; no further auto-fix needed).

## Action 2 — Unit tests
Initial run surfaced 2 sets of intentional-change fallout (both fixed via specialists, Iron Law):
- **4 api failures** (assignments.service.spec.ts) — tests asserted `can(...,'manage_channels')` for the organizer path; the wave's swap to `manage_assignments` broke the arg assertion. Fixed by backend-developer (a9318ef5e5d6c8e76): updated 4 assertions + 1 title to manage_assignments; negative-path (non-organizer→403) coverage preserved (4 permission-agnostic mockResolvedValue(false) tests intact). → **388 api unit passed**.
- **5 web failures** (assignments.test.tsx) — tests mocked the old owner-only CTA path; the B-3 gate now calls `getMyPermissions`. Fixed by react-specialist (a86442703f1db4280): mocked `api.getMyPermissions` per-test (owner-true for organizer tests, all-false for non-organizer) + **added a new test** asserting a non-owner WITH manage_assignments:true sees the CTA (validates the wave's key behavior directly). → **216 web passed**.

**Final: api unit 21 files/388 passed; web 14 files/216 passed.**

**Integration tier (api vitest.integration.config.ts):** fails locally on `ECONNREFUSED 127.0.0.1:5433` — no local Postgres. This is env-gated, NOT a code regression: CI's test job provisions `postgres:16` (DATABASE_URL_TEST on 5432) and runs the integration tier authoritatively (verified ci.yml; same as wave-22). Failure is loud (connection refused), not a silent skip → no wave-17-style false-green. Deferred to C-1 CI.

## Action 3 — Build
`pnpm build` (turbo, 3 packages) → exit 0. Web dist + api build clean.

## Action 4 — Dev-server smoke
Full endpoint smoke (`GET /servers/:serverId/me/permissions`, CTA gate) requires the app DB (Railway-hosted; no local DB). Deferred to C-2 deploy-verify (which probes the new route 401-not-404 against prod), matching the wave-22 pattern. Build-level smoke passed (Action 3).

```yaml
lint_passed: true
unit_tests_passed: true          # api 388 + web 216 (unit tiers)
build_passed: true
dev_smoke_passed: deferred-to-C2 # app DB Railway-hosted; endpoint smoke at deploy-verify
integration_tier: ci-gated       # ECONNREFUSED locally (no DB); runs at C-1 with provisioned postgres
flakes_documented: []
```

## Exit
Locally-runnable checks green (lint + 604 unit tests + build). Integration + live-smoke CI/C-block-gated (honest, documented). → B-6 Review.
