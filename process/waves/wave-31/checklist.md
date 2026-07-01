## Wave 31 stage completion

**Wave:** 31
**Active milestone:** 8702a335 — M6 Voice/video study rooms [in_progress]
**Topic:** M6 first bundle — LiveKit voice-room groundwork (server-side token mint + minimal client join + occupancy)
**Bundle:** d8a85de0 (seed: VoiceModule LiveKit token-mint service) + 1dd1f2ca (client join surface) + 78f51968 (who's-in-room occupancy)
**claimed_task_ids:** [d8a85de0, 1dd1f2ca, 78f51968]
**Carry-ins for P-0:** design_gap likely TRUE (voice-study-room page + primitives → expect a D-block); livekit-integration + supertokens-integration specialists build; LiveKit Cloud decided (server out of media path, mints short-lived room-scoped tokens); SDK contract at command-center/dev/SDK-Docs/LiveKit/livekit.md. Unassigned queue depth 12 (incl. 6 M5-debt tasks re-homed at wave-30 N-1 — walk at P-0).

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [x] D-1 Brief
- [x] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [ ] C-1 PR, CI & merge
- [ ] C-2 Deploy & verify (canary armed when real users > 1000)

TEST:
- [ ] T-1 Static
- [ ] T-2 Unit
- [ ] T-3 Contract
- [ ] T-4 Integration
- [ ] T-5 E2E
- [ ] T-6 Layout
- [ ] T-7 Perf
- [ ] T-8 Security
- [ ] T-9 Journey

VERIFY:
- [ ] V-1 Independent reviews (Karen + jenny, parallel)
- [ ] V-2 Triage
- [ ] V-3 Fast-fix loop (or close)

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
