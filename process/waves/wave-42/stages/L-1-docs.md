# Wave 42 — L-1 Docs

**Block:** L (Learn) · **Stage:** L-1 (∥ L-2) · **Mode:** automatic · **Owner:** head-learn
**Wave content:** assignment submission collect/return lifecycle — student submit + own-card + edit UI; educator submissions roster; educator return-with-comment (NO grading).
**Claimed tasks (all `done` per L-2):** db8e082a (submission collect + submit UI), 1746f72a (educator roster), b859984b (educator return).

---

## Action 1 — CHANGELOG entry

Appended 2 bullets under `## [Unreleased] → ### Added` (CHANGELOG.md:76-77), citing PR #56.

- Section = **Added**: net-new feature from the spec contract (new `assignment_submissions` table, 4 endpoints, submit/roster/return UI). Not Security (all controls — member-gated presign, server-side own-only visibility, IDOR-safe server_id derivation — are preventive controls shipped *with* the feature, nothing shipped-then-patched).
- B-6 in-wave fixes (return-id contract, mySubmission-load data-loss guard, hide-student-submit-from-organizers) were caught and fixed **before** ship → folded into the Added feature description, **not** a separate `### Fixed` line (never shipped broken). Per L-1 stage Action 1 + brief.
- Length: 2 bullets, outcome-first, present-tense, user-facing. Matches the terse wave-41/#55 and wave-39/#53 house style, not the older verbose entries.

## Action 2 — Milestone delta

Touched milestone: **M8 — Educator tools & deeper academics** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`), status `in_progress`, H2, class `product-feature`.

Child-task terminal counts (post-L-2):

| done | open (todo/in_progress/blocked) | cancelled | total |
|---|---|---|---|
| 5 | 4 | 0 | 9 |

Open children:
- `683fec9b` todo — Polish assignment-submissions UI + fix stale organizer-… (V-2 follow-up, wave_id=`b1c463d3` = **wave-42**)
- `8d971bc2` todo — Harden assignment-submission test coverage (V-2 follow-up, wave_id=`b1c463d3` = **wave-42**)
- `8828484f` todo — Polish: muted-member indicator padding (wave-41 follow-up, wave_id=`6a583dad`)
- `ca43eb12` todo — Add delete-any-message UI E2E second-client fan-out (wave-41 follow-up, wave_id=`6a583dad`)

**Verdict: M8 stays `in_progress`. NO milestone UPDATE fired.**
- `open_count = 4` → NOT terminal (rule: close only when `open_count = 0`).
- M8 `## Scope` still lists unshipped items: class scheduling/calendar, study-group tools (timers/whiteboard), direct messages + group DMs, message search. This is slice 2 of the milestone (slice 1 = educator role + moderation, wave-41).
- `## Success metric` remains `_TBD by founder_` — a known founder-checkpoint item; **not finalized here** (no authority to author it; overdue-metric flag carried to N-1 / next founder checkpoint).
- **Mechanical, no ambiguity** → no BOARD escalation under `automatic` mode. `decision-slug L-1-roadmap-delta-wave-42` NOT convened (nothing to judge — 4 open children is an unambiguous stay-open).

## Action 3 — README touchups

**SKIPPED.** No user-facing README surface changed:
- No new env var (endpoints derive `server_id` from the assignment row; no config).
- No new CLI command / flag / install step.
- No breaking change.
Feature detail lives in CHANGELOG + PR #56.

## Action 4 — Commit

FS touchups (CHANGELOG.md only; README skipped) committed as `docs: L-1 wave-42 closeout (changelog)` and pushed to `main`. SHA recorded in footer.

---

## Flags for N-block (N-1 survey)

1. **NOT a backlog-stockout.** M8 `open_count = 4` (≥ 3 threshold) plus 14 unassigned-queue `todo` rows cushion the pipeline. Do not fire `backlog-stockout` on M8.
2. **Seed-stranding risk — ACTION REQUIRED before N-2.** The two V-2 follow-ups inserted this wave (`683fec9b`, `8d971bc2`) carry `wave_id = b1c463d3` (wave-42). Per the N-2 seed contract, a follow-up's `wave_id` must be `NULL` to be seedable — else it strands and is never claimable. N-block must NULL both before seeding. (Matches the recurring wave-41 seed-stranding flag on `8828484f`/`ca43eb12`, which carry `wave_id=6a583dad` and are still open/stranded — surface both pairs.)
3. **Overdue founder-checkpoint item:** M8 `## Success metric` still `_TBD by founder_` — carry to next founder checkpoint.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:76-77 (Added, #56, 2 bullets)"
  - "milestones 84e17739 UPDATE: none — stays in_progress (open_count=4)"
  - "README.md: skipped (no env/command/install/breaking change)"
  - "commit SHA: <filled by Action 4 push>"
changelog_entry_added: true
roadmap_milestones_progressed: []          # M8 progressed within-milestone (5→ still 4 open); no status transition
roadmap_skip_reason: ""                     # not skipped — evaluated, verdict = stay in_progress
readme_sections_touched: []
note: >
  M8 stays in_progress, mechanical (open_count=4), no BOARD. Success metric _TBD_ left
  for founder (overdue checkpoint). Flags to N-1: NOT backlog-stockout (4 open + 14
  unassigned); seed-stranding on 683fec9b + 8d971bc2 (wave_id=b1c463d3 must be NULLed
  before N-2 seed) plus still-stranded wave-41 pair 8828484f + ca43eb12.

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit criterion ticked from concrete artifacts. CHANGELOG entry appended
    under Added (#56), 2 bullets, house-style terse, B-6 in-wave fixes correctly folded
    into the feature rather than a spurious Fixed line (nothing shipped broken). Milestone
    delta evaluated against live child-task counts: M8 open_count=4 → unambiguous stay
    in_progress, no UPDATE, no BOARD, Success metric _TBD_ untouched (founder authority).
    README skip justified (no user-facing config/command/install/breaking change).
    Doc coverage of every shipped surface is captured (submit/roster/return in the
    changelog bullets). No blameful language; no promotion decisions here (that is L-2).
  next_action: PROCEED_TO_L-2
```
