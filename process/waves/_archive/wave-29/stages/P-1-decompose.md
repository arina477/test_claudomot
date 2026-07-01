# Wave 29 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~4-5 (presence.gateway.ts + servers.service.ts [part 1]; packages/shared/src/servers.ts + index.ts barrel [part 2 delete]; +1 test) | No |
| New primitives | > 60 | 0 new (a 2-char operator swap ×2 + a schema deletion) | No |
| Estimated net LOC | > 5,000 | ~30-50 (mostly deletions: 2 `??`→`||` edits + removing the unused schema + barrel exports + any dead import) | No |
| Stage-4 working set | > 350K | tiny | No |

No maximum threshold trips.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [d23a0740]` → length 1 → **wave_type: single-spec**.
- Single-spec floor: net LOC > 1,500. Estimate ~30-50 LOC → **floor UNMET**.

## Step 2b — RESCOPE-AUTO-MERGE → PRECEDENT-APPLICATION override-ship
Floor unmet. Decomposition-expansion is known-futile + reviewer-rejected (identical to w25-w28):
1. M5's only unbuilt `## Scope` item is the reminders arc (Resend-cred-blocked); the other M5 candidates are cross-concern.
2. All three P-0 reviewers endorsed the atomic scope (mvp-thinner OK + scope-freeze; problem-framer REFRAME-narrow; ceo-reviewer RECONSIDER wants a DIFFERENT milestone [M6], not expansion of THIS seed — and M6 is founder-park-blocked).
3. This is the **8th consecutive** under-floor M5-debt wave (w16/23/24/25/26/27/28). wave-24 BOARD standing ruling: "do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead" — applied as precedent w25-w28.

**Verdict: PRECEDENT-APPLICATION override-ship** (NOT a fresh BOARD). `floor_merge_attempt: 0`.

**Structural escalation (SHARPENED, carried to P-4):** the M5 **park-or-key fork** with the ceo-reviewer's concrete **M6 voice/video** alternative (credential-free, floor-clearing) — founder-pending, digest 2026-07-01 updated with the A/B choice. This is the real fix; the override-ship is the symptom. head-product carries to P-4. NOT re-raised as a new ask (already with founder).

## Step 3 — design_gap_flag
**design_gap_flag: FALSE.** Part 1 is a backend fallback-operator fix (presence gateway + servers.service — no UI). Part 2 is a shared-package Zod schema DELETION (no visual surface). → skip D, straight to B. **B-1 Contracts fires** this wave (part 2 mutates `packages/shared` — a contract-surface change, even though it's a deletion of an unused schema; B-1 verifies zero consumers before deleting + re-exports removed).

```yaml
verdict: PROCEED (override-ship under-floor, PRECEDENT-APPLICATION, 8th)
wave_type: single-spec
claimed_task_ids: [d23a0740-0326-4748-a158-62e69ea733e7]
max_rubric_trips: []
floor_threshold: "1500 LOC (single-spec)"
estimated_net_loc: "~30-50 (net negative — deletions)"
floor_met: false
floor_merge_attempt: 0
precedent_cited: [wave-16, wave-23, wave-24-do-not-relitigate, wave-25, wave-26, wave-27, wave-28]
board_convened: false
design_gap_flag: false
b1_contracts_fires: true   # part 2 = shared-package schema deletion
missing_surfaces: []
structural_escalation: "M5 park-or-key fork + ceo M6-concrete alternative — founder-pending, digest updated with A/B choice."
specs:
  - {task_id: d23a0740, layer: "backend + shared", scope: "part1: ??→|| at presence.gateway.ts:125 + servers.service.ts:249 (empty displayName falls through to userId); part2: DELETE unused ServerMembersResponseSchema + barrel re-exports (verify 0 consumers first). Keep OUT: adjacent refactors."}
```

## Exit
Single-spec (1 spec), under-floor override-ship by standing precedent (8th; no fresh BOARD, floor_merge_attempt 0), design_gap_flag=false → skip D. B-1 Contracts fires (shared-schema delete). M5 park-or-key + M6 escalation sharpened to founder. → P-2 Spec.
