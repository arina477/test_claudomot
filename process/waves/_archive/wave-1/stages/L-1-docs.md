# Wave 1 — L-1 Docs

**Block:** L (Learn) · **Stage:** L-1 (∥ L-2) · **Owner:** head-learn
**Wave:** 1 (M1 foundation seed) · **Shipped:** PR #1, merge commit 486d45b · LIVE on Railway

## Action 1 — CHANGELOG entry

`CHANGELOG.md` did not exist (greenfield). Created with keep-a-changelog header + an
`[Unreleased] / ### Added` section for the foundation. Headline paragraph + 5 bullets
(under the ≤5 cap), declarative present-tense, user-facing, cites (#1).

- File: `CHANGELOG.md` lines 1–16 (entry body lines 10–16).

## Action 2 — Milestone delta

Milestone touched (via `tasks.milestone_id` on the claimed seed): **M1**
(`5a6efc9e-9de7-4594-a75d-d45e30d9a417`, `in_progress`).

Post-L-2 task counts under M1:

| done_count | open_count | cancelled_count |
|---|---|---|
| 1 | 5 | 0 |

`open_count = 5 > 0` → **M1 stays `in_progress`**. No `UPDATE milestones` performed.
Open children: auth backend (`b9118041`), auth frontend (`9aae8255`) — split by P-1 to
future waves — plus the three V-2 non-blocking follow-ups (`c51589cd` CI chromium E2E,
`e38c306e` version-align, `a7667fb7` Node-20 warnings). Mechanical, no ambiguity → no
mode escalation (no BOARD/ceo/founder).

This is above the brain-fallback roadmap threshold (< 3 open per milestone), so no
`backlog-stockout` flag for N-1.

## Action 3 — README touchups

Live deploy landed this wave → user-facing change. Added a **Live** table with the web
and API `/health` URLs after the badges block. Quick-start already covered install/dev
(pointers to `project.yaml`); left untouched. Surgical edit only.

- File: `README.md` (new `## Live` section).

## Action 4 — Commit

Single batched FS commit: `docs: L-1 wave-1 closeout (changelog, readme)` — SHA **a0e1123**.
Committed to `main`. Only `CHANGELOG.md` + `README.md` staged; pre-existing
brain-modified files left out of the commit.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:1-16 (entry 10-16)"
  - "milestone M1 5a6efc9e: no transition (open_count=5) — no DB write"
  - "README.md commit: a0e1123"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M1 (5a6efc9e-9de7-4594-a75d-d45e30d9a417)", before: in_progress, after: in_progress}
roadmap_skip_reason: ""
readme_sections_touched: ["Live (new)"]
note: "M1 stays in_progress: 1 done / 5 open. CHANGELOG created greenfield. Direct doc commit to main."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every active block in the wave has its observations captured at L-2; L-1's three
    sub-actions are each backed by a concrete artifact (CHANGELOG line range, the live
    Railway URLs, the milestone count query). The milestone delta is mechanical
    (1 done / 5 open) and correctly leaves M1 in_progress with no DB write and no
    escalation. The README change reflects the only user-facing surface that shipped
    (the live deploy). Doc deltas cover the changed surface; no blameful language.
  next_action: PROCEED_TO_L-2
```
