# L-1 — Docs (wave-55)

Test-only wave: added the `who_can_dm='server-members'` 2-cell privacy truth-table
to the real-Postgres DM-candidates integration suite. Merged #70 (2565f43).

## Action 1 — CHANGELOG entry

Appended one bullet under `### Changed` (CHANGELOG.md:95), matching the terse
`(no visible change)` house style used for the analogous test-coverage entries (#50, #69):

> The "who can message me" privacy setting is now fully covered by durable
> database-backed tests: when a member limits messages to people in their shared
> study servers, someone in a shared server can still reach them while someone with
> no shared server is reliably blocked, so this protection can't silently regress.
> (no visible change) (#70)

**Changed, not Security** — no shipped vulnerability, no user-visible change; this is
test coverage of an already-shipped-and-correct privacy control. Single bullet, under the
5-bullet cap.

## Action 2 — Milestone delta

- Distinct milestone touched via `tasks.milestone_id`: **M8** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`,
  "Educator tools & deeper academics", `in_progress`).
- Post-close count: `done_count=36, open_count=6`.
- `open_count = 6 > 0` → **M8 stays `in_progress`; no transition.** Mechanical no-op, no ambiguity,
  no BOARD/founder escalation. `open_count ≥ 3` → not a backlog-stockout flag either.

### M9-disposition flag for N-1 (ceo-reviewer signal — record, do NOT act on here)

M8's tail now carries **ZERO unshipped feature scope**. The 6 remaining open tasks are all
DM-polish / hardening / test stragglers:

| id | kind |
|---|---|
| f8eb49c1 | unit-test `buildTypingLabel` transition table — cosmetic debt |
| a1dda389 | harden delete-any-message E2E determinism — test debt |
| 5bcbd27f | DM off-token surface substitutions (rail/picker/disabled) — cosmetic |
| 874bd233 | reconcile /dm/candidates throttle + 429 backoff — hardening |
| **c5051444** | **DM pagination/LIMIT on getDmCandidates for large-server scale — real leverage** |
| ff09c4c9 | DM→server return nav exit dmHomeActive — cosmetic |

M8's success metric is substantively met; the educator role, assignment collect/return,
scheduling, study-group tools, and DMs all shipped. Only **c5051444 (DM pagination, real scale
value)** is high-leverage; the rest is cosmetic/test debt. **N-1 should weigh whether to advance
toward M9 (Monetization)** — a strategic product-direction call that likely needs the founder
rather than mechanical wave-by-wave draining of the tail. Do NOT close M8 (open>0, mechanical).
This is a soft signal for N-1 disposition, not an L-1 transition.

## Action 3 — README touchups

**Skipped** — nothing user-facing changed (test-only wave: integration-spec additions to the
DM-candidates suite; no CLI, env var, install step, or breaking change).

## Action 4 — Commit

Single FS-side doc commit: `docs: L-1 wave-55 closeout (changelog)`. Pushed to `main`.
Milestone delta is a DB no-op (no transition), so no milestone commit.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:95 (one bullet under Changed, #70)"
  - "milestones no-op: M8 84e17739 stays in_progress (open_count=6>0)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "M8 touched but open_count=6>0; no transition; mechanical no-op"
readme_sections_touched: []
note: >
  M9-disposition flag raised for N-1: M8 tail has zero unshipped feature scope, success metric
  substantively met, only c5051444 (DM pagination) is high-leverage; rest is cosmetic/test debt.
  N-1 should weigh advancing toward M9 (Monetization) — strategic call likely needing founder.

head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit checkbox ticks. CHANGELOG entry appended, terse + user-facing + correctly
    classified as Changed (test coverage, no shipped vuln, no visible change) not Security.
    Milestone delta is a clean mechanical no-op — M8 stays in_progress at open_count=6, no
    ambiguous 'really done?' judgment (open>0 forces the answer), so no BOARD/founder routing
    needed under automatic mode. README correctly skipped (nothing user-facing). The M9-disposition
    ceo-reviewer flag is recorded for N-1 as a soft signal, not acted on here. Commit pushed.
  next_action: PROCEED_TO_N-block
```
