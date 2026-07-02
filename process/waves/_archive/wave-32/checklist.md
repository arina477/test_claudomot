## Wave 32 stage completion

**Wave:** 32
**Active milestone:** 8702a335 — M6 Voice/video study rooms [in_progress]
**Topic:** M6 next bundle — who's-in-room voice occupancy indicator
**Bundle:** 78f51968 (seed: Add who's-in-room voice occupancy indicator) — single-task bundle (0 siblings)
**claimed_task_ids:** [78f51968]
**Carry-ins for P-0:**
- LiveKit creds STILL NOT SET → occupancy is credential-dependent for LIVE verify but buildable credential-independent (code + tests, mock/placeholder). Same build-now-defer-live-verify pattern as wave-31 token-mint (VERIFY rule 2). Founder heads-up standing on LiveKit creds.
- Occupancy reads LiveKit room occupancy server-side → likely a small design_gap (small UI + a server occupancy query) OR reuse the existing voice-study-room surface (design/voice-study-room.html, shipped wave-31). P-1 decides D-block skip.
- M6 metric ("drop in + talk + screen-share + degrade to audio-only gracefully") still NOT met after this wave — drop-in-room/screen-share/audio-fallback/presence-rings remain future M6 waves.
- Unassigned queue depth 12 (incl. M5-era debt re-homed at wave-30 N-1) — walk at P-0.
- P-0 Action 0a MUST open wave-32's `waves` row (INSERT) — N-3 intentionally did NOT.

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
- [x] B-1 Contracts
- [x] B-2 Backend
- [x] B-3 Frontend
- [x] B-4 Wiring
- [x] B-5 Verify
- [x] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge
- [x] C-2 Deploy & verify (both services SUCCESS on merge 45b08c3; route-flip 401; canary skipped 0 DAU < 1000)

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
- [x] V-3 Fast-fix loop (or close) — head-verifier APPROVED; fast-fix queue empty (0 cycles); F-32-T-8-1 non-blocking → task a2dd9f3d

LEARN:
- [x] L-1 Docs
- [x] L-2 Distill

NEXT: — COMPLETE (head-next APPROVED; loop continues, no pause). Wave-32 closed (status=ok) + archived; wave-33 opened.
- [x] N-1 Survey & triggers — APPROVED: no triggers fire (no close/decompose/promote/checkpoint); cred-tripwire deferred/not-tripped
- [x] N-2 Seed — APPROVED: seed a2dd9f3d (validated: todo, wave_id NULL, parent NULL, milestone_id=M6); single-task bundle
- [x] N-3 Handoff — APPROVED: wave-32 waves row closed (RETURNING wave_number=32 status=ok); dir archived; wave-33 P-0 opened; STATUS RUNNING
- Resolution: prior latent lifecycle defect (a2dd9f3d.wave_id=d25f8c47) resolved by orchestrator (wave_id -> NULL, rule 15 + rule 17). Systemic fix left to brain maintainers (observations.md). See blocks/N/gate-verdict.md.
