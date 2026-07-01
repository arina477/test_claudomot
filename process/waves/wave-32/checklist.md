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
