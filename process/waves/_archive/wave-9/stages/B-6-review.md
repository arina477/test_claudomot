# Wave 9 — B-6 Review (gate) — APPROVE
## Phase 1 — head-builder APPROVED: all 4 P-4 T-8 conditions pass (revoke server-side authz owner_id||created_by, no-IDOR, userId from session; revoked→404 both preview+join [wave-8 validateInviteActive]; 8a app-side CSPRNG backfill idempotent WHERE NULL + 23505 retry, db:backfill script not boot-wired; 8b no mint-on-open, permanent-default from member-gated findServerDetail.inviteCode + null fallback). 196 tests. Commit-per-spec OK. Scope held (no RBAC; rotation deferred d058283d; session-scoped list honest gap).
## Phase 2 — code-reviewer PASS + code-quality-pragmatist PASS; secret-grep clean. Non-blocking L-2 nits (revoke-404-as-transient, UI nits, optional backfill unit spec).
```yaml
phase1_head_builder_verdict: APPROVED
final_verdict: APPROVE
