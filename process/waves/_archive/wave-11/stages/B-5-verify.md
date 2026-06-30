# Wave 11 — B-5 Verify
Ops/test-infra wave (no app code). Fixture provisioned + VERIFIED live (POST /servers 201 proof; 401 unauthed boundary holds). Secret-grep CLEAN: test-accounts.md gitignored (NOT in diff); the committed re-verify-fixture.sh reads $ST_API_KEY at runtime from Railway CLI (no hardcoded value; length-only echo) — no literal secret committed. Non-secret artifacts: project.yaml label+email + the script. Branch pushed.
```yaml
secret_grep: clean (no committed secret; test-accounts.md gitignored)
fixture: provisioned + verified (POST /servers 201)
app_code_changed: false
pushed: true
