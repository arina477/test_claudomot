# Wave 87 — P-3 Plan

## Approach

### Action 1 — Architecture deltas
**Module:** `ServersService` (`apps/api/src/servers/servers.service.ts`) — membership-insert path only.

- **What changes:** the two server-join methods (`joinPublicServer`, `joinViaInvite`) currently insert `server_members` with `{ server_id, user_id }` (role_id → NULL). Add a single private resolver `resolveDefaultRoleId(tx, serverId)` and set `role_id` from it on both inserts, so a new member gets the server's existing `is_default=true` role at write time.
- **Why this approach (vs alternatives):**
  - *Alt A — leave NULL, keep relying on `backfill-roles.ts`:* rejected — the backfill must then run forever; new joins perpetually re-create the rows it sweeps. This wave exists to close that drift.
  - *Alt B — a DB default / trigger assigning role_id:* rejected — a per-server default role id is not a static column default (it's a per-server lookup); a trigger adds an opaque write-path side effect and cross-cuts Drizzle's model. A resolver in the service is explicit and testable.
  - *Alt C — factor a fully shared `insertMembership(tx,…)` helper:* rejected as over-abstraction — `joinViaInvite` needs `.returning()` + downstream invite-use accounting, `joinPublicServer` does not. Sharing only the *role resolution* (not the insert call) keeps each call site's `onConflictDoNothing`/`returning` shape intact. Chosen: shared **resolver**, per-site insert.
- **Failure-domain impact:** none new. Resolver is a plain `SELECT` inside the already-open transaction; no service-boundary crossing, no permission-check change (RBAC already treats NULL ≡ default-Member). Transaction scope unchanged. `onConflictDoNothing` means re-joins skip the insert → existing members' role_id untouched (AC4 holds by construction).

### Action 2 — Data model
**No schema change. No migration.** `server_members.role_id` already exists (nullable text FK → `roles.id`). No index / FK / constraint change. (Noted latent gap, out of scope: no unique index on `(server_id, is_default)` — the resolver defends with `LIMIT 1`, does not add the constraint.)

### Action 3 — API contracts (concrete)
No API surface change. Both join endpoints keep their request + response shapes:
- `joinPublicServer` → `{ serverId }` (unchanged); auth: authed user; 404 (no server) / 403 (private) before insert.
- `joinViaInvite` → `{ serverId }` (unchanged); auth: authed user; 404 (invalid/expired invite) before insert; ad-hoc invite use-count accounting unchanged.
Idempotency: `onConflictDoNothing` unchanged — re-join is a success no-op.

### Action 4 — Dependency list
None. No new deps, no SDK.

## Plan

### Action 5 — File-level steps

**B-1 Schema:** skip (no schema change).
**B-2 Contracts:** skip (`role_id` already on the `server_members` insert type; no types/Zod change).

**B-3 Backend** (`node-specialist`):
| Path | Op | What changes | Order |
|---|---|---|---|
| `apps/api/src/servers/servers.service.ts` | modify | Add private `resolveDefaultRoleId(tx, serverId): Promise<string \| null>` → `select id from roles where server_id=$serverId and is_default=true order by position asc, id asc limit 1`; return `row?.id ?? null`. In `joinPublicServer` (:708-711) and `joinViaInvite` (:751-755): `const roleId = await this.resolveDefaultRoleId(tx, serverId)` then set `role_id: roleId` on the existing `.values({...}).onConflictDoNothing()[.returning()]` — preserve each call site's onConflict/returning shape. | single file, serial |

**B-4 Frontend:** skip (backend-only; `design_gap_flag=false`).

**B-5 Verify** — tests (`node-specialist`; same executor keeps test+impl coherent):
| Path | Op | What changes | Order |
|---|---|---|---|
| `apps/api/src/servers/servers.service.spec.ts` | modify | Update the existing `role_id: null` join expectation (~:177) to expect the default role id. Add/extend unit cases for AC1 (public join → default role id), AC2 (invite join, ad-hoc + permanent → default role id), AC3 (server with no is_default role → role_id NULL, no throw), AC4 (re-join by existing member → existing role_id unchanged), AC5 (invite use-count increment + public/private gating unchanged). | after B-3 |

### Action 6 — Specialist routing (validated against AGENTS.md)
- `node-specialist` — NestJS backend service + spec. ✓ present in `command-center/AGENTS.md` ("node / nestjs work").

### Action 7 — Parallelization map
Fully serial: B-3 (`servers.service.ts`) → B-5 (`servers.service.spec.ts`). Single file each; no parallel batches. `/simplify` runs on `servers.service.ts` after B-3.

### Action 8 — Post-write consistency sweep
1. AC→step: AC1/AC2 → B-3 role_id set on both inserts + B-5 assertions; AC3 → resolver null-fallback + B-5 no-throw case; AC4 → onConflictDoNothing (unchanged) + B-5 re-join case; AC5 → B-5 accounting/gating assertions. ✓ all map.
2. Every step has a specialist (`node-specialist`). ✓
3. No file in multiple parallel batches (serial). ✓
4. `design_gap_flag: false` referenced. ✓
5. Architecture deltas carry explicit alternative trade-offs (A/B/C). ✓
6. Data + API contracts concrete, no TBD (no schema/API change stated explicitly). ✓
7. No new deps. ✓
8. No external SDK. ✓ (n/a)

Sweep clean — ready for P-4.
