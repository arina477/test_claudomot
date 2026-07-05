# Wave 49 — P-0 Frame
## Discover
- wave_db_id: 49210ad5-85eb-4d4f-bb67-e1915ae03d0a (wave 49, running, M8). Seed 1387d845 + siblings cb81bf03/c3daf6d3/832b83b7.
- Prior-work: real-time (messaging.gateway per-server rooms + WS auth), server_members + rbac can() (membership authz), Drizzle conventions, presence — all shipped (DMs wave-46/47, scheduling wave-43). Study-group tools = new M8 feature (founder-chosen this session).
- short-circuit: no-prior-spec (decomposer prose). Product decision: study-group tools direction founder-set; slice-1 = shared study timer.
## Reframe (Action 6 mediation — 3 substantive verdicts merged)
- **problem-framer: REFRAME (narrow model-pin, no rescope) — ACCEPTED as a binding P-2/P-3 model constraint (NOT a re-spawn; problem/scope unchanged, only implementation model pinned):**
  - Persisted single-row-per-server timer is CORRECT (mutable interactive state — a running/paused timer can't be derived from a fixed rule like scheduling's compute-on-read recurrence). AFFIRMED.
  - BUT: persist **ANCHORS ONLY** (server_id, phase [work|break], run_state [idle|running|paused], started_at, ends_at, updated_by; durations hardcoded 25/5 per mvp-thinner) — NEVER a stored decrementing counter. Derive remaining-time + current-phase **compute-on-read** (server-side + client counts down to authoritative ends_at → anti-drift).
  - **Phase auto-advance (832b83b7) = broadcast-on-transition, NOT a timer loop**: at most a single one-shot idempotent transition write + emit at ends_at; self-healing (state always re-derivable). **FORBID a per-server setInterval / @nestjs/schedule tick loop** (wrong-layer antipattern #2 — N servers = N loops, restart-fragile, multi-instance double-fire). Codebase has zero server-loop precedent + clean compute-on-read precedent (scheduling.service).
- **ceo-reviewer: SELECTIVE-EXPANSION — ACCEPTED:** add EPHEMERAL live-presence roster to the timer broadcast (cb81bf03 fan-out + c3daf6d3 widget) — a count/roster ("N studying") of members currently VIEWING the running server timer. Body-doubling = awareness of co-present others → moves slice ~5/10→8/10. Cheap: reuses the per-server room membership the fan-out already maintains; ephemeral, NO persistence. GUARDRAIL: ephemeral presence only (who's viewing the live timer) — NOT join/leave rooms, NOT persisted attendance/history (later study-sessions slice). Offline-first NOT gold-plated (live-broadcast feature; reconnect-reconcile is the only reliability surface — M12 owns the offline moat).
- **mvp-thinner: THIN — ACCEPTED (1 peel):** defer configure/custom-durations → NEW deferred M8 seed (parent NULL, wave_id NULL, inserted this stage). Seed 1387d845 narrows to HARDCODED 25/5 (drop the configure endpoint + "durations configurable"). Keep auto-advance + reconnect-reconcile (both mvp — auto-advance IS the Pomodoro; reconcile = "everyone sees the SAME timer"). Keep pause.
- Mediation (ceo-expand vs mvp-thin): NON-CONFLICTING — configure-defer (thin) + presence-roster (expand) are different ACs; both applied. Net slice: "shared 25/5 Pomodoro, everyone sees it counting + auto-advances + sees who's studying together," minus custom durations.
- Disposition: **PROCEED-WITH-ADJUSTMENTS**. claimed_task_ids UNCHANGED [1387d845, cb81bf03, c3daf6d3, 832b83b7] (configure-defer is a separate future seed, not claimed). design_gap_flag EXPECT true (timer widget + presence roster = new member-facing surface → D-block).
```yaml
p_stage_verdict: COMPLETE
disposition: PROCEED-WITH-ADJUSTMENTS
short_circuit: no-prior-spec
reframe: {problem-framer: REFRAME-model-pin-bound, ceo-reviewer: SELECTIVE-EXPANSION-presence-added, mvp-thinner: THIN-configure-deferred}
carry_forward:
  - "P-2/P-3 MODEL (binding): persist anchors only; compute-on-read remaining+phase; client counts to authoritative ends_at; auto-advance=broadcast-on-transition (one-shot idempotent, self-healing); FORBID per-server timer loop"
  - "P-2: seed hardcodes 25/5 (configure DEFERRED to new seed); add ephemeral live-presence roster to fan-out+widget (no persistence; not attendance)"
  - "P-1: design_gap_flag=true (timer widget + presence roster new surface)"
config_defer_seed_inserted: true
