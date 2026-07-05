```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause check PASSES: the seed's cause claim is genuine, not a
  symptom-restatement. Wave-49's server-timer roster answers "who is passively
  VIEWING the one ambient server timer"; this slice answers a distinct user
  intent — "I am sitting down to focus NOW, with THESE people, on OUR shared
  Pomodoro." The explicit-JOIN signal + per-room roster + room-scoped timer is a
  real user-value delta (the body-doubling co-working loop), addressed at the
  right layer (reusing the shipped Socket.IO server-room substrate + a DISTINCT
  study-room:presence namespace, not conflating with study-timer:presence). No
  antipattern in the catalog fires: voice/video and persisted attendance are
  correctly deferred (not gold-plating), authz reuses assertMember/IDOR, and the
  timer explicitly mandates the wave-49 anchors + compute-on-read + one-shot
  setTimeout model (no per-room-loop trap, no premature "rooms framework").
  The bundle is a coherent buildable slice, and the seed already names its own
  split point (ef84b378) if room-scoping the timer breaches the size floor —
  that decision belongs to P-1 sizing, not a P-0 reframe.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
```

## Final crisp framing for the rest of P-block

**The problem (cause, verified):** A StudyHall server today has ONE ambient study
timer whose ephemeral roster tracks *passive viewers* (wave-49). There is no
surface where a student makes the *explicit commitment* "I'm focusing now, with
these people." That explicit-join commitment — plus a per-room roster and a
room-owned shared Pomodoro any member drives — is the co-working / body-doubling
"reason to open StudyHall together." This is a genuine new capability, not a
re-skin of the viewer roster.

**Room-vs-server presence boundary (must be preserved through P-2/P-3):**
- Server-timer presence = "who is viewing the server's ambient timer," in-memory
  `timerPresence` Map in `StudyTimerGateway`, broadcast on `study-timer:presence`
  over the `/study-timer` namespace, keyed `serverId → userId`.
- Focus-room presence = "who has JOINED focus room R," a SEPARATE in-memory map,
  broadcast on the NEW `study-room:presence` wire namespace, keyed
  `serverId → roomId → userId`.
- These two MUST NOT share a Map, a room name, or a wire event. A student may be
  viewing the ambient server timer while not in any focus room, or in a focus
  room without the server-timer widget mounted. Conflating them is the one
  wrong-layer risk to guard at B-block review.

**Ephemeral-vs-persisted room identity (resolve at P-2 spec — this is the load-bearing decision):**
Slice-1 rooms are EPHEMERAL by explicit seed decision: in-memory, rebuilt from
live sockets, torn down on disconnect / when empty; NO persisted room row or
attendance history (that is a later study-sessions slice). "Create/name a room"
in this slice means "register an in-memory room descriptor {id, serverId,
displayName, live member set}" — NOT a persisted DB entity. This is the correct
MVP: a room that vanishes when empty matches the transient "we're studying
together right now" intent and avoids scoping persistence + lifecycle + GC the
seed defers. **P-2 must state this explicitly** so B-block does not silently
introduce a `focus_rooms` table.

**Room-scoped-timer state-location (the one real trap — resolve at P-3 plan):**
The existing server timer persists its ANCHORS in `server_study_timer`
(PK/UNIQUE `server_id`, DB-backed, self-healing across process restart). The
room-scoped timer (ef84b378) is asked to reuse "room-scoped anchors,
compute-on-read, no per-room loop" — but an EPHEMERAL room has no persistent row
to hang anchors off. So the room timer's anchors necessarily live in-memory
alongside the ephemeral room (dying with the room), whereas the server timer's
anchors are DB-persisted. This asymmetry is a genuine architectural decision, NOT
a framing defect: it is internally consistent with the ephemeral-room MVP (a room
that vanishes takes its timer with it). P-3 must (a) NOT reuse the
`server_study_timer` table for room timers, (b) keep the room-timer `setTimeout`
map keyed by `roomId` (distinct from the service's `serverId`-keyed `timeouts`
map), and (c) reuse the compute-on-read / idempotent-advance / reconnect-reconcile
formulas (`computeCurrentPhase`, `phaseDurationMs`, guarded UPDATE→guarded Map
mutation) — which are pure/reusable — without reusing the DB persistence path.
Server-level timer must remain undisturbed (seed requirement confirmed).

**Bundle coherence / split:** The 3 tasks are a coherent slice (backend room +
UI + room timer). ef84b378 is the seed-flagged natural split point if room-scoping
the timer pushes the wave past its size ceiling — that is a P-1 sizing call
(RESCOPE-AUTO-SPLIT is deferred to P-1 per the stage contract), not a P-0 reframe.
No auto-split verdict from problem-framer.

## Reuse-claim verification (read at P-0)
- `apps/api/src/study-timer/study-timer.service.ts` — confirms anchors-only +
  compute-on-read + ONE-SHOT setTimeout (`timeouts: Map<serverId,handle>`) +
  idempotent guarded UPDATE + `assertMember` IDOR-safe (serverId from route,
  userId from session). Pure helpers `computeCurrentPhase` / `phaseDurationMs` /
  `advancePhase` are room-agnostic and directly reusable.
- `apps/api/src/study-timer/study-timer.gateway.ts` — confirms the ephemeral
  in-memory presence Map pattern (`timerPresence` + `socketPresenceIndex` reverse
  index for O(1) disconnect cleanup), `installWsAuthMiddleware` WS-upgrade auth,
  server-side displayName resolution (never client-provided), and reconnect
  reconciliation on join. The `/study-timer` namespace + `study-timer:server:<id>`
  room naming is the template the new `study-room:presence` namespace must MIRROR
  but not SHARE.
- `apps/api/src/db/schema/study-timer.ts` — `server_study_timer` is UNIQUE per
  server_id; NOT a room-keyed table. Confirms room timer needs a distinct keyspace
  (in-memory for the ephemeral MVP).
- `packages/shared/src/presence.ts` — separate `presence:*` subsystem; unrelated
  to study-room presence, confirming a new namespace is the clean path.

## Disposition
PROCEED. No reframe. No escalation. No auto-split (P-1 owns any sizing split via
ef84b378). Three P-2/P-3 decisions flagged above (ephemeral room identity;
room-vs-server presence separation; room-timer state-location) are framing
*clarifications the spec must lock*, not defects — all resolvable without changing
the problem statement.
