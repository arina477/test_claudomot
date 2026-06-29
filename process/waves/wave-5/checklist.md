# Wave 5 stage completion

**Active milestone:** M1 — Foundation: app shell, auth & profiles (`5a6efc9e-9de7-4594-a75d-d45e30d9a417`, in_progress)
**Seed task:** `839af17f-fa3d-4212-a17b-d34bfbb231d7` — Add rate limiting to auth endpoints (@nestjs/throttler)
**Bundled siblings:** `84e09891-2b2f-4b68-b6e2-e2ef340ef32a` — Set Railway Bucket creds + verify avatar upload live
**Claimed task ids (B-0 claims this batch):** [839af17f, 84e09891]
**Theme:** Hardening (founder "a bit of both" ruling, 2026-06-29) — rate-limiting + finish avatar storage, then M2 servers → M3 messaging.

> **PENDING FOUNDER DEPENDENCY (B-block must plan the ask):** task 84e09891 needs founder-supplied **Railway Bucket creds** (bucket name + access key/secret). The avatar upload presign path is already built + deployed (returns 503 gracefully when storage unset, so no regression). If creds do not arrive during this wave, ship rate-limiting (839af17f) and leave 84e09891 open/blocked — do NOT block the wave on the creds.

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
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
- [x] C-1 PR/CI/merge (PR#12 via branch-protection) · C-2 deploy&verify (rate-limit 429 LIVE; version fixed; avatar pending creds)
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
- [x] V-1 Independent reviews (Karen REJECT node-20 Low + jenny APPROVE)
- [x] V-2 Triage (node-20 sole blocking → fast-fix; rest non-blocking)
- [x] V-3 Fast-fix loop — head-verifier APPROVED; node-20 fast-fixed (PR#15), CI-verified zero annotations

LEARN:
- [x] L-1 Docs (CHANGELOG: rate-limit/E2E Added + version Fixed; M1 10 done/2 open — disposition flagged for N-1; README skip)
- [x] L-2 Distill (5 obs, 2 candidate-grade, PROMOTE ZERO — obs-1 karen-REJECT as dup of BUILD rule 1; obs-3 held for wave-6; followup da242f6b queued)

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
