# Wave 28 — P-3 Plan (single-spec: invite-code rotate)

## Approach section

### Architecture deltas
- **ServersModule (server):** add one service method + one route. `ServersService.rotateInviteCode(serverId, callerId)` regenerates `servers.invite_code` and returns the new code; `ServersController` exposes `POST /servers/:id/invite-code/rotate` (`@UseGuards(AuthGuard)`). No module boundary crossed, no new provider, no transaction-scope change. The write is a single-row `UPDATE servers SET invite_code=$new WHERE id=$serverId` inside the existing 23505-retry pattern.
  - **Authz approach:** inline in-service owner-ONLY check (`server.owner_id !== callerId → ForbiddenException`), mirroring `revokeInvite` (servers.service.ts:354) but dropping the OR-creator branch (the permanent code has no creator). **Alternative considered:** a reusable `ServerOwnerGuard` guard class — REJECTED: it's a cross-cutting refactor of the existing inline-authz convention (revoke/other routes gate in-service), out of scope for a single-endpoint security fix; introducing a guard here fragments the authz style. Inline keeps parity with the shipped pattern.
  - **Invalidation approach:** regenerate the CSPRNG code in place (overwrite the UNIQUE column). **Alternative considered:** add a `revoked`/`rotated_at` flag on the permanent code — REJECTED: requires a schema change + join-path check on every invite resolution, for no benefit; overwriting the single source (`servers.invite_code`, resolved at servers.service.ts:401-402) makes the old link stop resolving immediately (getInvitePreview/joinViaInvite → 404). Matches "rotate" semantics.
  - **Failure-domain impact:** no service-boundary crossing; expands no transaction; the ONLY permission-check change is the new owner-only gate on the new route. Ad-hoc `invites` table untouched (separate table).

### Data model
**No schema change, no migration.** Writes the existing `servers.invite_code` column (UNIQUE, `db/schema/servers.ts:20`) in place. No column/table/index/FK/constraint delta, no backfill.

### API contracts (concrete)
- **`POST /servers/:id/invite-code/rotate`**
  - Request: path param `:id` (serverId); caller identity from `SessionAugmentedRequest` (SuperTokens); **no request body**.
  - Response 200: `{ invite_code: string }` (the new permanent code).
  - Auth model: `@UseGuards(AuthGuard)` (authenticated + email-verified) **+ in-service owner-ONLY** authorization.
  - Errors: 401 unauth (AuthGuard), 403 unverified (AuthGuard) | non-owner (in-service), 404 server-not-found, 409 retry-exhausted (astronomically rare; mirrors createInvite's ConflictException).
  - Idempotency/retry: not idempotent (each call mints a new code); internal 23505-collision retry ≤5 attempts.

### Dependency list
None. No new third-party dep, no SDK. Pure reuse of `randomBytes` (Node crypto, already imported) via `generateCode()`.

### SDK pre-build
N/A (no external SDK).

## Plan section

### File-level steps by B-stage

**B-0 Branch & schema:** branch only (`wave-28-invite-rotate` from main `c3dc6ca`). No schema/migration (no DB change).

**B-1 Contracts:** SKIP (inline response DTO `{ invite_code }` on the controller; no shared `@studyhall/shared` type / Zod / API-contract change — no client consumer this wave).

**B-2 Backend:**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 1 | apps/api/src/servers/servers.service.ts | modify | add `rotateInviteCode(serverId, callerId)`: load server → 404 if absent; owner-ONLY (`owner_id !== callerId → Forbidden`); regenerate `invite_code` via `generateCode()` in a 23505-retry loop (MAX_RETRIES=5, mirror createInvite:286-317); return `{ invite_code }` | node-specialist |
| 2 | apps/api/src/servers/servers.controller.ts | modify | add `@Post(':id/invite-code/rotate')` `@UseGuards(AuthGuard)` handler → `rotateInviteCode(id, req.session.getUserId())` → 200 `{ invite_code }` | node-specialist |
| 3 | apps/api/src/servers/servers.service.spec.ts + servers.controller.spec.ts | modify | unit specs: regenerated code differs; owner-only → Forbidden for non-owner; server-not-found → NotFound; 23505 retry path; controller wires session userId + returns new code | node-specialist |

**B-3 Frontend:** SKIP (design_gap_flag=false; no UI — client regenerate-link button is keep-OUT/demand-gated per P-0).

**B-4 Wiring:** repo typecheck + `biome check` (BUILD rule 7) + build.

**B-5 Verify:** api unit + build. **Integration proof (real PG, authored here, runs in integration tier + T-4):**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 4 | apps/api/test/integration/invite-code-rotate.spec.ts | create | real-PG (wave-17 pg-harness): seed server+owner+member; rotate as owner → 200 new code; assert GET/join on OLD permanent code → 404 (AC2); GET/join on NEW code → 200 (AC3); rotate as non-owner member → 403 (AC4); rotate non-existent server → 404 (AC5). Uses `describe.skipIf(!DATABASE_URL_TEST)` + './pg-harness' first-import (CF-2). | node-specialist |

**B-6 Review:** head-builder gate + /review. Commit-per-spec: all commits cite `Refs: d058283d`.

### Specialist routing (validated against AGENTS.md)
- `node-specialist` — Node.js/NestJS APIs/services/runtime (in AGENTS.md; the servers module is NestJS). Chosen over the generic `backend-developer` (AGENTS.md marks it "replaced by domain-specific agents per stack") and over `supertokens-integration` (no new auth wiring — AuthGuard is reused as-is, not modified).

### Parallelization
Serial chain within B-2: step 1 (service method) → step 2 (controller route, depends on the method) → step 3 (unit specs, depend on both). Step 4 (integration test) can start once step 1+2 land. Single specialist (node-specialist) across the wave → effectively serial; no cross-file parallel batch (all in apps/api/src/servers + one test file).

### Action 8 — self-consistency sweep
- AC1 (owner rotate → new code) → steps 1-2 + unit 3 + integration 4. AC2 (old link dead) → integration 4. AC3 (new link works) → integration 4. AC4 (non-owner 403) → steps 1 + unit 3 + integration 4. AC5 (404 server) → steps 1 + unit 3 + integration 4. AC6 (401/403 AuthGuard) → step 2 (guard) + unit 3. AC7 (CSPRNG + 23505 retry) → step 1 + unit 3. Every AC maps to ≥1 step.
- Every step has a specialist (node-specialist). No file in two parallel batches. design_gap_flag=false referenced. Architecture deltas carry explicit alternative trade-offs (guard-class; flag-column). Data/API contracts concrete (no TBD). No new deps. No SDK. Clean.

## Exit
Single-spec plan: one service method + one owner-only route + unit + integration proof, all node-specialist, all in ServersModule. No schema/contract/frontend/dep/SDK. design_gap_flag=false → skip D. Security surface (owner-authz + CSPRNG invite secret) → P-4 security-scope-tightened gate + T-8. → P-4 Gate.
