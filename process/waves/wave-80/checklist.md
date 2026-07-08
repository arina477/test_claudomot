## Wave 80 stage completion

**Milestone:** M13 — Institution partnerships & portable identity (b7400254-9c16-4b97-a898-2619b949fc5e)
**Seed:** 3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1 — Add read-receipt and presence privacy controls to settings
**Siblings:** (none — single-task bundle)
**claimed_task_ids:** [3038a4bc]
**Note:** M13 leg-3b — read-receipt & presence privacy controls in settings (split out at wave-79 P-0). SCOPE HOLE to resolve at P-0: `sendReadReceipts` gates a read-receipt feature that does not exist yet — either build the read-receipt primitive first, or narrow the AC to presence-only + a deferred read-receipt sibling. This is M13's LAST autonomous leg: after it ships, M13 hits open=0 with only founder-reserved scope remaining (B2B2C go-to-market, _TBD_ success metric, identity verification) → expect a milestone-disposition JUDGMENT CALL at next N-1 (routes to BOARD under automatic mode) + roadmap-planning stockout cascade (todo-milestone queue is EMPTY). Wave touches settings/message-privacy — assess T-8 security-scope tightened gate at P-4.

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema
- [x] B-1 Contracts
- [x] B-2 Backend
- [x] B-3 Frontend
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify (canary armed when real users > 1000)

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [x] T-3 Contract
- [x] T-4 Integration
- [x] T-5 E2E
- [x] T-6 Layout
- [x] T-7 Perf (SKIP — not heavy)
- [x] T-8 Security
- [x] T-9 Journey

VERIFY:
- [x] V-1 Independent reviews (Karen + jenny, parallel)
- [x] V-2 Triage
- [x] V-3 Fast-fix loop (or close)

LEARN:
- [x] L-1 Docs
- [x] L-2 Distill

NEXT:
- [x] N-1 Survey & triggers
- [x] N-2 Seed
- [x] N-3 Handoff
