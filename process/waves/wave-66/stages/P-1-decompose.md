# P-1 Decompose — wave-66 (single-spec; offline empty-state copy polish)

## Maximum rubric (all four)
- Files touched: ~2 — apps/web/src/shell/ChannelSidebar.tsx (split the detailStatus==='error' render by connection state) + apps/web/src/shell/shell-components.test.tsx (update the /couldn't load channels/i assertion into offline-neutral vs online-error). Under 60.
- New primitives: ~0-1 (one conditional copy branch gated on useConnectionState). Under 60.
- Est net LOC: ~30-50 (mostly the test split). Under 5,000.
- Working set: trivial. Under 350K.
→ Max rubric: no threshold trips.

## Wave type + floor
- claimed_task_ids=[6018bdee] → **single-spec**. Floor: >1,500 LOC. Est ~30-50 → BELOW floor → RESCOPE-AUTO-MERGE.

## Floor resolution — OVERRIDE-SHIP BY RULE (precedent-application, no BOARD)
- Override-ship the sub-floor single-task wave. floor_merge_attempt: 0.
- **Why (precedent-application, not fresh decision):** UX-polish-on-shipped-infra reusing ConnectionStateIndicator + existing detail-error state — inherently sub-floor. Only adjacent M12 scope is BLOCKED (10e7543f) or ill-posed (conflict-resolution UI, per P-0 strategic flag). Nothing coherent to floor-merge; padding = anti-goal. Exactly PRODUCT-PRINCIPLES rule 5 + the wave-21/53 infra-reuse/UX-completion floor-exemption lineage (waves 16/21/23-27/40/45/50/53/65). Per the wave-24 standing "do NOT re-litigate a Nth per-wave floor-merge" ruling → precedent-application, NO fresh BOARD.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Reason: presentation-only copy change; reuses existing ChannelSidebar states + ConnectionStateIndicator/useConnectionState; no new UI surface or mockup.

```yaml
wave_type: single-spec
verdict: RESCOPE-AUTO-MERGE → override-ship-by-rule (precedent-application)
floor_merge_attempt: 0
claimed_task_ids: [6018bdee-1b99-47b2-8235-b3786c29c2d5]
design_gap_flag: false
```
