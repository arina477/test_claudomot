# Wave 88 — T-4 Integration
Pattern B (active) → EXECUTED in CI. 4 real-Postgres cases added to `dm-encryption.integration.spec.ts` ran GREEN in the #109 `test` job (postgres:16 + DATABASE_URL_TEST): (1) registered key MATCHING → row stored; (2) MISMATCHING → BadRequestException, zero rows persisted; (3) no registered key → send SUCCEEDS (fail-open); (4) **post-rotation T-8** → rotate key A→B (upsert-replace, UNIQUE(user_id)), send with B ACCEPTED (154ms), stale A rejected. Boundary audited: sendMessage inline select + reject/fail-open against real schema. No DB mocking. head-ci-cd confirmed the integration tier ran 30 files (nonzero — no false-green).
```yaml
test_pattern: active
skipped: false
boundaries_audited: ["sendMessage senderKeyRef validation vs user_encryption_keys.public_key", "fail-open no-key", "post-rotation current-key acceptance"]
ci_evidence: ["#109 (d0646058) test job SUCCESS — 4 DM senderKeyRef integration cases green against postgres:16 incl. post-rotation"]
findings: []
```
