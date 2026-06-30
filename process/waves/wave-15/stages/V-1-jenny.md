# V-1 Semantic-Spec Verification (jenny) — wave-15 M3 @mentions

**Reviewer:** jenny (spec-compliance auditor) — independent, no awareness of any other reviewer
**Date:** 2026-06-30
**Wave:** 15 (multi-spec, 3 tasks) — M3 @mentions
**Authoritative spec:** `tasks.description` of `3d238446-25b9-4c3d-91ca-0fc3dbae17f2` (DB; convenience copy `process/waves/wave-15/stages/P-2-spec.md`)
**Deployed:** api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app` (PR#27 merge `fd86540`)
**Code state verified:** HEAD `c3b46f0`. `git diff --stat fd86540 HEAD -- apps/api/src/messaging apps/web/src/shell packages/shared` = **empty** — the source files audited below are byte-identical to what is deployed. (HEAD adds only T-block test + journey-doc commits on top of the deployed feature commit.)
**Live probes:** `GET /me/mentions` (no auth) → **401** (authz gate live); web root → **200**.

---

## VERDICT: APPROVE

All three specs MATCH the deployed implementation. The two load-bearing chains called out in the prompt are confirmed end-to-end:
- **autocomplete-token ↔ resolver chain MATCHES** — autocomplete inserts `member.username` (the canonical handle the resolver matches against `users.username`), NOT a displayName-derived token. The B-4 fix is in place.
- **mention-realtime semantics MATCH spec** — per-user room (`user:<userId>`), reuses the existing `/messaging` namespace (no new namespace), one emit per recipient, author excluded server-side, decoupled from channel-room fan-out.

No DRIFTS found. Pre-existing coverage GAPS (carried, non-blocking) are catalogued at the end for V-2 disposition; none contradict the deployed behavior.

---

## Spec 1 — `3d238446` data plane (parse/resolve/persist + realtime + my-mentions)

**MATCHES.** Evidence per acceptance-criterion:

- **AC1 parse word-boundaried + member-only resolve; non-member → plain.** MATCHES.
  - Parser `apps/api/src/messaging/mentions.ts:35` — `/(?:^|\s)@([a-zA-Z0-9_-]+)/g`: triggers only at start-of-string or after whitespace (mid-word `a@b` excluded), captures the username slug, dedupes lowercase. Matches spec grammar exactly.
  - Resolution `messages.service.ts:161-190` (`resolveMentions`): JOINs `server_members ⋈ users` filtered by `server_members.server_id = serverId` AND `users.username IS NOT NULL` AND `lower(username) = ANY(tokens)`. Only members of the channel's server resolve; unknown/non-member tokens produce no row → stay plain text. Server-scope is the security invariant from the spec's §SECURITY (2).
  - Called on BOTH create (`messages.service.ts:306`) and edit (`messages.service.ts:430`).

- **AC2 persist `message_mentions` (UNIQUE) + round-trip on fetch.** MATCHES.
  - Schema `apps/api/src/db/schema/messages.ts:90-108` — `message_mentions(id uuid PK, message_id uuid NOT NULL FK→messages ON DELETE cascade, mentioned_user_id text NOT NULL FK→users, created_at)`, `UNIQUE(message_id, mentioned_user_id)`, index `(mentioned_user_id, created_at)`. Migration `0007_massive_chamber.sql:1-11` is the exact DDL, with `ON DELETE cascade` on `message_id`. **Matches contracts.data spec verbatim** (migration 0007, all columns, the UNIQUE, the index).
  - Persist `messages.service.ts:307-314` — `INSERT ... ON CONFLICT (message_id, mentioned_user_id) DO NOTHING` (idempotent; satisfies edge-case "same user twice → one row").
  - Round-trip — `rowToDto` (`messages.service.ts:127-130`) emits `mentions: [{userId, username}]`; `MessageResponseSchema.mentions` added at `packages/shared/src/messaging.ts:49` with `MentionRef {userId, username}` (`messaging.ts:20-24`). Matches contracts.types (`MessageResponse += mentions: Array<{userId, username}>`).

- **AC3 realtime mention signal over EXISTING `/messaging` gateway (no new namespace).** MATCHES.
  - Gateway `messaging.gateway.ts:55` namespace `/messaging` (unchanged from wave-12). On connect every socket joins `user:<userId>` (`messaging.gateway.ts:107`) — a **room**, derived from the verified session userId (no client spoof). `@OnEvent('mention.created')` (`messaging.gateway.ts:238-244`) emits a `mention` event only `to('user:<mentionedUserId>')`.
  - Service emits one `mention.created` **per mentioned user** (`messages.service.ts:335-347`), with author exclusion (`if (mentioned_user_id === authorId) continue`, line 337). Matches spec's "implementer picks" option — a distinct `message.mentioned`-style event (here named `mention`) rather than riding on `message.created`; the `mentions[]` ALSO rides on `message.created` DTO (`messages.service.ts:319-323`), so both documented options are honored. The per-user room (not a namespace) honors the no-new-namespace decision.

- **AC4 GET /me/mentions — most-recent-first, cursor-paginated, server-scoped, session-derived authz, no cross-user read.** MATCHES.
  - Controller `messages.controller.ts:186-213` (`MentionsController`, route `GET /me/mentions`): `@UseGuards(AuthGuard)`, `viewerUserId = req.session.getUserId()` ONLY — never a query/path/body param (`messages.controller.ts:210`). 401 when unauthed (live-probed → 401).
  - Service `getMyMentions` (`messages.service.ts:790-891`): `WHERE mentioned_user_id = viewerUserId` (no cross-user), JOIN `server_members` on `(channels.server_id, server_members.user_id = viewerUserId)` for membership scoping, `is_deleted = false` (tombstone exclusion), `ORDER BY created_at DESC, id DESC` (most-recent-first), `limit safeLimit+1` opaque cursor pagination. Matches contracts.api (`GET /me/mentions?cursor= → 200 MyMentionsResponse, 401`) and `MyMentionsResponseSchema {items, nextCursor?}` (`messaging.ts:120-124`).

- **AC5 edit add/remove diffing (idempotent).** MATCHES.
  - `editMessage` (`messages.service.ts:421-455`): fetches existing mention IDs, resolves new IDs from updated body, computes `toRemove = existing − new` (DELETE, lines 434-444) and `toInsert = new − existing` (INSERT ON CONFLICT DO NOTHING, lines 447-455). Satisfies edge-cases "edit removing all → all rows gone; adding → new rows." Newly-added mentions also fire `mention.created` (with author exclusion), lines 479-491.

- **Edge cases:** non-member → no row (resolver scope); duplicate → one row (UNIQUE + ON CONFLICT); self-mention persisted but no badge (persisted via resolver; badge exclusion is the author-skip in the emit loop + client never receives a self event); soft-deleted excluded from my-mentions (`is_deleted = false` filter, line 817). All MATCH.

---

## Spec 2 — `cd585f04` autocomplete member-picker

**MATCHES.** Evidence (`apps/web/src/shell/MentionAutocomplete.tsx`):

- **AC1 @-trigger dropdown sourced from server membership (reuse GET /servers/:id/members).** MATCHES — fetches via `api.getServerMembers(serverId)` (`MentionAutocomplete.tsx:132`), the same wave-14 data source (`reuse ServerMember`, contracts.types). @-trigger / email-safety lives in the composer (the file documents "only fires after whitespace … never inside a@b" at the header, consistent with the server-side parser).
- **AC2 keyboard nav: ↑↓ move, Enter selects (NOT sends), Escape dismiss, click select.** MATCHES — `handleKeyDown` (`MentionAutocomplete.tsx:209-228`): ArrowDown/Up wrap with modulo, Enter calls `e.preventDefault()` (explicit comment "Do NOT send the message", line 219) then `handleSelect`, Escape → `onDismiss`. Click → `onClick={() => handleSelect(member)}` (line 316).
- **AC3 filter by username/displayName prefix; avatar + name; empty query capped.** MATCHES — filter `MentionAutocomplete.tsx:151-158` (username `startsWith` OR displayName `includes`, case-insensitive); rows render avatar + displayName + `@username` (lines 329-364); empty query (`!query`) returns all `mentionableMembers` (line 152) — capped by the `max-h-[240px]` overflow-scroll listbox.
- **AC4 closes on selection/Escape/blur/broken token; doesn't block typing/sending.** MATCHES — outside-click close (lines 187-195), Escape (line 222), selection invokes `onSelect` then composer closes. Document-level keydown is `capture`-phase and returns early when `filtered.length === 0` (line 211) so it never swallows normal typing.

- **LOAD-BEARING: inserted token resolves (the B-4 fix).** **MATCHES — CONFIRMED.**
  - `handleSelect` (`MentionAutocomplete.tsx:197-206`) inserts `{ username: member.username }` — `member.username`, the **canonical handle**, NOT a displayName-derived slug. The code comment is explicit: "Use member.username as the canonical @-token — this is the value that resolveMentions matches against users.username in the database" (lines 198-201).
  - Only members with a non-null username are mentionable (`mentionableMembers` filter, line 147-148), so the picker never offers an unresolvable token.
  - **Chain closure:** picker inserts `@<member.username>` → server parser captures `[a-zA-Z0-9_-]+` slug → resolver matches `lower(users.username) = ANY(tokens)` with `username IS NOT NULL`. Insert value === resolver key. The token the autocomplete produces is exactly what the data-plane resolver resolves. Chain is sound.

---

## Spec 3 — `c3f3f62a` pills + unread-mention badge

**MATCHES.** Evidence:

- **AC1 pills; viewer-targeted pill distinct (emerald) emphasis.** MATCHES — `MentionPill` (`MessageList.tsx:118-147`): self pill = `bg rgba(16,185,129,0.10)` + text `#6ee7b7` + emerald outline `rgba(16,185,129,0.30)`; other pill = `bg #27272a` + text `rgba(255,255,255,0.92)`. Self-detection compares `ref.username` to `viewerUsername` case-insensitively (`MessageList.tsx:180-181`). Tokenization `renderBodyWithMentions` (lines 160-196) renders a pill only for `@tokens` present in the server-supplied `mentions[]` (resolved), else plain text — matches "unresolved @token → plain text."
- **AC2 unread-mention badge driven by realtime event + GET /me/mentions; clears on view; no self-badge.** MATCHES — `useMentionBadge.ts`:
  - Realtime: `onMention` subscribes to the `mention` socket event (lines 165-173); the server already excludes the author, so no self-badge (comment lines 162-164). Active-channel suppression (`e.channelId === activeChannelRef.current` → skip, line 169).
  - Bootstrap: `GET /me/mentions` on mount (`bootstrap`, lines 84-116) seeds counts; self-check `msg.mentions.some(m => m.username === viewerUsername)` (line 98).
  - Clears on view: `clearChannel(activeChannelId)` on active-channel change (lines 176-180) + `markChannelRead` (line 184-186).
- **AC3 DESIGN-SYSTEM tokens; viewer pill WCAG AA contrast.** MATCHES — pills use emerald/zinc/surface tokens; journey map records the viewer pill measured at **10.08:1** and other-pill 14.89:1 (both ≥ 4.5:1, DESIGN-PRINCIPLES rule 1). Pills render via escaped React JSX (XSS-safe). [Visual contrast is a T-5/T-8 layout concern; jenny confirms the token values present in code match the adopted design, not re-measuring pixels.]
- **AC4 accurate (no false self-badge; no stale after view).** MATCHES — self exclusion (server-side emit skip + client bootstrap self-check), stale cleared on channel open, H-2 singleton reset on viewer-identity change (lines 77-82, 147-155).

---

## Scope / constraint checks (all confirmed)

- **Stays on the mention primitive (#8); does NOT build a notification-inbox (#14).** CONFIRMED. `GET /me/mentions` is a paginated mention LIST + a per-channel unread COUNT badge — no read/unread persistence, no inbox surface, no "mark all read," no notification entity. Spec §scope ("Notification-inbox surface OUT (feature #14, later milestone)") is honored.
- **@everyone / @role OUT.** CONFIRMED. Parser captures only individual `[a-zA-Z0-9_-]+` username tokens; there is no `@everyone`/`@here`/`@role` branch anywhere in `mentions.ts` or the resolver. Documented at `mentions.ts:11` and `messages.service.ts:155-156`.
- **Reuse-existing-gateway / no-new-namespace (per-user ROOM is not a new namespace).** CONFIRMED. `/messaging` namespace unchanged; `user:<userId>` is a `socket.join()` room, not a `@WebSocketGateway({namespace})`. Explicitly asserted at `messaging.gateway.ts:97-107`.
- **M3 success metric — mentions does NOT close M3 (threads + attachments remain).** CONFIRMED. No thread or attachment code shipped; spec body states "Threads + attachments remain later-M3" and the journey map (line 192-193) records threads/attachments NOT built. Mentions correctly does not close M3.

---

## DRIFT vs GAP ledger

**DRIFTS (deployed behavior contradicts spec):** NONE.

**GAPS (spec-permitted absence / pre-existing coverage holes — non-blocking, carried; flagged for V-2 disposition, not REJECT-worthy):**
- **G1 (MEDIUM, carried 2 waves, task 02fa8011):** No real-Postgres integration tier for `message_mentions` (UNIQUE/cascade/diff exercised against live PG). This is a TEST-COVERAGE gap, not a behavior gap — the constraints exist in migration 0007 and are live. V-2 must issue an explicit disposition.
- **G2 (MEDIUM, T5-F1):** Playwright MCP swarm blocked by absent chrome channel; UI verified via bundled chromium instead. Tooling gap, not a feature gap.
- **G3 (LOW, observation, B-6 carry M-2):** Client tokenizer `renderBodyWithMentions` (`MessageList.tsx:172,177`) splits on `/(@\S+)/` then strips trailing `[.,!?;:)]+`, whereas the server parser captures `[a-zA-Z0-9_-]+`. For interior punctuation (e.g. `@al.ice`) the client `\S+`/strip logic and the server slug logic can diverge on which substring is treated as the handle. Pills only render for tokens present in the server `mentions[]`, so a divergence degrades to plain text (no false pill, no security impact) — cosmetic at worst. Pre-accepted B-6 carry; not a spec DRIFT.

None of G1–G3 contradict a spec acceptance-criterion; they are absence-of-coverage or pre-accepted minor divergences. Per the DRIFT-vs-GAP distinction they do not block APPROVE.

---

## Cross-agent notes
- TEST-COVERAGE gap G1 is for **@head-verifier** to route at V-2 (explicit accept/defer disposition) — it is a known 2-wave carry, not new.
- Behavior is fully spec-compliant; no rework needed from a semantic-spec standpoint.

**FINAL: APPROVE** — 3/3 specs MATCH; autocomplete-token↔resolver chain confirmed sound; mention-realtime semantics (per-user room, no new namespace, author-excluded, one-emit-per-recipient) match spec; scope/constraint guards (#8 not #14, @everyone OUT, M3 not closed) all honored.
