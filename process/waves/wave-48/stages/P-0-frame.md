# Wave 48 — P-0 Frame
## Discover
- wave_db_id: 25c46eee-306a-4b10-b0b9-d842542dcd9c (wave 48, running, M8). Seed 03ccf636 (single-task).
- Prior-work: wave-47 shipped GET /dm/candidates; T-8 proved the privacy fence ACTIVE via positive results; V-2 flagged the negative-case (counter-example) coverage gap (LOW, test-only).
- short-circuit: no-prior-spec (V-2 prose). Product decision: none (test-only).
## Reframe
- problem-framer: **PROCEED**. Unit tests are "coverage theater by construction" (mock where() no-op, resolves pre-filtered arrays — never exercises ne(who_can_dm,'nobody')/inArray). Closing negative-case coverage on a PRIVACY boundary (a candidate leak exposes non-co-members) is real regression-protection, not busywork. Existing harness (pg-harness.ts + presence-comembers.spec.ts) drops the fixture in; scope = who_can_dm fixture param + 2 assertions.
- ceo-reviewer: **PROCEED (HOLD-SCOPE)**. Right use — guards the academic-wedge trust surface; right-sized single test task (sub-floor OK per wave-16 test-exemption); wave-49 MUST re-escalate the founder study-groups-vs-search fork (guardrail).
- mvp-thinner: **OK**. Single indivisible privacy negative-case (1 fixture + 2 assertions); no splittable fat; not over-cut; scope-fenced (NOT pagination c5051444 / picker-UI 5bcbd27f / other DM siblings).
- Disposition: **PROCEED**. Final framing: add who_can_dm param to insertFixtureUser + 2 real-DB negative-case assertions on GET /dm/candidates (nobody-co-member excluded; disjoint non-co-member hidden). Test-ONLY, no production code. design_gap_flag=false.
```yaml
p_stage_verdict: COMPLETE
disposition: PROCEED
short_circuit: no-prior-spec
reframe: {problem-framer: PROCEED, ceo-reviewer: PROCEED-HOLD-SCOPE, mvp-thinner: OK}
carry_forward: ["wave-49 P-0: re-escalate study-groups-vs-search founder fork (guardrail — no 2nd consecutive debt wave)"]
