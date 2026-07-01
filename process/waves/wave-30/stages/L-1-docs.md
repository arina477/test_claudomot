# Wave 30 — L-1 Docs

**Block:** L (Learn), stage L-1 (∥ L-2). Owner: head-learn. Mode: `automatic`.
**Wave:** M5 flagship — assignment due-date reminders (hourly cron + NotificationsModule via Resend). Shipped LIVE, all gates APPROVE, PR #43 (81dc821) merged, migration applied, api deployed + verified end-to-end (CI real-PG integration tier + V-block).

## Action 1 — CHANGELOG entry

Appended 2 bullets to `## [Unreleased] → ### Added`, citing (#43):

- "Assignment due-date reminders — members are emailed about once, roughly 24 hours before an assignment is due, and anyone who has already marked it done is skipped. (#43)"
- "Reminders run automatically on an hourly schedule and remind each member only once per assignment; stronger delivery guarantees under heavy load are tracked as a separate follow-up. (#43)"

Placed after the #41 invite-rotation bullet, before `### Changed`. Honest on the two spec carries surfaced to users: send-once semantics + the tracked at-least-once-under-load follow-up. House style matched (declarative, outcome-first, one line per change, terse-family entries). Length: 2 bullets — well under the headline + ≤5-bullet cap.

## Action 2 — Milestone delta

Milestone touched (via `tasks.milestone_id` on the 3 claimed tasks): **a5232e16 — M5 Academic tooling: assignments**.

DB state (queried live):
- 3 claimed tasks (4a4c2715 cron, c5c30363 tracking table, 0ba853e2 email) → `status='done'` (set by L-2). Confirmed.
- M5 counts: **done_count=15, open_count=6** → `open_count ≠ 0`, so L-1 does **NOT** transition M5 to `done`. M5 stays `in_progress`.
- 6 open tasks (all `todo`, all non-metric): 4b397de0 (IDOR controller-spec assertion), 6f257c82 (rowToDto JOIN fold), 3ad35a42 (optimistic-toggle revert), 72cb6ebb (stale manage_channels sweep, wave-23), 226c7e42 (integration-tier executed-count hardening), fdb444fc (extend presence dots to DM/mention/hover). Assignments code-debt + a presence-dots follow-up — none is M5's success-metric task.

**M5 success metric is MET.** The assignment-reminders arc was M5's sole unbuilt `## Scope` item; with reminders LIVE + verified, the metric bar is cleared. This is the milestone-completing wave, arriving after 8 debt waves that were blocked on the founder's Resend key (unblocked Path A this wave).

**Milestone stays `in_progress` at L-1 by design.** Metric-MET ≠ milestone-done. N-block owns the close: N-1/N-2 dispose the 6 open non-metric tasks (ship / defer / cancel), and only then does N transition M5 → `done`. Recorded here for N-block pickup; not a `backlog-stockout` flag (this milestone is metric-complete, not stalled).

Mode routing: this is a **mechanical, unambiguous** milestone-progress read (metric met, open tasks remain, no transition). No judgment call → no BOARD escalation under `automatic`. `L-1-roadmap-delta` decision-slug NOT raised.

## Action 3 — README touchups

**Skipped — reason: no matching surface + env already documented.**

- README has **no feature list** to append to. Its user-facing content is a narrative "Live" paragraph (accounts / servers / invites) and a repo-structure doc. Reminders is a backend cron feature with no user-visible screen (D-block skipped; no UI this wave) — it does not belong in the account/server user-flow paragraph. Surgical-edit discipline: nothing to add.
- README has **no env table** (only `cp .env.example .env`, pointing to `project.yaml`). The env vars the reminders path uses — `RESEND_API_KEY_NOTIFY` (NotificationsModule → invite/reminder emails) and `RESEND_API_KEY_AUTH` (SuperTokens verify/reset) — are **already documented placeholders in `.env.example`** (no value committed). No new env var was introduced this wave. Nothing to add.

Detailed release content lives in the CHANGELOG per Action 3 guidance.

## Action 4 — Commit

`docs: L-1 wave-30 closeout (changelog — assignment reminders)` → pushed to `main` (direct doc commit; project allows direct docs to main). FS touchups only (CHANGELOG.md + this deliverable + checklist). Milestone progress is DB-side (no git commit); no milestone transition written this wave.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: 2 Added bullets appended under [Unreleased] (#43)"
  - "milestones a5232e16 (M5): no UPDATE — open_count=6, stays in_progress by design (metric MET; N-block closes after disposition)"
  - "README.md: not touched (no feature list / env table; env vars already in .env.example)"
  - "commit: docs: L-1 wave-30 closeout (changelog — assignment reminders) → main"
changelog_entry_added: true
roadmap_milestones_progressed:
  - milestone: M5 (a5232e16 — Academic tooling: assignments)
    before: "in_progress (12 done)"
    after: "in_progress (15 done)"
    metric_met: true
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  M5 success metric is MET — the assignment-reminders arc was M5's sole unbuilt ## Scope item, now
  LIVE + verified. M5 stays in_progress at L-1 by design: metric-MET is not milestone-done. N-block
  disposes M5's 6 open non-metric tasks (3ad35a42, 4b397de0, 6f257c82, 72cb6ebb, 226c7e42, fdb444fc —
  assignments debt + presence-dots follow-up) then transitions M5 → done. Milestone-completing wave
  after 8 debt waves blocked on the Resend key (unblocked Path A). Mechanical delta, no BOARD routing.

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit checkbox ticks. CHANGELOG carries an artifact-cited (#43), user-facing, honest
    Added entry within the length cap. Milestone delta is mechanical against live DB state (15 done /
    6 open, verified) — M5 correctly held in_progress since open_count≠0; metric-MET recorded for
    N-block, close deferred to N after disposition (no premature milestone close). README skip is
    justified (no feature list / env table; RESEND_* placeholders already in .env.example, no new env
    var). No blame, no promotion (L-1 does not promote). Commit direct-pushed to main.
  next_action: PROCEED_TO_L-2   # L-1 ∥ L-2; block exits once both exit
```
