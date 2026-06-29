# Wave 9 — V-1 Summary
- **Karen APPROVE** — 7/7 VERIFIED live+code: revoke 401/preview 404/server-detail 401/health 200; revokeInvite owner||created_by→403 no-IDOR idempotent; revoked→404 preview+join (validateInviteActive); 8a app-side randomBytes (no pgcrypto) idempotent+23505, db:backfill wired, ran clean (0 rows); 8b NO mint-on-open (permanent default from member-gated findServerDetail.inviteCode); 197 tests. No gold-plating.
- **jenny APPROVE** — 3/3 blocks MATCH live; scope clean (RBAC wave-10; rotation deferred d058283d todo/unclaimed; no pull-forward). 0 gaps.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: [rotation-deferred-d058283d, session-scoped-list, authed-e2e-gap, L-FLAG: CI-PRINCIPLES 4-rule bypass]
```
