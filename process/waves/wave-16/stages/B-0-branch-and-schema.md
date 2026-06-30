# Wave 16 — B-0 Branch & schema
```yaml
branch: wave-16-create-server-e2e
deps_added: []
env_vars_added: [E2E_FIXTURE_EMAIL, E2E_FIXTURE_PASSWORD]  # GitHub Actions secrets (set via gh; password NEVER committed)
schema_skipped: true
migrations: []
backfill_ran: false
deviations: []
```
- Task 46f16288 → in_progress. No schema (test-infra). CI secrets E2E_FIXTURE_EMAIL/PASSWORD set via `gh secret set` from the gitignored test-accounts.md (verified fixture studyhall-e2e-fixture@example.com). Password never enters the repo.
