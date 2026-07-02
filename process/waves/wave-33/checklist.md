## Wave 33 stage completion

**Wave:** 33
**Active milestone:** 8702a335 — M6 Voice/video study rooms [in_progress]
**Topic:** M6 hardening — harden voice endpoint param validation (non-UUID channelId 500→400)
**Bundle:** a2dd9f3d (seed: Harden voice endpoint param validation) — single-task bundle (0 siblings)
**claimed_task_ids:** [a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354]
**Carry-ins for P-0:**
- Seed a2dd9f3d = wave-32 V-2 follow-up (F-32-T-8-1): non-UUID channelId currently returns 500; harden to 400 via ParseUUIDPipe / DTO param validation on the voice endpoint. **CREDENTIAL-INDEPENDENT** — fully unit/contract verifiable without LiveKit keys; no live-verify deferral this wave.
- Cred-tripwire: count=2 (w31 token-mint, w32 occupancy). This wave's work is credential-independent → 3rd-consecutive-cred-blocked condition NOT met → tripwire DEFERRED, NOT tripped. Standing LiveKit founder ask remains open in the digest. Tripwire re-arms only when the M6 queue holds ONLY cred-blocked work AND keys still absent.
- M6 metric ("drop in + talk + screen-share + degrade to audio-only gracefully") still NOT met — screen-share, audio-fallback, presence-rings remain future M6 waves after this hardening slice.
- Unassigned queue depth 12 — walk at P-0.
- Backend-only hardening → D-block likely SKIP (no new UI). P-1 decides.
- P-0 Action 0a MUST open wave-33's `waves` row (INSERT) — N-3 intentionally did NOT.
- Prior lifecycle note: a2dd9f3d was resolved from wave_id=d25f8c47 → NULL by the orchestrator (rule 15 + rule 17) so it could seed this wave. Systemic fix (milestone-scoped V-2 follow-up wave_id disposition) documented in wave-32 observations.md for brain maintainers.

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
