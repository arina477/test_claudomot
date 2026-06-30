# Wave 20 — B-6 Review
```yaml
phase1_head_builder_verdict: APPROVED   # code-read; flagged the tautological 403 test for Phase-2
phase2_review_invocations: 2
findings_critical: []   # exactly-once HELD throughout
findings_high: []       # H1 drain-re-entrancy + H3 single-send-path + H4 strict-in-order(stop-on-failure) + H2 tautological-403 ALL FIXED + re-confirmed
findings_medium_accepted: [M1 POST-succeeds-delete-fails window untested, M3 catch-up one-page no-loop]
findings_low_accepted: [L1 dexie-txn-clean, L2 private-mode-null lightly-tested, L3 no-enqueue-dedup, L4 conditional-tombstone-assertion]
fix_up_commits:
  - "cefa1de: H1 _drainInFlight re-entrancy guard + H3 single send path (enqueue+drain) + H4 stop-on-failure strict in-order (later item NEVER sends ahead; test rewritten; docstring corrected) + M2 id-tiebreak"
  - "69ac8c1: H2 delete tautological 403 test → real ChannelMessageGuard coverage (decorator gates ?after= branch + guard.spec genuine 403)"
final_verdict: APPROVE
```
- Phase 1 head-builder APPROVED by code-read (exactly-once spine verified real) but flagged the tautological 403 test. **Phase-2 /review (adversarial, per BUILD rule 4) caught 4 Highs the code-read passed:** in-order at risk (H1 concurrent-drain double-POST, H3 immediate-POST overlap, H4 partial-failure out-of-order — the code's docstring claimed an in-order guarantee the test ENSHRINED breaking) + H2 tautological 403. **4th consecutive wave (17/18/19/20) where adversarial Phase-2 caught what Phase-1 code-read passed — rule 4 validated again.**
- Fix: strict in-order outbox (re-entrancy guard + single send path + stop-on-failure: a later message can NEVER send ahead of an earlier un-sent one; failed-at-MAX skipped on later drains = self-healing, liveness-over-strict-order only after terminal failure gated behind user retry) + real 403 guard coverage. THE WEDGE (exactly-once + in-order offline send) PROVEN. Repo green: typecheck 4/4, build 3/3, lint 0, api 346 + web 176. Re-review: 0 Critical/High.
