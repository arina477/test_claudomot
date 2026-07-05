# Wave 49 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, B-6 Phase 1 gate)
**Reviewed against:** process/waves/wave-49/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
REWORK

## Rationale
The binding compute-on-read model is honored cleanly and is genuinely good work: `server_study_timer` persists anchors only (phase/run_state/started_at/ends_at/paused_remaining_ms), `rowToDto` derives `remainingMs = max(0, ends_at − now)` with no stored ticking counter, auto-advance is a single one-shot `setTimeout` per server that is cleared+re-armed (no `setInterval`, no `@nestjs/schedule`, no per-server tick loop — grep-confirmed), `doPhaseAdvance` is idempotent via `UPDATE ... WHERE run_state='running' AND ends_at=$expected`, `selfHealIfOverdue`/`computeCurrentPhase` re-derive phase from anchors on read, presence is an ephemeral in-memory Map with multi-tab dedupe and zero DB writes, and every door is guarded (AuthGuard on all five REST routes; `assertMember` → 403 on every control and read; `join_timer_room` re-checks `server_members` server-side; userId from session, never client-supplied; displayName resolved server-side). The migration (0022) is committed, anchors-only, UNIQUE(server_id), FK cascade, no startup auto-migrate — all correct. **However, the block fails the single most important cross-layer check the B-block exists to enforce: the frontend and backend are wired to two different Socket.IO namespaces, so the real-time contract is broken end-to-end.** The backend `StudyTimerGateway` is declared on `namespace: '/study-timer'` and broadcasts to room `study-timer:server:<id>` on that namespace's server instance. The frontend `studyTimerSocket.ts` emits `join_timer_room` and subscribes to `study-timer:update` / `study-timer:presence` over `getMessagingSocket()`, which connects to `io(\`${BASE}/messaging\`)`. Socket.IO namespaces are isolated: a `/messaging` client's `join_timer_room` never reaches the `/study-timer` gateway handler, and the gateway's room broadcasts never reach any `/messaging` socket. Net effect in production: REST controls succeed (200 + DB write), but no client is ever in the `/study-timer` room, so cross-client timer sync and the "N studying" presence roster silently do nothing — the exact single-client-realtime / client-breaking contract-drift failure this gate must catch. It slipped because it was never verified end-to-end: the backend integration spec imports `StudyTimerService` directly (no `socket.io-client`, no namespace round-trip), and the frontend unit test mocks the socket module — neither exercises the real cross-namespace wire. This is a concrete, resolvable wiring defect (REWORK), not an unimplementable spec (ESCALATE).

## Rework instructions  (only if REWORK)

### Stages requiring rework
- B-3 frontend: study-timer client connects to the wrong Socket.IO namespace; realtime + presence never reach the widget.
- B-4 wiring: the end-to-end socket round-trip was declared wired but was never actually verified; must add real cross-namespace confirmation after the B-3 fix.

### Per stage

#### B-3
- **What's wrong:** `apps/web/src/shell/studyTimerSocket.ts` reuses `getMessagingSocket()` (namespace `/messaging`) for `join_timer_room`, `leave_timer_room`, `study-timer:update`, and `study-timer:presence`. The backend `StudyTimerGateway` (`apps/api/src/study-timer/study-timer.gateway.ts`) is on namespace `/study-timer` with room `study-timer:server:<serverId>`. Different namespaces = zero delivery in both directions. The file's own header comment ("event subscriptions over the /messaging namespace … The messaging.gateway hosts per-server rooms and broadcasts study-timer events") describes a design that does not match the shipped backend and is factually wrong — `messaging.gateway.ts` has no `join_timer_room` handler and no study-timer emit (grep-confirmed).
- **Heuristic fired:** H-B-09 contract/transport drift between B-2 and B-3 (frontend subscribes on a different Socket.IO namespace than the backend gateway serves) + single-client-realtime (tests pass because no test performs a real client↔server namespace round-trip).
- **What "good" looks like:** `studyTimerSocket.ts` owns a dedicated singleton Socket.IO client on the `/study-timer` namespace, mirroring the established codebase convention in `apps/web/src/shell/presenceSocket.ts` which does `io(\`${BASE}/presence\`)` for the `/presence` gateway — this is exactly the pattern the P-4 carry pointed at. Concretely: create a `getStudyTimerSocket()` singleton that connects `io(\`${BASE}/study-timer\`, { withCredentials: true, ... })` (copy the auth/reconnect options from `messagingSocket.ts`/`presenceSocket.ts`), and route `joinTimerRoom`/`leaveTimerRoom`/`onStudyTimerUpdate`/`onStudyTimerPresence` through it instead of `getMessagingSocket()`. Keep the reconnect re-join handler (`ensureReconnect`) bound to the new socket. After the change, a mounted widget on client A must receive `study-timer:update` when client B hits start/pause/reset, and the "N studying" badge must reflect both viewers.
- **Re-do instructions:**
  1. Route fix through **frontend-developer** (backed by **websocket-engineer** for the namespace/singleton + reconnect semantics): rewrite `apps/web/src/shell/studyTimerSocket.ts` to use a dedicated `/study-timer` client per the `presenceSocket.ts` template; correct the stale header comment. Do NOT alter the backend gateway — the `/study-timer` namespace choice is correct and consistent with the `/presence` pattern the carry referenced.
  2. Confirm the `/study-timer` namespace passes the same WS-upgrade auth: the gateway already calls `installWsAuthMiddleware(server)` in `afterInit`, so the new client must send credentials the same way the messaging/presence clients do (verify `withCredentials`/cookie flows for the `/study-timer` namespace connection).
  3. Update `apps/web/src/shell/study-timer.test.tsx` mock target to the new socket module accessor so tests still cover the reconcile path.
  4. (Alternative, only if the team prefers a single namespace) route through **node-specialist**: move `join_timer_room`/`leave_timer_room`/fan-out onto the existing `/messaging` gateway as rooms (the `messaging.gateway.ts` "no new namespace" comment suggests the spec may have intended this). If this path is chosen, B-2 also re-runs. Pick ONE path; the dedicated-namespace fix (step 1) is lower-risk and preserves the already-correct backend, so it is the recommended path.

#### B-4
- **What's wrong:** B-4 recorded "backend and frontend wired against the same shared contract; round-trip succeeds" but the socket round-trip was never actually exercised — repo typecheck cannot detect a namespace mismatch, and no integration/e2e test connects a real `socket.io-client` to the gateway namespace.
- **Heuristic fired:** wiring-verified-by-assertion (B-4 exit ticked without a real round-trip against the running server).
- **What "good" looks like:** after the B-3 fix, a real cross-client verification exists — either a lightweight backend integration test that connects two `socket.io-client` instances to the `/study-timer` namespace, both `join_timer_room`, one triggers a control, and both observe `study-timer:update` + a `study-timer:presence` count of 2; or this is explicitly deferred to T-block two-client realtime with a written note, but the namespace fix itself must be proven before B-6 re-approval.
- **Re-do instructions:** **backend-developer** (or **test-automator**) adds the two-client `/study-timer` namespace round-trip check; re-run B-4 repo-wide typecheck and B-5 full suite (lint, tsc, unit, build) after the B-3 change lands.

### Cascade

B-block cascade rules (trigger = B-3 frontend, recommended path):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-3 frontend | B-4 (re-wire + real round-trip verification), B-5 (re-verify full suite) |

- **Stages that must re-run after the above:** B-4, B-5. (If the alternative single-namespace path in B-3 step 4 is chosen instead, B-2 backend also re-runs, then B-3→B-4→B-5.)
- **Stages that stay untouched:** B-0 (schema — correct, anchors-only), B-1 (contracts — payload schema + event-name constants are correct; the drift is at the transport/namespace layer, not the Zod shape). B-2 backend stays untouched under the recommended dedicated-namespace fix.

## Secondary notes (not independently gating)
- **Action 6 commit discipline:** all four claimed task_ids have ≥1 commit (1387d845: a7ceff5/a1b962a/ea33592; cb81bf03: d5067eb; c3daf6d3: 1a6972c; 832b83b7: ea33592). One commit (ea33592) cites two task_ids (1387d845 + 832b83b7). This is a technical Action-6 exception, but the two specs are genuinely inseparable at the file level — the auto-advance/self-heal logic (832b83b7) lives inside `study-timer.service.ts` interleaved with the compute-on-read spine (1387d845) and cannot be cleanly split into disjoint file sets; the diff does NOT cross into another spec block's files (cb81bf03's gateway and c3daf6d3's frontend are in separate commits). The author documented the coupling in the commit body. Accepted as documented-debt — do NOT force an artificial `rebase -i` split of one file's cohesive methods. No independent REWORK on this basis.
- **D-3 carries (a11y/CSS):** not re-audited line-by-line at this gate because the namespace defect forces REWORK regardless; verify the `.btn` transition, slim-bar phase indicator, aria-atomic/aria-live, and decorative-icon carries during the B-3 re-review pass and at T-block.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
