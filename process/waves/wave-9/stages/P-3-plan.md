# Wave 9 — P-3 Plan (M2 invite-completion, multi-spec; build order 8a→8b→revoke)

## 8a backfill (08ff762f) — B-0, backend-developer/database-administrator
- A committed drizzle migration: `UPDATE servers SET invite_code = translate(encode(gen_random_bytes(16),'base64'),'+/=','-_') WHERE invite_code IS NULL` (pgcrypto gen_random_bytes = CSPRNG; translate→base64url). Idempotent (WHERE NULL). Collision: UNIQUE(invite_code) guards; for the rare bulk-collision do a guarded loop OR (0 prod rows) accept + document the retry note. NOT auto-migrate-on-boot (committed SQL, applied at C-2 via db:migrate). Verify: no NULL invite_code after.

## 8b share-modal-permanent (5331b7d5) — B-2 (tiny) + B-3, backend-developer + react-specialist
- Backend: expose servers.invite_code to MEMBERS in server detail (GET /servers/:id already returns the server; add invite_code field for members) OR a small GET /servers/:id/invite-code. (Member-gated.)
- Frontend: InviteShareModal reads the permanent invite_code from server detail → shows /invite/<permanent-code> as the default link. Does NOT call createInvite on open (stops ad-hoc accumulation). "Generate limited invite" optional secondary. NULL-code graceful fallback. Copy+Toast retained.

## revoke (863c10ef) — B-2 + B-3, backend-developer + react-specialist
- Backend (ServersModule, arch #3): POST /invites/:code/revoke (AuthGuard) — authorize: caller == servers.owner_id OR == invites.created_by (else 403). Set invites.revoked=true. Idempotent. The wave-8 preview/join read path already filters `revoked` → revoked invite 404 on both (confirm + test). (Permanent servers.invite_code is NOT an ad-hoc invite — revoke applies to invites-table rows.)
- Frontend: a revoke affordance for ad-hoc invites (in the share modal's limited-invites list OR a manage view) — confirm + Toast + honest revoked state.

## Design (D-block, head-designer) — design_gap_flag TRUE-delta
- Validate design/invite-share.html for: default = permanent link (8b); + a revoke affordance / limited-invites list. Compose deltas only.

## Specialists (AGENTS.md ✓): backend-developer, database-administrator/postgres-pro, head-designer, react-specialist.
## Security (T-8): revoke authz (owner||creator, server-side); revoked→404 preview+join; backfill idempotent/collision-safe.
## Sequencing: B-0 (8a migration) → B-1 (shared, if new types) → B-2 backend (8b invite_code-expose + revoke endpoint, commit-per-spec) → [D-block] → B-3 frontend (8b modal + revoke UI) → B-4/5/6. PUSH after each stage (BUILD rule 2). C-2 applies 8a migration to prod.
