# L-1 — Docs (wave-77 closeout)

**Wave:** 77 — M13 leg-2 portable academic identity (LIVE on merge 633f362e)
**Milestone:** M13 — Institution partnerships & portable identity (b7400254-9c16-4b97-a898-2619b949fc5e)
**V-block:** APPROVED (karen + jenny + head-verifier, 0 blocking)

## Action 1 — CHANGELOG entry

Appended two bullets under `## [Unreleased] › ### Added`, at **CHANGELOG.md:98-99** (immediately after the wave-76 Educator Admin Console bullet at line 97).

- Bullet 1 (line 98): portable academic identity — 6 self-declared profile fields (pronouns, bio, institution, program, academic role, academic year), editable on the profile page + visible on a fellow member's profile card. Explicitly fenced: self-declared, no verification, no trust badge.
- Bullet 2 (line 99): privacy posture in plain language — profile cards honor the member's "who can see my profile" setting; hidden profiles return a uniform blank result (fail-closed), nothing leaks to strangers / blocked users / non-shared-server members, deleted accounts never shown.

User-facing, present-tense, keep-a-changelog house style. Brand: StudyHall. Cited (#96).

## Action 2 — Milestone delta

Resolved via `tasks.milestone_id` FK on claimed tasks → single milestone M13.

DB counts (post-L-2 done-marking):
```
done_count | open_count
    8      |     2
```

`open_count = 2 ≠ 0` → **M13 does NOT transition; stays `in_progress`.** No DB write. The 2 open tasks are the UX-polish follow-ups filed at V-2 (academicRole NULL-clear; card hidden-vs-network-error distinction). M13 leg-3 (privacy/E2E) remains unplanned — N-block owns milestone-level disposition.

**Planning flag (open < 3 threshold):** open_count=2 is below the brain-default threshold of 3. Recorded as a next-wave planning signal for N-1 (`reason: backlog-stockout` candidate). Additional signal: `todo`-milestone queue is EMPTY — if M13 later closes, N-1 fires roadmap-planning (stockout).

## Action 3 — README touchups

**SKIPPED.** Reason: the new academic-profile fields are a plan-gated product feature with no new CLI command/flag, no new env var, no new install step, and no breaking change — none of the four README-touch triggers fire. README line 16 prose already summarizes profile customization at a high level; enumerating each academic field there would violate the surgical-edit rule and the CHANGELOG carries the user-facing detail. Consistent with wave-74/75/76 L-1 skips.

## Action 4 — Commit

FS docs committed + pushed to main (automatic mode, repo allows direct doc commits). SHA recorded in deliverable footer below.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:98-99"
  - "milestones M13 (b7400254-9c16-4b97-a898-2619b949fc5e): no transition — open_count=2, stays in_progress"
  - "README.md: skipped (no CLI/env/install/breaking-change trigger)"
  - "commit: 6182f2d (amended to this SHA on push)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M13 (b7400254)", before: in_progress, after: in_progress}
roadmap_skip_reason: ""
roadmap_planning_flag: "M13 open_count=2 (< 3 threshold) → N-1 backlog-stockout candidate; todo-milestone queue EMPTY"
readme_sections_touched: []
note: "M13 leg-2 shipped LIVE (merge 633f362e). Milestone holds in_progress; leg-3 privacy/E2E unplanned — N-block decomposes. B2B2C go-to-market + M13 success metric remain founder-reserved (fenced)."
```
