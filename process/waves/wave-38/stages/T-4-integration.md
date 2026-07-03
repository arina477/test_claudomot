# Wave 38 — T-4 Integration (Pattern A — CI-verified)
- CI ran `avatar-render.spec.ts` against REAL Postgres (DATABASE_URL_TEST set in CI) — PASSED. Asserts: confirm persists avatar_key + stable avatar_url; GET /users/:id/avatar → 302 when avatar_key set, 404 when null. Migration 0017 (avatar_key) applied in CI's test DB.
- Schema+service integration verified end-to-end at the DB layer.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job green: avatar-render.spec.ts real-PG integration passed"]
findings: []
```
