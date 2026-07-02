# Wave 36 — P-1 Decompose

**Bundle:** seed 622a7bf3 (privacy-endpoint regression tests) + siblings 73e96a9d (states-AC re-scope, docs) + b7feab30 (stub Last-updated date fix). **claimed_task_ids.length = 3.**

## Maximum size rubric — no threshold trips
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~10 (2-3 new integration specs via pg-harness, 1 contract spec, 2-3 unit specs, PrivacyPage/TermsPage date edit, a product-decisions/feature-list note) | no |
| New primitives | > 60 | ~6 test suites | no |
| Estimated net LOC | > 5,000 | ~600-700 (integration specs 150-270 each per existing pg-harness siblings; unit+contract ~300; date-fix ~4; docs-note ~15) | no |
| Stage-4 working set | > 350K | ~60K | no |

→ **No RESCOPE-AUTO-SPLIT.**

## Wave type
`claimed_task_ids.length = 3` → **`wave_type: multi-spec`**.

## Minimum floor (multi-spec: >2,500 LOC OR ≥6 tasks) — EXEMPT
- Est ~700 net LOC, 3 tasks → **below the multi-spec floor.** Normally → RESCOPE-AUTO-MERGE.
- **EXEMPTION APPLIES — test-coverage floor exemption (codified: product-decisions.md:215, "Test-coverage waves are exempt from the feature-LOC floor").** wave-36 is the identical shape to **wave-24** (~500-LOC pg-harness extension closing a shipped-authz-surface integration-test gap). Precedent chain: w16/w21/w23/w24/w25/w26/w27. The **wave-24 BOARD ruling ("do NOT re-litigate the Nth per-wave floor-merge")** governs — applied as precedent, **no fresh BOARD needed** (matches how w25/w26/w27 were handled).
- Distinction from the M5-era strategic escalation (product-decisions:328, "draining debt while the headline is blocked"): does NOT apply — M7's bet-load-bearing headline (privacy controls) **SHIPPED in wave-35**; wave-36 hardens the shipped wedge with regression coverage, it is not debt-draining around a blocked headline.

→ **Verdict: PROCEED** (floor-exempt). `floor_merge_attempt: 0` (exemption, not a decomposition-expansion).

## design_gap_flag — FALSE
No new UI surface: test files (no UI); b7feab30 edits the existing PrivacyPage/TermsPage "Last updated" string (no new mockup); 73e96a9d is a docs/product-decisions note. All touched surfaces pre-exist.
```yaml
design_gap_flag: false
missing_surfaces: []
```
→ Next block after P-4: **B**.

```yaml
wave_type: multi-spec
verdict: PROCEED
floor_status: exempt (test-coverage; product-decisions:215; wave-24 precedent)
claimed_task_ids: [622a7bf3, 73e96a9d, b7feab30]
floor_merge_attempt: 0
design_gap_flag: false
```
