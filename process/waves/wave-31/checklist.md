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
- [x] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema
- [x] B-1 Contracts (skipped)
- [x] B-2 Backend
- [x] B-3 Frontend
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge — PR #44 MERGED (squash ca3d277); 7/7 checks green; boot-probe api+LiveKit-ESM OK; voice suites ran; no leaks
- [x] C-2 Deploy & verify — api+web deployed via railway up; deploy-state SUCCESS both (api 001b3da2, web e103384e), distinct revisions/digests; /health 200; POST /voice/token 401 route-flip proof; canary skipped (0<1000 DAU); LIVEKIT creds pending (503-until-provided, informational)

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [x] T-3 Contract
- [x] T-4 Integration
- [x] T-5 E2E
- [x] T-6 Layout
- [x] T-7 Perf
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
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
