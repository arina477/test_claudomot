# P-1 — Decompose (wave-52)

## Maximum size rubric — all clear
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~15-22 (study-room module: gateway/service/controller/presence + shared contracts + web focus-room panel + socket hook + room-timer scoping + tests) | no |
| New primitives | > 60 | ~10 (study-room namespace, room descriptor, join/leave, room-presence Map, create-room + list + roster endpoints/events, room-scoped timer) | no |
| Estimated net LOC | > 5,000 | ~2,200 (decomposer/mvp-thinner est; reuses study-timer pure formulas + Socket.IO server-room infra) | no |
| Stage-4 working set | > 350K | moderate | no |

No max threshold trips → not RESCOPE-AUTO-SPLIT. (ef84b378 room-timer was the decomposer's CONDITIONAL split point IF the ceiling breached — it did not; the wave is under-floor, not over-ceiling, so no split — mvp-thinner OK confirms.)

## wave_type + floor
- `claimed_task_ids = [d123d9e0, aad849ac, ef84b378]` → length 3 → **wave_type: multi-spec**.
- multi-spec floor: >2,500 net LOC OR ≥6 tasks. ~2,200 LOC / 3 tasks → **Floor TRIPS (sub-floor by ~300 LOC).**

## Floor-trip resolution — override-ship (resolve-by-rule)
This is the recurring reuse-heavy-slice floor-trip (obs-B 3rd instance — waves 50, 51, 52; strengthens the L-2 floor-carve-out candidate held at wave-51). Override-ship is correct:
1. **This is a genuine headline FEATURE, not a tiny/wasteful wave** — the founder-directed joinable focus-room (ceo-reviewer 2x-recommended). The floor's purpose (block wasteful greenfield micro-waves) does not apply.
2. **mvp-thinner OK + floor_constraint_active** — the ONLY split candidate (ef84b378 room-timer, ~700-900 LOC) leaves residual (~1,300-1,500 / 2 tasks) BELOW both multi- AND single-spec floors → splitting drives it FURTHER sub-floor. Refuse.
3. **All 3 P-0 reviewers scope-endorsed** the 3-task bundle (problem-framer PROCEED, ceo HOLD-SCOPE, mvp OK); the per-room timer is the mvp-critical Discord-differentiator (not a peelable add-on).
4. **No BOARD** (board-process fires-list = monolith not floor-merge; anti-pattern #1 resolve-by-rule; ceo-reviewer BOARD-seat HOLD-SCOPE'd). **No decomposer expand** (would author fenced-out scope — voice/persistence/whiteboard are deliberate deferrals). The ~2,200 estimate is conservative for a new realtime namespace + presence + rooms-CRUD + UI panel + room-timer scoping — the real build may land at/over floor; override covers the estimate either way.
- Logged as the recurring pattern (product-decisions [2026-07-05 wave-50 P-1] class).

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - focus-room panel (aad849ac): open-rooms list ("N focusing" count per room) + create-room affordance + joined-room live roster + leave control, in the server view. NEW UI surface (not in design/). Prior art: design/study-timer.html widget chrome + the wave-49 presence roster + DESIGN-SYSTEM tokens; responsive incl. <1024 slim. The room-scoped TIMER reuses the shipped study-timer widget (no new design). Scope-fenced: no voice/video UI.
```

## Verdict
**PROCEED** (max clear; floor waived override-ship by rule; design_gap_flag true → D-block runs).

```yaml
wave_type: multi-spec
max_rubric: clear
floor: tripped (multi-spec, ~2200 LOC < 2500 / 3 tasks < 6)
floor_resolution: override-ship (resolve-by-rule; mvp-thinner floor_constraint_active split-drives-further-sub-floor; ceo HOLD-SCOPE; genuine headline feature; obs-B 3rd instance)
floor_merge_attempt: 0
siblings_created: []
claimed_task_ids: [d123d9e0-bdcd-4815-91c5-ac90b6852997, aad849ac-3273-4a11-ad05-8efef1c5da87, ef84b378-df1d-4bf1-b669-6624d210170f]
design_gap_flag: true
l2_flag: "sub-floor reuse-heavy-slice override — obs-B 3rd instance (waves 50/51/52); floor-carve-out candidate now strongly recurring, promote at L-2"
```
