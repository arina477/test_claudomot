# L-1 — Docs (wave-85)

> Block L (Learn), stage L-1. Ran concurrent with L-2. Mode: `automatic`.
> Owner: head-learn. V-block exited APPROVE (karen + jenny + head-verifier).

## Action 1 — CHANGELOG entry

Appended one line under `## [Unreleased] → ### Fixed` (CHANGELOG.md:150), matching the terse house style:

> Fixed the assignment done/todo toggle so a failed update restores the correct previous state instead of guessing the opposite, and now shows a visible "Couldn't update assignment. Please try again." message instead of failing silently. (#105)

- Section chosen: **Fixed** (existing feature modified — a shipped bug in AssignmentCard's optimistic toggle revert).
- Length: single line, no sub-bullets. Within the headline + ≤5 bullet cap.
- User-facing language; no stage codes / internal vocab.

## Action 2 — Milestone delta — SKIP

Task `3ad35a42-efe5-4e9d-8f90-d22d6fe345e8` has `milestone_id IS NULL` (verified via DB SELECT — unassigned bug-fix queue; roadmap complete). No milestone touched by this wave, so no milestone-progression evaluation and no `milestones` UPDATE. Skip recorded per L-1 Action 2 skip condition ("wave's claimed tasks all had `milestone_id IS NULL`").

## Action 3 — README touchups — SKIP

Frontend behavior fix to an existing component. No new CLI command / flag, no new env var, no new install step, no breaking change. Nothing user-facing in the README sense changed. Skip recorded.

## Action 4 — Commit

FS-side touchup: CHANGELOG.md only (milestone delta skipped → no DB write in Action 2). Committed as `docs: L-1 wave-85 closeout (changelog)` and pushed to `main`. Batched into the L-block commit `docs: L-block complete for wave-85` (both L-stages exit together per dispatcher § Parallelization).

## Footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:150 (Unreleased → Fixed, #105)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "claimed task 3ad35a42 has milestone_id IS NULL (unassigned bug-fix queue; roadmap complete)"
readme_sections_touched: []
note: "Frontend-only fix; no user-facing usage/CLI/env change → README skip. Mode: automatic."
```
