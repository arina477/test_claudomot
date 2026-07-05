# P-1 — Decompose (wave-53)

## Maximum size rubric — all clear
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~4-8 (shared UUID-format guard util + generic-error mapper; wire into study-room.gateway.ts parsers/catch; possibly study-room.service.ts boundary; unit tests) | no |
| New primitives | > 60 | ~1-2 (one reusable UUID-format guard/validator; one generic unknown-error→client-message mapper) | no |
| Estimated net LOC | > 5,000 | ~150-280 (guard ~30-50; mapper ~15-30; parser/boundary wiring ~15-25; negative + unit tests ~80-150) | no |
| Stage-4 working set | > 350K | small (single module + shared util + tests) | no |

No maximum threshold trips → not RESCOPE-AUTO-SPLIT.

## wave_type + floor
- `claimed_task_ids = [fb1c367a]` → length 1 → **wave_type: single-spec**. (The app-wide-sweep sibling `c52a7a52` was split OUT + deferred at P-0 — not claimed this wave.)
- single-spec floor: net LOC > 1,500. ~150-280 LOC → **Floor TRIPS (sub-floor, well under 1,500).**

## Floor-trip resolution — override-ship (resolve-by-rule)
This is the recurring reuse-heavy / small-hardening sub-floor trip (obs-B, now **4th instance** — waves 50/51/52/53), and it is precisely the case the **PRODUCT-PRINCIPLES rule 5 promoted this wave** codifies: *"When mvp-thinner returns floor_constraint_active with zero split candidates, waive the floor; no BOARD is required. Why: the floor targets wasteful greenfield micro-waves; a feature with no valid split is exempt."*

Override-ship is correct:
1. **Genuine security fix, not a wasteful micro-wave.** Closes a penetration-tester-verified (wave-52 T-8) schema/table/column-name info-disclosure on a shipped realtime surface, plus ships a reusable UUID-format guard / generic-error mapper. The floor's purpose (block wasteful greenfield micro-waves) does not apply.
2. **Zero VALID floor-merge candidate.** The only expansion options are: (a) the app-wide sweep `c52a7a52` — deliberately deferred at P-0 by unanimous reviewer convergence; re-merging reverses a just-made scope decision AND re-introduces unbounded/unknown-site-count scope (the floor's own anti-goal); or (b) cross-surface DM hardening-tail items — N-1 chose single-seed fb1c367a specifically to keep the security fix un-entangled; bundling them creates an incoherent grab-bag wave. Neither is valid.
3. **No decomposition-expand.** M8's substantive `## Scope` is shipped (per wave-52 N-1) → milestone-decomposer has no coherent adjacent scope to author into a study-room-security wave; expanding would author padding. `floor_merge_attempt: 0` (mirrors wave-52 P-1 "no decomposer expand — would author fenced-out scope").
4. **No BOARD** (board-process anti-pattern #1: resolve routine sizing by rule, never convene). mvp-thinner confirmed the retained wave is **NOT OVER-CUT** (study-room fix + reusable guard is independently valuable).
- Logged in `command-center/product/product-decisions.md` [2026-07-05 wave-53 P-0/P-1].

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # backend error-handling + input-validation only; client receives a generic
                       # (non-leaking) error instead of raw error text — no new UI surface / mockup.
```

## Verdict
**PROCEED** (max clear; floor waived override-ship by rule — obs-B 4th instance / PRODUCT rule 5; design_gap_flag false → B-block next, D-block skipped).

```yaml
wave_type: single-spec
max_rubric: clear
floor: tripped (single-spec, ~150-280 LOC < 1500)
floor_resolution: override-ship (resolve-by-rule; PRODUCT rule 5 / obs-B 4th instance; zero valid merge candidate — sweep deferred at P-0, cross-surface DM items incoherent; M8 substantive scope shipped so decomposition-expand would pad; mvp-thinner NOT OVER-CUT)
floor_merge_attempt: 0
siblings_created: [c52a7a52]   # app-wide-sweep follow-up, DEFERRED (not claimed this wave); top-level M8 seed
claimed_task_ids: [fb1c367a-4f63-47a5-8f35-10a8d0fd492a]
design_gap_flag: false
l2_flag: "obs-B sub-floor override now 4th instance; PRODUCT rule 5 (promoted wave-52) applied first time — rule is holding. No new promotion."
```
