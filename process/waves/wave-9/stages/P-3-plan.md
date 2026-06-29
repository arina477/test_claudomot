# Wave 9 — P-3 Plan (M2 invite-completion, multi-spec; build order 8a→8b→revoke)

## 8a backfill (08ff762f) — B-0, backend-developer
- **FIX (P-4 REWORK): pgcrypto is NOT installed → gen_random_bytes unavailable.** Use the wave-8 APP-SIDE generator `randomBytes(16).toString('base64url')` (servers.service.ts:25) in a committed BACKFILL SCRIPT (a TS one-off, e.g. apps/api/src/db/backfill-invite-codes.ts, run at C-2 alongside db:migrate via a `pnpm --filter @studyhall/api db:backfill` step) that: SELECTs servers WHERE invite_code IS NULL, per-row generates a CSPRNG code, UPDATEs with the existing 23505 per-row collision-retry (servers.service.ts:203-233 pattern). Idempotent (WHERE NULL → re-run no-op), true per-row collision-safety. NOT auto-migrate-on-boot. (0 prod servers → effectively moot but must be correct + re-runnable.) Verify: no NULL invite_code after. (Alt: CREATE EXTENSION pgcrypto + SQL gen — rejected: bulk UPDATE can't per-row retry collisions; app-side stays on the locked pattern.)

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
