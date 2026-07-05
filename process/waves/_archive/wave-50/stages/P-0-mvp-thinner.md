```yaml
verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  A class cohort runs coursework end-to-end in StudyHall without falling back to
  Discord: the teacher side is live (roles, assignment collect/return, scheduling)
  AND students can hold private 1:1 and small-group conversations outside class
  channels — real-time and offline-tolerant. First slice: direct + group messages.
  [Working target set by Claudomat 2026-07-04 on founder delegation; founder can
  adjust anytime.]
mvp_critical_status: |
  All success-metric-load-bearing scope is already done. The metric names two
  pillars — (1) teacher side live [roles+moderation w41, assignment collect/return
  w42, class scheduling w43 — all status=done] and (2) students hold private 1:1 +
  group conversations [DM slice + DM-polish waves 45-48 — all status=done]. Both
  pillars are shipped. Study-group tools (shared timers/Pomodoro, study sessions,
  whiteboard) are M8 ## Scope items but are NOT referenced by the ## Success metric
  prose — they are founder-directed forward scope beyond the metric floor. The
  wave-49 shared study timer shipped LIVE. This wave's custom-durations follow-up
  and the F-1 CSS fix therefore sit ENTIRELY ABOVE the milestone's mvp-critical
  floor: the trace test returns "success metric still satisfiable" for every AC in
  this wave, because it is already satisfiable without any study-timer scope at all.

ok_rationale: |
  Right-sized, and additionally floor-constrained. Two independent reasons this is
  OK not THIN: (1) FLOOR — the custom-durations feature is a deliberately thin
  slice that reuses the entire wave-49 substrate (timer schema + service + widget +
  fan-out); its true mvp-critical core (per-server work/break durations, validated
  min/max, applied to the shared timer, synced via the existing broadcast) IS the
  whole feature. Peeling the anticipated nice-to-have ACs (per-user prefs, presets
  library, long-break-every-N, history/analytics) off would not shrink a bloated
  wave — those ACs are NOT in the proposed scope to begin with (the seed prose
  scopes only "custom work/break durations, validated ranges"). There is nothing
  to split; a THIN here would push residual LOC below the single-spec 1,500-LOC
  floor and trigger RESCOPE-AUTO-MERGE. (2) TRACE — because the M8 success metric
  is already fully satisfiable (both pillars done) WITHOUT study timers, no study-
  timer AC can be "mvp-critical for the metric"; but that makes the whole wave
  discretionary founder-directed forward scope, not a thinness target — mvp-thinner
  re-classifies WITHIN a wave's mvp-critical claim, and this wave makes no such
  claim to trim. The seed itself is already the product of a prior mvp-thinner THIN
  (deferred from wave-49); re-thinning a previously-thinned deferral would be
  double-cutting. The F-1 CSS fix (ffd98a36) is correctly bundled: a genuinely
  trivial ~1-line specificity fix on the SAME widget this wave already touches,
  parent-linked to the seed — coherent co-location, not noise; splitting it into
  its own wave would be waste.
floor_constraint_active: true
floor_constraint_detail: |
  Wave = 2 tasks: custom-durations feature (f4b3659e) + ~1-line CSS fix (ffd98a36).
  Estimated current wave LOC: custom-durations ~250-450 net (configure endpoint +
  Zod duration-range validation + widget number-input affordance + broadcast reuse
  + tests) reusing the shipped wave-49 timer schema/service/widget; CSS fix ~1-5
  LOC. The ANTICIPATED split-out candidates (per-user duration prefs vs per-server;
  presets/templates library; long-break-every-N-cycles; duration history/analytics;
  UI polish beyond a number input) are NOT present in the proposed scope — the seed
  prose fences to "custom work/break durations (validated ranges)" only. Since the
  proposed AC set already equals the mvp-critical core, there is 0 LOC available to
  split. Any hypothetical peel-off would drive residual below the single-spec floor
  (1,500 LOC — which the wave is already under, correctly, as a deliberate thin
  deferred follow-up; sub-floor thin feature-follow-ups under M8 have precedent-
  approved override handling per product-decisions 2026-07-04 wave-45 floor-merge
  BOARD 7/7). The floor genuinely blocks any further thinning; refuse to THIN.

# Advisory for P-1/P-2 (not a split proposal — recorded so the scope fence survives)
scope_fence_advisory: |
  Keep the mvp-critical core to: a PER-SERVER configurable work + break duration
  (validated min/max), applied to the existing shared timer, synced to all members
  via the existing wave-49 broadcast — reusing the shipped schema/service/widget.
  If P-1/P-2 or B-block enumeration DRIFTS UPWARD into any of the following, THOSE
  become the split targets (author as sibling tasks under seed f4b3659e,
  milestone_id=84e17739, wave_id=NULL) rather than in-wave scope creep:
    - per-USER duration preferences (vs the per-server single shared value) — a
      different data model + conflict story; defer.
    - presets / templates library (52/17, deep-work, etc.) — polish ahead of demand.
    - long-break-every-N-cycles (extended Pomodoro variants) — extension ahead of
      demand; the wave-49 phase model is work/break binary.
    - duration history / analytics / stats — a later study-group slice already
      named as deferred in product-decisions (2026-07-05 timer bundle).
    - UI polish beyond a simple validated number/stepper input.
  This is a drift-guard, NOT a THIN proposal — none of these are in the current
  proposed scope. mvp-thinner would flip to THIN only if a later stage packs one of
  them INTO this wave.

sibling_visible: false
```

## Reasoning narrative (for head-product merge)

**Trace-test result.** The M8 `## Success metric` is finalized (no longer `_TBD`) and names exactly two pillars: teacher-side-live (roles/moderation, assignment collect/return, scheduling) and students-hold-private-conversations (1:1 + group DMs, real-time + offline-tolerant). Both pillars map to `status=done` task chains in M8. Study timers appear in `## Scope` but are **absent from the success-metric prose**. Running the trace test — "if this AC were absent, would the success metric still be satisfiable?" — returns YES for every study-timer AC, because the metric is *already* satisfiable with zero study-timer scope. That does not make these ACs splittable; it makes the entire wave founder-directed forward scope sitting above the metric floor. mvp-thinner trims ACs *within* a wave's mvp-critical claim; this wave asserts no such claim to trim.

**Why not THIN.** The seed is itself the output of a prior mvp-thinner THIN at wave-49 P-0 (custom durations was the deferred carve-out; product-decisions 2026-07-05 confirms 25/5 was hardcoded and durations pushed to f4b3659e). The proposed scope is already the mvp-critical core — "per-server custom work/break durations, validated + synced, reusing the wave-49 substrate." The classic candidate split-outs (per-user prefs, presets, long-break-every-N, history/analytics, heavy UI) are **not in the proposed scope**; the seed prose fences to "validated ranges" only. There is nothing to peel. A THIN would be inventing a smaller wave, which is P-1's authority, not mine — and would trip the single-spec floor.

**Floor.** Reused substrate makes this a ~250-450 net-LOC feature + a ~1-line CSS fix. Already thin by construction. Emitting OK with `floor_constraint_active: true` per the stage contract's floor-awareness pre-check.

**F-1 CSS fix bundling.** Appropriate, not noise. It is a ~1-line specificity fix (inline `border` shorthand at StudyTimerWidget.tsx:476 outranking the `.timer-phase-*` border-left rule) on the *same widget* this wave already modifies, parent-linked to the seed. Co-located coherently; a standalone wave for it would be waste.

**Recorded a scope-fence advisory** (not a split proposal) so the drift-guard survives into P-1/P-2/B — if enumeration drifts upward into per-user prefs / presets / long-break-N / history / heavy UI, those are the sibling-split targets, and mvp-thinner's verdict would flip to THIN at that point.
