# Wave-41 B-6 Phase 2 — Production-bug + Security Review

**Scope:** RBAC `moderate_members` + light moderation (delete-any, member timeout, send-gate) on branch `wave-41-educator-moderation`.
**Diff base:** `448adfd` (merge-base origin/main) → HEAD `099a1b4`.
**Focus:** CRITICAL/HIGH production bugs + authz holes that typecheck + green tests would miss.

---

## Summary verdict

One **HIGH** send-gate bypass (thread replies are not mute-gated). No CRITICAL findings. Several MEDIUM design/hardening observations. The core authz surface (`can(moderate_members)` gating, IDOR posture, delete-any widening, DTO exposure) is sound.

---

## CRITICAL / HIGH findings

### [HIGH] H-1 — Send-gate does not cover thread replies (mute bypass)

**File:** `apps/api/src/messaging/messages.service.ts`
The `muted_until` send-gate is implemented ONLY in `createMessage` (lines 456–475). `createReply` (line 1008+) has **no mute check** at all. `POST /messages/:parentId/replies?channelId=` is a live REST endpoint (`messages.controller.ts:292`) that reaches `createReply` directly.

**Impact:** A member who has been timed out (`server_members.muted_until > now()`) is blocked from top-level messages but can freely post **thread replies** into any channel they can view. The timeout is trivially circumvented from the UI (reply composer) — this defeats the primary purpose of the feature (silence a disruptive student).

**Why green tests miss it:** the integration spec (`moderation.integration.spec.ts`) only asserts the block on the `createMessage` path (criterion 3); no test exercises `createReply` while muted.

**Fix:** extract the muted-sender check into a shared private helper (`assertNotMuted(serverId, authorId)`) and call it in `createReply` after the parent/channel are resolved (server_id available via `parent.channel_id` → channel row, or the already-loaded channel), mirroring lines 461–475. Add a `createReply`-while-muted integration case.

**Note:** the spec text (`B-2-backend.md` line 6) itself scopes the gate to "createMessage", so this is arguably spec-conformant-as-written — but it is a genuine security hole regardless of spec wording. Flagging as HIGH; recommend fixing in-wave rather than deferring, since a half-covered mute is worse than none (moderators will believe the member is silenced).

---

## MEDIUM findings

### [MEDIUM] M-1 — Delete-any has no rank guard; a moderator can delete the owner's / an admin's messages

**File:** `apps/api/src/messaging/messages.service.ts:840–851`
`deleteMessage` gates the moderator branch on `can(moderate_members)` only — there is **no `assertRankGuard`**. The rank guard (owner / manage_server / manage_roles protection) is applied to timeout but NOT to delete-any. So a plain moderator can soft-delete the **server owner's** messages, an admin's messages, and another moderator's messages.

Per `B-2-backend.md` line 5 the delete-any widening is specified as "`moderate_members OR author`" with the rank guard described only for timeout (lines 3–4) — so this matches the written spec and is **not a spec violation**. Flagged as a design/authz-consistency concern: timeout is rank-protected but message deletion is not, which is an asymmetric and likely unintended power (a moderator can erase the owner's announcements). Recommend a product decision: either extend `assertRankGuard` to delete-any, or explicitly document that delete-any is intentionally unranked.

### [MEDIUM] M-2 — A moderator can time out (and delete-target) another moderator

**File:** `apps/api/src/rbac/moderation.service.ts:131–185`
`assertRankGuard` blocks only owner / manage_server / manage_roles holders. Two members who each hold **only** `moderate_members` are peers under the guard, so moderator A can time out moderator B (and, via M-1, delete B's messages). This is "peer moderation" and may be acceptable for an education product, but it is not stated in the spec and enables moderator-vs-moderator griefing. Recommend an explicit product call; if peers should be protected, add "target holds `moderate_members`" to the guard's block set.

### [MEDIUM] M-3 — Edit path is not mute-gated

**File:** `apps/api/src/messaging/messages.service.ts:652` (`editMessage`)
A muted member can still `PATCH` their own existing messages. Lower impact than H-1 (author-only, existing message, no new row), but a muted user can materially change what they said (e.g., replace old content with new disruptive content) while "silenced". Consider gating edit on mute too, or accept as out-of-scope. Reactions (`toggleReaction`) are similarly ungated but are non-content and reasonably excluded.

---

## LOW / hardening notes

### [LOW] L-1 — Rank-guard uses two sequential reads without a transaction (benign)
`assertRankGuard` reads server owner, then target membership/role in separate queries, then `setMemberTimeout` re-reads membership. No atomicity issue (moderation is idempotent and last-writer-wins on `muted_until`), and no TOCTOU that grants privilege. Noted only for completeness; no action needed.

### [LOW] L-2 — Duplicate target-membership read
`setMemberTimeout`/`clearMemberTimeout` load the target membership inside `assertRankGuard` (for `role_id`) and again after (for existence). Minor redundant query; could be merged. Non-blocking.

---

## Items explicitly checked and CLEARED

1. **can(moderate_members) gating — all entry points covered.** Timeout POST/DELETE both call `can(...,'moderate_members')` before any write (`moderation.service.ts:47,90`); delete-any calls it (`messages.service.ts:847`). No moderation write path is reachable without the permission. Owner short-circuits `can()` to true (correct). `moderate_members` correctly added to the `Permission` union, role CRUD, `getEffectivePermissions`, and DTO/schema.
2. **IDOR — clean.** `callerUserId` is always `req.session.getUserId()` (controller lines 68, 91); never from body/params. `serverId`/`targetUserId` come from route params and are validated (server existence, server membership). Cross-server timeout is prevented: every query is scoped `AND server_id = :serverId` **and** `AND user_id = :targetUserId`, and the membership check (`moderation.service.ts:56–64`) 404s a target who is not a member of *this* server — a moderator in server A cannot time out a member of server B.
3. **Delete-any widening does not over-grant.** `isModerator` is only evaluated when `!isAuthor`; a non-author non-moderator hits `throw ForbiddenException` (`messages.service.ts:849–851`). Author-delete preserved (`isAuthor` short-circuits, no permission needed). Server_id resolved from `channels.server_id`, never trusted from request.
4. **Send-gate expiry logic correct.** `muted_until > new Date()` → blocked; `null`/`undefined`/past timestamp → allowed. Time-based, no cron. Optional-chaining guards a non-member sender (`senderMembership` undefined → not blocked, which is correct since a non-member can't reach a channel anyway). *(Coverage gap is H-1, not the comparison itself.)*
5. **Rank guard — no multi-role edge.** Schema is single `role_id` per `server_members` row (`servers.ts:55`), so the "member with two roles" bypass does not exist. Self-moderation blocked (`callerUserId === targetUserId` → 403). Owner blocked by explicit `owner_id` check AND transitively by manage_server/manage_roles. Null/missing role → guard passes (correct: no elevated perms = moderatable).
6. **mutedUntil DTO exposure — safe.** `ServerMemberSchema.mutedUntil` is `z.string().nullable()` (ISO timestamp only). `servers.service.ts:262` emits only the ISO string; the internally-selected `email` is used solely as a displayName fallback and is NOT in the returned DTO. No sensitive leakage; public-by-design mute indicator confirmed.
7. **Migration `0018`.** Adds nullable `muted_until timestamptz` — additive, no backfill, no NOT NULL, no default; safe on a live table. No contract drift between schema, migration snapshot, and shared DTO.
8. **DI/module wiring.** `ModerationController` + `ModerationService` registered in `RbacModule`; `AuthGuard` on the controller; value-imports for `emitDecoratorMetadata` present. Typecheck-clean, no runtime DI gap.

---

## Gate recommendation

**REWORK (soft)** — H-1 (reply mute bypass) should be closed in-wave; it is a live security hole that a moderator/founder would reasonably assume is covered. M-1/M-2 warrant an explicit product decision (extend rank guard / peer protection to delete-any) but are spec-conformant as written and can be logged as follow-ups if the founder accepts the asymmetry. Everything else is clean.
