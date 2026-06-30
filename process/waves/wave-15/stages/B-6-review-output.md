# Wave-15 B-6 Production-Bug Review — M3 @mentions

**Reviewer:** code-reviewer (B-6 /review substitute)
**Scope:** `git diff main...wave-15-m3-mentions` — READ-ONLY
**Verdict input:** Critical/High re-enter B-stages; Medium/Low logged as carries.

---

## Summary

Backend (parse/resolve/persist, edit-diff, my-mentions query, batch DTO) is solid:
no SQL injection, no N+1, no ReDoS, authz is session-derived and membership-scoped,
cursor pagination is stable with the `(created_at, id)` tiebreaker. **No Critical findings.**
No XSS — all pill/body text renders through React JSX, which escapes.

The one substantive defect is a **broken realtime feature** (High): the unread-mention
badge can only ever populate from the bootstrap fetch; its realtime increment path is
architecturally dead given the current socket room model. Everything else is Medium/Low.

---

## Critical
*(data loss / security / crash / XSS)*

None.

Explicitly cleared:
- **XSS (pills + body):** `renderBodyWithMentions` (MessageList.tsx:86-122) splits the
  string and renders each segment as `<span key>{part}</span>` / `@{ref.username}` — all
  via React children, which HTML-escapes. No `dangerouslySetInnerHTML` anywhere in the diff.
- **my-mentions authz / param leak:** controller (messages.controller.ts:57-65) takes only
  `cursor` + `limit`; `viewerUserId = req.session.getUserId()`. Service hard-filters
  `mentioned_user_id = viewerUserId` (messages.service.ts:773) AND re-joins
  `server_members.user_id = viewerUserId` (807-815). No cross-user read path.
- **SQL injection:** all dynamic values go through drizzle parameter binding, including the
  `inArray(sql\`lower(${users.username})\`, tokens)` (messages.service.ts:181) and cursor
  comparisons. `tokens` come from `parseMentions` which restricts to `[a-zA-Z0-9_-]+`.
- **ReDoS:** `/(?:^|\s)@([a-zA-Z0-9_-]+)/g` (mentions.ts:35) and `@\S+` (MessageList.tsx:98)
  have no nested/overlapping quantifiers — linear time, no catastrophic backtracking.

---

## High
*(broken feature / contract / null-handling gap)*

### H-1 — Realtime unread-mention badge is effectively dead; only bootstrap populates it
**Files:** `apps/web/src/shell/useMentionBadge.ts:128-138`, `apps/web/src/shell/useMessages.ts:72-110`, `apps/api/src/messaging/messaging.gateway.ts:146-148`

The realtime increment path can never fire:
- The Socket.IO client joins **exactly one room at a time** — the active channel
  (`useMessages.ts:83-87` leaves the previous channel and joins the new one). There is no
  per-user room; the gateway fans `message:new` out only `to(channel:${channelId})`
  (gateway.ts:148).
- `useMentionBadge`'s realtime listener (useMentionBadge.ts:130-135) then **explicitly skips
  the active channel**: `if (msg.channelId === activeChannelId) return;`.

So the only `message:new` events the client receives are for the active channel — the exact
channel the badge logic ignores. A mention that arrives in any **non-active** channel
produces no socket event at all (client isn't in that room), so `increment()` is never
called for it. The badge therefore only ever reflects the **bootstrap** snapshot taken once
on mount (`bootstrap()`, useMentionBadge.ts:70-98, guarded by `_bootstrapped`), and never
updates live. The headline "realtime unread badge" feature does not work as specified.

Fix direction (B-stage): give each connected socket a per-user room (e.g.
`socket.join(\`user:${userId}\`)` in `handleConnection`) and fan mention notifications to
`user:<mentioned_user_id>` independent of channel room membership; the client subscribes
once. Alternatively, auto-join all member channel rooms on connect. Either is a B-2/B-3
change, not a fast-fix.

### H-2 — `_bootstrapped` singleton never resets → stale badges across login/logout and no refresh
**File:** `apps/web/src/shell/useMentionBadge.ts:68-98, 35`

`_bootstrapped` and `_counts` are module-level singletons that are never reset. Consequences:
- After logout + login as a **different user** in the same tab, `bootstrap()` short-circuits
  on `_bootstrapped === true`, so the new user sees the **previous user's** `_counts` (a
  cross-user data-correctness/privacy bug short of a security boundary breach, since counts
  are just integers per channel — but the displayed badge is wrong for the new user).
- Even for the same user, the badge is seeded **once per page load** and (given H-1) never
  refreshes, so it goes stale immediately.

Fix direction: reset `_bootstrapped` + `_counts` on viewer-identity change (key the store by
viewer, or expose a reset wired to the auth/logout flow).

---

## Medium
*(correctness edge / drift / robustness)*

### M-1 — Migration index omits `DESC`; comment and schema claim `created_at DESC`
**Files:** `apps/api/drizzle/migrations/0007_massive_chamber.sql:11`, `apps/api/src/db/schema/messages.ts:87,106`

Schema comment and table-builder comment both say `INDEX(mentioned_user_id, created_at DESC)`,
but the generated SQL is `... USING btree ("mentioned_user_id","created_at")` (ASC). The
my-mentions query orders `created_at DESC, id DESC` (messages.service.ts:817). Postgres can
still scan a btree backwards, so this is not a correctness bug, but the index does not match
its documented intent and the "fast my-mentions lookup ordered by recency" rationale is
weaker than stated (and the `id` tiebreaker isn't in the index at all). Low-risk; worth
aligning the comment to reality or regenerating with the intended ordering.

### M-2 — Display-text `@token` extraction can mis-tag adjacent text as a mention pill
**File:** `apps/web/src/shell/MessageList.tsx:98-104`

`renderBodyWithMentions` splits on `/(@\S+)/` then strips trailing `[.,!?;:)]+`. Cases that
diverge from the server-side parser (`mentions.ts`, which requires a whitespace/BOL boundary
*before* `@` and allows only `[a-zA-Z0-9_-]`):
- Mid-word `@`: `"email a@bob"` → split yields `"a@bob"` which does NOT `startsWith('@')`, so
  it's fine. But `"foo@bob bar"` likewise stays plain — OK.
- A token like `@bob_smith.dev`: `\S+` captures `bob_smith.dev`, strips trailing `.dev`? No —
  the strip only removes the trailing-punctuation *run* at the very end; interior `.` stays,
  so `raw = "bob_smith.dev"`, which won't match a stored username `bob_smith` → renders as
  plain text even though the server stored a mention for `bob_smith`. The pill silently
  doesn't render for that message. Cosmetic, but it's a parser-divergence between client
  render and server resolve. Consider reusing a shared tokenizer.

### M-3 — Non-idempotent create path can attach mentions to the wrong row under concurrency
**File:** `apps/api/src/messaging/messages.service.ts:280-305`

When `idempotencyKey === null`, the canonical row is re-selected by
`(channel_id, author_id, content, idempotency_key IS NULL) ORDER BY created_at DESC LIMIT 1`
(282-296). If the same author posts two **identical** messages to the same channel in quick
succession with no idempotency key, the second `createMessage` can resolve `message` to the
*other* insert's row, and mentions get attached/duplicated against it. The
`message_mentions` UNIQUE(message_id, mentioned_user_id) + ON CONFLICT DO NOTHING bounds the
blast radius (no duplicate rows), but the mention rows can land on the wrong message id.
Pre-existing wave-12 best-effort pattern; mentions inherit its fragility. Low real-world
likelihood; note for hardening (prefer `.returning()` on the insert).

### M-4 — Edit-diff delete+insert is not wrapped in a transaction
**File:** `apps/api/src/messaging/messages.service.ts:410-430`

`editMessage` does a `DELETE` of removed mentions then a separate `INSERT` of added ones with
no enclosing transaction. A failure between the two (or concurrent edits of the same message)
can leave a partially-updated mention set. The UNIQUE constraint prevents dupes, and the next
successful edit reconverges, so this is not data loss — but a `db.transaction()` wrapper would
make the diff atomic and is cheap. Mirror it for the create-path insert too if M-3 is touched.

---

## Low
*(polish / consistency / minor leak)*

### L-1 — Global capture-phase `keydown` listener on `document` for every open popover
**File:** `apps/web/src/shell/MentionAutocomplete.tsx:234-240`

The autocomplete attaches its keyboard handler to `document` in capture phase rather than to
the textarea. Cleanup is correct (the effect returns `removeEventListener`), so no leak. But
capturing Enter/Arrow/Escape at the document root while open is a broad surface — any other
focused interactive element on the page (e.g. a modal that opens over the composer) would have
its arrow/enter intercepted while the popover is mounted. The component comment itself flags
this as a "ref trick / for simplicity" shortcut. Prefer forwarding keydown from the textarea
(MessageComposer already has `handleKeyDown`) via an imperative handle or callback prop.

### L-2 — `handleBlur` 150ms `setTimeout` to dismiss popover has no cleanup
**File:** `apps/web/src/shell/MessageComposer.tsx:230-236`

The blur-dismiss timer isn't cleared on unmount; if the composer unmounts within 150ms of
blur, `setMentionQuery(null)` fires on an unmounted component (React 18 no-ops it, so harmless
today). Minor; clear the timeout on unmount for cleanliness.

### L-3 — Redundant `server_members.user_id = viewerUserId` predicate in my-mentions
**File:** `apps/api/src/messaging/messages.service.ts:775 + 811-814`

The membership scope is asserted both in `baseWhere` (775) and again in the JOIN-ON (811-814).
Harmless (planner dedupes), but the duplication invites future drift if one is edited and not
the other. Keep only the JOIN-ON predicate.

### L-4 — Self-mention badge counts the author's own mention at bootstrap
**Files:** `apps/web/src/shell/useMentionBadge.ts:79-83`

Bootstrap counts any item whose `mentions[]` includes `viewerUsername`, including messages the
viewer **authored** that @-mention themselves. The realtime path guards the active channel but
not authorship; bootstrap guards neither. A user who @-mentions themselves then reloads will
see a phantom unread badge on that channel. Minor UX; filter out `msg.authorId === viewerId`
(needs author-id/username comparison — note MainColumn passes `profile.username` as both
`currentUserId` and `viewerUsername`, so author identity is available).

### L-5 — `MyMentionsResponse.nextCursor` is `.nullish()` while `MessageList.nextCursor` is `.nullable()`
**File:** `packages/shared/src/messaging.ts:165 vs 111`

Inconsistent nullability across the two paginated responses (`nullish` allows `undefined`,
`nullable` does not). The service always returns `string | null` (messages.service.ts:846), so
`nullish` is over-permissive but harmless. Align to `.nullable()` for contract consistency.

---

## Out of scope (informational, not in this diff)

- **Pre-existing `message:deleted` payload mismatch:** gateway emits the full `MessageResponse`
  DTO (gateway.ts:175-177, has `.id`) but the client `MessageDeletedPayload` type +
  `onMessageDeleted` handler read `payload.messageId` (messagingSocket.ts:28-31). `payload.messageId`
  is `undefined` at runtime; the wave-13 soft-delete tombstone is matched by an undefined id.
  These files are NOT in the wave-15 diff — flagging for a separate wave-13 follow-up, not a
  wave-15 gate blocker.

---

## Gate recommendation

- **H-1** and **H-2** are broken-feature / correctness defects in the headline "realtime unread
  badge." Per B-6 contract, **High findings re-enter B-stages** (H-1 = B-2 gateway + B-3 client;
  H-2 = B-3 client). Recommend **REWORK** scoped to the badge realtime/lifecycle.
- Backend mention parse/resolve/persist/edit-diff/my-mentions and all pill rendering are
  ship-ready; no Critical, no security issue, no XSS.
- M-1..M-4 and L-1..L-5 are carries (fix opportunistically during the H-1/H-2 rework).

---
---

# B-6 RE-REVIEW (iteration 2) — H-1 + H-2 fix verification

**Reviewer:** code-reviewer (B-6 /review substitute)
**Scope:** verify commits `09f138a` (backend per-user room + mention event) + `1f4bc30` (client badge wiring + logout reset) — READ-ONLY
**Files re-read:** `apps/api/src/messaging/{messaging.gateway.ts, messages.service.ts}`, `apps/web/src/shell/{useMentionBadge.ts, messagingSocket.ts, ProfileContext.tsx}`, `packages/shared/src/messaging.ts` (MentionEvent)

## Verdict: both HIGH findings genuinely cleared; no new Critical/High introduced.

---

## H-1 — Realtime unread-mention badge → CLEARED

The dead-path problem is fully resolved. The signal now travels on a dedicated per-user room independent of channel membership:

- **Per-user room join on connect:** `handleConnection` (gateway.ts:93-108) calls
  `socket.join(\`user:${userId}\`)` for every authenticated socket, immediately after the
  WS-auth middleware sets `socket.data.userId`. `userId` is session-derived (not client-supplied),
  so no room-spoofing surface.
- **Mention event reaches the mentioned user regardless of active channel:** `@OnEvent('mention.created')`
  (gateway.ts:238-244) emits `mention` to `user:<mentionedUserId>` — decoupled from any
  `channel:<id>` room. The mentioned user receives it whether or not they have joined that channel's room.
- **Per-recipient emit + author exclusion (server-side):** `createMessage` (messages.service.ts:335-347)
  and `editMessage` (479-491) loop over resolved mention values, `continue` on
  `mentioned_user_id === authorId/userId`, and emit one `mention.created` per remaining recipient.
  The author never receives a self-badge — and the exclusion is enforced on the server, so the
  client needs no authorship check.
- **Client subscribe + active-channel suppression:** `useMentionBadge` (useMentionBadge.ts:165-173)
  subscribes via `onMention()` (messagingSocket.ts:152-158), and suppresses the active channel via
  `if (e.channelId === activeChannelRef.current) return` before `increment()`. The `activeChannelRef`
  is kept current by a separate effect (142-145) so suppression tracks the open channel without
  re-subscribing the socket listener.
- **Bootstrap retained:** `bootstrap()` (84-116) still seeds from `GET /me/mentions` for
  offline-arrived mentions; it now coexists with the live path rather than being the only source.

Cross-channel mention signal is live and correctly targeted. H-1 closed.

## H-2 — Singleton reset on identity change → CLEARED

- **Reset primitive:** `resetMentionBadges()` (useMentionBadge.ts:77-82) clears `_bootstrapped`,
  `_bootstrappedForUser`, and `_counts`, then `notify()`s subscribers.
- **Bootstrap now keyed by user:** the short-circuit is `_bootstrapped && _bootstrappedForUser === viewerUsername`
  (line 87) — a different username re-bootstraps even absent an explicit reset, so a stale count
  cannot survive a user switch.
- **Reset wired at two layers:** `ProfileContext` (ProfileContext.tsx:50-56) fires `resetMentionBadges()`
  whenever `profile.username` transitions (including → null on logout); the hook-level guard
  (useMentionBadge.ts:147-155) duplicates it defensively. Both skip the initial-mount transition
  (`prevUsernameRef === undefined`), so no spurious reset on first render. Calling reset twice is
  idempotent (sets the same empty state), so the double-wiring is harmless.

No cross-user leak in-tab. H-2 closed.

---

## Critical
None.

## High
None. New-issue scan (per re-review checklist) cleared:

- **Unhandled-rejection in the per-recipient emit loop:** `eventEmitter.emit('mention.created', …)`
  is synchronous and `handleMentionCreated` returns `void` synchronously (gateway.ts:239) — no
  floating promise, no rejection path. Safe.
- **Per-user room leak on disconnect:** Socket.IO removes a socket from all its rooms automatically
  on disconnect; no manual `leave` needed and none is missing. No leak.
- **`onMention` cleanup on unmount:** the effect returns `unsub` (useMentionBadge.ts:171) →
  `socket.off('mention', handler)` (messagingSocket.ts:155-157). Listener is removed on unmount and
  on `viewerUsername` change. No accumulation.
- **Bootstrap-vs-live double count:** addressed below as new **L-6** (Low) — a transient over-count
  on the narrow overlap window, self-correcting on channel-open. Not High.

---

## Carried Medium/Low — none escalated

All prior carries re-confirmed as accepted, non-blocking, and unchanged by the fix commits:

- **M-1** (migration index omits `DESC`) — unchanged; backward btree scan still correct. Accepted.
- **M-2** (client `@token` extraction mis-tags interior-dot usernames) — unchanged; cosmetic
  render divergence only. Accepted.
- **M-3** (non-idempotent create re-select under identical concurrent posts) — unchanged;
  pre-existing wave-12 pattern, UNIQUE+ON CONFLICT bounds blast radius. Accepted.
- **M-4** (edit-diff delete+insert not transactional) — unchanged; reconverges on next edit,
  no data loss. Accepted. Note: the mention-event emit loop on edit (479-491) fires only for
  `toInsert`, so a partial diff would at worst under-notify, never spuriously notify — does not
  raise M-4's severity.
- **L-1** (document-level capture keydown), **L-2** (blur timeout no cleanup), **L-3** (redundant
  membership predicate), **L-4** (self-mention bootstrap count), **L-5** (`nullish` vs `nullable`
  contract drift) — all unchanged, all accepted.

### L-6 (new, Low) — bootstrap/live overlap can transiently double-count one channel
**File:** `apps/web/src/shell/useMentionBadge.ts:51-54, 95-111`

If a mention both (a) arrives via the live `mention` socket event and (b) appears in the
`GET /me/mentions` bootstrap page that resolves shortly after, it is counted twice: once by
`increment()` and once by the bootstrap accumulation merge (`_counts[ch] = (_counts[ch] ?? 0) + n`).
The window is narrow (only the gap between mount and the bootstrap fetch resolving), and the count
self-corrects to 0 the moment the user opens that channel (`clearChannel`). Cosmetic transient
over-count; not a correctness or security issue. De-dup by `messageId` if hardened. Logged as Low,
non-blocking.

---

## Gate recommendation (re-review)

- **H-1 CLEARED, H-2 CLEARED.** No Critical, no High remaining. New-issue scan clean.
- Carries: M-1..M-4, L-1..L-5 accepted unchanged; one new Low (L-6) logged.
- Recommend **APPROVED** for B-6 exit. Carries roll forward as opportunistic debt.
