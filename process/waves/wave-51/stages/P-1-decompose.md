# P-1 — Decompose (wave-51)

## Maximum size rubric — all clear
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~2 (AppShell.tsx + a layout test) | no |
| New primitives | > 60 | 0 (extends an existing guard) | no |
| Estimated net LOC | > 5,000 | < 100 (a conditional-render guard on 2 wrappers + test) | no |
| Stage-4 working set | > 350K | tiny | no |

## wave_type + floor
- `claimed_task_ids = [39fc1c5e]` → length 1 → **wave_type: single-spec**.
- single-spec floor: net LOC > 1,500. This wave: < 100 LOC. **Floor TRIPS (sub-floor).**

## Floor-trip resolution — override-ship (resolve-by-rule)
Same recurring reuse-heavy cosmetic debt-fix pattern as wave-50 (documented carve-out candidate). Expansion is inappropriate: mvp-thinner returned OK + `floor_constraint_active: true` with ZERO split candidates (the fix is a single indivisible atomic AC — route-conditional + full-width thread + 1024/1280 re-check are inseparable); the 3 P-0 reviewers scope-fenced against folding in any sibling. The floor's purpose (block wasteful tiny waves) doesn't apply to a V-2-triaged user-visible defect fix on a shipped surface. **No BOARD** (board-process fires-list covers the monolith not floor-merge; anti-pattern #1 "resolve routine sizing by rule"; ceo-reviewer BOARD-seat already HOLD-SCOPE'd this exact scope). **No milestone-decomposer** (would author fenced-out scope). Override-ship; already logged as the recurring pattern in product-decisions [2026-07-05 wave-50 P-1] — this is the same class (L-2 floor-carve-out candidate stands).

## design_gap_flag
```yaml
design_gap_flag: false
```
Restores the ALREADY-canonical 3-panel DM layout (ServerRail + DmConversationList + DmThread) — no new UI surface, no new component, no new mockup. The fix GATES an existing column (ChannelSidebar) off the DM state via an existing guard pattern; the resulting 3-panel geometry is the intended/adopted DM layout. No design gap → **D-block SKIPS → straight to B.**

## Verdict
**PROCEED** (max clear; floor waived override-ship by rule; design_gap_flag false → B-block next).

```yaml
wave_type: single-spec
max_rubric: clear
floor: tripped (single-spec, ~<100 LOC < 1500)
floor_resolution: override-ship (resolve-by-rule; mvp-thinner floor_constraint_active + 0 split candidates; ceo HOLD-SCOPE; recurring cosmetic-debt-fix class)
floor_merge_attempt: 0
siblings_created: []
claimed_task_ids: [39fc1c5e-7fcc-473a-9f50-71cdb53f8759]
design_gap_flag: false
l2_flag: "sub-floor reuse-heavy debt-fix override — same floor-carve-out candidate as wave-50 (2nd occurrence — approaching promotion threshold)"
```
