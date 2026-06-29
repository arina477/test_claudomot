# Wave 9 — B Backend (commit-per-spec, order 8a→8b→revoke)
- 08ff762f 8a (f7b3bf3): apps/api/src/db/backfill-invite-codes.ts (app-side randomBytes base64url + 23505 retry, WHERE NULL idempotent) + db:backfill script. generateCode exported. NOT pgcrypto/auto-migrate.
- 5331b7d5 8b-backend (ad725a7): findServerDetail returns server.inviteCode (member-gated); shared ServerSummaryWithInvite. +2 tests.
- 863c10ef revoke (9f196a8): POST /invites/:code/revoke (AuthGuard) owner_id||created_by→403 else; revoked=true idempotent; permanent code→404 (not ad-hoc); revoked→preview/join 404 (wave-8 read path). +6 service +4 controller tests.
- 123 api tests.
