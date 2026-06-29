# Wave 8 — B-0/B-1/B-2 Backend (commit-per-spec)
- B-0 schema (e9a2a1e): invites table (code unique, max_uses, uses, expires_at, revoked) + servers.invite_code unique. Migration 0004_gigantic_saracen.sql (applies on deploy; C-2 applies + backfills).
- B-1 shared (0973a0c): invites.ts (InvitePreview/CreateInvite/InviteResponse/JoinResult), built to dist.
- c7443638 invite-backend (9e5b06d): CARRY-FORWARD A — InvitesController IN ServersModule (no standalone). CSPRNG randomBytes(16) base64url (~128-bit), 23505 retry. createInvite member-gated (403). servers.invite_code set on create.
- 77e2041a preview+join (1595a08): GET /invites/:code PUBLIC (no @UseGuards) minimal {server:{id,name,memberCount}}, 404 invalid. POST /invites/:code/join AuthGuard(verified). CARRY-FORWARD B — txn: INSERT server_members ON CONFLICT RETURNING → increment uses ONLY on new row (re-join no-op, test passes). atomic max_uses (validate-in-txn). 401/403/404.
- 110 api tests (createInvite-gate, CSPRNG, preview-minimal, max_uses-concurrency [distinct users], re-join-no-increment, unauthed).
