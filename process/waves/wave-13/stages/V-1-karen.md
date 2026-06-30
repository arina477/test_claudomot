# V-1 Karen — Source-Claim Verification (wave-13 M3 message lifecycle)

**Verdict: APPROVE**

**Scope:** edit/delete authz + idempotent reactions + two-client realtime, verified against LIVE deployed state (main @ 8487601, which supersedes the prompt's 427d5d6/PR#24 — the deployed commit is the T-block-complete tip and includes the same M3 code). API: https://api-production-b93e.up.railway.app.

---

## Methodology note (one correction to the brief)

The prompt instructed reading the live app schema via `psql "$CLAUDOMAT_DB_URL"`. That env var points at the **brain control-plane DB** (`current_database()=railway`, `current_user=claudomat_brain`, holds `tasks`/`waves`/`milestones`), **not** the StudyHall application database. `messages`/`message_reactions` correctly do NOT exist there. The migration-applied claim was therefore verified through (a) the deployed API route behavior, (b) the committed migration SQL + Drizzle schema source, and (c) C-2's recorded deploy verification — not via a direct app-DB query (the app DB is not reachable from this env var). This does not weaken the verdict; it changes the evidence path.

---

## Per-claim findings

### 1. Live auth gate (PATCH/DELETE/POST reactions → 401; /health 200) — **VERIFIED**
Live curl, unauthenticated:
- `GET /health` → **200**
- `PATCH /channels/:c/messages/:m` → **401**
- `DELETE /channels/:c/messages/:m` → **401**
- `POST /channels/:c/messages/:m/reactions` → **401**

Route-existence control: a bogus sibling route (`.../messages/y/nonexistent-xyz`) → **404**, while all three lifecycle routes → **401**. This proves the routes are genuinely **mounted and guarded** (a missing route would 404), not merely returning a blanket 401. `@UseGuards(AuthGuard, ChannelMessageGuard)` is present on all three handlers (controller L92-93, L123-124, L141-142).

### 2. editMessage author-only (403 else; deleted→409) — **VERIFIED**
`messages.service.ts:228-281`. Loads message scoped by `(id, channelId)` → 404 if absent. `if (message.author_id !== userId) throw ForbiddenException` (L245-247) — author-only, session-derived userId (controller L106 `req.session.getUserId()`, never body). `if (message.is_deleted) throw ConflictException` (L250-252) → 409 on editing a tombstone. Sets `is_edited=true, edited_at=now`. Emits `message.updated`.

### 3. deleteMessage author OR manage_channels; serverId server-resolved; soft-delete tombstone — **VERIFIED** (load-bearing IDOR check passes)
`messages.service.ts:300-356`. Critical authz ordering is correct:
- `serverId` is resolved from `channels.server_id` via a DB SELECT **on the looked-up channel row** (L317-327), then passed to `rbacService.can(userId, serverId, 'manage_channels')` (L334-336). It is **NOT** request-trusted — there is no path for the caller to supply `serverId`.
- Author bypass (`isAuthor = message.author_id === userId`, L330) short-circuits the rbac call; non-author non-moderator → `ForbiddenException` (L338-340).
- Soft-delete tombstone: `is_deleted=true, deleted_at=now, content=''` (L345); `rowToDto` returns `content: null` for deleted rows (L107). No hard delete.
- Idempotent: already-deleted → early `return` (L312-314) → 204 with no error (controller `@HttpCode(NO_CONTENT)` L125).

### 4. toggleReaction idempotent (UNIQUE; insert/delete); aggregated reactedByMe — **VERIFIED**
`messages.service.ts:369-447`. Existence-check then branch: existing → DELETE (toggle off, `reacted:false`, emit `reaction.removed`); absent → INSERT with `onConflictDoNothing` on the UNIQUE target (toggle on, `reacted:true`, emit `reaction.added`). userId from session (controller L155). UNIQUE constraint is live in both schema (`messages.ts:69`) and committed migration (`0006_…sql:7`). Aggregation: `rowToDto` (L78-100) groups by emoji → `{emoji, count, reactedByMe}`, where `reactedByMe` is computed against `viewerUserId` (the caller's session) — per-caller correct. List path aggregates reactions in a single `inArray` query (L538-547), no N+1.

### 5. Gateway @OnEvent room-only fan-out — **VERIFIED**
`messaging.gateway.ts`: `@OnEvent('message.updated')` (L228), `('message.deleted')` (L242), `('reaction.added')` (L255), `('reaction.removed')` (L270). Every handler emits via `this.server.to('channel:${channelId}').emit(...)` — room-scoped, never `server.emit` broadcast-all. Gateway tests (`messaging.gateway.spec.ts:368-437`) assert BOTH `mockTo).toHaveBeenCalledWith('channel:X')` AND `server.emit).not.toHaveBeenCalled()` for all four events — positively excludes broadcast leak.

### 6. ~350 tests; two-client 87-112ms — **VERIFIED (count) / TRUSTED (timing, per brief)**
Measured test count across the messaging suites + project specs = **354** (`it(`/`test(` occurrences). Matches "~350." The 87-112ms two-client realtime latency is a C-2 runtime measurement not re-runnable from source; trusted per the brief's explicit instruction ("trust C-2 + the gateway tests"). The gateway tests independently confirm the room-routing contract that the two-client test exercises.

### 7. Antipatterns — **CLEAN**
- **Gold-plating:** none. No threads, mentions, edit-history, attachments, or presence — all explicitly DEFERRED in the spec and absent from the diff. Scope is exactly edit/delete/react.
- **Claimed-but-fake:** none. Routes are live (401, not 404), migration SQL is committed (`0006_wave13_message_lifecycle.sql`) with the soft-delete columns + `message_reactions` + UNIQUE + cascade FK, schema source matches, and the authz/idempotency logic is real server-side code — not stubs or mocks-as-implementation.

---

## UI wiring (task f323a71f) — spot-check VERIFIED
- `MessageList.tsx`: edit/delete affordances gated `isOwn` (L456); delete shown for moderators-on-others with graceful 403 handling (L316-319); tombstone renders "This message was deleted" with no content/reactions/actions (L462-487); `(edited)` indicator (L597-606); reaction pills with `reactedByMe` highlight + `aria-pressed` (L193-220); add-reaction popover (L110-175).
- `useMessages.ts`: optimistic edit/delete/react with reconcile; socket handlers for `message:updated`/`message:deleted`/`reaction:added`/`reaction:removed` (L127-189); in-flight reaction de-dup ref suppresses self-echo double-flip (L62, L159-160, L341-342); delete rollback on failure (L314-322).

---

## Residual notes (non-blocking, informational)
- **N1 (Low):** App-DB schema state could not be confirmed by direct query in this environment (env var targets the brain DB). Confidence in "migration 0006 applied" rests on live route behavior + C-2's deploy record + committed SQL. If a stronger guarantee is ever wanted, an authenticated end-to-end edit/react against the live API would close it directly. Not a defect in the wave's work.
- **N2 (Low):** `editMessage` catch-block in `useMessages.ts` (L295-299) deliberately leaves optimistic state on failure, relying on the socket `message:updated` or a reload to correct. Documented and acceptable for a non-destructive edit; noted for awareness, not a fix request.

**APPROVE.** All load-bearing claims (edit/delete authz with server-resolved serverId, idempotent reactions, room-only realtime) verified against committed source + live deployed route behavior. Scope matches spec; no gold-plating; no fake completions.
