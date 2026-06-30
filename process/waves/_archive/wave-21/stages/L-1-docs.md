# Wave 21 — L-1 Docs

**Block:** L (Learn), stage L-1 (∥ L-2, concurrent). **Mode:** automatic. **Owner:** head-learn.
**Wave:** M4 wave-2 — offline UX (live connection-state indicator + multi-page reconnect catch-up). FRONTEND-ONLY, web-only deploy 032dc384, PR #33 (9c48007). 3 tasks DONE (c1dbee64, 94e41695, 2fe6b517).

## Action 1 — CHANGELOG entry

**Disposition: ADD (1 bullet under [Unreleased] → Added).** CHANGELOG.md:46.

- Classified **Added** (consistent with the wave-20 offline bullet placement and the brief's example): the wave delivers net-new *visible* behavior. Wave-20's bullet (#32, CHANGELOG.md:45) covered offline-first messaging in general; the connection-state indicator component existed but was DEAD (AppHome hardcoded `connectionState="online"`, and the foundation bullet at CHANGELOG.md:12 described the component's existence only). Wave-21 makes the dot reflect REAL socket state (online / reconnecting / offline) and completes multi-page catch-up so reconnect recovers ALL missed messages past page 1.
- NOT folded into #32: this is a distinct, user-perceivable capability (live status visibility + full-window recovery), not redundant restatement. Lean-ADD per brief (visible new behavior).
- NOT **Fixed**: the dead-indicator plumbing + single→multi-page catch-up were gaps on a never-shipped-as-functional surface (the indicator never received a live value; catch-up never looped). The V-3 resume-after-mid-loop-failure test fix was a pre-merge catch on this wave's own new code, not a patch to shipped behavior. Consistent with the wave-19/20 Added-not-Fixed ruling.

Bullet added:
> The connection dot now shows your real status — online, reconnecting, or offline — and reconnecting recovers every message you missed while away, however long you were gone. (#33)

## Action 2 — Milestone delta

**RECORDED ONLY. No `milestones` UPDATE fired (mechanical non-close — open children remain).**

- Touched milestone: **M4 (eb2a1688) — Offline-first reliability (the wedge)**, status `in_progress`.
- M4 child census post-L-2 done-marking: **7 done / 6 open** → `open_count = 6 ≠ 0` → mechanical closure UPDATE does NOT fire at L-1. M4 STAYS `in_progress`.
- The 6 open children are ALL re-homed M3 messaging-infra tech-debt (parked, independent top-level backlog, `parent_task_id`/`wave_id` semantics per M3-closure re-home), NOT unshipped offline-first scope features:
  - d058283d invite-code rotation, 10b9d18e author-presence-dots (sibling), 02fa8011 real-PG test tier, 6a546c7b presence-perf, d23a0740 presence-debt, c18b8089 mention-parity.

### M4 closure-eligibility assessment (for N-1)

**M4 is CLOSURE-ELIGIBLE at N-1, modulo the 6 parked tech-debt children.** The 7 done tasks now cover the entire M4 ## Scope:

| M4 ## Scope item | Shipped by |
|---|---|
| IndexedDB local store (cached reads + outbox) | 7332a4b8 (wave-20) |
| outbox queue + idempotency keys + replay-safe POST | 92d85e0e (wave-20) |
| outbox enqueue + optimistic-send integration | 9a4ab31d (wave-20) |
| reconnect reconciliation + ?after= keyset catch-up (multi-page) | 94e41695 (wave-21) |
| connection-state indicator (online/reconnecting/offline) — LIVE | c1dbee64 (wave-21) |
| pending/failed message UI | shipped wave-20 (premise-verified complete; dropped from bundle as already-done) |
| composer stays enabled offline | shipped wave-20 spine |
| heavily tested (fake-indexeddb unit + integration) | e29f6566 (wave-20) + 2fe6b517 (wave-21) |

The M4 ## Success metric — "loses connectivity, keeps reading cached channels and composing, on reconnect every queued message sends exactly once in order with no data loss" — is now FULLY MET (cached reads + outbox exactly-once + live connection-state + multi-page catch-up all shipped & LIVE; V-3 + jenny confirmed no-data-loss + honest-signal, 0 Critical/0 High).

**Do NOT close M4 here — N-block (N-1 Action 6) owns the `in_progress → done` transition.** N-1 must resolve the 6 open children per roadmap-lifecycle Invariant #3 (all `WHERE milestone_id=M4` children terminal before closure): cancel, re-home to the next milestone, or carry. They are genuine carried-forward backlog (re-homed once already at M3 closure), so cancelling would discard real work — N-1's disposition call.

## Action 3 — Floor-exemption precedent (jenny-recommended)

**APPENDED to `command-center/product/product-decisions.md`** (append-only product-decision log, NOT a principles file — allowed at L-1).

- Recorded the wave-16 feature-LOC-floor exemption as EXTENDED from test-infra/test-coverage waves to **UX-completion waves reusing shipped infrastructure** (wave-21 founding precedent). Rationale: such waves are inherently sub-floor in net-new feature LOC because the component/store/cursor/contract already exist; the floor is a thin-FEATURE-wave guard that does not apply when the wave's job is to make shipped infra function at runtime.

## Action 3 (stage) — README

**SKIPPED.** Nothing user-facing in setup/CLI/env/install/breaking changed. Frontend-only wave, no new server surface, no new command or flag. README line 3 tagline already names "offline-first reliability" at a high level (frozen early snapshot, lags messaging waves). Consistent with the wave-13–20 README cut.

## Action 4 — Commit

FS touchups committed + pushed to main. SHA in footer.

- Tasks-table status untouched (L-2 owns it, concurrent). Principles files untouched (L-2 owns promotion, concurrent).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:46 (1 bullet, Added, #33)"
  - "command-center/product/product-decisions.md:255-266 (floor-exemption precedent extension)"
  - "milestones row UPDATE: NONE (M4 eb2a1688 census 7 done / 6 open → open_count≠0, mechanical non-close; stays in_progress)"
  - "commit: 42123c9533d035df78eb6ae5bc453763e023308a (pushed to main)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "M4 (eb2a1688) has 6 open children (re-homed M3 tech-debt) → open_count=6≠0 → mechanical closure UPDATE does not fire at L-1. Closure-eligibility RECORDED for N-1 (all ## Scope shipped + success metric met)."
readme_sections_touched: []
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every active block's wave content is captured. CHANGELOG carries one terse user-facing bullet
    for the genuinely new visible behavior (live connection dot + full-window catch-up), correctly
    classified Added not Fixed. Milestone delta is RECORD-ONLY — no DB write — because M4's 6 open
    children (all parked re-homed M3 tech-debt, not offline-first scope) keep open_count≠0; the
    closure-eligibility assessment (all ## Scope shipped, success metric met) is recorded for N-1,
    which owns the transition. The floor-exemption precedent extension is a product-decision append
    (not a principles promotion — that is L-2's gated lane), correctly placed. README skip is
    consistent with the standing cut. No tasks-table or principles-file writes (L-2's concurrent lane).
  next_action: PROCEED_TO_block_exit
note: "L-1 ∥ L-2 concurrent; block exits once both exit. M4 closure-eligibility handed to N-1."
```
