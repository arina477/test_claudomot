# L-1 — Docs (wave-87)

**Block:** L (Learn). Stage L-1 ∥ L-2. Owner: head-learn (sub-agent). Mode: automatic.

## Action 0 — head-learn spawned

head-learn owns the L-block. Claimed task this wave: `dc4abee3` (single spec, `milestone_id IS NULL`, bug-fix phase). V-block APPROVE (Karen + jenny + head-verifier). Shipped live: api `1d2ef9df` (PR #107); integration test landed via follow-up PR #108.

## Action 1 — CHANGELOG entry

Appended ONE line under `## [Unreleased]` → `### Changed` (existing join behavior modified; behavior-preserving data-hygiene):

> - Joining a study server now assigns the server's default member role right away, instead of leaving it unset until a background cleanup filled it in. No change for the member. (#107)

- Section rationale: existing feature modified (server-join flow), not a new feature → **Changed**, not Added. Not **Fixed** — no shipped user-visible bug was corrected; NULL role_id was intended-safe at the permission layer (P-0 REFRAME). User-facing framing per rule 16: outcome-first, "No change for the member" states the behavior-preservation plainly.
- Terse house-style match (one declarative line, `(#107)` citation), within the headline+≤5-bullet cap.
- Location: `CHANGELOG.md` — appended as the last bullet of `### Changed` (after the #106 CSRF line).

## Action 2 — Milestone delta

**SKIPPED.** The claimed task `dc4abee3` has `milestone_id IS NULL` (bug-fix phase, came off the unassigned queue without a milestone assignment). Per L-1 Action 2 skip condition ("wave's claimed tasks all had `milestone_id IS NULL`"), no milestone progressed → no `milestones` row transition, no `product-decisions.md` append. Skip recorded here.

## Action 3 — README touchups

**SKIPPED.** Nothing user-facing in the README changed this wave — no new CLI command/flag, no new env var, no new install step, no breaking change. Backend data-hygiene only, behind an existing endpoint. Per Action 3 skip condition.

## Action 4 — Commit

Not committed by this stage. Per orchestrator instruction, the block owner commits all FS-side touchups at L-block close. The CHANGELOG edit is staged for that commit (`docs: L-1 wave-87 closeout`).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: appended 1 line under [Unreleased] > Changed (after #106 line)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "claimed task dc4abee3 has milestone_id IS NULL (bug-fix phase; no milestone to progress)"
readme_sections_touched: []
note: "README skipped — no user-facing README surface changed. Commit deferred to block-close per orchestrator."
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    CHANGELOG carries one terse, user-facing Changed line citing #107, correctly classified
    (existing behavior modified, not a shipped-bug Fixed). Milestone delta legitimately skipped —
    the single claimed task is milestone-unassigned (bug-fix phase). README skip is correct —
    no user-facing README surface changed. All L-1 exit boxes tick or carry a recorded skip.
  next_action: PROCEED_TO_L-block-exit
```
