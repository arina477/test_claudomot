# L-1 — Docs (wave-63)

**Block:** L (Learn) · **Stage:** L-1 (∥ L-2) · **Mode:** automatic · **Owner:** head-learn (spawned inline)

Wave-63 = M12 (Offline-first moat) bundle #2: extend the offline read-cache from messages + DMs to ACADEMIC content — assignments + class schedule now render from a Dexie v3 offline cache when disconnected. Merged PR #78 → main 699a619, web deployed SUCCESS, all gates APPROVED, T-5 LIVE offline prod probe PASSED.

Claimed tasks: c5689dc5 (seed) + 35c57942 + 42e0a265 (siblings), all `milestone_id = 36378340` (M12), all now `status='done'`.

## Action 1 — CHANGELOG entry

Appended ONE bullet under `## [Unreleased] → ### Added` (CHANGELOG.md, immediately after the wave-62 offline-DM line #84):

> - View your assignments and class schedule offline: your assignment list and class calendar now stay readable even when you're offline or on a flaky connection, instead of going blank, and they refresh once you reconnect. (#78)

**Added, not Changed:** a genuinely new user-facing capability (offline reads for assignments + schedule) extending the M4/wave-62 offline wedge to the academic surface — same treatment as the wave-62 offline-DM entry. StudyHall identity, plain-language, no stage codes, cites PR #78. Length within cap (1 bullet).

## Action 2 — Milestone delta

Milestone touched: **M12 — Offline-first moat** (36378340), reached via `tasks.milestone_id` on all 3 claimed tasks.

Child rollup after L-2 done-marking: **done=6 / open=0 / total=6** (bundle #1 offline DMs = 3 + bundle #2 offline academic = 3).

**Disposition: M12 in_progress → in_progress (NO transition).** `open_count=0` from two decomposed bundles does NOT close a LARGE multi-bundle milestone whose recorded scope is not yet shipped. M12's own `## Success metric` + `## Scope` still owe: **study-group data**, **previously-loaded media**, and a **conflict-resolution UI** (zero-data-loss reconcile on reconnect). Closing M12 here would falsely claim the moat is shipped.

This is a **mechanical, no-ambiguity disposition** — the milestone's own recorded scope is the authority, not a judgment call — so under `automatic` mode it runs WITHOUT BOARD escalation and WITHOUT a `milestones` DB write. Transition record appended to `command-center/product/product-decisions.md` (wave-63 L-1 milestone-delta entry).

**CRITICAL carry-forward for N-1 (flagged prominently):** M12 active queue now has 0 open child tasks but scope NOT shipped → N-1 "fire per-wave milestone-decomposition" case (N-1 Action 7 spawns milestone-decomposer for M12's next bundle). **Bundle #3 = OFFLINE STUDY-GROUP DATA** — the remaining academic-content clause of M12's success metric (assignments + schedule done; study-group data next), per ceo-reviewer's recorded direction across waves 62/63. Extend the now-proven Dexie read-through cache pattern to study-group content; NOT another social surface, NOT the heavier deferred items (media blobs + conflict-resolution UI) yet.

## Action 3 — Journey-map annotation (T-9-deferred)

T-9 deferred the annotation-only journey-map regen to L-1. Added one `last_updated_wave63:` annotation to `command-center/artifacts/user-journey-map.md` (after the wave-62 DM annotation): AssignmentsPanel + ClassCalendar surfaces are now offline-read-cached (Dexie v3 data-source change, NO new route/screen/endpoint/component). Matches the wave-62 offline-DM annotation shape — data-source change, zero journey delta.

## Action 3b — README

**Skipped.** Offline read behavior is transparent — no user-facing CLI / env var / install step / breaking change; a data-source change on existing surfaces. Recorded.

## Action 4 — Commit

FS docs batched: `docs: L-1 wave-63 closeout` (CHANGELOG + journey-map annotation + product-decisions milestone-delta record). Commit SHA + push recorded in verdict_evidence below.

---

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: L-1-docs
  reviewers: {}
  failed_checks: []
  rationale: >
    Every active block's observations captured at L-2; CHANGELOG carries one plain-language user-facing
    Added bullet citing PR #78; milestone delta is a mechanical no-ambiguity in_progress→in_progress hold
    (M12 scope not shipped — study-group data + media + conflict-resolution UI remain), recorded in
    product-decisions with the bundle-#3 = offline STUDY-GROUP DATA carry-forward flagged prominently for
    N-1; journey-map got the one-line data-source annotation T-9 deferred; README correctly skipped
    (transparent behavior). No blame, artifact-cited, doc coverage complete.
  next_action: PROCEED_TO_N-1
```

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: +1 Added bullet after line 84 (#78)"
  - "milestones row: NO UPDATE (M12 stays in_progress — mechanical hold, scope not shipped)"
  - "command-center/artifacts/user-journey-map.md: last_updated_wave63 annotation added"
  - "command-center/product/product-decisions.md: wave-63 L-1 milestone-delta record appended"
  - "commit: SEE_COMMIT_SHA_BELOW (docs: L-1 wave-63 closeout)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M12 (36378340)", before: "in_progress", after: "in_progress"}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  M12 done=6/open=0 but LARGE multi-bundle milestone; scope (study-group data + media + conflict-resolution UI)
  not shipped → stays in_progress. CARRY-FORWARD: N-1 fires milestone-decomposition; bundle #3 = OFFLINE
  STUDY-GROUP DATA. Commit SHA recorded post-commit.
```
