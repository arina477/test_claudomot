# Wave 11 stage completion

> Seeded by wave-10 N-3. Active milestone: M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, in_progress).
> Promoted from todo at wave-10 N-1 (M2 closed FEATURE-COMPLETE; founder-pre-authorized M2 servers → M3 messaging pivot, 2026-06-29).
> Seed task: `4a2ad286-c068-406b-a2b3-4fee2a4d528b` — Provision a persistent verified prod test fixture.
> Bundled siblings: none (single-task bundle).
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [4a2ad286-c068-406b-a2b3-4fee2a4d528b]
>
> WHY THIS SEED (wave-10 L escalation + N-2 ordering):
> - Verified-prod fixture is ESCALATION-CRITICAL — 4 consecutive authed-feature waves (wave-7→10) ran without a persistent verified prod test account, forcing ad-hoc SuperTokens core admin email-verification each wave to verify any authed/session-gated route at C-2/T-8.
> - M3 (Real-time messaging) is entirely authed: Socket.IO /messaging namespace auth via SuperTokens cookie on WS upgrade, message CRUD, etc. Establishing the fixture FIRST de-risks every M3 authed/messaging wave's live verification. This is a test-infra/tech-debt enabler, NOT an M3 feature.
>
> CARRY-FORWARDS / NOTES (P-0/P-1 to honor):
> 1. **Likely non-UI / infra wave.** Provisioning a persistent verified prod test user + recording credentials in command-center/testing/test-accounts.md (gitignored). P-1 confirms D-block skip (no UI gap expected). P-0 walks the unassigned queue (depth 0 at wave-10 close).
> 2. **3 sibling-eligible M3 seed candidates remain as independent top-level seeds** for future M3 waves (NOT siblings of this seed): 46f16288 (browser-E2E create-server), 25523fb0 (PG-rollback test), d058283d (invite_code rotation). N-2 of a future wave picks them; they are test-infra/tech-debt, sequenced after the fixture.
> 3. **M3's actual messaging bundle is NOT yet decomposed.** Decomposition fires at a later N-1 once M3's queue has no seed candidate AND messaging scope is unshipped. The verified-fixture seed clears first.
> 4. **Credentials handling:** test-account secrets go in gitignored test-accounts.md only; never commit secrets (rule 2). Generate via SuperTokens core admin API / platform, never block on founder.

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
- [x] C-1 PR, CI & merge — PR #22 MERGED (squash, 57927b1); 7/7 CI green; 2 fix-up cycles cleared a gitleaks false positive via scoped .gitleaks.toml
- [x] C-2 Deploy & verify — deploy NOT NEEDED (config/docs/script-only diff); fixture proven live at provision-time (POST /servers 201); canary skipped

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
- [x] L-1 Docs
- [x] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
