# Wave 1 — P-1 Decompose

## Maximum size rubric (pre-split, full 3-task bundle)

| Measure | Threshold | Estimate (full bundle) | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~60–95 (monorepo scaffold ~25 + auth backend ~25 + 6 frontend pages ~25) | **YES** |
| New primitives | > 60 | ~50+ (24 design primitives + users/profiles/supertokens tables + ~5 auth endpoints + 6 pages) | borderline |
| Estimated net LOC | > 5,000 | ~7,000–10,000 | **YES** |
| Stage-4 working set | > 350K tokens | ~250K (plan + SDK docs for SuperTokens/Resend + briefs) | no |

Two thresholds trip (files, LOC) → **RESCOPE-AUTO-SPLIT**. Confirms P-0's problem-framer signal (size, not bad framing).

## RESCOPE-AUTO-SPLIT protocol

- **Thresholds tripped:** files (~60–95 > 60), net LOC (~7–10K > 5,000).
- **Split proposal:** wave-1 keeps the **seed** (monorepo + dark app shell + CI). The two auth siblings are re-parented to NULL (top-level), becoming candidate seeds for future waves (wave-2 ≈ auth backend; wave-3 ≈ auth + profile frontend). N-2's seed-pick surfaces them.
- **Re-parented (surplus → future seeds):** `b9118041-…` (Postgres + Drizzle + SuperTokens auth backend), `9aae8255-…` (Auth + profile frontend pages). `milestone_id` unchanged (M1), `wave_id` NULL.
- **Retained this wave (claimed_task_ids):** `[cbf25dd5-95ab-4ebf-a7bc-a5e6a3714804]` (the seed).

## First-slice sizing (post-split, seed only)

| Measure | Threshold | Estimate (seed slice) | Under cap? |
|---|---|---|---|
| Files touched | > 60 | ~25–40 (turbo/pnpm/biome/tsconfig configs + apps/api + apps/web scaffold + dark app-shell components + theme tokens) | ✓ |
| New primitives | > 60 | ~15–25 (design tokens + shell components: server rail, channel sidebar, layout chrome, connection-state indicator; NOT the 6 auth pages — those are sibling 3) | ✓ |
| Net LOC | > 5,000 | ~2,300–3,300 | ✓ |
| Stage-4 working set | > 350K | ~120K | ✓ |

## Wave type + minimum floor

- `claimed_task_ids.length == 1` → **wave_type: single-spec**
- Floor (single-spec): net LOC > 1,500. Estimate ~2,300–3,300 > 1,500 → **floor met**. No merge.

## Verdict

**RESCOPE-AUTO-SPLIT** → resolved. Wave-1 scope = the monorepo + dark app shell + CI seed (single-spec). Surplus auth work deferred to future waves.

## design_gap_flag

```yaml
design_gap_flag: false
missing_surfaces: []
```

Rationale: the dark app shell (layout chrome, server rail, channel sidebar skeleton, theme tokens, connection-state indicator) implements the **already-approved** `design/DESIGN-SYSTEM.md` tokens + primitives and the approved mockups (`design/app-home.html`, `design/server-channel-view.html`). No net-new UI surface is invented this wave → **D-block skips; P-4 → B**.

---
```yaml
floor_merge_attempt: 0
wave_type: single-spec
claimed_task_ids: [cbf25dd5-95ab-4ebf-a7bc-a5e6a3714804]
design_gap_flag: false
verdict: RESCOPE-AUTO-SPLIT
```
