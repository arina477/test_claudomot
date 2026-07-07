# P-4 Karen — wave-69 (M14 moderation bundle #1, multi-spec)

**Role:** Reality-check the load-bearing reuse claims in the multi-spec + P-3 plan against real code (repo `/home/claudomat/project`, `main`). This wave REUSES not reinvents — every named reuse target must exist for the plan to be buildable.

**Task:** `9f2bb017-fd19-464d-ab2b-c13ed75c04bb` — "Add report substrate + directory-level unlist for public discovery" (3 claimed tasks: `9f2bb017…` substrate, `d7250881…` action-loop, `96d5ed58…` UI).
**Plan:** `process/waves/wave-69/stages/P-3-plan.md`.

---

## Per-claim verdicts

### Claim 1 — `ModerationService.setMemberTimeout` exists + `can(moderate_members)` + `assertRankGuard`
**VERIFIED.** `apps/api/src/rbac/moderation.service.ts:40` — `async setMemberTimeout(serverId, callerUserId, targetUserId, durationMinutes)`. Guard 1: `moderation.service.ts:47` `const canModerate = await this.rbacService.can(callerUserId, serverId, 'moderate_members')` → throws `ForbiddenException` at `:49`. Guard 2: `moderation.service.ts:53` `await this.assertRankGuard(serverId, callerUserId, targetUserId)`. The rank guard itself (`moderation.service.ts:131` `assertRankGuard`) blocks acting on: owner (`:153` `server.owner_id === targetUserId`), and `manage_server`/`manage_roles` holders (`:169-178`, plus self-moderation guard `:137`). This is exactly the reuse the action loop routes `timeout` through — **it exists and enforces both guards as claimed**.

### Claim 2 — `MessagesService.deleteMessage` exists (~:801) + soft-deletes + is moderate_members + rank-guarded
**VERIFIED.** `apps/api/src/messaging/messages.service.ts:801` `async deleteMessage(channelId, messageId, userId)`. Soft-delete: header comment `:794-795` (`is_deleted=true, deleted_at=now(), content cleared`) + idempotent early-return on already-deleted `:813`. Authz: `messages.service.ts:838` moderator path is `this.rbacService.can(userId, serverId, 'moderate_members')` (widened from manage_channels per wave-41), throws `ForbiddenException` `:841`. Rank guard: `messages.service.ts:851-852` `if (isModerator) await this.assertDeleteRankGuard(serverId, message.author_id)` → `assertDeleteRankGuard` at `:1779` blocks owner (`:1792`) + `manage_server`/`manage_roles` authors (`:1819-1821`). **Signature is `(channelId, messageId, userId)` — channelId is a REQUIRED first arg**; the plan/spec correctly notes the action loop must resolve channel_id from the message row before calling (spec B edge-case + AC line). Verified consistent.

### Claim 3 — `rbacService.can(userId, serverId, 'moderate_members')` exists + is a real flag
**VERIFIED.** `apps/api/src/rbac/rbac.service.ts:53` `async can(userId: string, serverId: string, permission: Permission): Promise<boolean>` — signature matches. `'moderate_members'` is a member of the `Permission` union (`rbac.service.ts:36`) and a real column on `roles` (`moderate_members: boolean` referenced at `:646/:661`, and set in role create/update `:135/:169`). Owner short-circuit (`rbac.service.ts:56-68` returns true for `owner_id === userId`), default-deny otherwise. This is the permission the report GET/resolve gate on — **exists as claimed**.

### Claim 4 — Session idiom (ModerationController derives callerUserId from `req.session.getUserId()` under AuthGuard)
**VERIFIED.** `apps/api/src/rbac/moderation.controller.ts:44` `@UseGuards(AuthGuard)` on the controller; `:18-20` `interface SessionAugmentedRequest { session { getUserId(): string } }`; `:60` `@Req() req: SessionAugmentedRequest`; `:68` `const callerUserId = req.session.getUserId()`. Explicit comment `:38` "callerUserId derived from req.session.getUserId() — never from body/params." The report endpoints are specced to mirror this (no IDOR) — **the idiom to mirror exists exactly as claimed**.

### Claim 5 — `is_public` unlist: `discoverServers` filters `WHERE is_public=true` + wave-68 owner-gated PATCH supports `is_public=false`
**VERIFIED.** `apps/api/src/servers/servers.service.ts:615` `const publicFilter = eq(servers.is_public, true)` inside `discoverServers` (`:598`) — so flipping `is_public=false` drops a server from discovery. The wave-68 owner-gated PATCH exists: controller `apps/api/src/servers/servers.controller.ts:105` `@Patch(':id')` → `updateServer` (`:107`); service `servers.service.ts:451` `updateServer` enforces owner-authz `:462` `if (server.owner_id !== userId) throw new ForbiddenException` and applies `is_public` `:471` `if (patch.is_public !== undefined) setFields.is_public = patch.is_public`. **Setting `is_public=false` via the owner-gated PATCH is fully supported — no new endpoint needed, as the plan claims (reuse).**

### Claim 6 — `reports` table is NET-NEW + schema/migration conventions + index.ts export pattern exist
**VERIFIED.** `apps/api/src/db/schema/reports.ts` does **not** exist (confirmed absent from `ls apps/api/src/db/schema/`) — net-new as claimed, no collision. Conventions present: `apps/api/package.json:14` `"db:generate": "drizzle-kit generate"` + `:15` `db:migrate`; `apps/api/src/db/schema/index.ts` is a barrel of `export * from './<table>'` lines — the export pattern the plan's B-0 step follows. **Net-new + conventions confirmed.**

### Claim 7 — users/servers/messages tables exist for FKs; messages has channel_id
**VERIFIED.** `apps/api/src/db/schema/users.ts:8` `users` with `id: text('id').primaryKey()` → matches FK claims `reporter_id/target_user_id/resolved_by` = **text** FK to users.id. `apps/api/src/db/schema/servers.ts:20` `servers` with `id: uuid('id').primaryKey()` → `target_server_id` = **uuid** FK. `apps/api/src/db/schema/messages.ts:22` `messages` with `id: uuid` (`:25`) and `channel_id: uuid('channel_id')` (`:26`, notNull FK to channels) + `is_deleted: boolean` (`:39`). The `channel_id` on the message row is what the action loop reads to feed `deleteMessage(channelId, …)`. **All FK targets + the channel_id resolution path exist; the plan's stated column types (text/uuid) are exact.**

---

## Cross-cutting sanity checks (beyond the 7)
- **Rank-guard reuse is genuinely load-bearing and correct.** Both `assertRankGuard` (timeout) and `assertDeleteRankGuard` (delete) already implement the owner + manage_server + manage_roles block. Routing resolve-actions THROUGH these methods (not re-implementing) is the right call and is buildable — the plan's B-2 explicitly does this. No second permission system is introduced.
- **No IDOR surface introduced by design.** Every reuse target derives caller identity from session, not params/body. The report endpoints inherit this by mirroring ModerationController.
- **Cross-server tamper guard (`target_server_id === serverId`)** is net-new logic in ReportsService, not a reuse claim — correctly scoped as new build, not asserted as existing.

## No WRONG / UNVERIFIED claims found
Every load-bearing reuse target the plan depends on exists in real code at the cited (or near-cited) locations, with the guards the plan relies on actually enforced. The one nuance — `deleteMessage`'s `channelId` first arg — is already acknowledged by the spec (resolve channel_id from the message row). No divergence between claimed and actual.

---

## OVERALL: **APPROVE**

All 7 load-bearing reuse claims VERIFIED against real code. The three critical reuse targets — `setMemberTimeout` (+ `can(moderate_members)` + `assertRankGuard`), `deleteMessage` (soft-delete + moderate_members + `assertDeleteRankGuard`), and `can(userId, serverId, 'moderate_members')` — all exist and enforce exactly what the plan routes through. The `reports` table is net-new (no collision), FK targets + conventions + the owner-gated `is_public=false` PATCH all exist. This is a real, code-grounded reuse plan — not a reinvention dressed as reuse. Buildable as specced.

**Key file:line evidence (for B-block):**
- `apps/api/src/rbac/moderation.service.ts:40,47,53,131,153,169` — setMemberTimeout + can + assertRankGuard
- `apps/api/src/messaging/messages.service.ts:801,838,851,1779` — deleteMessage + moderate_members + assertDeleteRankGuard
- `apps/api/src/rbac/rbac.service.ts:36,53` — can() signature + moderate_members flag
- `apps/api/src/rbac/moderation.controller.ts:44,68` — session idiom to mirror
- `apps/api/src/servers/servers.service.ts:451,462,471,598,615` — updateServer owner-gate + is_public discover filter
- `apps/api/src/servers/servers.controller.ts:105` — PATCH /servers/:id
- `apps/api/src/db/schema/{users,servers,messages,index}.ts` + `apps/api/package.json:14` — FK targets + conventions + db:generate
