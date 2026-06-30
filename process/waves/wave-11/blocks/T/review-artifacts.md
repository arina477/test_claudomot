# Wave 11 — T-block review artifacts (light — ops/no-app-code)
**Block:** T · **Wave topic:** verified prod fixture · **Gate:** T-9 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| T-1 Static | done | CI lint/typecheck green (PR#22) |
| T-2 Unit | skip | no app code changed |
| T-3 Contract | skip | no contract change |
| T-4 Integration | done | fixture VERIFIED live (POST /servers 201 at provision; 401 boundary) |
| T-5 E2E | done | CI playwright green (PR#22) |
| T-6 Layout | skip | no UI |
| T-7 Perf | skip | n/a |
| T-8 Security | done | secret-grep clean (test-accounts gitignored; script reads key at runtime; user-id false-positive allowlisted scoped) |
| T-9 Journey | active | gate (no new user-facing route — test-infra only) |
## Context: load-bearing T-8 (secrets). Fixture works (201 proof). Secret-scan false-green caught at C; user-id allowlist scoped (configured-not-bypassed). No app behavior change.
