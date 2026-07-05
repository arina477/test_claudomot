# T-4 — Integration (wave-53) — Pattern A (CI-verified)

- **C-1 evidence:** CI `test` job (run 28758318294) ran the real-Postgres integration suite against a `postgres:16` service container (`studyhall_test`, `DATABASE_URL_TEST`) → **`Test Files 18 passed (18)` / `Tests 144 passed (144)`**. This is the coverage that could not run locally at B-5 (no local PG), now authoritatively green on CI.
- **Regression scope:** the wave changed the study-room WS gateway (error-handling), which is unit-tested in-memory (no DB integration test targets it). The 18 integration suites (servers, dm-candidates, presence, moderation, study-timer, invite-rotate, malformed-uuid-params, etc.) are the REGRESSION guard — all green → the fix introduced no DB/service integration regression. `assertMember`'s `server_members` query is unchanged (the fix only prevents malformed ids reaching it).
- **Coverage note:** no NEW integration test needed — the fix is a WS parse-layer + catch-layer change, fully unit-covered; there is no real-Postgres path for the study-room gateway.

```yaml
mask_mode_signoff: PASS
signoff_note: "18/18 real-Postgres integration files green on CI (postgres:16); no integration regression from the WS fix"
test_pattern: ci-verified
evidence:
  - "C-1 test job (integration): run 28758318294 — Test Files 18 passed (18) / Tests 144 passed (144) on postgres:16"
findings: []
```
