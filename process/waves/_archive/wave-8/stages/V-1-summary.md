# Wave 8 — V-1 Summary
- **Karen APPROVE** — all security/correctness claims VERIFIED live+code: 401/404/health, carry-forward A (InvitesController in ServersModule), B (increment only on new member), atomic max_uses (conditional UPDATE+throw-rollback, TOCTOU fixed 92cc0f3), CSPRNG 128-bit, public preview minimal, 180 tests. 2 NEW findings: 8a (Medium) migration 0004 has NO backfill UPDATE for servers.invite_code (AC said backfill) — but 0 prod servers + new servers self-gen at creation → moot in prod; 8b (Low) InviteShareModal mints ad-hoc on EVERY open instead of the permanent code (AC: "permanent by default") → permanent code dead in UI + accumulates rows.
- **jenny APPROVE** — 4/4 blocks MATCH live; both carry-forwards honored; scope clean (RBAC/per-role/kick-ban/settings/realtime deferred; M2 NOT fully closed). Same 8b Low drift.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: [8a-no-backfill-Medium(moot-in-prod), 8b-share-modal-not-permanent-default-Low, T9: no-verified-fixture, revoked-no-endpoint, no-/invite-e2e]
```
