# P-4 Phase-2 — Karen load-bearing-claim verification (wave-15 M3 @mentions)

**Verdict: APPROVE** — every reuse/architecture claim in the spec + P-3 plan is grounded in real, current code. One non-blocking note on the migration-number claim (filename label only, not a correctness issue).

Scope: spec task `3d238446` (data plane) + `cd585f04` (autocomplete) + `c3f3f62a` (pills/unread). Verified against live `apps/api` + `packages/shared` + `apps/web`.

---

## Per-claim findings

**1. createMessage + editMessage are the right hook points for resolve+persist (+ edit diffing) — VERIFIED**
`messages.service.ts:136` `createMessage` and `:228` `editMessage` both exist, both already write the message row then `eventEmitter.emit(...)` (`:211`, `:278`). The plan's "after the message row is written, parse → resolve → upsert" inserts cleanly at those two points. `editMessage` already does a fetch-then-update (`:234`–`:259`) so the diff-on-edit logic has a natural home. Body is `input.content` / `content` param — available for parsing at both sites. Grounded.

**2. GET /servers/:id/members exists (wave-14) for autocomplete reuse — VERIFIED**
`servers.controller.ts:76` `@Get(':id/members')` → `serversService.listServerMembers(userId, id)`, membership-gated (403 otherwise per docstring `:74`). Returns `ServerMember[]`. DTO (`packages/shared/src/servers.ts:55`) = `{userId, displayName, avatarUrl}` — exactly the avatar+name the autocomplete claim (task `cd585f04` AC3, plan line 14) needs. Grounded.

**3. /messaging gateway room emit carries mentions[] — no new namespace — VERIFIED**
`messaging.gateway.ts:55` namespace `/messaging`; `:146` `@OnEvent('message.created')` → `server.to('channel:<id>').emit('message:new', message)` where `message: MessageResponse`. Since mentions[] is carried *on the MessageResponse DTO* (claim 5), adding the field automatically propagates through the existing room emit with zero gateway change for the create case. `message:updated` path (`:159`) covers edit. Plan line 10's "ADD mentions[] to the DTO so the room payload carries them; no new event/namespace" is correct. Grounded.

**4. message_mentions belongs in db/schema/messages.ts; 0007 is next migration — VERIFIED (with label nuance)**
`db/schema/messages.ts` already houses `messages` (`:11`) + `message_reactions` (`:54`) with the identical association-table pattern (FK→messages ON DELETE CASCADE, FK→users, UNIQUE, index) the plan proposes for `message_mentions`. Right file, proven pattern.
Migration number: journal max `idx=6 / tag=0006_wave13_message_lifecycle`; files on disk top out at `0006_*`. So **the next sequence index is 7 and `0007` is the correct next number** — claim stands. **Non-blocking nuance:** the existing series is NOT contiguous (there are two `0004_*` files — `0004_gigantic_saracen` + `0004_green_madripoor` — and `0003` is absent). Numbering has drifted before. This does not threaten 0007 (drizzle keys on journal `idx`, and idx 7 is free), but the implementer should generate the migration via the drizzle toolchain (let it pick the tag) rather than hand-naming, to avoid repeating the collision.

**5. MessageResponse in packages/shared/src/messaging.ts is the DTO to extend — VERIFIED**
`messaging.ts:23` `MessageResponseSchema` is the canonical zod DTO, already extended twice (wave-13 edit/delete `:29`, reactions `:33`). Adding `mentions: z.array(z.object({userId, username}))` follows the established extension pattern. Consumed by both REST (`messages.controller.ts:18`) and gateway (`messaging.gateway.ts:25`), so one edit round-trips on fetch AND realtime — matches AC2 + plan line 25. `rowToDto` (`messages.service.ts:63`) is the single mapping site to populate it. Grounded. (Plan must also add the NEW `MyMentionsResponse` type per spec contracts — not yet present, correctly scoped as new.)

**6. server_members + users exist for username→userId resolution — VERIFIED**
`db/schema/servers.ts:43` `server_members` (server_id, user_id, role_id) — the membership filter for "resolve ONLY to members of the channel's server" (AC1). `db/schema/users.ts:11` `username` column + `:17` case-insensitive uniqueness index `users_username_lower_idx` on `lower(username)`. The unique-lower index directly supports word-boundaried `@username` → userId resolution. The resolve query (`server_members ⋈ users` for the channel's server, plan line 8) is fully backed. Grounded.
*Minor caveat (non-blocking):* `users.username` is **nullable** (`:11`, no `.notNull()`). Users with a null username cannot be `@`-mentioned and won't appear as resolvable tokens — correct/harmless behavior, but the implementer must filter `username IS NOT NULL` in both resolution and autocomplete to avoid a null-handle in the picker. Worth a one-line note in B-2/B-3; not a spec defect.

**7. Antipatterns — VERIFIED clean**
- **ACs falsifiable:** Yes. Each AC is observable — non-member token stays plain text (AC1), row persists + round-trips (AC2), realtime signal on existing namespace (AC3), cross-user my-mentions denied (AC4), edit add/remove diffs rows (AC5). All testable.
- **Gold-plating OUT:** Spec + plan explicitly exclude @everyone/@here/@role and the notification-inbox surface (spec SECURITY block; plan line 10 "no global push this wave"). Scope held to data-plane + autocomplete + pills/unread. No scope creep.
- **message_mentions table vs parse-on-read justified:** YES. The plan names the rejected alternative (parse-on-read, line 9) with three concrete reasons that hold up against the code: (a) AC4's `GET /me/mentions` needs an **indexed authz-scoped** lookup — parse-on-read would require scanning all messages across all channels per request; the proposed `index(mentioned_user_id, created_at DESC)` is exactly the access path. (b) membership is re-resolved per render under parse-on-read (server_members join on every fetch). (c) no unread driver. The persisted association is the right call, not over-engineering — it is load-bearing for an explicit AC.

---

## Summary

| # | Claim | Status | Evidence |
|---|---|---|---|
| 1 | create/edit are persist hook points | VERIFIED | messages.service.ts:136,228,211,278 |
| 2 | GET /servers/:id/members reuse | VERIFIED | servers.controller.ts:76; shared/servers.ts:55 |
| 3 | /messaging room emit carries mentions[], no new namespace | VERIFIED | messaging.gateway.ts:55,146,159 |
| 4 | message_mentions in schema/messages.ts; 0007 next | VERIFIED* | schema/messages.ts:54; journal idx=6 |
| 5 | MessageResponse is the DTO to extend | VERIFIED | shared/messaging.ts:23 |
| 6 | server_members + users back resolution | VERIFIED | schema/servers.ts:43; users.ts:11,17 |
| 7 | ACs falsifiable; no gold-plating; table justified | VERIFIED | spec ACs + plan:9 |

\*Non-blocking notes for the build block: (a) generate migration 0007 via drizzle toolchain — series has a prior `0004` collision + missing `0003`; (b) `users.username` is nullable — filter `IS NOT NULL` in resolution + autocomplete.

No WRONG claims. No UNVERIFIED claims. **APPROVE.**
