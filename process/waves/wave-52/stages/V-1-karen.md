# V-1 — Karen source-claim verification (wave-52: joinable focus rooms)

**Verdict: APPROVE**

**Scope:** Source-claim verification of wave-52 (StudyHall joinable focus room / body-doubling) against DEPLOYED production. Merge `725f7b6` on `main` (feature PR #66 `25c0736` + subscribe-fix PR #67). LIVE: api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`. Read-only; no fixes performed.

**Bottom line:** Every load-bearing claim is substantiated in the merge tree AND against live production. The 3 MUST-LOCKs are real in code (not doc-only). The subscribe fix is wired end-to-end. The `/study-room` namespace is live and auth-guarded (proven distinct from a 404-absent namespace via a negative control probe). No claimed-but-fake work, no decorative tests, no DB-path smuggling of the room timer. The F-1 Low info-disclosure is out of scope (routed to V-2), and I did not re-find it.

---

## 1. File existence (merge tree HEAD `725f7b6`) — PASS

All 10 claimed files exist (`git cat-file -e HEAD:<path>`):

- `apps/api/src/study-room/study-room.gateway.ts` — OK
- `apps/api/src/study-room/study-room.service.ts` — OK
- `apps/api/src/study-room/study-room.module.ts` — OK
- `apps/api/src/study-room/study-room.service.spec.ts` — OK
- `apps/api/src/study-room/study-room.gateway.spec.ts` — OK
- `packages/shared/src/study-room.ts` — OK
- `apps/web/src/shell/FocusRoomPanel.tsx` — OK
- `apps/web/src/shell/studyRoomSocket.ts` — OK
- `apps/web/src/shell/focus-room.test.tsx` — OK
- `apps/web/src/shell/studyRoomSocket.test.ts` — OK

---

## 2. The 3 MUST-LOCKS are real in code — PASS

### MUST-LOCK 1 (ephemeral, no DB) — PASS
- `study-room.service.ts:129` `private readonly rooms = new Map<string, Map<string, FocusRoomEntry>>()` — rooms in-memory.
- `study-room.service.ts:132` `private readonly roomTimers = new Map<string, RoomTimerAnchor>()` — room-timer anchors in-memory.
- `study-room.service.ts:135` `private readonly roomTimeouts = new Map<...>()` — auto-advance handles in-memory.
- NO `db.insert` / `db.update` / `db.delete` / SQL `UPDATE` anywhere in the module. The only `db.select` calls are auth/profile READS: `assertMember` (`study-room.service.ts:170`, `server_members`) and `resolveUserProfile` (`study-room.service.ts:235`, `users`). Rooms/rosters/room-timer are NEVER persisted.
- NO `pgTable` / `CREATE TABLE` / `server_study_timer` write / `.sql` migration in the module. Independent of the claim doc, `find apps/api -path '*migrat*' -name '*.sql' | xargs grep -il 'focus_room|study_room|room_timer'` → no room migration. C-2 confirms Drizzle ledger untouched at `0023`.

### MUST-LOCK 2 (presence separation) — PASS
- Gateway decorator `study-room.gateway.ts:73-79`: `@WebSocketGateway({ namespace: '/study-room', ... })` — distinct namespace, NOT `/study-timer`.
- Own presence structures: `socketRoomIndex` (`:90`), `socketServerIndex` (`:96`); service `rooms`/`roster` Maps (`:129`). No shared presence Map with study-timer.
- ZERO import of `StudyTimerGateway`, `timerPresence`, or any `/study-timer` event const. `grep -E "study-timer.gateway|StudyTimerGateway|timerPresence"` over `study-room/*.ts` returns only doc-comment mentions asserting the exclusion — no code import.
- The ONLY cross-module import is the pure-helper line `study-room.service.ts:62-67` `import { BREAK_DURATION_MS, WORK_DURATION_MS, computeCurrentPhase, phaseDurationMs } from '../study-timer/study-timer.service'` — pure functions/consts only.
- Module (`study-room.module.ts:33-37`): imports `[RbacModule]` only; does NOT import `StudyTimerModule`. Zero cross-module coupling.
- Frontend `studyRoomSocket.ts:88` `_socket = io(\`${BASE}/study-room\`, ...)` — connects to `/study-room`, not `/study-timer`.

### MUST-LOCK 3 + in-memory CAS — PASS (this is the crux; it holds)
- Room-timer anchors keyed by `roomId` (`study-room.service.ts:132`), distinct from study-timer's serverId-keyed DB rows.
- Auto-advance is ONE-SHOT `setTimeout` per room (`armRoomAutoAdvance`, `:645-658`), NOT a `setInterval` / `@nestjs/schedule` tick loop.
- **CAS site — `doRoomPhaseAdvance`, `study-room.service.ts:685-706`.** The idempotency guard is an in-memory compare-and-set: `capturedEndsAtMs` is captured at arm time (`:649`) and passed into the timeout handler (`:652-653`); on fire, `study-room.service.ts:700` `if (anchor.ends_at === null || anchor.ends_at.getTime() !== capturedEndsAtMs) { ...delete; return; }` — no-op on Map anchor mismatch. This is a genuine re-implementation, NOT a copy of the wave-49 DB `UPDATE...WHERE ends_at=` path.
- Confirmed no DB path smuggled in: `grep -E "UPDATE|db\.update|\.set\("` over the service shows ONLY JS `Map.set()` calls (`:199,:275,:315,:448,:656`) and doc-comments — zero SQL `UPDATE`, zero `db.update`. The `UPDATE WHERE ends_at=$expected` string appears only in comments (`:15,:641,:698`) documenting what is being replaced.
- Reuses ONLY the pure helpers: `phaseDurationMs` (`:711`) and `computeCurrentPhase` (`:763`, in `selfHealRoomTimerIfOverdue`). All DB-coupled wave-49 logic (`doPhaseAdvance`, DB `selfHealIfOverdue`) is not imported.

---

## 3. The subscribe fix (T-5 live-bug fix) — PASS (end-to-end)

- Shared verb: `packages/shared/src/study-room.ts:117` `export const STUDY_ROOM_SUBSCRIBE_VERB = 'subscribe_server_rooms' as const`.
- Backend handler: `study-room.gateway.ts:343` `@SubscribeMessage(STUDY_ROOM_SUBSCRIBE_VERB)` → `handleSubscribeServerRooms` (`:344`). It member-guards via `getOpenRooms` (`:359`), `ensureServerRoom` (`:363`), then immediately emits `STUDY_ROOM_ROOMS_EVENT` to the socket (`:366`) — resolving the skeleton even when the list is empty `[]`.
- Frontend emit on mount: `FocusRoomPanel.tsx:882-884` `useEffect(() => { subscribeServerRooms(serverId); ... })`; the emitter `studyRoomSocket.ts:136-139` `subscribeServerRooms` emits `SUBSCRIBE_SERVER_ROOMS_VERB` (`= 'subscribe_server_rooms'`, `:58`). Reconnect handler re-emits it on `'connect'` (`:101-106`).
- Verb strings match on all three surfaces (`subscribe_server_rooms`). This is the exact chicken-and-egg fix described in the redeploy note (C-2 §T-5 fix redeploy) that resolved the skeleton-stuck bug.

---

## 4. Route / namespace live (production probe) — PASS

Engine.IO handshake `GET /socket.io/?EIO=4&transport=polling` → **200** with a valid `sid`.

Socket.IO namespace CONNECT probes (unauth, via `socket.io-client@4.8.3`, websocket transport):

| Namespace | Result | Interpretation |
|---|---|---|
| `/study-room` | `CONNECT_ERROR: Unauthorized` (packet `44/study-room,{"message":"Unauthorized"}`) | Namespace REGISTERED + `ws-auth` guard LIVE — rejects unauth, not 404-absent |
| `/nonexistent-xyz` (negative control) | `CONNECT_ERROR: Invalid namespace` | Distinct rejection — proves `/study-room` is NOT falling through a generic path; it is a genuinely registered namespace |
| `/study-timer` (wave-49) | `CONNECT_ERROR: Unauthorized` | Wave-49 namespace still live & distinct — corroborates MUST-LOCK 2 separation (both namespaces coexist) |

The differing rejection strings (`Unauthorized` for registered-but-guarded vs `Invalid namespace` for absent) are decisive: `/study-room` is live, registered, and auth-guarded as designed.

---

## 5. Deploy hash match — PASS

- C-2 authoritative Railway `deployments` GraphQL state (not `/health` alone): api deployment `4b525786`, web `02574ba2`, both **SUCCESS** with deployed-commit == merge SHA `725f7b6b6887...` (C-2 §T-5 fix redeploy, `:127-132`). Initial PR #66 deploy was pinned to `25c0736`; the fix redeploy re-pinned both to `725f7b6`.
- NO migration: C-2 `:12-14`, `:69` — zero `.sql` in diff, ledger untouched at `0023` (in-memory feature). Consistent with §2 MUST-LOCK 1.
- Live `/health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`; web `/` → **200**.
- Revision-freshness corroboration: web bundle served now is `index-ok0yDolM.js`, DIFFERENT from the `index-CSETvy6K.js` recorded at the initial `25c0736` deploy (C-2 `:56`) — consistent with the web bundle being rebuilt at the `725f7b6` fix redeploy (the fix touched `FocusRoomPanel.tsx`). No stale-revision race indicated.
- Note: the runtime does not expose a commit-hash endpoint (`/health/version` → 404), so the deployed-hash == `725f7b6` claim rests on C-2's authoritative Railway deployment-state evidence, which is the correct source per project convention; the live 200s + fresh bundle hash independently corroborate a fresh serving revision.

---

## 6. Parity — study-timer byte-untouched — PASS

- `git log 25c0736~1..725f7b6 -- apps/api/src/study-timer/` → EMPTY. `study-timer.service.ts` (and the whole dir) is byte-untouched across the entire wave-52 range.
- The wave-49 DB CAS (`UPDATE WHERE ends_at=$expected`) remains only in `study-timer.service.ts` (comments `:17`, `:256`) and was not modified for the room timer.
- study-timer test count: `study-timer.service.spec.ts` has **36** `it/test` cases — matches the claimed 36/36. Since the service is byte-identical, those 36 tests are unaffected by this wave.

---

## 7. Antipattern check — PASS (no claimed-but-fake / decorative tests / DB-path fake)

- Room-timer uses in-memory CAS, NOT the DB path (§2 MUST-LOCK 3 — verified `grep` shows zero SQL `UPDATE`/`db.update` in the module).
- The CAS idempotency test is REAL and exercises the crux (`study-room.service.spec.ts:553-635`): matching `ends_at` → phase advances (`:567`); NON-matching → no-op with `timerCb` asserted NOT called (`:588,:606`); double-fire with same `capturedEndsAtMs` → only ONE advance, callback asserted called once (`:609,:632`). This tests the actual guard, not a mock of it.
- No decorative-test smells: `grep` for `expect(true).toBe(true)`, `.skip(`, empty `it()`, trailing-`toBeDefined` stubs → none found across all 4 spec/test files.
- Test volume is substantive: service 43, gateway 10, focus-room 24, studyRoomSocket 6.
- The MUST-LOCK-1 negative assertions are tested: `study-room.service.spec.ts:542-545` asserts `db.select/insert/update/delete` were NOT called for room operations — a real ephemeral-guard test.

---

## Findings summary

| # | Claim | Severity if false | Result |
|---|---|---|---|
| 1 | 10 files exist on merge tree | Critical | PASS |
| 2a | MUST-LOCK 1 ephemeral (no DB/table/migration) | Critical | PASS |
| 2b | MUST-LOCK 2 presence separation (distinct namespace, no study-timer import) | Critical | PASS |
| 2c | MUST-LOCK 3 in-memory CAS (not DB-path copy) | Critical | PASS |
| 3 | subscribe_server_rooms fix wired backend+frontend | High | PASS |
| 4 | /study-room namespace live + auth-guarded (not 404) | High | PASS |
| 5 | api+web SUCCESS @ 725f7b6, /health 200, no migration | High | PASS |
| 6 | study-timer byte-untouched; 36/36 unaffected | Medium | PASS |
| 7 | no claimed-but-fake / decorative / DB-path-fake | Critical | PASS |

**No Critical/High/Medium/Low discrepancies found.** F-1 (Low info-disclosure) intentionally not re-investigated — routed to V-2.

## Recommendation

**APPROVE.** Every source-claim verified in code and against live production; the crux (in-memory ephemeral rooms + presence separation + in-memory CAS room timer) is real and correctly implemented, the T-5 subscribe fix is wired end-to-end and the namespace is provably live and auth-guarded, and the wave-49 study-timer is genuinely untouched. Proceed to V-2 triage (which owns the F-1 Low finding).
