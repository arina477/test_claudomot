# P-0 — Frame (wave-50)

## Discover section
- **wave_db_id:** 660cefa8-731f-48b5-90aa-a6892887d730 (wave_number 50, running, milestone M8)
- **Prior-work citation:** wave-49 (archived `_archive/wave-49/`) shipped the shared study timer (seed 1387d845) LIVE — this wave extends it. P-4 review scoped to the delta (config + one CSS fix), not the whole timer.
- **Roadmap milestone:** M8 — Educator tools & deeper academics (in_progress). Both seeds pre-assigned milestone_id=M8; `waves.milestone_id` set at open. No backfill needed.
- **Spec-contract short-circuit verdict:** `no-prior-spec` (both seed descriptions are prose, no fenced YAML head) → full P-1..P-3.
- **Product-decision resolutions:** none (Action 4) — no money/security/major-UX Tier-3 signal; validated-range per-server config is a standard feature.

## Reframe section
**Original framing:** M8 study-group slice 2 — bundle of custom Pomodoro durations (seed f4b3659e) + F-1 slim-bar CSS fix (sibling ffd98a36).

**problem-framer (ab8d75ca) — PROCEED:** symptom-vs-cause clear on both (custom-durations is a genuine feature extension of a LIVE feature, not gold-plating; F-1 correctly root-caused to the inline-border/stylesheet specificity collision). No antipatterns matched (premature-abstraction cleared provided P-2 scopes ONE work/break pair, not a "timer settings" framework). **Ownership RESOLVED: per-server** (verified `server_study_timer UNIQUE(server_id)` + membership-gated; per-user would be a different larger wave — P-1/P-2 must NOT drift there). Bundle KEEP TOGETHER (F-1 too trivial for its own wave). **2 guardrails flagged for P-2:** (1) changing durations while a timer is running/paused is a real non-happy-path — spec must name transition semantics (reject-while-running vs apply-on-next-phase vs restart); (2) config endpoint reuses the existing membership-gate + IDOR-safe route pattern (serverId from route, userId from session).

**ceo-reviewer (a0d51a63) — PROCEED / HOLD-SCOPE:** right-sized, right thing. No expansion — joinable study-sessions + whiteboard are separate larger M8 slices (not cheap add-ons; folding one in would be "9/10 when 3/10 was enough" in reverse). Custom-durations is a founder-recorded deferred commitment; F-1 is a real regression on the LIVE timer, not ignorable. **Strategic next-wave note (not a wave-50 blocker):** the ambitious joinable focus-room / body-doubling session — the strongest "reason to open StudyHall together" draw — should be the NEXT wave, as its own wave. This wave earns that by clearing cheap debt first; one more thin timer follow-up after this would tip into drift.

**mvp-thinner (ae8a33d0) — OK (floor-constrained):** M8 `## Success metric` (teacher-live + private-conversations) is already both done, so all study-timer scope is founder-directed forward scope above the mvp-critical floor. The seed is itself a prior-wave THIN carve-out — re-thinning would be double-cutting. Proposed scope already equals the mvp-critical core (per-server work/break durations, validated min/max, applied to the shared timer, synced via existing broadcast, reuse wave-49 substrate). `floor_constraint_active: true` (~250-450 net LOC + 1-line CSS = already thin; any peel drives under the single-spec floor). F-1 correctly bundled. **Scope-fence advisory:** if P-1/P-2 enumeration drifts into per-user prefs / presets library / long-break-every-N / history-analytics / heavy UI → those are sibling-split targets and the verdict flips to THIN.

**Mediation outcome:** none needed — ceo-reviewer proposed no expansion + mvp-thinner returned OK (not THIN); they agree. No sibling splits created.

**Disposition: PROCEED.**

**Final framing (rest of P-block uses this):** wave-50 = per-server configurable Pomodoro work/break durations (validated min/max ranges) on the shipped shared study timer — synced to all members via the existing `study-timer:update` broadcast, reusing the wave-49 `server_study_timer` schema + service + StudyTimerWidget, membership-gated/IDOR-safe (serverId from route, userId from session) — PLUS the F-1 slim-bar phase-indicator CSS fix. **Guardrails:** (a) spec MUST define change-while-running/paused transition semantics; (b) reuse the existing auth/IDOR route pattern; (c) scope-FENCE: NO per-user prefs, NO presets library, NO long-break-every-N, NO history/analytics, NO heavy settings UI (those are future sibling slices). claimed_task_ids = [f4b3659e, ffd98a36].
