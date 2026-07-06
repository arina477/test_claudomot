# L-1 — Docs (wave-60)

Head-learn gate for the L-block Docs stage. Wave-60 shipped seed 5bcbd27f — DM off-token
surface substitutions: 3 direct-message surfaces converted from hardcoded off-token hex to
canonical design-token consumption via `var()` (server rail bg → `--color-surface-900`; DM
start-picker modal card → `--color-surface-900`; disabled confirm/send → accent-emerald @40%).
Merged PR #75 → main (7a1af6f); web deployed SUCCESS; all gates APPROVED.

## Action 1 — CHANGELOG entry

**Added** one terse bullet under `### Changed` (CHANGELOG.md:97, #75):

> Aligned a few direct-message surface shades to the design system, so the server rail, the
> start-a-message picker, and the disabled send button now match the app's standard dark palette. (#75)

**Section = Changed** (existing surfaces modified, not a new feature; not Fixed — no `bug-*`
blocking finding was patched, this was a planned token-hygiene drainage item).

**Judgment on subtlety:** the seed prompt offered skip-with-reason for a too-subtle change. This
is a genuinely user-*visible* shade shift (server rail moved surface-950 → surface-900, etc.), not
an internal-only refactor, so a one-line release note is warranted. Kept terse per L-1 length cap;
declined the `(no visible change)` tag used for pure-internal Changed entries because the shades
did visibly move. StudyHall identity, plain product language, no stage codes / agent / Claude refs.

## Action 2 — Milestone delta

Claimed task 5bcbd27f (`milestone_id = 84e17739`, M8 — Educator tools & deeper academics).

Post-done counts on M8: **done=41 / open=2 / total=43** (verified via DB).
- `open_count = 2 > 0` → milestone is NOT structurally complete → **M8 stays `in_progress`** (no
  transition, no DB write). Mechanical no-op; no ambiguity → no BOARD / no escalation under
  `automatic` mode.
- The 2 open child tasks:
  - `874bd233` (todo) — DM: reconcile /dm/candidates throttle policy + message — **the last
    *drainable* M8 tail item**.
  - `999a14d1` (todo) — getDmCandidates cursor/pagination + load-more UX — **do-not-auto-drain**
    (wave-56 deferral stands; not a seed candidate).

**Delta recorded: M8 in_progress → in_progress (41/43).**

### CARRY-FORWARD FOR N-1 (backlog-stockout early-warning)

`open_count = 2 < 3` (brain fallback threshold). After the *next* wave drains `874bd233`, M8 will
have ONLY the do-not-auto-drain item (`999a14d1`) left → next-claimable likely **NULL** →
daily-checkpoint → founder.

Both high-value milestones that could absorb the engine next are **FOUNDER-RESERVED** and have
already been **FOREGROUNDED to the founder this wave**:
- **M9 — Monetization** (rule-17 founder-reserved; pricing).
- **M12 — Offline-first moat** (36378340; the untouched differentiator half of live bet ad1a3685;
  `## Success metric = _TBD by founder_`; H3 horizon-jump).

The plain-language decision-request was strengthened to a founder-facing
"engine is down to cleanup — which first, M9 or M12?" ask at
`process/session/updates/checkpoint-2026-07-06-m8-tail-vs-m12-offline-first.md`. N-1 should weigh
this: draining 874bd233 empties the drainable M8 tail, so a founder direction on M9/M12 is the
gating next-move. Do NOT let the BOARD decide M9 or M12 — both are above BOARD authority
(binding precedent: wave-59 N-1 BOARD 6/7-to-pivot was RESOLVED as HOLD on the founder-proxy
REJECT).

## Action 3 — README touchups

**SKIPPED — reason:** color-only change to existing DM surfaces. No new CLI command/flag, no new
env var, no new install step, no breaking change. Nothing user-facing in the README-governed
surface (quick-start / usage / env table / upgrade notes) changed.

## Action 4 — Commit

FS docs committed as `docs: L-1 wave-60 closeout` and pushed to `main`. Commit SHA recorded in
footer (see `verdict_evidence`).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:97 (Changed, #75)"
  - "milestone M8 84e17739: in_progress -> in_progress (41/43 done; no transition, no DB write)"
  - "README.md: skipped (color-only; no CLI/env/install/breaking change)"
  - "commit: docs: L-1 wave-60 closeout (SHA in commit log)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M8 (84e17739)", before: "in_progress (40/43 at wave start; 41 after done)", after: "in_progress (41/43)"}
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  Milestone delta is a mechanical no-op (open_count=2>0, no ambiguity) — no BOARD under automatic.
  CARRY-FORWARD to N-1: open_count=2<3 backlog-stockout early-warning; after next wave drains the
  last drainable tail item 874bd233, M8 has only do-not-auto-drain 999a14d1 left -> next-claimable
  likely NULL -> daily-checkpoint. M9 (Monetization) + M12 (Offline-first, live-bet differentiator)
  are FOUNDER-RESERVED and already foregrounded to the founder this wave; N-1 must not let the BOARD
  decide either.
head_signoff:
  verdict: APPROVED
  stage: L-1-docs
  reviewers: {}
  failed_checks: []
  rationale: >
    Every L-1 exit check ticks. CHANGELOG carries one terse blameless product-language Changed
    entry for the one shipped surface change (correct section: existing surfaces modified). Milestone
    delta is mechanically correct (M8 stays in_progress, 41/43, no false close) and the backlog-stockout
    early-warning + founder-reserved M9/M12 context is carried forward for N-1. README skip is justified
    (color-only, no README-governed surface changed). No blameful language; the single doc surface that
    changed (DM shades) is covered.
  next_action: PROCEED_TO_N_BLOCK
```
