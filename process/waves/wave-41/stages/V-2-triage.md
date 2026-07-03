# Wave 41 — V-2 Triage

Inputs merged + deduplicated from T-block findings-aggregate + V-1 Karen (0 findings) + V-1 jenny (3 findings).
Karen APPROVE (0 contradictions) → no Karen findings to triage.

## Classification

| Finding | Source | Sev | Bucket | Route |
|---|---|---|---|---|
| **V1-F1** delete-any affordance rendered for ALL viewers (`MainColumn.tsx:296` onDelete unconditional); should be moderate_members-gated | jenny | Medium (drift) | **Blocking** | **V-3 fast-fix** (frontend-only guard, ~est <20 LOC; backend already enforces 403 so no security risk, but spec §6 "non-moderator sees no controls" is violated) |
| V1-F3 fixture-B credential rejected by deployed auth | jenny | infra | Non-blocking | task `c50f3040` (milestone NULL — test infra) |
| T-LOW1 muted-icon right-edge padding | T-6 | Low cosmetic | Non-blocking | task `8828484f` (M8) |
| T-LOW2 delete-any UI E2E + 2nd-client fan-out coverage (folds V1-F1 verification) | T-5/head-tester/jenny | Low coverage | Non-blocking | task `ca43eb12` (M8) |
| V1-F2 pre-existing (not wave-41-introduced) | jenny | Low | **Noise** | suppress — prior-state; not this wave's regression |
| T-NOISE throwaway test server persists | T-2 | noise | **Noise** | suppress — no server-DELETE endpoint exists; harmless test artifact (known cross-wave) |

## Fast-fix queue → V-3
- **V1-F1** — gate the delete-any message affordance on `moderate_members` (own-message delete stays for everyone; delete-OTHERS affordance only for moderators). Frontend-only, no schema/contract change. V-3 enforces the 20-LOC threshold and aborts to B re-entry if exceeded.

## B re-entry
- none

## Noise suppressions
- V1-F2: pre-existing, not introduced by wave-41 — out of scope for this wave's verify.
- T-NOISE: throwaway test-server rows accumulate because there is no server-DELETE endpoint (out of scope, "light" moderation only); harmless; recurring cross-wave — candidate VERIFY-PRINCIPLES note if it persists.

```yaml
findings_input_count: 6
findings_blocking: [{id: V1-F1, source: jenny, summary: "delete-any affordance not moderator-gated (MainColumn.tsx:296)", fast_fix_candidate: true}]
findings_non_blocking:
  - {id: V1-F3, source: jenny, summary: "fixture-B credential doc wrong", task_id: c50f3040, milestone_id: null}
  - {id: T-LOW1, source: T-6, summary: "muted-icon padding", task_id: 8828484f, milestone_id: 84e17739}
  - {id: T-LOW2, source: T-5/jenny, summary: "delete-any UI E2E + fan-out coverage", task_id: ca43eb12, milestone_id: 84e17739}
findings_noise:
  - {id: V1-F2, source: jenny, summary: "pre-existing", rationale: "not wave-41-introduced"}
  - {id: T-NOISE, source: T-2, summary: "throwaway test server persists", rationale: "no server-DELETE endpoint by design; harmless"}
fast_fix_queue: [V1-F1]
b_block_re_entry_required: []
```
