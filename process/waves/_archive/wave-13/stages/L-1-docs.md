# L-1 Docs — wave-13 closeout

> Block: L (Learn), stage L-1 (runs ∥ L-2). head-learn owns the L-block.
> Wave-13 shipped: M3 message lifecycle — edit / soft-delete tombstone / reactions + realtime fan-out.

## Action 1 — CHANGELOG entry

Appended 3 user-facing bullets under `## [Unreleased]` → `### Added`, matching house style
(terse, present-tense, one line, PR-cited). Real-time messaging (#23) shipped last wave; this wave
extends it with the message lifecycle, so the new surfaces land in **Added**, not Changed.

The V-3 fast-fix (toggleReaction now 409s on soft-deleted messages, PR#25) is a within-wave
correctness guard on a brand-new endpoint — NOT a shipped-vulnerability patch — so it stays in
**Added** as a user-facing behavior, not **Fixed**. No prior-wave defect was patched, so the
`### Fixed` section is untouched.

**Lines:** `CHANGELOG.md:31-33` (3 new bullets; insertion point after existing line 30, the #23
real-time-messaging entry).

New bullets:
- `(#24)` edit/delete + "(edited)" mark + tombstone, live for the channel.
- `(#24)` emoji reactions: add/remove toggle, counts + who-reacted, live.
- `(#25)` reacting to a deleted message is blocked.

## Action 2 — Milestone delta

Resolved milestone touched by wave-13 claimed tasks via `tasks.milestone_id`:
**M3 — Real-time messaging core** (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`).

Census (post L-2 done-marking of the 3 wave tasks):

```
done_count | open_count | total
        7  |         3  |    10
```

`open_count = 3 > 0` → **M3 stays `in_progress`. No `UPDATE` issued.** Mechanical non-close, no
ambiguity → runs under `automatic` mode without BOARD/founder escalation (no judgment call).

The 3 open rows are parked follow-ups / tech-debt, NOT M3 core feature scope:
- `25523fb0` — real-Postgres mid-transaction-failure rollback test (todo)
- `46f16288` — browser E2E coverage for authed create-server flow (todo)
- `d058283d` — rotate permanent server invite_code, owner-gated regenerate (todo)

M3 remaining feature scope (presence / typing / mentions / attachments / member-list) is not yet
decomposed into tasks — N-1 picks up M3 next-bundle decomposition (reason `backlog`/next-bundle).

**Success-metric prose:** M3 `description` `## Success metric` section carries no `_TBD_` markers —
already finalized. No `milestones.description` UPDATE needed.

## Action 3 — README touchups

**SKIP.** Wave-13 is a pure feature wave (message edit/delete/reactions). Nothing user-facing
changed in setup, env vars, install steps, or CLI. README touchups not warranted; detailed change
record lives in CHANGELOG + PR #24 / #25.

## Action 4 — Commit

FS touchups (CHANGELOG only) committed + pushed to `main`.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:31-33"
  - "M3 census: done=7 open=3 total=10 (open>0 → no close, no UPDATE)"
  - "commit: <see footer / git>"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M3 (6198650e-f4e0-44dc-9b0a-6550f01f9f82)", before: "in_progress", after: "in_progress"}
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  Mechanical milestone progress only (3 wave tasks done by L-2; M3 stays in_progress,
  open_count=3 parked tech-debt). No UPDATE, no escalation. README skipped (pure feature, no
  user-facing setup/env/CLI change). V-3 reaction-on-deleted guard logged in Added not Fixed
  (within-wave guard on new endpoint, not a prior-wave shipped-vuln patch). N-1 flag: decompose
  M3 next feature bundle (presence/typing/mentions/attachments/member-list).
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    L-1 exit checklist fully ticked. CHANGELOG entry matches the Contract-equivalent house style
    (terse, present-tense, PR-cited, no war stories). Milestone delta is mechanical and correctly
    held open (open_count>0). README skip is justified and recorded. No observation/promotion work
    crosses into L-2's lane. Blameless, artifact-cited.
  next_action: PROCEED_TO_block_exit
```
