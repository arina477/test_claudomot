# V-1 Jenny — Semantic-Spec Verification — wave-46 (M8 Direct Messages, slice 1)

**Lane:** Does DEPLOYED BEHAVIOR match the SPEC CONTRACT's intent (semantic, beyond literal AC wording the T-block tested)? Independent of Karen's source-claim lane.
**Spec source of truth:** `tasks.description` YAML head of `a48f1910-473f-4a4a-bed6-385ec8d8c2d3` (DB row read live). 4 specs: `a48f1910` (schema+backend+who_can_dm), `32f5d29e` (Socket.IO fan-out), `1ceffdc9` (DM UI), `d8264800` (offline outbox).
**Deployed targets:** web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`
**Fixtures used:** userA `studyhall-e2e-fixture@example.com` (id `21984eb2-8029-4c1b-9e73-bc586a0be4d2`, username `studyhallfixturea`). **userB password from the fixture family is WRONG** (`/auth/signin` → `WRONG_CREDENTIALS_ERROR`) — so live probing was single-token (A). userB's id `da74148e-132e-4faf-a526-a34c28e7481b` is present as A's DM peer + a co-member of "Fixture Proof Server" (`ad62cd12…`, roster "Online — 2"). Two-client realtime + the full 3-policy who_can_dm matrix are therefore taken from the surviving prod message record + T-block, not freshly re-driven with a second live token.
**Note on DB access:** `CLAUDOMAT_DB_URL` points to the BRAIN db (`founder_bets/milestones/tasks/waves`), NOT the StudyHall app db. DM schema was verified via observable API contract (correct V-1 stance), not direct table inspection.

---

## Verdict summary

Backend spine is semantically strong and largely spec-conformant (idempotency, cap, self/empty rejects, find-or-create, IDOR 404-no-leak, who_can_dm enforcement live, outbox generalization non-regressing). **The UI layer has multiple confirmed defects that break the spec's stated UX intent**, the most serious being that **a new DM is effectively unstartable through the UI from its own entry point** (picker sources zero candidates), plus the T-block's F6/F7/F-C1 UI defects independently reproduced live, plus F-I4 cursor boundary duplication independently reproduced live.

---

## Spec a48f1910 — schema + participant-gated backend + who_can_dm

### AC1 — create 1:1 / small-group, cap, DTO — MET (live)
- 1:1 create `POST /dm/conversations {participantIds:[B]}` → 200, `isGroup:false`, exactly 2 participants. **Find-or-create confirmed**: repeated create returned the SAME id `5f62052f…` (no dup). Evidence: two POSTs both returned `id:5f62052f-a60a-4c33-b49e-830dbae92620`.
- Cap: body of 10 others (11 total) → 400 `"Total participants must not exceed 10 (including yourself)"`.
- DTO on create = `{id,isGroup,participants[],lastMessage,createdAt}`. `lastMessage` is ADDITIVE vs the AC's enumerated `(id,isGroup,participants,createdAt)` — not a violation.

### AC2 — who_can_dm ENFORCED at create — MET (enforcement path live), matrix partially proven
- `everyone` path: A (whoCanDm=`everyone`) → B → 200 (allowed).
- Reject path: create to unreachable target `99999999-…` → **403** `"User … not found or cannot receive direct messages"` — whole-create fails 403 with a policy-naming message, no partial conversation. This is the NEW enforcement firing (not stored-but-unenforced).
- **Coverage note (not a finding):** the full 3-branch matrix (`server-members`=shared-server allow vs no-shared reject; `nobody`=reject to a *real* user who set it) could not be freshly re-driven live because userB's token is unavailable and I did not mutate other users' privacy. The `everyone`-allow + generic-reject legs are proven live; the server-members/nobody legs rest on T-block coverage + the live-proven reject code path. Recommend V-2 re-drive with a working second fixture.

### AC3 — list conversations, last-message preview, recency, empty — MET (live)
- `GET /dm/conversations` → 200 `{conversations:[{id,isGroup,participants[],lastMessage{content,createdAt,authorId},createdAt}]}`. Ordering by last-message recency observed (preview flipped to newest send after each message).

### AC4 — send message, participant-gated, idempotent — MET (live)
- **Idempotency PROVEN**: two POSTs with same `idempotencyKey`, second with DIFFERENT content (`"idem test A CHANGED"`) → SAME id `b931fca8…` AND the ORIGINAL content returned; no dup row. Server truth cross-checked: after a UI send, `GET …/messages` returned exactly 1 row for the probe text (id `51865496…`).
- IDOR write: non-participant `POST …/00000000-…/messages` → **404 `"Conversation not found"`** (no existence leak). Unauth → 401.

### AC5 — list messages, participant-gated, ordered oldest→newest, cursor honored
- Ordering oldest→newest: MET (full page returned 23 msgs ascending by createdAt).
- Cursor: composite base64 of `createdAt|id` (good design — id tiebreaker). **BUT cursor is NOT honored correctly — see F-I4 below.**
- IDOR read: non-participant / random-uuid → 404 (same envelope as nonexistent, no oracle). Control: participant read → 200.

### 🔴 F-I4 — cursor boundary DUPLICATION — **spec-DRIFT, HIGH** (independently CONFIRMED)
Spec a48f1910 AC5: *"ordered oldest→newest within the page; cursor honored."*
Live evidence: `GET …/messages?limit=5` → nextCursor decodes to `2026-07-04T11:13:03.695Z|e8cba73c-…`. Page 2 via that cursor returns `e8cba73c-…` (`.695Z`) **as its FIRST row** — identical to page 1's LAST row. Walking all 6 pages of the 23-message thread emitted **28 rows = 23 unique + 5 duplicate boundary rows** (one dup per page turn). The WHERE clause is inclusive (`(created_at,id) >= cursor`) where it must be strict (`>`).
- **T-block F-I4 half-confirmed:** the DUPLICATION half is real and reproduced. The *"drops the last message"* half did NOT reproduce here — 0 messages were dropped (last msg `b931fca8…` reachable), all 23 unique reachable. The composite id-tiebreaker prevents the drop; the `>=` vs `>` bug still re-shows the boundary. User-visible impact: every page turn shows one duplicate message. **spec-DRIFT** (code wrong, not spec).

### Schema (AC6) — MET (inferred from observable contract)
Message DTO `{id,conversationId,authorId,content,createdAt}` + idempotency dedup behavior + cursor(created_at,id) index behavior are all consistent with the specified `dm_messages` shape incl. `UNIQUE(conversation_id,idempotency_key)` and `INDEX(conversation_id,created_at)`. (Direct table inspection N/A — brain db, not app db.)

---

## Spec 32f5d29e — Socket.IO `dm:message` fan-out

- Socket.IO transport LIVE in the authed browser session (sid `uA-JhBs1cYvuVcOvAAAs`, polling+ws).
- Two-way delivery evidenced by the surviving prod thread: RT-PING (A-authored) / RT-PONG (B-authored) pairs — a message authored by B is present in A's thread, i.e. cross-client fan-out delivered. AC1/AC2 (participant-scoped fan-out to the OTHER online participant) proven-live-adjacent via that record + T-block two-client run.
- **AC/edge "sender's own client uses optimistic render + reconcile, NOT the fan-out echo" — VIOLATED. See F6 below.**

---

## Spec 1ceffdc9 — minimal DM UI

### AC1 — reachable list + thread + composer — MET structurally (live)
- "Direct Messages" button in the server rail (aria-label) opens a DM home with a `Direct Messages` heading, a conversation LIST, a THREAD view (message rows w/ timestamps), and a COMPOSER textarea. All present and functional (message send lands server-side).

### 🔴 AC2 — START-DM affordance ("the feature's entry point; without it DMs are unstartable") — **spec-DRIFT/GAP, CRITICAL**
The "Start Direct Message" button opens the picker, BUT the picker sources candidates ONLY from a single `serverId` prop = `useServers().selectedId` (`apps/web/src/shell/StartDmPicker.tsx:108-119`, `apps/web/src/shell/DmHome.tsx:23,105`). The picker's own doc-comment admits *"falls back to empty if no server selected"* (`StartDmPicker.tsx:8`).
- Live: opening the picker from the DM home shows **"Join a server to find people to message." and ZERO candidates** even though A owns/shares many servers (incl. Fixture Proof Server co-membered with B, "Online — 2"). Typing `studyhall` in the search yields no candidates. NO network call is made to fetch people (`browser_network_requests` shows only `/dm/conversations`).
- Root cause is structural, not transient: **the DM home and a selected-server context are mutually exclusive views** — selecting any server navigates to that server's channel view and unmounts the DM home + its Start button. So the picker opened from the DM home is *guaranteed* `serverId=null` → empty. There is no reachable UI path that gives the picker a non-null server.
- **Impact:** a brand-new DM is effectively **unstartable through the UI** — the exact failure AC2 names ("without it DMs are unstartable"). Existing conversations still open/send fine; only *starting a new one* is blocked. **spec-DRIFT** (the picker exists but is wired to a data source that's always empty at its entry point) bordering on spec-GAP (the spec didn't pin down where candidates come from when no server is active). **CRITICAL** — the feature's entry point is non-functional.
- who_can_dm-in-picker gating (AC2 "not selectable / clear reason") is therefore **unverifiable live** — no candidates ever render to gate.

### 🔴 F6 — sender's own message DOUBLE-RENDERS — **spec-DRIFT, HIGH** (independently CONFIRMED)
Spec 1ceffdc9 AC3: *"optimistically renders … then reconciles … (no dup, correct ordering)"*; spec 32f5d29e edge: *"sender's own client uses optimistic render + reconcile, not the fan-out echo."*
Live: sending `V1-UISEND-probe-msg` via the composer rendered it **TWICE simultaneously** and stably (still 2 after 3s):
- Row A: `"Unknown user … 12:17 PM V1-UISEND-probe-msg"` (optimistic copy)
- Row B: `"21984eb2-… 12:17 PM V1-UISEND-probe-msg"` (reconciled/echo copy)
**Server truth = exactly 1 row** (`GET …/messages` → 1 hit, id `51865496…`); a full reload collapses the UI to 1 row. So this is a **client-side reconcile bug** — the optimistic entry is never matched-and-replaced against the incoming server message (likely the optimistic temp-id ≠ server id and the echo isn't dedup'd by idempotencyKey). Idempotency/dedup is correct server-side; the CLIENT fails the "reconcile, not echo" contract. **spec-DRIFT**, HIGH (persists for the whole live session until reload).

### 🔴 F7 — optimistic author renders "Unknown user" — **spec-DRIFT, MEDIUM** (independently CONFIRMED)
The optimistic copy of the sender's OWN message is authored **"Unknown user"** (avatar initials "UU") — the client can't resolve the sender's own display name at optimistic-render time. This is the F6 partner symptom. After reload it's gone (server row shows the author). Contradicts the calm/correct-author UX intent. **spec-DRIFT**, MEDIUM. (Note: F7 as the T-block phrased it — "Unknown user on some *delivered* rows" — did NOT reproduce on delivered/persisted rows; it reproduced specifically on the OPTIMISTIC row.)

### 🔴 F-C1/F3 — displayName is the raw userId UUID (UI leaks UUID) — **spec-DRIFT, HIGH** (independently CONFIRMED)
Spec a48f1910 participant DTO + 1ceffdc9 AC1 ("participant name(s)"). Live, the server returns `displayName` = the raw userId UUID for BOTH participants — e.g. `{"userId":"21984eb2-…","displayName":"21984eb2-…"}` — even for A whose `username` `studyhallfixturea` is known (`GET /profile` returns it). This UUID leaks into the UI everywhere:
- conversation-list item name: `21984eb2-…` (avatar initials "21")
- thread heading: `21984eb2-…` (and it shows A's OWN uuid as the 1:1 title, i.e. the WRONG participant — a 1:1 title should be the PEER)
- composer placeholder: `"Message 21984eb2-…"`
- every message-row author label (both `21984eb2` and `da74148e`), persists across reload.
This is a **server-side DTO defect** (displayName should fall back to `username` then userId, per the wave-29 `displayName || userId` pattern used elsewhere) surfacing as a UI UUID leak. **spec-DRIFT**, HIGH — it makes the feature look broken to any user and violates the "participant name(s)" intent. (Precedent: wave-29 fixed this exact class for server rosters/presence; DM DTOs regressed the fallback — likely mapping `display_name` straight to userId with no `username` fallback.)

### AC4 — empty states — NOT verified live (had existing data)
A had an existing conversation, so "No direct messages yet" and empty-thread states weren't exercised live. Component copy exists (`DmConversationList.tsx`, `StartDmPicker` "No members to message."). Low-risk; note for V-2 with a fresh fixture.

---

## Spec d8264800 — offline-tolerant outbox (routing-key generalization)

### MET (source + design confirmed; live offline-toggle not driven)
- `apps/web/src/features/sync/outbox.ts`: `OutboxTarget` discriminator `{kind:'channel',channelId} | {kind:'dm',conversationId}`; `SendFn` dispatches by kind → `POST /channels/:id/messages` vs `POST /dm/conversations/:id/messages`.
- **Non-regression guard present:** legacy `channelId` field retained for Dexie index + backward compat; **pre-wave-46 rows lacking `target` fall back to `{kind:'channel', channelId}`** (`outbox.ts:195-198`). This satisfies "WITHOUT regressing existing channel-message offline send."
- Exactly-once on flush relies on server idempotency — which is PROVEN live (AC4 above, same-key→same-id, dedup). So a double-flush dedups to one row (matches AC "double-flush → server idempotency dedups, exactly-once").
- **Not driven live:** the actual offline→online transition + pending-state UI (AC4) was not exercised (no reliable offline toggle in the hosted MCP session). Design + server-idempotency backing are sound; recommend V-2 drive the offline path if a fixture-B two-client harness is stood up.

---

## User-journey continuity

- start-DM picker → **DEAD-END at the entry point** (F-C1 gap above): from the DM home you cannot select any recipient. Existing-thread journeys (list → open thread → send/receive → list reorder) work.
- No broken back-button, no white-screen, no unhandled console error (only a benign PWA manifest-icon 404 warning).
- **UUID-shown-as-name leak is pervasive** across list/thread/composer (F-C1/F3).
- Double-render (F6) + "Unknown user" (F7) degrade the send experience until reload.

---

## Spec-gap detection (for next-wave P-2)

1. **Picker candidate source is under-specified.** Spec 1ceffdc9 AC2 says "pick 1 recipient (1:1) or several" and "respecting who_can_dm" but never says WHERE candidates come from when the user is at the DM home with no active server. The implementation defaulted to `selectedServer.members`, which is empty at the DM home. P-2 should specify a candidate source that is populated at the DM entry point (e.g. a `GET /dm/candidates` = union of co-members across all my servers, who_can_dm-filtered) — otherwise DMs stay unstartable.
2. **displayName fallback contract for DM DTOs was not restated.** The `displayName || username || userId` fallback (wave-29) is a project convention; the DM spec didn't pin it, and the DM DTO mapper dropped it. P-2 should make displayName-resolution an explicit AC for any new user-bearing DTO.
3. **Optimistic-reconcile keying.** Spec says "reconcile … not the echo" but doesn't pin the dedup key (idempotencyKey vs temp-id↔server-id). The client double-renders because the key wasn't nailed down. P-2 should specify the reconcile join key.
4. **Cursor comparator strictness.** AC5 says "cursor honored" but not strict-vs-inclusive; the composite (createdAt,id) with `>=` re-emits the boundary. P-2 should specify strict tuple `>`.

---

## JENNY VERDICT: REJECT

Enumerated findings (severity):

1. **F-A (CRITICAL, spec-DRIFT/GAP)** — Start-DM picker sources ZERO candidates at its only entry point (DM home always has `serverId=null`; server selection unmounts the DM home). A new DM is **unstartable through the UI** — directly violates spec 1ceffdc9 AC2 "without it DMs are unstartable." `StartDmPicker.tsx:108-119,281-287` + `DmHome.tsx:23,105`.
2. **F-C1/F3 (HIGH, spec-DRIFT)** — `displayName` returned as raw userId UUID for all participants (even self, whose username is known); UUID leaks into conversation list, thread title (which also shows self not peer for 1:1), composer placeholder, and every message-row author, persisting across reload. Server-side DTO fallback (`displayName||username||userId`) dropped. Violates a48f1910 participant DTO + 1ceffdc9 "participant name(s)".
3. **F6 (HIGH, spec-DRIFT)** — Sender's own message double-renders (optimistic + echo) and does not reconcile; stable until reload; server truth = 1 row. Violates 1ceffdc9 AC3 + 32f5d29e "reconcile, not the fan-out echo."
4. **F-I4 (HIGH, spec-DRIFT)** — Cursor pagination re-emits the boundary message on every page turn (`>=` where `>` is required); 28 emitted vs 23 unique across 6 pages. Boundary DUPLICATION confirmed; the T-block's "drops last message" half NOT reproduced (composite id-tiebreaker prevents drop). Violates a48f1910 AC5 "cursor honored."
5. **F7 (MEDIUM, spec-DRIFT)** — Optimistic copy of the sender's own message is authored "Unknown user" (self display-name unresolved at optimistic-render). Partner symptom of F6. Reproduced on the OPTIMISTIC row (not delivered rows as T-block phrased).
6. **Coverage note (MEDIUM, not a defect)** — who_can_dm 3-policy matrix (server-members shared/no-shared; nobody→real user) + two-client realtime + offline-send pending-state could not be freshly re-driven live because userB's fixture password is WRONG (`WRONG_CREDENTIALS_ERROR`). The enforcement code path IS proven live (403 with policy message); the `everyone`-allow leg is proven; the rest rests on the surviving prod record + T-block. Recommend V-2 restore a working second fixture.

**MET / conformant (no action):** idempotency (same-key→same-id, no dup), participant cap >10→400, self-only/empty→400, find-or-create (same id), 1:1 isGroup=false/exactly-2, IDOR read+write 404-no-leak, unauth 401, who_can_dm enforcement live (403 whole-create), list recency ordering + last-message preview, outbox routing-key generalization with non-regressing channel fallback, message/conversation DTO shapes.

Recommend: route F-A + F-C1 + F6 + F-I4 to @task-completion-validator for fix-verification after V-3, and @code-quality-pragmatist to confirm the picker candidate-source fix stays minimal. F-A and F-C1 are the M8-DM-blocking pair — a shipped DM feature where you can't start a DM and every name is a UUID is not shippable.
