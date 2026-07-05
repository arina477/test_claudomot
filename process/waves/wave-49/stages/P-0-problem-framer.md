verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [2]
reasoning: |
  Symptom-vs-cause check: PASS on scope framing — the real job is "everyone in a
  study server shares one authoritative work/break countdown that survives API
  restart and reconnects." A PERSISTED single-row-per-server timer (server_id
  unique, phase, durations, run_state, started_at, ends_at, updated_by) is the
  CORRECT model, NOT over-engineering. Ephemeral/compute-on-read alone (the
  scheduling recurrence pattern) does not apply: a Pomodoro timer with manual
  start + pause/resume is MUTABLE interactive state, not a deterministic function
  of a fixed rule, so its anchors (ends_at, run_state, phase) MUST be durable to
  reconcile late-joiners and survive restart. Persist affirmed.
  The ONE framing defect is the phase-auto-advance mechanism (832b83b7), left
  unspecified in a way that invites antipattern #2 (wrong layer): implementing
  "work->break->work at ends_at" as a per-server setInterval / @nestjs/schedule
  tick loop puts timing logic in a live server process (N servers = N timers;
  fragile on restart; double-fires under multi-instance API). The codebase has
  ZERO precedent for server-side interval loops and a clean precedent for
  compute-on-read derivation + room-scoped broadcast. Pin the model now so P-2/P-3
  do not bake the timer-loop in. Keep all 4 tasks and the current ordering; this
  is a model constraint, not a rescope. Educator-gate deferral is correct
  (anti-gold-plating handled well); auto-advance stays in-slice (a timer whose
  break never fires does not deliver "study together").
proposed_reframe: |
  Keep the 4-task bundle and ordering. Bind the following model into the framing
  (carry into P-2 spec ACs):
  1. Authoritative state = the persisted single-row-per-server timer. Store
     ANCHORS only (phase, run_state, work/break durations, started_at, ends_at,
     updated_by) — never a stored/decrementing remaining-seconds counter.
  2. Remaining time AND current phase are DERIVED (compute-on-read) from
     started_at + ends_at + durations, both server-side (on any GET / reconnect
     reconcile) and client-side (client counts down to authoritative ends_at).
     This is what makes clients self-synchronize and self-heal a missed event.
  3. Phase auto-advance (832b83b7) is broadcast-on-transition, NOT a per-server
     loop: at most a single one-shot scheduled emit at ends_at to push the
     transition to already-connected clients; because state is always derivable,
     a missed/duplicated tick self-heals on next read. FORBID setInterval /
     @nestjs/schedule / node-cron per server. Idempotent transition write.
  4. Fan-out reuses messaging.gateway room pattern: emit timer state only to the
     server room, membership gated by server-side can() re-derivation at join
     (never client-asserted) — mirrors channel:<id> fan-out.
escalation_reason: |
  n/a
sibling_visible: false
