# Wave 8 — B-block review artifacts (multi-spec, commit-per-spec)
**Block:** B · **Wave topic:** M2 invites/join · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0 | done | branch wave-8-m2-invites-join; claimed 4 |
| B-0..B-2 | done | backend (110 tests); carry-forwards A+B done |
| B-3 | done | frontend (68 web tests) 8697d42 |
| B-5 | done | full suite green; pushed |
| B-6 | done | head-builder APPROVED (attempt 2, atomic max_uses fix 92cc0f3) |
## BINDING CARRY-FORWARDS (P-4): (A) invites schema/service/controller INSIDE ServersModule (apps/api/src/servers/), NOT standalone (arch #3). (B) re-join NO double-increment: INSERT server_members RETURNING first → increment uses ONLY on genuinely-new row, one txn. Security: CSPRNG randomBytes(16) base64url codes; GET /invites/:code PUBLIC (no @UseGuards) + minimal {server:{id,name,memberCount}}; POST /invites/:code/join AuthGuard (verified); atomic max_uses (conditional UPDATE...WHERE uses<max_uses RETURNING). servers.invite_code backfill in migration. Bare paths. Designs: design/invite-join.html (8 states) + invite-share.html. PUSH branch after each major stage.
