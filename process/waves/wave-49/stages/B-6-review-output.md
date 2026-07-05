# B-6 Phase 2 Production-Bug Review — wave-49 StudyHall Shared Study Timer

Branch: `wave-49-study-timer` · Diff base: `main` · Reviewer: code-reviewer (B-6 Phase 2)
Scope: NEW study-timer code only (schema, shared contracts, service, controller, gateway, web widget + socket + api).

Overall: the feature is well-structured — compute-on-read anchoring is sound, the idempotent
`UPDATE ... WHERE ends_at = $expected AND run_state='running'` guard is correct and genuinely
protects against double-fire and cross-instance ghost advances, SQL is fully parameterized, and
auth/IDOR gating is solid. No Critical (data-loss / security) issues. The findings below are real
production-bug patterns that lint + typecheck + the head-builder gate would not catch.

---

## SQL safety

CLEAN. All drizzle queries use `eq()` / `and()` parameterized builders; no raw `sql`
interpolation anywhere in the new code. The idempotent transition write
(`study-timer.service.ts` ~line 350-360) binds `expectedEndsAt` as a `Date` param —
injection-safe and semantically correct (guards on `server_id` + `run_state='running'` +
`ends_at = expectedEndsAt`). The upserts (`onConflictDoUpdate` on the `UNIQUE(server_id)`
target) are correct.

---

## Conditional side effects (auto-advance setTimeout + in-memory Maps)

### [High] Pause/resume/reset do not self-heal an overdue running timer — session can freeze at 0:00
`apps/api/src/study-timer/study-timer.service.ts:483` (`pauseTimer`), and the race at the
phase boundary generally.
- What's wrong: `selfHealIfOverdue` is only called from `getTimerForRoom` (GET + socket join).
  `pauseTimer` computes `pausedRemainingMs = max(0, ends_at - now)` directly from the raw row.
  If the row is a *running* timer whose `ends_at` is already in the past (missed transition after
  a process restart, OR a pause landing in the window after `ends_at` but before the armed
  `doPhaseAdvance` has committed), the pause freezes `paused_remaining_ms = 0`. A subsequent
  resume sets `ends_at = now + 0` → the timer immediately advances / shows 0:00 — the active
  session is effectively lost.
- Why it's a bug: at exactly `ends_at` there is an interleave between the REST pause and the
  armed auto-advance. `doPhaseAdvance` is idempotency-guarded, but `pauseTimer`'s
  `UPDATE ... WHERE server_id` is not boundary-aware and can overwrite a just-advanced row with a
  0-remaining paused state. Narrow window, but a real correctness/data-UX loss the gate misses.
- Suggested fix: call `selfHealIfOverdue(row)` (or re-derive via `computeCurrentPhase`) at the top
  of `pauseTimer`/`resumeTimer`/`resetTimer` before computing remaining, so control actions
  operate on the healed anchors; and/or guard the pause `UPDATE` with
  `AND ends_at = $observedEndsAt` so a concurrent advance makes the pause a no-op that retries.

### [Medium] `timeouts` Map entries are never removed on no-op advance or server deletion — bounded leak
`apps/api/src/study-timer/study-timer.service.ts:277` (`armAutoAdvance`), `303` (`clearAutoAdvance`).
- What's wrong: entries are deleted only on pause/reset (`clearAutoAdvance`) and `onModuleDestroy`.
  When `doPhaseAdvance` fires and finds the row missing (server deleted via `ON DELETE cascade`)
  or changed, it returns a no-op **without** deleting `this.timeouts.get(serverId)`; the spent
  handle lingers. A server whose timer was Started and then the server is deleted leaves a
  permanent stale Map entry.
- Why it's a bug: unbounded-ish growth of the `timeouts` Map keyed by every server that ever ran a
  timer and was deleted/abandoned without a reset. Small per-entry, but never reclaimed.
- Suggested fix: in `doPhaseAdvance`, on the no-op / missing-row path call
  `this.timeouts.delete(serverId)`; on successful re-arm the replace already handles it.

### [Medium] Started timers auto-cycle forever — abandoned servers do DB writes indefinitely
`study-timer.service.ts` auto-advance loop (start → arm → `doPhaseAdvance` → re-arm).
- What's wrong: a Started timer perpetually re-arms work→break→work with no terminal condition;
  the only stops are pause/reset/process-restart. A server whose members all leave keeps cycling
  phases and issuing an `UPDATE` + fan-out every 5–25 min forever.
- Why it's a bug: background DB write + emit load that scales with the number of servers that ever
  pressed Start, independent of whether anyone is viewing. Resource growth, not user-visible.
- Suggested fix: auto-stop after N idle cycles with zero presence viewers, or reset to idle when
  the presence roster for a server empties (the gateway already tracks last-leave).

### [Medium] Gateway presence Maps — cleanup is correct
`study-timer.gateway.ts` `removePresenceSocket` / `handleDisconnect` / `handleLeaveTimerRoom`.
- Verified: last-socket-leave deletes the `userId` entry; last-user deletes the `serverId` map;
  `socketPresenceIndex` is deleted on disconnect and pruned on leave. No leak in the presence
  structures. Noting explicitly as CLEAN for this sub-area.

---

## Contract mismatches (shared Zod ↔ frontend types ↔ socket payloads)

CLEAN on shape. Frontend consumes `StudyTimer`, `StudyTimerUpdateEvent`,
`StudyTimerPresenceEvent` directly from `@studyhall/shared` — no locally redefined DTOs, so no
field drift. Gateway emits `{ serverId, timer }` and `{ serverId, viewers, count }` matching the
schemas; the widget reads exactly those fields. Two low-severity drift *risks*:

### [Low] Duplicated event-name string literals instead of importing the shared constants
`apps/web/src/shell/studyTimerSocket.ts:33-34` — `TIMER_UPDATE_EVENT`/`TIMER_PRESENCE_EVENT` are
hardcoded `'study-timer:update'` / `'study-timer:presence'` rather than importing
`STUDY_TIMER_UPDATE_EVENT` / `STUDY_TIMER_PRESENCE_EVENT`.
- Currently match the shared values, but a future rename in `packages/shared/src/study-timer.ts`
  would silently desync the client (typecheck won't catch a string literal). The inline comment
  explains a CJS named-export resolution issue as the reason; if that constraint is real, prefer a
  single shared re-export module both sides import, or a typed assertion against the shared const.

### [Low] Idle duration hardcoded on the client
`apps/web/src/shell/StudyTimerWidget.tsx` `computeDisplaySeconds` returns `25*60`/`5*60` for idle —
duplicates the server `WORK_DURATION_MS`/`BREAK_DURATION_MS`. If durations ever move to config
(the deferred custom-durations seed), the idle display drifts from the server.

---

## Null / undefined access

CLEAN. `rowToDto` guards `ends_at !== null` before `.getTime()`/`.toISOString()`;
`paused_remaining_ms ?? 0`; `updated_by ?? null`. `selfHealIfOverdue` guards `ends_at`/`started_at`
null before use. The widget's `computeDisplaySeconds` guards `!timer`, `timer.endsAt` before
`new Date(...).getTime()`, and idle/paused branches never parse a null date. Roster rendering
guards `roster.count === 0`. No null-deref paths found.

---

## Missing error handling

### [Medium] Non-UUID `serverId` route param → 500 instead of 404/400
`apps/api/src/study-timer/study-timer.controller.ts` — all five routes take
`@Param('serverId') serverId: string` with no `ParseUUIDPipe`. `server_members.server_id` and
`server_study_timer.server_id` are `uuid` columns, so `assertMember`'s query throws Postgres
`22P02 invalid input syntax for type uuid` on a malformed param → unhandled → HTTP 500.
- Note: this matches the existing app convention (`scheduling.controller.ts` also uses bare
  `@Param('serverId')`), so it's an inherited pattern, not net-new — lower priority. Fix by adding
  `ParseUUIDPipe` (or a shared UUID param decorator) for a clean 400.

### [Medium] Custom socket `'error'` event is never observed by the client
`apps/api/src/study-timer/study-timer.gateway.ts:169,184,189,232` emit `socket.emit('error', ...)`
for invalid payload / membership-check failure / non-member. The web client
(`studyTimerSocket.ts`) never subscribes to `'error'`, and `'error'` collides with Socket.IO's
reserved client-side error channel.
- Why it's a bug: a non-member (or bad-payload) join fails silently on the client — the widget
  shows a normal idle timer with no roster and never surfaces the rejection. Prefer a namespaced
  app event (e.g. `'study-timer:error'`) that the client subscribes to and maps to the widget's
  error/empty state.

### [Medium] `handleConnection` is async but not awaited before `join_timer_room` can run
`apps/api/src/study-timer/study-timer.gateway.ts:115`. Socket.IO does not block incoming events on
an async `handleConnection`. A client that emits `join_timer_room` immediately can hit
`handleJoinTimerRoom` before the `display_name` lookup resolves; `addPresenceSocket` then falls
back to `userId` as the display name and caches it in the presence entry permanently (the entry's
displayName is only set on first insert). Roster can show a raw user id.
- Suggested fix: resolve/cache `displayName` lazily inside `handleJoinTimerRoom` (await it there)
  rather than relying on the connect-time side effect having completed.

Controller-level: GET returning a 200 idle DTO for a missing row (not 404) is intentional and
documented — acceptable. Non-member → `ForbiddenException` (403) via `assertMember` — correct.

---

## Structural issues (compute-on-read correctness, boundary, races)

### [Medium] `selfHealIfOverdue` idempotency comment overstates its guarantee
`apps/api/src/study-timer/study-timer.service.ts:222` claims "at most one concurrent request will
write the healed row," but the healing `UPDATE` guards only `WHERE ... run_state='running'`
(line 250) — there is no `AND ends_at = $observed` guard like `doPhaseAdvance` has. Two concurrent
GETs/joins on an overdue timer both match `run_state='running'`, both `UPDATE`, both re-arm (second
`armAutoAdvance` clears the first's handle), and both emit a fan-out.
- Why it's a bug: duplicate `study-timer:update` broadcasts and a double-arm on the heal path. It
  converges (last write wins, single Map entry), so effect is benign — but the stated invariant is
  false and will mislead a future maintainer. Add an `ends_at`/`started_at` guard to the heal
  `UPDATE` to make it genuinely single-writer, matching `doPhaseAdvance`.

### Compute-on-read + boundary — otherwise correct
`computeCurrentPhase` walks forward with strict `phaseEndMs > nowMs`, so exactly at `ends_at` it
advances (consistent with `doPhaseAdvance` re-arming from `now`). The self-heal re-anchors
`started_at = newEndsAt - phaseDuration` correctly (line 243). The work→break→work derivation is
sound. The REST-control vs armed-advance race is safe for reset/start (Node drains microtasks
before the timer macrotask; and `doPhaseAdvance`'s `ends_at` guard no-ops a stale fire) — the one
exception is the pause-at-boundary case captured as the [High] above.

### [Low] `RbacService` injected but unused
`apps/api/src/study-timer/study-timer.service.ts:112` injects `rbacService` in the constructor, but
`assertMember` does a direct `server_members` query and no method uses `rbacService`. Dead
dependency — remove it (and the `RbacModule` import if nothing else needs it) or actually route the
membership check through it for consistency with the documented "Mirrors scheduling.service.ts."

---

## Realtime correctness (multi-client fan-out)

Update + presence both fan out to the whole room via
`this.server.to(`study-timer:server:<id>`).emit(...)` (`handleTimerUpdated`, `broadcastPresence`) —
correct room-wide multicast, not single-socket. The join-time reconciliation emit is correctly
targeted to the joining socket only. Reconnect re-join (`studyTimerSocket.ts` `connect` handler
re-emitting `join_timer_room` for `_activeServerId`) plus the gateway's authoritative-state emit on
join is a sound late-joiner/reconnect reconciliation path.

### [Medium] In-process EventEmitter2 + in-memory rooms/presence — no cross-replica fan-out
`study-timer.gateway.ts` uses `@OnEvent` (in-process `EventEmitter2`) and default in-memory
Socket.IO rooms; the presence Maps and the auto-advance `timeouts` Map are per-process. No
`@socket.io/redis-adapter` exists anywhere in the API. If the API is ever run with >1 replica:
clients connected to a different instance than the one handling a REST control never receive its
`study-timer:update`/`study-timer:presence`, and presence rosters diverge per instance.
- Note: this is the *established app-wide pattern* (messaging/presence gateways are identical), so
  the study timer inherits a documented single-instance assumption rather than introducing a new
  defect. The idempotent `ends_at` guard already neutralizes the worst cross-instance risk (ghost
  phase advances). Flagging so the single-instance constraint is explicit; a Redis adapter is the
  fix if/when the API scales horizontally.

---

## Summary count by severity

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 1 |
| Medium | 8 |
| Low | 3 |

- **High (1):** pause/resume/reset skip self-heal → overdue/boundary pause can freeze a session at 0:00.
- **Medium (8):** `timeouts` Map stale-entry leak; timers auto-cycle forever (background load);
  non-UUID serverId → 500; custom `'error'` event never observed by client; async `handleConnection`
  race → userId shown as display name; self-heal idempotency claim false (duplicate broadcasts /
  double-arm); no cross-replica fan-out (documented single-instance assumption).
- **Low (3):** duplicated event-name string literals (drift risk); idle duration hardcoded on
  client; unused `RbacService` injection.

CLEAN categories: SQL safety; contract shape (shared Zod ↔ frontend); null/undefined access;
presence-Map cleanup; room-wide fan-out targeting.

---

## Re-run (post-fix-up)

Reviewer: code-reviewer (B-6 Phase 2 re-run) · Diff base: `main` · Scope: the 4 fix-up commits
`754c036` (self-heal-idempotency), `7c2c324` (timeouts-leak), `cc852c4` (pause-heal),
`7788980` (join-error-event) — changes to `study-timer.service.ts`, `study-timer.gateway.ts`,
`packages/shared/src/{study-timer,index}.ts`, `study-timer.service.spec.ts` only. Verification:
static read of every changed line + `vitest` (service 27/27, web socket+widget 20/20 pass) +
`tsc --noEmit` clean on `packages/shared` and `apps/api`.

### Fix 1 — `754c036` self-heal idempotency (Structural [Medium], line 146) — CONFIRMED-RESOLVED
The heal `UPDATE` now guards `AND ends_at = observedEndsAt` (svc line 256) alongside
`run_state='running'`, matching `doPhaseAdvance`. `observedEndsAt` is captured after the null-guard
(line 238) so the `Date` bind is safe. Two concurrent overdue heals: exactly one matches the
`ends_at` predicate and commits + re-arms + emits; the loser gets 0 rows → falls through to
`return row` (the original, un-mutated row) with **no** re-arm and **no** emit. Genuinely
single-writer; the corrected comment (lines 221-224) now matches behaviour. No new defect.

### Fix 2 — `cc852c4` pause-heal (the [High], line 27) — CONFIRMED-RESOLVED
`pauseTimer` now calls `selfHealIfOverdue(row)` first (svc line 505) and derives
`pausedRemainingMs` from the **healed** row's `ends_at` (line 510), and guards the pause `UPDATE`
with `run_state='running' AND ends_at = observedEndsAt` (lines 524-527). Traced both branches:
- Heal succeeds → `observedEndsAt` is the new future `ends_at` → `pausedRemainingMs > 0`; the
  overdue running row can no longer freeze at 0:00. New regression test
  (`pauseTimer on overdue running row …`) asserts `remainingMs > 0` and both UPDATEs ran — passes.
- Heal loses the race (concurrent advance/heal won) → `selfHealIfOverdue` returns the stale row
  with the old past `ends_at` → the pause `UPDATE`'s `ends_at = staleEndsAt` predicate no longer
  matches → 0 rows → the new `!updated` branch re-reads and returns current state (lines 532-539)
  instead of the old `throw`. So even the lost-race path does **not** persist `remaining_ms=0`.
resume/reset correctly left untouched: `resumeTimer` reads a `paused` row and computes from
`paused_remaining_ms` (ends_at unused); `resetTimer` unconditionally writes idle nulls — neither
consumes `ends_at`, so self-heal is inapplicable there. No new defect. The former `throw` on
0-rows is replaced by a graceful no-op, which is strictly safer (removes a spurious 500 on a benign
concurrent-advance interleave).

### Fix 3 — `7c2c324` timeouts leak (Conditional-side-effects [Medium], line 46) — CONFIRMED-RESOLVED
`doPhaseAdvance` now `this.timeouts.delete(serverId)` on BOTH no-op returns: `newPhase===null`
early-exit (line 346) and post-UPDATE `!updated` (line 378). The success path still re-arms via
`armAutoAdvance` (line 383), which `clearTimeout`s any prior handle and `set`s the new one —
overwrite semantics intact, verified by the passing re-arm/advance tests. No path now leaves a
spent handle orphaned in the Map for a deleted/abandoned server. CONFIRMED-RESOLVED.

### Fix 4 — `7788980` socket error channel (Missing-error-handling [Medium], line 120) — CONFIRMED-RESOLVED (channel-collision half)
New `STUDY_TIMER_JOIN_ERROR_EVENT = 'study-timer:join_error'` declared in
`packages/shared/src/study-timer.ts:60` and barrel-exported from `index.ts:198`; imported in the
gateway. `grep` confirms **zero** residual `socket.emit('error'` anywhere in `study-timer/`; all
four join-failure emits (gateway lines 173, 188, 195, 240) now use the namespaced constant. The
reserved Socket.IO `'error'` channel is no longer touched. Frontend contract unaffected and
additive: `studyTimerSocket.ts` still subscribes only to `study-timer:update` /
`study-timer:presence` (the `join_error` emit is server-side only). Note the second half of the
original Medium — "client never surfaces the rejection" — is **unchanged** (no client subscriber to
`join_error` yet), but it is not made worse; this commit's scope was the channel-collision fix,
which is correct and complete.

### New Critical/High introduced by the fixes
None. One benign **[Low]** observation, net-new but non-blocking: on the two `doPhaseAdvance`
no-op paths (Fix 3), if a resume/heal re-armed a *fresh* live handle during the awaited DB
round-trip gap, the unconditional `timeouts.delete(serverId)` drops that live handle from the Map
without `clearTimeout`. Worst case the orphaned timeout fires once later, finds a mismatched
`ends_at` via its own idempotency guard (line 336/368), no-ops, and self-deletes — it **cannot**
corrupt state. Extremely narrow single-event-loop-gap interleave, no data risk; note only. (Could
be tightened by deleting only when the Map still holds *this* fire's handle, but not required for
exit.)

### Updated severity count (post-fix-up)

| Severity | Before | After |
|---|---|---|
| Critical | 0 | 0 |
| High | 1 | 0 |
| Medium | 8 | 5 (3 accepted-debt not re-litigated; 3 resolved; 2 remaining are the accepted cross-replica + non-UUID→500 + the client-never-observes-join-error half) |
| Low | 3 | 4 (+1 benign no-op Map-delete race) |

High resolved (pause-heal). Mediums resolved by the fixes: self-heal idempotency, timeouts leak,
socket-error channel-collision. The accepted-debt Mediums (auto-cycle-forever, non-UUID→500,
cross-replica, async handleConnection race) were **not** touched and are **not** made worse.

### B-6 Phase-2 exit condition
**ZERO Critical / High findings on the branch.** All 4 fix commits are correct and introduce no new
Critical/High. Exit condition MET.
