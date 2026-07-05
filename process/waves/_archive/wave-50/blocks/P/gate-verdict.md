# Wave 50 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-p4-w50-a1)
**Reviewed against:** process/waves/wave-50/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-50 completes a founder-committed deferred feature (per-server custom Pomodoro durations, carved out of wave-49 by mvp-thinner) on the shipped-LIVE shared study timer, plus a one-line CSS fix for the F-1 slim-bar regression on that same widget — both laddering to milestone M8. The spec's acceptance criteria are falsifiable and observably testable (specific HTTP codes, concrete validated ranges 1-120/1-60, "verifiable via ends_at/remaining after Start", "other members update WITHOUT reloading"), and the non-happy states — 400 invalid range/non-integer/missing, 409 config-while-running/paused, 403 non-member, 401 anon, concurrent last-write-wins, and backward-compat for pre-migration rows — are each enumerated in the edge-cases block. The plan maps every AC to a file-level step with a named specialist (node-specialist / react-specialist, both confirmed in AGENTS.md), reuses the wave-49 substrate rather than inventing a parallel path, and its migration-0023 additive-with-defaults strategy is backfill-safe and backward-compatible. I verified the load-bearing claims against the codebase: the `server_study_timer` table with `UNIQUE(server_id)` + `run_state {idle|running|paused}`, the hardcoded `WORK_DURATION_MS`/`BREAK_DURATION_MS` literals the plan replaces, the `assertMember`→403 IDOR-safe controller pattern the config route mirrors, migration 0022 as latest (0023 correct), and the F-1 inline-border-clobbers-`border-left` collision at StudyTimerWidget.tsx:476 vs globals.css:310-315 — all confirmed. The scope-fence (no per-user/presets/history/heavy-UI) is coherent and matches per-server ownership (the `UNIQUE(server_id)` shared timer). The idle-only config transition semantic (409 when running/paused) is a sound, unambiguous choice — it keeps the compute-on-read anchor model from having to walk mixed-duration phases mid-run, and the reviewers scope-fenced to a minimal affordance, so the extra flexibility of apply-on-next-phase would be gold-plating.

## Floor-waiver adjudication
The P-1 override-ship (floor waived, resolve-by-rule, no BOARD) is a **defensible P-block call** and I uphold it. The multi-spec floor exists to prevent wasteful tiny waves; its purpose does not apply here — this is high-value feature-completion of a founder-directed deferral plus a shipped-regression fix on a LIVE surface, reusing existing substrate, not filler. Expanding to meet the ~2,500 LOC floor would require ~5x the scope and would author precisely the adjacent slices (joinable study-sessions, whiteboard, per-user prefs) that all three P-0 reviewers unanimously fenced out — and would re-litigate a strategic HOLD-SCOPE call the BOARD strategic seat (ceo-reviewer) already made at P-0. `board-process.md`'s fires-list scopes BOARD to the P-1 *monolith* (max-split), not floor-merge; anti-pattern #1 directs routine sizing to resolve-by-rule. Convening BOARD here would be procedurally wrong. The recurring-pattern L-2 carve-out flag (floor rubric needs a reuse-heavy-completion/regression-fix exemption) is the correct disposition. One caution recorded for the strategic log, not a blocker: ceo-reviewer's note that "one more thin timer follow-up after this would tip into drift" — this wave is the last cheap-debt-clearing timer follow-up before the ambitious joinable-focus-room slice should open as its own wave.

## Security-scope note (informational — routes Phase 2)
This wave adds a state-changing `PATCH /servers/:serverId/study-timer/config` endpoint. It is NOT under-specified: the spec mandates the wave-49 IDOR-safe pattern explicitly (serverId from route, userId from session, AuthGuard→401 anon, assertMember→403 non-member, 400 Zod range validation, 409 non-idle), and I confirmed that pattern exists verbatim on the sibling start/pause/resume/reset routes the new route mirrors. `wave_touches ∩ {auth, sessions, ...}` is limited to reusing an existing session/membership gate on a new mutation — no new auth/session/cookie/rate-limit surface is introduced. The security-scope tightened Phase-2 gate applies; the authz contract is complete enough to verify against.

## Cascade
Not applicable — APPROVED, no rework.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
- next_action: PROCEED_TO_P4_PHASE_2 (karen + jenny + Gemini); design_gap_flag=true → D-block after gate pass

---

# Phase 2 — Karen + jenny + Gemini (merged)

**Phase:** 2

## Verdict: APPROVED (gate PASSES → P-block exit → D-block)

- **karen: APPROVE** (agentId aa25b9187c72db904) — all load-bearing claims VERIFIED against the wave-49 substrate (schema UNIQUE(server_id) + run_state, 25/5 literals at service.ts:39-40, IDOR controller pattern, 0022 head → 0023 next, F-1 collision at StudyTimerWidget.tsx:476 vs globals.css:310-315, both specialists in AGENTS.md). Claim 3 (event constant) pinned. **2 Medium build-notes → B-block carries** (below). Spec buildable.
- **jenny: APPROVE** (agentId a1729f16656975c9b) — all 6 spec items MATCH prior decisions (per-server ownership, redeems recorded f4b3659e deferral, scope-fence verbatim, idle-only 409 consistent with shipped states, F-1 restores adopted design, closes exactly the 25/5 gap). No spec-drift, no material spec-gap.
- **Gemini: UNAVAILABLE** (HTTP 429; helper exit=3) — degradable per Action 3; does NOT block. Gate proceeds on karen + jenny.

## B-block carries (from karen Phase 2 — MANDATORY at B-2)
1. **Event wiring:** `configureDurations` emits the INTERNAL `STUDY_TIMER_UPDATED_EVENT` (`'study-timer.updated'`, service.ts:46) — NOT a direct wire `study-timer:update`. The existing gateway `@OnEvent` (gateway.ts:271) fans out the wire event to the room. The extended DTO (with duration fields) rides the existing payload. Live-sync AC is then achieved for free.
2. **Duration threading (correctness-critical):** route the per-row `work_duration_ms`/`break_duration_ms` through `phaseDurationMs()`, `computeCurrentPhase()`, `doPhaseAdvance()`, AND `selfHealIfOverdue()` — not only `startTimer()`. Otherwise a restarted process self-heals a custom-duration timer using hardcoded 25/5 and corrupts phase math. Make `phaseDurationMs`/`computeCurrentPhase` row-aware (take the two durations as params).

## Footer (Phase 2)
- phase2_complete: true
- karen: APPROVE | jenny: APPROVE | gemini: UNAVAILABLE
- gate: PASSED
