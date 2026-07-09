# Wave 88 — T-9 Journey (gate)
## Phase 1 — head-tester: APPROVED
Confirmed against primary sources (CI job 86234356653 log): the 4 senderKeyRef integration cases (match→store, mismatch→reject/zero-rows, no-key→fail-open, post-rotation→accepted 154ms) ran GREEN against a live postgres:16 with real pg-harness queries, no mock-the-SUT; fail-open + server-blind + unspoofable-callerId + no-privilege-escalation reasoning holds. Zero critical/high. Verdict at blocks/T/gate-verdict.md.
## Phase 2 — journey
- **Regen SKIP:** backend wave_type; design_gap_flag=false; B-3 skipped → regen skipped; canonical map stays prior wave's.
- **Targeted annotations (P-4 jenny carry-forward):** (1) `POST /dm/conversations/:id/messages` annotated with the new senderKeyRef mismatch-400 (defense-in-depth, fail-open); (2) finding **F-T8-2 marked RESOLVED wave-88** (merge d0646058, PR #109) with the 4-case CI verification.
- **Scenario smoke:** no `user-scenarios/` dir.
- **Cross-wave regression:** none (behavior-preserving for legitimate sends; only a mismatched/stale-post-rotation send is newly rejected — correct).
```yaml
phase1_head_tester_verdict: APPROVED
journey_regen_skipped: true
journey_regen_skip_reason: "backend wave_type; design_gap_flag=false; B-3 skipped"
crawl_routes_visited: 0
scenarios_run: 0
regressions_critical: 0
journey_map_commit: 54269ed6bfd1f955fbdb4e18d91cc298f75b6a0b
findings: [{severity: none, journey: "DM send", description: "F-T8-2 retired; mismatch-400 annotated; no regression"}]
```
