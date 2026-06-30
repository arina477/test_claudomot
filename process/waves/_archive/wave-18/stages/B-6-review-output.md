# Wave-18 B-6 Phase-2 Review (/review) — M3 Threads

**Branch:** `wave-18-m3-threads` vs `main` | **Mode:** READ-ONLY | **Reviewer:** code-reviewer (senior)
**Phase-1 (head-builder):** APPROVED with one Medium routed to Phase-2.
**Phase-2 verdict:** **REWORK** — 1 Critical (IDOR) + 1 High (live reply-delete divergence) block B-6 re-entry.

Scope reviewed: migration 0008, `messages.ts` schema, `messages.service.ts` (createReply / deleteMessage thread branch / listThreadReplies / rowToDto), `messages.controller.ts` (ThreadsController), `messaging.gateway.ts`, `messaging.module.ts`, web `ThreadPanel.tsx` / `useThread.ts` / `MessageList.tsx` / `useMessages.ts` / `messagingSocket.ts` / `MainColumn.tsx` / `auth/api.ts`, `packages/shared/src/messaging.ts`, and `messages.service.spec.ts`.

---

## CRITICAL

### C-1 — IDOR: thread reply POST + replies GET are NOT behind the channel-membership guard
**Files:** `apps/api/src/messaging/messages.controller.ts:240-307` (ThreadsController), `apps/api/src/messaging/messages.service.ts:694-902` (createReply / listThreadReplies)

`ThreadsController` decorates both routes with `@UseGuards(AuthGuard)` ONLY — it deliberately drops `ChannelMessageGuard`. The controller comment (`messages.controller.ts:223-238`) and `api.ts:272,294` docstrings claim the service "verifies channel membership transitively" / returns "403 not member." **It does not.** Verified:

- `createReply` (`messages.service.ts:694-800`) checks only: parent exists (404), parent.channel_id === channelId (400), parent not a reply (400), parent not soft-deleted (409). **No call to `rbacService.canViewChannelById` or any membership/permission check.** Contrast `deleteMessage` which does call `rbacService.can(...)` (`messages.service.ts:563`).
- `listThreadReplies` (`messages.service.ts:813-902`) checks only parent existence (404). No membership check.

`ChannelMessageGuard` (`rbac/channel-message.guard.ts:53`) is the sole enforcement of `canViewChannelById` for the sibling top-level message routes (owner-superuser, private-channel default-deny, etc.). By omitting it here, **any authenticated user — including a non-member of the server, or a member barred from a private channel — can both read every reply in any thread and post replies into it**, given only a parentId (UUIDs are guessable/leakable, and `channelId` is an attacker-supplied query param the service merely cross-checks against the parent, not against the viewer). This is a read+write IDOR across the entire messaging surface, bypassing the private-channel and server-membership model the rest of M3 enforces.

There is also **zero test coverage** for an unauthorized caller on these routes (`messages.service.spec.ts` covers only 404/400/409/idempotency/ordering — no 403/non-member case; grep for `canView`/`member`/`403` in the thread describe blocks returns nothing).

**Fix direction:** apply `canViewChannelById(viewerUserId, parent.channel_id)` inside both service methods after loading the parent (the parent's channel_id is the trusted source — query param is not), throwing 403 on false; OR build a parent-aware guard. Add non-member 403 tests for both routes. This is a head-X / security-scope gate concern (wave touches channel-access authorization).

---

## HIGH

### H-1 — Reply soft-delete never propagates to open thread panels or the affordance count (live divergence + stale tombstone)
**Files:** `apps/api/src/messaging/messages.service.ts:585-651` (reply delete branch), `apps/api/src/messaging/messaging.gateway.ts:186-189`, `apps/web/src/shell/useMessages.ts:189-213`, `apps/web/src/shell/useThread.ts`

When a **reply** is soft-deleted, the service emits the generic `message.deleted` event (`messages.service.ts:650`), which the gateway fans out as `message:deleted` to the channel room (`messaging.gateway.ts:188`). No thread-scoped delete event exists (only `thread.reply.created` was added). Consequences on every other connected client:

1. **Open ThreadPanel does not update.** `useThread` subscribes only to `thread:reply:created` — it has no `message:deleted` listener — so a deleted reply remains rendered as a live reply in other viewers' panels until they re-open/refetch the thread.
2. **Affordance count drifts.** `useMessages` increments `replyCount` on `thread:reply:created` (`useMessages.ts:199-209`) but has **no decrement path** for a deleted reply. The DB `reply_count` is correctly decremented server-side (`messages.service.ts:634,642`), but the client affordance chip stays inflated until a full reload — so the count the user sees diverges from both the server truth and the actual visible replies.
3. The `useMessages.onMessageDeleted` handler (`useMessages.ts:141-152`) does a no-op `map` for reply IDs (replies are never in the channel-list `realMessages`), so even that generic event buys nothing for threads.

Server-side counts are correct; this is a realtime-consistency gap, not corruption — hence High not Critical. Note: the originating client's own optimistic state is fine because ThreadPanel derives its count from `replies.length + optimisticReplies.length` (`ThreadPanel.tsx:484`), but it never removes the deleted reply from its own `replies[]` either.

**Fix direction:** emit a thread-scoped delete event (e.g. `thread:reply:deleted` carrying `{parentId, channelId, replyId, newReplyCount, newLastReplyAt}`) from the reply-delete branch; have `useThread` mark/remove the reply and `useMessages` decrement the affordance. Confirm against the wave-18 spec whether live reply-delete propagation was in scope (B-2 stage doc lists the realtime event only for `created`).

---

## MEDIUM

### M-1 — (CONFIRMED from Phase-1) Dead socket-echo reconcile-by-idempotency_key branch in useThread
**File:** `apps/web/src/shell/useThread.ts:114-121`

Confirmed **dead and (currently) harmless**. The branch reads `(incoming as MessageResponse & { idempotencyKey?: string }).idempotencyKey`, but:
- `MessageResponseSchema` (`packages/shared/src/messaging.ts:40-56`) has **no** `idempotencyKey` field.
- `rowToDto` (`messages.service.ts:140-158`) never sets one; `ThreadReplyEvent.reply` is a plain `MessageResponse`.

So `key` is always `undefined`, the `if (key)` block at line 119-121 never runs. Reconciliation of the optimistic row is fully handled by the API-confirm path (`useThread.ts:141-149`: on `postReply` resolve, append-by-id-dedup + remove optimistic by `idempotencyKey`), mirroring `useMessages`. Dedup-by-id (`useThread.ts:110`, `145`) prevents the socket echo from double-inserting the confirmed reply.

**No orphan/duplicate in the panel** in the normal case: the optimistic row is removed when the API resolves; the socket echo is id-deduped against the already-appended confirmed row. The only residue is a misleading comment (lines 16-23, 114-118) and the unreachable cast.

**Harmless-EXCEPT edge to flag:** if the `postReply` HTTP response is lost but the write committed (network drop after commit), the optimistic row moves to `failed` (catch at `useThread.ts:151`) while the socket echo separately appends the confirmed reply by id. The user then sees BOTH the appended real reply AND a failed/retry row for the same content — because the dead key-reconcile was the intended (but non-functional) cleanup for exactly this case. Retry then ON-CONFLICT-replays harmlessly server-side, but the failed row is not auto-cleared. Low-probability; surfaces as a duplicate-looking failed row, not data corruption.

**Fix direction:** delete the dead branch + correct the comments; optionally add a real reconcile by matching the socket echo against pending optimistic rows on (authorId + content) or have the server echo the idempotencyKey (schema change) to handle the lost-ack edge cleanly.

### M-2 — Affordance `lastReplyAt` uses client `Date.now()` against server ISO; relative label can read "just now" / negative on clock skew
**File:** `apps/web/src/shell/MessageList.tsx:115-130` (`formatRelativeTime`)

`formatRelativeTime` computes `Date.now() - new Date(isoString)`. With client-ahead skew the diff is fine; with client-behind skew (or the optimistic `lastReplyAt: event.reply.createdAt` set from a server timestamp while the client clock lags) `diff` can be negative, yielding `s < 60 → "just now"` which is acceptable, but a larger negative skew still floors to `"just now"`. Cosmetic only — no correctness impact. Worth a guard `if (s < 0) return 'just now'` for clarity.

### M-3 — `formatRelativeTime` / affordance label is static; never re-renders as time passes
**File:** `apps/web/src/shell/MessageList.tsx:783-836`

"last reply 2m ago" is computed at render and only refreshes when the row re-renders (new event, edit, etc.). An idle channel shows an increasingly stale "Nm ago." Matches existing `formatTime` behavior for message timestamps, so consistent with the codebase — noting for parity awareness, not a regression.

---

## LOW

### L-1 — Idempotency UNIQUE scope `(channel_id, idempotency_key)` is shared across top-level messages AND replies; replay re-fetch in createReply does not filter by thread_parent_id
**Files:** `apps/api/src/db/schema/messages.ts:46` (unique constraint unchanged), `apps/api/src/messaging/messages.service.ts:754-763`

The UNIQUE is `(channel_id, idempotency_key)` — not scoped by `thread_parent_id`. If a client ever reused an idempotency_key that a top-level `createMessage` already consumed in the same channel, the reply INSERT would hit ON CONFLICT DO NOTHING, `isNewInsert=false`, and the replay branch re-fetches by `(channel_id, idempotency_key)` **without** a `thread_parent_id` filter (`messages.service.ts:756-762`) — returning the *top-level* message as if it were the reply, with no count increment. Practically unreachable because both `useThread.sendReply` and `useMessages` generate fresh `crypto.randomUUID()` keys per send (`useThread.ts:130`), so cross-surface collision probability is ~0. Defensive note only: the replay re-fetch could assert `replyRow.thread_parent_id === parentId` and 409 on mismatch.

### L-2 — Reply rows render `authorId` as the display name (no username/display resolution)
**File:** `apps/web/src/shell/ThreadPanel.tsx:112,117,594,602`, composer `parentAuthorId` at 309/316

`ReplyRow` and the pinned-parent block use `reply.authorId` / `parentMessage.authorId` directly for the avatar initials and the name line, and the composer placeholder is `Reply to ${parentAuthorId}`. `authorId` is the user UUID/id, not a username/display name. Top-level `MessageList` rows have the same shape (so this is consistent with existing behavior, and `currentUserId` is passed as `profile?.username`), but in the thread panel the parent/reply author renders as a raw id with no resolution. Confirm this matches the channel-list rendering; if the channel list resolves display names elsewhere, the panel is inconsistent. Cosmetic.

### L-3 — Migration 0008 self-FK is `ON DELETE no action`; relies entirely on soft-delete to avoid orphaned replies
**File:** `apps/api/drizzle/migrations/0008_dazzling_bushwacker.sql:4`

`thread_parent_id` FK is `ON DELETE no action ON UPDATE no action`. This is the correct/safe choice (the app only ever soft-deletes; a hard DELETE of a parent with live replies would be blocked by the FK, which is the desired fail-safe). Additive and safe — no surprise cascade. Flagging only to confirm the team's intent: there is no path that hard-deletes messages today, so this never fires; if a future purge job hard-deletes parents it must delete replies first or it will error. No action needed this wave.

### L-4 — `Esc` handler is a capturing document-level listener mounted per open panel
**File:** `apps/web/src/shell/ThreadPanel.tsx:423-432`

The Escape handler uses `addEventListener('keydown', handler, true)` (capture) with `stopPropagation()`. Correctly scoped to mount/unmount of the panel and only active while open, so no leak. `e.stopPropagation()` in capture phase will swallow Escape from any other capture-phase listener registered earlier on ancestors — acceptable for a modal dialog but worth awareness if a global hotkey layer is added later. The focus-trap effect (`ThreadPanel.tsx:444-482`) correctly only arms when `isOverlay`. All 5 D-carries verified wired: focus-trap (444-482), Esc + focus-restore (423-441), affordance hidden @ replyCount===0 (`MessageList.tsx:787-791`), `<ol role/list>` semantics (`ThreadPanel.tsx:697`), `aria-live="polite"` on the replies `<ol>` (`ThreadPanel.tsx:698`).

---

## Items verified CLEAN (adversarial hunt, no finding)

- **reply_count increment atomicity / no double-count on retry:** `createReply` runs INSERT…ON CONFLICT DO NOTHING RETURNING + `isNewInsert = insertReturning.length > 0`; the `reply_count = reply_count + 1` UPDATE is gated on `isNewInsert` inside the SAME `db.transaction` (`messages.service.ts:733-787`). Idempotent replay re-fetches and skips the increment. No double-count, no drift on retry. Tested (`messages.service.spec.ts:38-39, 1043, 1077`).
- **No missing decrement on delete:** reply delete ALWAYS does `GREATEST(reply_count - 1, 0)` in a txn (`messages.service.ts:634,642`); `GREATEST(...,0)` floors at 0, so concurrent double-decrement cannot go negative.
- **Tail-only last_reply_at recompute — no stale pointer to a deleted reply:** tail delete (`deleted.created_at === parent.last_reply_at`) recomputes `MAX(created_at)` over live replies excluding the deleted one, NULL when none remain (`messages.service.ts:610-637`). Non-tail delete leaves `last_reply_at` unchanged — correct, since the tail (newest) is still live and is still the true max. No path leaves `last_reply_at` pointing at a soft-deleted reply.
- **One-level enforcement TOCTOU:** parent is re-validated (`thread_parent_id !== null` → 400) and the INSERT sets `thread_parent_id = parentId` from the validated parent's id; a reply cannot itself become a parent because the guard rejects any parentId whose row already has a non-null `thread_parent_id`. Cross-channel guard compares against the parent's trusted `channel_id`. No write occurs before validation (all checks precede the txn).
- **Realtime scoping — no leak into top-level stream:** `createReply` emits ONLY `thread.reply.created`; it never emits `message.created`. Gateway fans it out under the distinct `thread:reply:created` name (`messaging.gateway.ts:233`). `useThread` filters by `event.parentId === parentId` (`useThread.ts:103`); `useMessages` thread listener updates only the parent's count and does NOT add the reply to `realMessages` (`useMessages.ts:199-209`). Replies never enter the channel message list.
- **Author exclusion (realtime):** intentionally NOT excluded for `thread.reply.created` (documented `messaging.gateway.ts:230-231`) so the sender's own panel/affordance live-update; sender double-render is prevented by id-dedup in both `useThread` and `useMessages`. Correct.
- **listThreadReplies pagination + tombstone exclusion:** ASC `(created_at, id)` keyset cursor, `is_deleted = false` filter, `safeLimit+1` hasMore probe (`messages.service.ts:830-879`). Tested (`messages.service.spec.ts:42, 1292, 1316`).
- **author_id never from body:** both ThreadsController routes derive author/viewer from `req.session.getUserId()` (`messages.controller.ts:289,306`).
- **Migration additivity:** all ADD COLUMN with safe defaults (`reply_count DEFAULT 0 NOT NULL`, nullable `thread_parent_id`/`last_reply_at`) + one index; no data backfill needed, no destructive change.

---

# Wave-18 B-6 Phase-2 RE-REVIEW (iteration 2) — M3 Threads

**Branch:** `wave-18-m3-threads` vs `main` | **Mode:** READ-ONLY | **Reviewer:** code-reviewer (senior)
**Trigger:** iteration-1 verdict was REWORK (1 Critical IDOR + 1 High live-delete divergence). Two fix commits landed: `b7abbea` (API IDOR guard + `thread:reply:deleted` event) and `efde6ec` (web wiring + dead-branch removal).
**Phase-2 (iteration 2) verdict:** **APPROVED** — C-1 + H-1 confirmed cleared, M-1 cleared, no NEW Critical/High introduced. Carried Medium/Low accepted non-blocking.

## CRITICAL — [] (none)

### C-1 (IDOR) — CLEARED ✓
Membership now enforced **on both routes, parent-derived, un-bypassable via the query param**:
- `createReply` (`messages.service.ts:751-754`): after loading the parent and validating `parent.channel_id === channelId`, calls `this.rbacService.canViewChannelById(authorId, parent.channel_id)` → `ForbiddenException` on false. The authz channel is `parent.channel_id` (the trusted row), not the query param. The cross-channel check (`:742`) already rejects a forged `channelId`, so even a mismatched param can never reach the guard with a wrong channel — the param is redundant to the authz source, never the source.
- `listThreadReplies` (`messages.service.ts:865-880`): parent fetch now selects `channel_id`; `canViewChannelById(viewerUserId, parent.channel_id)` → `ForbiddenException` on false, before any reply read.
- `canViewChannelById` (`rbac.service.ts:344-354`) is default-deny: returns `false` for non-member AND for missing channel — same enforcement primitive the sibling `ChannelMessageGuard` uses (`channel-message.guard.ts:53`). Call shape matches the signature `(userId, channelId)`.
- Controller comment (`messages.controller.ts:232-247`) + `api.ts:276,292` docstrings corrected — the previously-false "verifies membership" claims now accurately describe in-service `canViewChannelById` enforcement. No stale lie remaining.
- **Tests added (3):** non-member POST → 403 (`spec:1382`), non-member GET → 403 (`spec:1403`), member GET → 200 (`spec:1425`). All three assert `canViewChannelById` was called with the **parent-derived** `CHANNEL_ID`, not a caller param (`spec:1396,1418,1447`). Proves parent-sourced authz, not just presence of a check.

**Residual-IDOR hunt (adversarial), no finding:**
- *404-before-403 ordering:* both routes throw parent-not-found (404) before the membership 403. This leaks only the existence of a message UUID to a caller who already holds that UUID — it does not leak content, channel, or membership of any private channel. Identical to the pre-existing `deleteMessage` pattern (`:540` early-returns on missing/already-deleted before authz too). Not a new finding; not an IDOR (no cross-tenant data exposure).
- *GET-by-parentId in an unseen channel:* now blocked — the 403 fires before any reply rows are selected (`:877` precedes the keyset queries at `:882+`). No reply content leaks.
- *Forged channelId param:* dead-ends at the cross-channel 400 (`:742`); the guard always runs on `parent.channel_id`. Un-bypassable.

## HIGH — [] (none)

### H-1 (realtime reply-delete) — CLEARED ✓
- **Event fires on reply-delete:** `deleteMessage` reply branch (`messages.service.ts:659-680`) does a post-commit SELECT of the parent's `reply_count` / `last_reply_at` / `channel_id` (authoritative post-decrement values, read after the txn committed the decrement) and emits `thread.reply.deleted` with `{parentId, channelId, replyId, replyCount, lastReplyAt}`. Generic `message.deleted` still also emitted (`:651`) — no regression to top-level delete.
- **Gateway:** `@OnEvent('thread.reply.deleted')` fans out `thread:reply:deleted` to `channel:<channelId>` (`messaging.gateway.ts:261-267`), distinct event name — symmetric with `thread:reply:created`.
- **Client affordance:** `useMessages` `onThreadReplyDeleted` (`useMessages.ts:223-241`) sets the parent row's `replyCount`/`lastReplyAt` from the payload's authoritative values; affordance auto-hides at `replyCount===0` via `MessageList`'s conditional render (verified clean in iter-1, `MessageList.tsx:787-791`). Uses server values, not a client decrement → no drift.
- **Client panel:** `useThread` `onThreadReplyDeleted` (`useThread.ts:126-134`) filters the reply out of the open panel by `replyId`, gated on `event.parentId === parentId`. Removes the deleted reply from other viewers' open panels live.
- **Type match:** `ThreadReplyDeletedEvent` (`shared/messaging.ts:123-130`: `replyCount: nonnegative int`, `lastReplyAt: string|null`) matches the emitted payload (service ISO-stringifies `last_reply_at`, null when no live replies). Gateway + client import the same type. No shape mismatch.
- **Test added:** `deleteMessage` emits `thread.reply.deleted` with post-decrement counters (`spec:1472-1533`) — asserts both `message.deleted` AND `thread.reply.deleted` fire with the correct payload incl. ISO `lastReplyAt`.

## NEW Critical/High from the fixes — [] (none)
- **`canViewChannelById` call shape:** correct `(userId, channelId)` on both call sites; matches `rbac.service.ts:344` + the guard's own usage. Async-awaited.
- **Post-commit SELECT cannot NPE:** the parent fetch result is guarded by `if (updatedParent)` (`messages.service.ts:669`) before building the event — if the parent row were somehow absent the event is simply skipped (graceful), no dereference. `toISOString()` is behind the `last_reply_at ? … : null` ternary (`:675-677`). Parent vanishing is impossible anyway (soft-delete only; self-FK `ON DELETE no action`). Safe.
- **Event payload types:** verified above (H-1) — match end-to-end.
- **No new write-before-validate:** the membership guard runs in the read-only pre-flight, before the `createReply` transaction opens (`:751` precedes the txn at `:769`). No partial-write window introduced.

## M-1 (dead reconcile-by-idempotency_key branch) — CLEARED ✓
The dead `if (key)` reconcile branch is gone from `useThread.ts`. The `thread:reply:created` handler (`:101-120`) now reconciles purely by id-dedup (`:115`); the comment (`:11-13`, `:109-113`) accurately describes the mechanism (API-confirm removes the optimistic row in `sendReply`'s `.then()` at `:158-159`; socket echo dedups by id). No unreachable cast, no misleading comment. Optimistic reply still reconciles correctly: API-confirm appends-by-id-dedup + removes optimistic by `idempotencyKey` (`:154-159`); socket echo id-deduped (`:115`). No orphan, no duplicate in the normal path. (The lost-ack edge noted in iter-1 — failed row co-existing with the id-deduped real reply on a post-commit network drop — remains a Low-probability cosmetic residue, not reintroduced and not blocking; covered under accepted debt.)

## Carried Medium/Low — ACCEPTED non-blocking (unchanged from iter-1)
- **M-2** — `formatRelativeTime` negative-skew floors to "just now" (`MessageList.tsx:115-130`). Cosmetic, no correctness impact. Optional `if (s < 0)` guard.
- **M-3** — affordance relative-time label is static, doesn't tick as time passes (`MessageList.tsx:783-836`). Consistent with existing `formatTime` behavior; parity note, not a regression.
- **L-1** — idempotency UNIQUE `(channel_id, idempotency_key)` shared across top-level + replies; replay re-fetch doesn't filter by `thread_parent_id` (`messages.service.ts:797-806`). Practically unreachable (fresh `crypto.randomUUID()` per send). Defensive note.
- **L-2** — reply rows render `authorId` as display name, no username resolution (`ThreadPanel.tsx`). Consistent with top-level `MessageList` rendering. Cosmetic.
- **L-3** — migration 0008 self-FK `ON DELETE no action`; relies on soft-delete. Correct/safe fail-safe; no hard-delete path exists today.
- **L-4** — Esc handler is a capture-phase document listener per open panel; correctly mounted/unmounted, no leak. Awareness note for a future global hotkey layer. (All 5 D-carries re-confirmed wired in iter-1.)
- Plus the M-1 lost-ack cosmetic edge (above) — Low, not blocking.

## Repo-green note
Claimed green: api 309 (was 305 +4: 3 IDOR + 1 H-1 emission), web 145 (was 142 +3), typecheck/build/lint clean. Test counts and the +N deltas are consistent with the fixes reviewed; the new spec blocks (`spec:1370-1534`) account for the API delta. Did not re-run the suite in this READ-ONLY pass — counts taken from the build/CI claim.

**Final B-6 Phase-2 verdict (iteration 2): APPROVED.** Critical [] · High [] · all carried items Medium/Low and accepted. Ready for B-6 gate-verdict + C-block.
