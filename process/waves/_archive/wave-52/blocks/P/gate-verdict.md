# Wave 52 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-p4-w52-a1)
**Reviewed against:** process/waves/wave-52/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The joinable focus room ladders cleanly to a live founder bet — the academic-tools + offline-first wedge that aims to displace Discord — via M8's study-sessions scope, and it is the exact study-group headline ceo-reviewer recommended twice (waves 50, 51); this is not an orphan wave. The three MUST-locks are unambiguously encoded across the DB spec contract (d123d9e0.description), the P-1/P-3 deliverables, and the shared-contract event names, and I verified the load-bearing reuse claims directly against the wave-49 code rather than inferring them. (1) Ephemeral identity: every task carries `data: NONE (MUST-LOCK 1)`, AC-1 spells out "in-memory descriptor, NO persisted focus_rooms/attendance table", the empty-room-removal AC forbids a persisted remnant, and P-3 declares no schema/no migration — B cannot add a table without breaking an explicit AC. (2) Presence separation: AC-5 mandates a distinct `/study-room` namespace, distinct in-memory Map, and distinct wire events that MUST NOT share `timerPresence`; the new event consts are literally distinct strings (`study-room:rooms`/`study-room:presence` vs wave-49 `study-timer:presence`); P-3 makes it a new module with its own gateway/Map and explicitly rejects folding into the study-timer gateway; and I confirmed in study-timer.gateway.ts that `timerPresence` is a private field cleanly separable. (3) Room-timer state-location: ef84b378 AC-3 requires anchors in-memory keyed by roomId (NOT server_study_timer), a roomId-keyed setTimeout map distinct from the serverId-keyed server map, an edge-case forbidding any read/write of server_study_timer or the `/study-timer` namespace, and reuse of only the pure compute-on-read formulas — and I confirmed `computeCurrentPhase`/`phaseDurationMs` are genuinely pure, exported, and room-agnostic (no serverId, no DB). Authz is fully specced and IDOR-safe (io.use WS-session gate + assertMember + room-membership gate for timer control; serverId/roomId from client, userId from session), mirroring the verified wave-49 pattern. Edge cases cover 403/401, room-removed-while-joined/while-timer-runs, reconnect re-join, multi-tab dedup, and armed-timeout cleanup. The sub-floor floor-waiver is defensible: this is a genuine headline feature, the only split candidate (the room-timer) drives the residual further below both floors, and all three P-0 reviewers scope-endorsed the 3-task bundle. Scope discipline holds (voice/LiveKit, persistence, scheduling, moderation, whiteboard all coherently deferred to later slices) and design_gap_flag=true is correct — the focus-room panel is a genuinely new UI surface. One precision note carried forward for B-block (not gate-blocking): the spec/P-3 phrasing "reuse ... the guarded idempotent transition" is loose — `doPhaseAdvance`/`selfHealIfOverdue` are DB-coupled (their idempotency guard IS the `UPDATE ... WHERE ends_at=expected` optimistic check on server_study_timer), so the room-timer must re-implement the compare-and-set guard against its in-memory anchors Map; only the two pure formulas are literally reusable. The spec's dominant, repeated in-memory/no-DB instruction resolves this in B's favor, so it is a build-note, not a REWORK.

## MUST-lock confirmation
- **MUST-LOCK 1 (ephemeral room identity):** UNAMBIGUOUS — `data: NONE` on all 3 specs; AC-1 + empty-room-removal AC + P-3 no-migration. B cannot add a focus_rooms table without violating an explicit AC.
- **MUST-LOCK 2 (room-vs-server presence separation):** UNAMBIGUOUS — distinct `/study-room` namespace + distinct Map + distinct event literals; fold-into-study-timer explicitly rejected; wave-49 `timerPresence` confirmed separable in code.
- **MUST-LOCK 3 (room-timer in-memory state-location):** UNAMBIGUOUS on state-location — anchors in-memory keyed by roomId, no server_study_timer, roomId-keyed setTimeout map, no per-room loop; pure formulas confirmed genuinely room-agnostic in code. B-block precision note: "reuse the guarded idempotent transition" must be understood as re-implement in-memory (the DB-coupled guard is not literally reusable); the spec's no-DB dominance prevents drift.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---
# Phase 2 — Karen + jenny + Gemini (merged)
## Verdict: APPROVED (gate PASSES → D-block; design_gap_flag true)
- **karen: APPROVE** (aa60457c) — all 7 load-bearing claims VERIFIED vs code: pure formulas (computeCurrentPhase:98-124/phaseDurationMs:76-81 module-level, room-agnostic) reusable; the idempotent transition (doPhaseAdvance:365-431/selfHealIfOverdue:262-308) is DB-coupled CAS (must re-implement in-memory); timerPresence private/separable (gateway:91); WS auth reusable (ws-auth.ts installWsAuthMiddleware); per-server rooms exist (presence.gateway:152); NO existing focus_rooms table/study-room module (net-new); specialists present.
- **jenny: APPROVE** (a299de61) — all 6 items MATCH (M8 ## Scope study-sessions + 2x ceo focus-room rec + decomposition log d2bd9d0; distinct /study-room presence; voice slice-2 deferred; ephemeral; reuse wave-49/50 shipped models; new surface not route). 0 material drift.
- **Gemini: UNAVAILABLE** (429; degradable) — gate proceeds on karen+jenny.

## B-block carries (MANDATORY — verify at B-6)
1. **[karen-1, HIGHEST RISK] In-memory CAS re-implementation:** the room-timer auto-advance idempotency must be a compare-and-set against the in-memory roomTimers Map anchor (compare expected endsAt), NOT a copy of doPhaseAdvance's `UPDATE...WHERE ends_at=` DB path (which is DB-coupled). Reuse ONLY the pure formulas.
2. **[MUST-LOCK 2] presence separation:** NEW /study-room gateway with its OWN presence Map + distinct events (study-room:rooms / study-room:presence); must not touch timerPresence or /study-timer.
3. **[MUST-LOCK 1/3] no table:** zero migration; rooms/rosters/anchors all in-memory Maps keyed by roomId.
4. **[karen-4] timeout leak:** roomTimeouts Map cleanup on room removal (mirror study-timer.service onModuleDestroy/clearAutoAdvance :150-155/340-347).
5. **[jenny-gap-1] REST snapshot:** decide the optional GET /servers/:serverId/study-rooms at B (socket-only is a valid fallback) — don't leave undecided into build.
6. **[jenny-gap-2] helper-extraction parity:** if the pure helpers are extracted/refactored out of study-timer.service, add a parity/regression guard that the wave-49 SERVER timer stays byte-identical (cf. wave-25 mention-slug parity test).

## Footer (Phase 2)
- phase2_complete: true | karen: APPROVE | jenny: APPROVE | gemini: UNAVAILABLE | gate: PASSED
