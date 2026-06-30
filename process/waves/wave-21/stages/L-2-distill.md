# Wave 21 — L-2 Distill
```yaml
l_stage_verdict: COMPLETE
tasks_marked_done: [c1dbee64, 94e41695, 2fe6b517]   # at V-close
observations_emitted: 4
promotion_candidates: 1
karen_verdicts: [{candidate: obs-3, verdict: APPROVE-PROMOTION (why-line corrected to 100 chars — synthesizer miscounted), note: "w20-drain + w21-catch-up same reconnect-loop-reentrancy class"}]
head_builder_signoff: APPROVE   # domain
promotions_applied:
  - file: command-center/principles/BUILD-PRINCIPLES.md
    rule: "5. Guard every reconnect-triggered async loop with an in-flight coalescing flag or promise-mutex at authoring time."
```
- **obs-3 PROMOTED → BUILD-PRINCIPLES rule 5** (2-wave recurrence: w20-H1 drain() re-entrancy [High, _drainInFlight fix] + w21-M1 runDrainAndCatchup loop re-entrancy [Medium, dedup-masked] — SAME structural class: reconnect-triggered async loop without in-flight coalescing, overlapped by the 2 reconnect triggers socket-connect + window-online). karen-vetted (corrected why-line) + head-builder-signed.
- **obs-1 PRODUCT rule 1 VALIDATED (1st post-promotion use, NO re-promotion):** the milestone-decomposer pre-applied rule 1 at N-1/decomposition (dropped already-shipped pending/failed UI, corrected the dead-component premise) BEFORE P-0. The rule promoted w20 already changed behavior. 
- **obs-2 principles-bypass NON-RECURRENCE (informational POSITIVE):** head-verifier did NOT write to VERIFY-PRINCIPLES at V-3 — the per-spawn no-edit directive HELD for the 1st time after 7 prior bypasses (w9/12/17/18 head-ci-cd + w19/20 head-verifier). Per-prompt reminder = working stopgap. The structural guard (git diff at every block exit) is still the durable fix (carry to N). N-block note: 7-streak + 1 held.
- **obs-4 (async-invariant-executing-test):** 1st-instance HOLD — "prove an async no-data-loss/resume invariant with a mutation-validated executing test, not code+contract reasoning" (from the V-3 L2 resume-test fast-fix). → VERIFY-PRINCIPLES rule 2 on a 2nd confirming wave. Staged for future L-2.
```
