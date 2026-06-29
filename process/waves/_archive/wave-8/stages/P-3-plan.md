# Wave 8 — P-3 Plan (M2 invites/join, multi-spec)

## Data model (B-0, database-administrator/postgres-pro) — one migration
- `invites` (id uuid pk, server_id uuid→servers cascade, code text UNIQUE notNull, created_by text→users.id, max_uses int null, uses int notNull default 0, expires_at timestamptz null, revoked boolean notNull default false, created_at default now())
- ALTER `servers` ADD `invite_code` text UNIQUE — BACKFILL existing servers with a generated CSPRNG code in the migration (data migration step).
- Drizzle schema in apps/api/src/db/schema/; generate migration. (Local apply may skip — no local PG; applies on deploy via drizzle-kit migrate. C-2 MUST apply it to prod.)

## Backend (B-2, backend-developer) — InvitesModule (apps/api/src/invites/)
- code gen: `crypto.randomBytes(16).toString('base64url')` (~22 chars, 128-bit) — a shared util; used for both invites.code + servers.invite_code (set on server-create going forward + backfilled).
- c7443638: invites.service createInvite(serverId, userId, opts) — member-check (403 non-member) → insert CSPRNG code → return. Collision → unique-retry.
- 77e2041a:
  - GET /invites/:code — **PUBLIC (NO @UseGuards — wave-7 uses per-controller guards, so omitting = public; no global guard to exempt)**. Resolve ad-hoc code OR servers.invite_code → minimal {server:{id,name,memberCount}}; invalid/revoked/expired/maxed → 404. NO members/channels.
  - POST /invites/:code/join — @UseGuards(AuthGuard) (verified session). ATOMIC: conditional `UPDATE invites SET uses=uses+1 WHERE code=$ AND NOT revoked AND (max_uses IS NULL OR uses<max_uses) AND (expires_at IS NULL OR expires_at>now()) RETURNING server_id` (ad-hoc) OR resolve servers.invite_code (permanent, no use-limit); then `INSERT server_members ON CONFLICT (server_id,user_id) DO NOTHING` (idempotent re-join). Return {serverId}. No row from the conditional update → 404/410 (invalid/maxed).
- shared: packages/shared/src/invites.ts (InvitePreview, CreateInvite, JoinResult Zod). Build shared FIRST.

## Design (D-block, head-designer) — design_gap_flag TRUE-delta
- Validate/compose design/invite-join.html (exists) for the join page; the invite-create/share modal reuses Modal/Button/Toast (compose, not net-new). D-1 audit → likely verify-and-adopt + the modal delta.

## Frontend (B-3, react-specialist) — apps/web/src/
- invites api client (getInvitePreview, joinInvite, createInvite) — getInvitePreview is PUBLIC (no session needed); join needs session.
- 72fc08ea: route /invite/:code (reachable unauthed → if join needs auth, login then return-to-invite). Preview + Join + states (loading/valid/invalid/already-member/joining/joined) per design/invite-join.html. On join → redirect into the server.
- 54407e1d: invite-create/share modal in the server header/menu → show/copy the invite link (permanent code default), Toast on copy. Reuses primitives.

## Specialists (AGENTS.md ✓): database-administrator/postgres-pro, backend-developer, head-designer, react-specialist.
## Security (T-8 load-bearing): CSPRNG 128-bit non-enumerable codes; public preview minimal; verified-session join; atomic max_uses (conditional UPDATE); idempotent re-join (ON CONFLICT). 
## Sequencing: B-0 schema+backfill → B-1 shared → B-2 backend (commit-per-spec) → [D-block] → B-3 frontend → B-4 → B-5 → B-6. PUSH branch after each major stage (restart-loss lesson). C-2 MUST apply the migration to prod.
