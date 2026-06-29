# Wave 6 stage completion

**Active milestone:** M1 — Foundation: app shell, auth & profiles (`5a6efc9e-9de7-4594-a75d-d45e30d9a417`, in_progress)
**Seed task:** `da242f6b-bce7-49c7-a7cc-69ca4849fc6e` — Add a CI job that boots the compiled API (node dist/src/main.js) and curls /health
**Bundled siblings:** (none — single-task bundle)
**Claimed task ids (B-0 claims this batch):** [da242f6b]
**Theme:** Finish M1's last engineering loose end — compiled-dist boot probe (guards against the version.ts-style dist/runtime path regression that crashed wave-5's first C-2 deploy). Likely infra/CI-only wave (D-block skip candidate).

> **PENDING FOUNDER DEPENDENCIES (still open under M1, NOT this wave's scope — track + remind):**
> - `84e09891` — Set Railway Bucket creds + verify avatar upload live (in_progress) — needs founder **Railway Bucket creds**; presign path deployed + 503-graceful, no regression.
> - `a1299e88` — Verify a Resend domain for transactional email (todo) — needs founder **DNS** action.
> M1 cannot reach `done` until both terminalize. After this wave ships da242f6b, a future N-1 will face the M1 closure block — at that point the founder completes the ops actions OR explicitly cancels/defers them (a roadmap-planning call) to unblock M1→done and promote M2 (servers/channels). Per founder "harden-then-core" direction.

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [ ] P-1 Decompose
- [ ] P-2 Spec
- [ ] P-3 Plan
- [ ] P-4 Gate

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
