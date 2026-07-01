# Wave 28 — V-2 Triage

## Action 1 — Aggregated finding list
| id | source | summary |
|---|---|---|
| F28-T8a | T-8 + jenny V-1 | Owner rotate returns **201** (NestJS @Post default) but spec AC1 + api contract say **"200"**. Body `{invite_code}` correct; both 2xx. |
| F28-T8b | T-8 + B-6 | 403-vs-404 existence oracle (non-owner→403 reveals server exists). |
| F28-V1k | karen V-1 | B-2 deliverable says "6 integration cases", actual is 7 (extra = AC5 404). |

karen V-1: APPROVE (all load-bearing claims hold in deployed state). jenny V-1: APPROVE (all 7 AC intents met live).

## Action 2/3 — Classification
| id | bucket | routing | rationale |
|---|---|---|---|
| **F28-T8a** | non-blocking → **fix in-wave (V-3)** | spec-doc reconciliation | jenny classified spec-GAP (the SPEC was wrong, not the code): 201 is the MORE correct status for a credential-minting action and matches the sibling create handlers (`createServer`/`createInvite` both `@HttpCode(CREATED)`). No client consumer this wave. Cleanest fix = amend the spec's AC1 + api contract to 2xx/201, NOT force `@HttpCode(200)` (which would make rotate the inconsistent handler in its own controller). Trivial doc reconciliation (0 code LOC) → V-3 fast-fix, not a future task row (a task row would leave the spec permanently inaccurate). |
| **F28-T8b** | **noise (accepted-debt)** | suppress | Spec-CONFORMANT (AC4 explicitly says non-owner→403). Consciously accepted at B-6 + recorded in product-decisions.md wave-28 (owner-ONLY-vs-manage_server) + the existence oracle matches the existing `findServerDetail` precedent; server ids are non-secret UUIDs; owner-only mutation still enforced. Not a bug. |
| **F28-V1k** | **noise** | suppress | Cosmetic deliverable count typo (6 vs 7) — MORE coverage than claimed, zero load-bearing impact. |

## Action 4 — Non-blocking task rows
None INSERTed. F28-T8a is fixed in-wave (V-3 spec reconciliation); F28-T8b + F28-V1k are noise.

## Action 5 — Noise suppressions
- F28-T8b: spec-conformant (AC4=403) + accepted-debt (product-decisions wave-28) + findServerDetail precedent. Recurring pattern (flagged B-6 + T-8 + V-1) — all agree it's accepted, not a defect.
- F28-V1k: cosmetic deliverable undercount, no impact.

```yaml
findings_input_count: 3
findings_blocking: []
findings_non_blocking:
  - {id: F28-T8a, source: "jenny V-1 (spec-gap)", summary: "spec AC1 says 200; deployed-correct is 201", disposition: "fix in-wave at V-3 (spec reconciliation)", task_id: null}
findings_noise:
  - {id: F28-T8b, source: "T-8/B-6", summary: "403-vs-404 existence oracle", rationale: "spec-conformant AC4=403 + accepted-debt (product-decisions wave-28) + findServerDetail precedent"}
  - {id: F28-V1k, source: "karen V-1", summary: "deliverable says 6 integration cases, actual 7", rationale: "cosmetic undercount, no impact"}
fast_fix_queue: [F28-T8a]   # spec-doc reconciliation (0 code LOC)
b_block_re_entry_required: []
```

## Exit
No blocking findings; both reviewers APPROVE. One trivial spec reconciliation (F28-T8a) → V-3 fast-fix. → V-3 gate.
