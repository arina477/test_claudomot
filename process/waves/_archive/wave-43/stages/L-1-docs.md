# Wave 43 — L-1 Docs

**Block:** L (Learn), stage L-1 (∥ L-2). **Owner:** head-learn (spawn-pattern). **Mode:** automatic.
**Shipped:** class scheduling (NEW `scheduled_sessions`, migration 0020; 5 endpoints; educator authoring modal + member calendar/agenda + session detail). PR #57 (squash 7b0bc478), deployed live (defense-in-depth guard e7f1f7a). V-block APPROVED (Karen + jenny).
**Claimed bundle (all `done` — L-2 confirmed):** 535bdb8c (scheduling backend + authoring UI), cdf81427 (class calendar view), 1216146e (session detail).

## Action 1 — CHANGELOG entry

Appended 2 bullets under `## [Unreleased] → ### Added`, `CHANGELOG.md:78-79`, tagged `(#57)`. Class scheduling is a NEW feature → **Added** (keep-a-changelog). Headline + user-facing bullets, terse to match wave-41/42 house style (member-facing + organizer-facing pair).

In-wave fixes folded into Added, NOT a separate Fixed line (never shipped broken):
- B-6: update range-bypass fix, datetime validation, weekly-edit refetch.
- T-4-caught createSession authz guard.

Bullets:
- Organizer-facing: schedule a session (title, optional details, start/end, optional weekly repeat + end date), edit/remove, server-side organizer-only enforcement, `manage_assignments`-gated.
- Member-facing: calendar + agenda of upcoming sessions (weekly repeats auto-expanded compute-on-read), open any session for full detail, calm empty state.

## Action 2 — Milestone delta

Wave's claimed tasks all belong to **M8** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`, "Educator tools & deeper academics", `in_progress`, H2, T5).

Child terminal counts (post L-2 done-marking):

| done | open (todo/in_progress/blocked) | cancelled | total |
|---|---|---|---|
| 8 | 6 | 0 | 14 |

`open_count = 6 ≠ 0` → M8 does **NOT** close. Remaining `## Scope` unshipped items: study-group tools (shared timers/Pomodoro, study sessions, whiteboard), direct messages + group DMs, message search. Slice 3 of M8 shipped (slice 1 = educator role + moderation; slice 2 = assignment collect/return).

**Decision: M8 stays `in_progress`. Mechanical — no ambiguity, no BOARD.** No milestone UPDATE issued.

**Success metric** `_TBD by founder_` left as-is. Overdue (re-surfaced non-blocking at wave-42 N-1); NOT L-1's to finalize under `automatic` — it is a founder-reserved product-taste call, non-blocking to the loop. Flagged to N-block (checkpoint item), not escalated.

The 6 open M8 children:

| id | status | wave_id | is_seed | origin |
|---|---|---|---|---|
| 0308cdf1 | todo | 9845e57d (wave-43) | yes | **NEW** V-2 follow-up (createdAt/updatedAt DTO + scheduling polish) |
| 8e54799a | todo | 9845e57d (wave-43) | yes | **NEW** V-2 follow-up (class-scheduling 1024 responsive + a11y/UX) |
| 683fec9b | todo | b1c463d3 (wave-42) | yes | still-open wave-42 follow-up (assignment-submissions UI polish) |
| 8d971bc2 | todo | b1c463d3 (wave-42) | yes | still-open wave-42 follow-up (submission test coverage) |
| 8828484f | todo | 6a583dad (wave-41) | yes | still-open wave-41 follow-up (muted-member indicator padding) |
| ca43eb12 | todo | 6a583dad (wave-41) | yes | still-open wave-41 follow-up (delete-any E2E fan-out) |

**Backlog-stockout check: NOT a stockout.** 6 open M8 children (≥ 3 threshold) + 14 unassigned `todo` cushion the pipeline. N-1 has ample seed candidates.

## Action 3 — README touchups

**SKIPPED.** No user-facing env var, CLI command, install step, quick-start change, or breaking change this wave. Class scheduling ships as UI + endpoints only; README quick-start delegates to `project.yaml` and is unaffected.

## Action 4 — Commit

FS touchups (CHANGELOG only) committed `docs: L-1 wave-43 closeout (changelog)`, pushed to `main`. Milestone progression required no DB write (M8 unchanged), so no product-decisions append.

## N-block flags

- **Seed-stranding (action needed at N-2):** all 6 open M8 seed children carry a non-NULL `wave_id` and will NOT seed until NULLed —
  - NEW wave-43 pair: **0308cdf1 + 8e54799a** (`wave_id=9845e57d`) must be NULLed before N-2 seed.
  - still-stranded wave-42 pair: 683fec9b + 8d971bc2 (`wave_id=b1c463d3`).
  - still-stranded wave-41 pair: 8828484f + ca43eb12 (`wave_id=6a583dad`).
- **Not backlog-stockout:** 6 open + 14 unassigned todo.
- **M8 success metric overdue** (`_TBD by founder_`) — non-blocking checkpoint item, surface to founder at next opportunity; do not block N-1.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:78-79 (2 bullets under Added, #57)"
  - "milestones row UPDATE: none (M8 84e17739 stays in_progress; open_count=6)"
  - "README.md: not touched (skip — no user-facing env/command/install/breaking change)"
  - "commit: docs: L-1 wave-43 closeout (changelog) → main"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M8 (84e17739)", before: "in_progress", after: "in_progress"}]
roadmap_skip_reason: ""
readme_sections_touched: []
note: "M8 slice 3 (scheduling) shipped; study-groups/DMs/search unshipped. Success metric _TBD by founder_ overdue, non-blocking, not finalized by L-1. N-block: NULL wave_id on 6 stranded M8 seeds (new pair 0308cdf1+8e54799a) before N-2."
head_signoff:
  verdict: APPROVED
  stage: L-1-docs
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit checkbox ticked from concrete artifacts. CHANGELOG entry appended under Added
    (#57), terse, user-facing, matching house style; in-wave B-6/T-4 fixes folded into Added not a
    separate Fixed line, correctly. Milestone delta is mechanical: M8 open_count=6 with unshipped
    Scope (study-groups/DMs/search) → stays in_progress, no BOARD, no metric finalization. README
    skip is justified and recorded. Seed-stranding on all 6 open M8 seeds (incl. the 2 new wave-43
    rows) flagged for N-2; not a backlog-stockout.
  next_action: PROCEED_TO_L-block-exit
```
