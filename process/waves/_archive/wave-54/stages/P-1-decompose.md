# P-1 — Decompose (wave-54)

## Maximum size rubric — all clear
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~4-6 (study-timer.gateway.spec.ts + messaging.gateway.spec.ts + presence.gateway.spec.ts regression cases; a shared canonical-error-string constant; minor gateway wiring for the string) | no |
| New primitives | > 60 | ~1 (one canonical generic-error-string constant, reused across gateways) | no |
| Estimated net LOC | > 5,000 | ~80-150 (mostly negative regression tests; a constant + call-site swaps) | no |
| Stage-4 working set | > 350K | small | no |

No maximum threshold trips → not RESCOPE-AUTO-SPLIT.

## wave_type + floor
- `claimed_task_ids = [c52a7a52]` → length 1 → **wave_type: single-spec**.
- single-spec floor: net LOC > 1,500. ~80-150 → **Floor TRIPS (sub-floor).**

## Floor-trip resolution — override-ship (resolve-by-rule)
Recurring reuse-heavy / small-hardening sub-floor trip (obs-B, now **5th instance** — waves 50/51/52/53/54); precisely the case **PRODUCT-PRINCIPLES rule 5** codifies. Override-ship:
1. **Genuine regression-hardening, not a wasteful micro-wave.** Locks an already-closed info-disclosure class closed with a per-gateway negative test (defends against a future refactor silently reintroducing `err.message` forwarding) + standardizes the canonical error string (wave-53 V-2 spec-gap fold-in). The floor's purpose (block wasteful greenfield micro-waves) does not apply.
2. **Zero VALID floor-merge candidate.** The dropped isUuid defense-in-depth (B) was rejected by both reviewers as not-worth-LOC (peeling/adding it is the floor's anti-goal). Repurposing to 344eabde is a distinct DM-REST surface (cross-surface grab-bag, correctly deferred to wave-55). No coherent adjacent scope.
3. **No decomposition-expand** (M8 substantive scope shipped; expanding pads). `floor_merge_attempt: 0`.
4. **No BOARD** (board-process anti-pattern #1: resolve routine sizing by rule). mvp-thinner confirmed NOT OVER-CUT.
- Logged: product-decisions [2026-07-06 wave-54 P-0 REFRAME].

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # test files + one error-string constant; no UI surface.
```

## Verdict
**PROCEED** (max clear; floor waived override-ship by rule — obs-B 5th instance / PRODUCT rule 5; design_gap_flag false → B-block, D skipped).

```yaml
wave_type: single-spec
max_rubric: clear
floor: tripped (single-spec, ~80-150 LOC < 1500)
floor_resolution: override-ship (resolve-by-rule; PRODUCT rule 5 / obs-B 5th; verify-and-harden regression-lock, no valid merge candidate; B dropped; 344eabde deferred cross-surface)
floor_merge_attempt: 0
siblings_created: []
claimed_task_ids: [c52a7a52-c2da-48d7-ac08-a8d849e9f429]
design_gap_flag: false
l2_flag: "obs-B sub-floor override now 5th instance; PRODUCT rule 5 holding. Also: problem-framer 'right-code-wrong-problem' catch (seed premise false — verify before sweeping) is a candidate L-2 observation."
```
