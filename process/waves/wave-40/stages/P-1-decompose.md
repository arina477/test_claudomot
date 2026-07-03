# Wave 40 — P-1 Decompose

## Maximum size rubric
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~3–5 (fix#1: auth.exception.filter.ts OR a users.controller :userId guard; fix#2: files.service.ts checkAvatarSize catch + files.controller confirm; test files) | > 60 | no |
| New primitives | 0–1 (at most a small guard/pipe) | > 60 | no |
| Estimated net LOC | ~20–40 (2 small hardening fixes + regression tests) | > 5,000 | no |
| Stage-4 working set | small | > 350K | no |

**Max verdict:** not tripped.

## Wave type
`claimed_task_ids = [7525b759]` → **single-spec**. wave_type = backend (+ security-adjacent: the fixes come from T-8 probes; T-8 fires to re-verify the 500→4xx behavior live).

## Minimum floor
- single-spec floor: net LOC > 1,500. Estimate ~20–40 → **FLOOR TRIPS** → RESCOPE-AUTO-MERGE.
- **floor_merge_attempt: 0.** Decomposition-expansion known-futile: M7's only other open task is a1299e88 (Resend, founder-blocked — not buildable). This is the LAST buildable M7 item; padding with evidence-free hardening is exactly the gold-plating the P-0 ceo HOLD-SCOPE guardrail forbids.
- **PRECEDENT-APPLICATION override-ship** (P-1 §2b resolution (a)): a security-hardening / tech-debt wave is inherently sub-floor (bug-fix LOC ≪ feature LOC). Extends the wave-16 test-infra/tech-debt floor-exemption to a T-8-evidenced robustness-hardening wave; the wave-24 standing "do NOT re-litigate a Nth per-wave" ruling stands (applied w25/w26/w38/w39). Last buildable M7 item; decomposition futile. NOT a fresh BOARD.

**Verdict:** PROCEED-AFTER-MERGE (override-ship, precedent-application).

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Backend-only (exception-filter/guard + S3-error catch); no UI surface. → D-block skips, P hands off to B.

```yaml
floor_merge_attempt: 0
wave_type: single-spec
verdict: PROCEED-AFTER-MERGE
design_gap_flag: false
```
