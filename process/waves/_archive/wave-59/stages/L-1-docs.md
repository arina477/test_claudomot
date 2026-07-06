# L-1 — Docs (wave-59)

> Block L (Learn), stage L-1 (Docs). Runs concurrent with L-2 (Distill).
> Wave-59: test-only tail-drainage — table-driven unit test locking `buildTypingLabel`'s
> 5-branch output contract (`apps/web/src/shell/useTyping.ts`); sole production change is an
> inert `export` on the previously module-private pure function (visibility only, no logic change).
> Merged PR #74 → main (42c95bc), web deployed SUCCESS, all gates APPROVED (B-6/T-9/V-3), CI 7/7 green.

## Action 1 — CHANGELOG entry — SKIPPED (deliberate, with reason)

**Decision: no CHANGELOG entry this wave.**

Reasoning:
- Wave-59 shipped a unit test plus a runtime-inert `export` keyword (visibility-only) on an
  already-correct pure function. There is **no user-facing behavior change** — no new feature,
  no modified behavior, no bug fixed that a user could perceive.
- Per keep-a-changelog (the project's declared format, CHANGELOG.md:3-5), test-only internal
  coverage with zero user-visible effect is NOT a release-note entry. House-style precedent: every
  entry under `[Unreleased]` describes a user-perceivable Added/Changed/Fixed behavior
  (e.g. wave-58 #73 cross-client delete-tombble fix; wave-57 #72 one-click DM return). None
  is a bare test addition.
- Inventing a Fixed/Added line for a pure test addition would misrepresent the wave as a
  behavior change to the founder and to future readers. Deliberately omitted.

CHANGELOG.md unchanged. No behavior shipped to describe.

## Action 2 — Milestone delta

Distinct milestone touched via `tasks.milestone_id` on the claimed task (f8eb49c1): **M8**.

- **M8 — Educator tools & deeper academics** (id `84e17739-af5e-4396-beb9-b6f3d6836fc4`).
- L-2 already done-marked f8eb49c1 (verified `done` in DB). Post-mark milestone rollup:

  ```
  SELECT count(*) FILTER (WHERE status='done')  AS done_count,
         count(*) FILTER (WHERE status IN ('todo','in_progress','blocked')) AS open_count
  FROM tasks WHERE milestone_id = '84e17739-af5e-4396-beb9-b6f3d6836fc4';
  → done_count = 40, open_count = 3
  ```

- **open_count = 3 > 0 → M8 does NOT transition to `done`.** Mechanical no-op, no ambiguity,
  so no BOARD escalation required under `automatic` mode (per L-1 Action 2 mode-routing table:
  ambiguity-free mechanical progress runs under any mode without escalation).
- **Milestone delta recorded: M8 `in_progress` → `in_progress` (40/43 done).**

- The 3 remaining open tasks:
  - `5bcbd27f` — DM off-token surfaces polish (drainable, low-value).
  - `874bd233` — DM 429 throttle (drainable, low-value).
  - `999a14d1` — DM pagination (**do-not-auto-drain**; deliberately deferred paging item).
- `open_count = 3` (≥ brain fallback threshold of 3) → **not a backlog-stockout flag** for N-1.

### ⚑ CARRY-FORWARD FOR N-1 (prominent — read at N-1 survey)

The wave-59 P-0 ceo-reviewer flagged a roadmap-pivot signal that N-1 must weigh:

> Once the M8 tail drains, the loop should **promote M12 "Offline-first moat"**
> (id `36378340-0ea5-428e-bc94-03750fb103f6`, currently `todo`). M12 is the differentiator
> half of the **live founder bet** (`ad1a3685`), it needs **NO founder gate**, and it **IS
> autonomously advanceable** by the BOARD.

This reframes the prior "only a low-value tail remains until the founder decides M9" picture:
there is a high-value, founder-gate-free next milestone (M12) available now. **N-1 should weigh
promoting M12 vs. continuing M8-tail drainage** (5bcbd27f / 874bd233).

- **M9 — Monetization stays founder-reserved** (a business-model / pricing call, rule 17;
  surfaced 4× as a soft, non-pausing signal — the BOARD must NOT decide pricing). M12 is the
  autonomously-advanceable alternative and does not depend on the M9 decision.
- M12 exists as `status='todo'` (verified in DB) — no roadmap-planning-ritual needed; it is
  ready for N-1 to promote to the active milestone if N-1 elects the pivot.

## Action 3 — README touchups — SKIPPED

No user-facing / CLI / env / install / breaking change. The wave added a test and a visibility-only
`export`. README untouched. Skip recorded.

## Action 4 — Commit

FS-side docs delta this wave = the L-1 deliverable itself + the L-2 observations ledger (L-2 concern,
committed under L-2). CHANGELOG and README both skipped, so no user-doc content changed. The L-1
deliverable is committed for the audit trail.

- Commit: `docs: L-1 wave-59 closeout` (carries this deliverable; CHANGELOG/README no-op with reasons above).
- Pushed to `main`.

## head_signoff (L-1)

```yaml
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}          # L-1 has no mandatory reviewer matrix; knowledge-synthesizer + karen are L-2
  failed_checks: []
  rationale: >
    Every L-1 exit check ticks. CHANGELOG deliberately skipped with a recorded reason
    (test-only + inert export; no user-facing behavior) rather than fabricating a Fixed/Added
    entry for a pure test — the correct call under keep-a-changelog and house style. Milestone
    delta is mechanical and unambiguous: M8 stays in_progress (40/43, open_count=3>0), no BOARD
    needed. README skipped (no user-facing/CLI/env/install change), recorded. The M12 offline-first
    carry-forward is captured prominently for N-1, reframing the tail-vs-M9 picture with an
    autonomously-advanceable, founder-gate-free next milestone. No doc drift: the only shipped
    surface change (an export keyword) has no journey-map/README/SDK-doc surface.
  next_action: PROCEED_TO_L-2       # (L-2 runs concurrently; both exit before N-block)
```

## Deliverable footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: no change (test-only + inert export; user-facing behavior = none)"
  - "milestone rollup (M8 84e17739): done_count=40 open_count=3 → in_progress held (no UPDATE)"
  - "README.md: no change (no user-facing/CLI/env/install/breaking change)"
changelog_entry_added: false
changelog_skip_reason: "test-only internal coverage + runtime-inert export keyword; no user-facing behavior change"
roadmap_milestones_progressed: [{milestone: "M8 (84e17739)", before: "in_progress (39/42... post-mark 40/43)", after: "in_progress (40/43 done)"}]
roadmap_skip_reason: ""                  # M8 evaluated, held; not skipped
readme_sections_touched: []
carry_forward_for_N1:
  - "M12 (36378340, todo) Offline-first moat — differentiator half of live bet ad1a3685; NO founder gate; autonomously advanceable. N-1: weigh M12 promotion vs M8-tail drainage (5bcbd27f / 874bd233)."
  - "M9 Monetization stays founder-reserved (pricing / business-model; rule 17; 4th soft non-pausing surfacing). BOARD must not decide pricing."
  - "M8 open=3 (5bcbd27f + 874bd233 drainable; 999a14d1 do-not-auto-drain). Not a backlog-stockout."
note: "automatic mode; STATUS RUNNING; no pause trigger (b/d/e/f) fired; loop continues to N-block after L-1 ∥ L-2 exit."
```
