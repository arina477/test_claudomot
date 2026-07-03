# Wave 41 — P-3 Plan (multi-spec)

## Approach section

### Architecture deltas
**Extend the shipped RBAC + messaging — no new subsystems.**
- **RBAC (spec 6cf06f99):** add one boolean permission `moderate_members` to the per-server `roles` model (wave-10 boolean-column pattern) + `packages/shared/src/rbac.ts` (RolePermissionsSchema + create/update schemas). `can(userId, serverId, 'moderate_members')` resolves it via the existing role-lookup path (no engine change — it already reads boolean columns). "Educator role" = a role granting moderate_members (+ optionally the existing manage_assignments). NO role-type abstraction (P-0 REFRAME). Assignments authz UNCHANGED (already can()-gated on manage_assignments). Alternative rejected: a separate `educator_roles` table / role-type enum — invents taxonomy the model lacks + would fragment the single-roles-table RBAC.
- **Moderation (spec 6ddddc2d):**
  - *delete-any-message*: widen the message-delete authorization from author-only to `author OR can(moderate_members)`; reuse the shipped `message:deleted` Socket.IO fan-out unchanged (cheap). Alternative rejected: a separate moderation-delete endpoint — duplicates the delete + fan-out path.
  - *member timeout*: add `server_members.muted_until timestamptz NULL`; a moderation endpoint sets it (bounded duration, moderate_members-gated); the channel-message SEND path adds a mute check (`muted_until > now()` → refuse). Server-side, time-based expiry (checked at send — no cron). Alternative rejected: a separate `mutes` table — a single nullable column on the existing membership row is sufficient + simpler.
  - *rank guard*: a moderator cannot delete/timeout a server owner or a manage_server/manage_roles holder above them (compare effective rank).
- **Failure-domain:** send-path gains one membership read for muted_until (already loaded in the membership check — no extra query). Delete authz widens (additive). No transaction-scope change.

### Data model
- `roles.moderate_members boolean NOT NULL DEFAULT false` (migration; existing rows default false — no behavior change).
- `server_members.muted_until timestamptz NULL` (migration; NULL = not muted).
- Both additive, online, no backfill.

### API contracts (concrete)
- Role create/update endpoints: request/response carry `moderate_members` (Zod schema extended). Auth: manage_roles (existing).
- `DELETE` message (existing path): authz widened to `author OR can(moderate_members)`. Emits existing `message:deleted`.
- `POST /servers/:serverId/members/:userId/timeout {durationMinutes}` (NEW): moderate_members-gated + rank guard → sets muted_until. (Or a moderation controller route — B-block picks the exact path matching existing member-management routes.)
- message-send (Socket.IO + REST): checks muted_until → refuse (403/error event) if muted.

### Dependency list / SDK
None new. Reuses Drizzle, the shipped RBAC `can()`, Socket.IO message events, the membership model.

## Plan section

### File-level steps (grouped by B-stage)
**B-0/B-1 Schema+Contracts**
| Path | Op | What | Specialist |
|---|---|---|---|
| apps/api/src/db/schema/servers.ts | modify | roles +moderate_members; server_members +muted_until | node-specialist |
| apps/api/drizzle migration | create | ADD COLUMN both (drizzle-kit generate) | node-specialist |
| packages/shared/src/rbac.ts | modify | RolePermissionsSchema + create/update schemas +moderate_members | node-specialist |

**B-2 Backend**
| Path | Op | What | Specialist |
|---|---|---|---|
| apps/api/src/rbac/ (can + role service) | modify | resolve moderate_members (additive to boolean set) | node-specialist |
| apps/api/src/messaging/ (message delete) | modify | widen delete authz to author OR can(moderate_members); reuse message:deleted fan-out | node-specialist |
| apps/api/src/rbac/channel-message.guard.ts (send path) | modify | mute check: refuse if muted_until > now() | node-specialist |
| apps/api/src/ (moderation/member timeout endpoint) | create | POST timeout {durationMinutes}, moderate_members-gated + rank guard → set muted_until | node-specialist |
| apps/api/**/*.spec.ts + test/integration | create/modify | real-PG authz+behavior: grant/revoke round-trip, delete-any+fanout, non-mod 403, timeout blocks+expires, rank guard | node-specialist |

**B-3 Frontend** (D-block designs the timeout UI first)
| Path | Op | What | Specialist |
|---|---|---|---|
| apps/web/src/shell/ServerRolesPage.tsx | modify | add moderate_members permission toggle (existing toggle pattern) | react-specialist |
| apps/web/src/shell/MessageList.tsx | modify | delete-any affordance on hover-actions (visible w/ moderate_members) | react-specialist |
| apps/web/src/shell/ (member-timeout UI) | create | moderation control + bounded-duration selector + muted indicator (per D-block design) | react-specialist |

### Specialist routing (validated against AGENTS.md)
- **node-specialist** — schema, RBAC, moderation backend, tests. **react-specialist** — the 3 frontend surfaces. Both in catalog. D-block (head-designer) for the member-timeout UI.

### Parallelization map
- B-1 schema/contracts serial (schema → generate → shared). B-2 backend: delete-any ∥ timeout-endpoint ∥ send-gate (independent files) then tests. B-3 frontend after B-2 emits the endpoints + after D-3 adopts the timeout design.

### Self-consistency sweep
1. Each AC → step (role perm→schema+rbac+ServerRolesPage; assignments→no-op existing; delete-any→messaging; timeout→muted_until+send-gate+endpoint; rank guard→moderation service; tests→spec files; UI→B-3+D-block). ✅
2. Every step has a specialist. ✅  3. No file in 2 batches. ✅  4. design_gap_flag=true referenced (D-block). ✅
5. Alternatives named + rejected (role-type table, separate delete endpoint, mutes table). ✅  6. Contracts concrete. ✅  7. No new deps. ✅  8. No new SDK. ✅
Sweep clean. HOLD-SCOPE: only these 2 specs; no scheduling/study-group/DM/search fold-ins.
