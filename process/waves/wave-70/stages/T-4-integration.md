# T-4 — Integration (wave-70) [Pattern A — CI-verified]
CI `test:ci` integration tier (postgres:16 + DATABASE_URL_TEST) ran `blocks.integration.spec.ts` — all 19 cases (block CRUD; self-block 400; exists 404; idempotent double-block; unblock 204 no-op; no-IDOR GET own-list; isBlockedBetween bidirectional; and the DM HIDE at ALL 5 seams bidirectionally — createConversation/sendMessage/getDmCandidates/listConversations/listMessages) against REAL Postgres (NOT mocked). Migration 0026 (user_blocks) applied to the CI test DB by the harness. THE authoritative integration gate; T-8 re-proves live on prod.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["blocks.integration.spec.ts 19 cases green vs postgres:16 in run 28838467304 (block authz + 5 DM HIDE seams bidirectional)"]
findings: []
```
