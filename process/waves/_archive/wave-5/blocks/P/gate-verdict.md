# Wave 5 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, P-4 Phase 1)
**Reviewed against:** process/waves/wave-5/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-5 is a faithful, correctly-scoped execution of the founder's 2026-06-29 "harden-then-core" ruling: it finishes M1's engineering hardening with the two named priorities (auth rate-limiting and avatar-storage completion) plus the deferred ops/CI follow-ups folded in, and correctly excludes the Resend-domain item (pure founder-DNS, no code) so M1 closes on engineering alone. All six spec blocks carry falsifiable, observable acceptance criteria, each mapped to a file-level P-3 step and a valid specialist; non-happy states (creds-pending 503, limit-window reset, all-jobs-green, brain-PR-flow-still-works) are enumerated per block. The two load-bearing architecture claims hold against the locked library: rate-limiting is `@nestjs/throttler` 10/min on auth endpoints with an in-memory store (matches `_library.md` L113), with Redis correctly held to H2 (L43/L423) — no premature scale infra. The credential-gated avatar block is decoupled so the other five specs ship independently and do not block on the pending Railway Bucket creds, exactly as P-0/P-1 directed. The throttle-in-front-of-SuperTokens-mounted-`/auth` approach is sound (app-level guard / global `APP_GUARD` enforces ahead of the SDK-mounted middleware), branch-protection via the GitHub API does not lock out the brain's PR→squash-merge flow (the AC names that edge-case explicitly), and the ci.yml double-touch (node-20 + E2E) is flagged for serialization in P-3. The multi-spec floor is met (6 ≥ 6) and the RESCOPE-AUTO-MERGE was justified — rate-limit alone (~300 LOC) is below the single-spec floor. One soft note (below) is recorded but is not load-bearing and does not gate.

## Notes (non-blocking; carry to B/C/T agent selection)
- **Specialist-name drift (soft):** P-3 routes the CI-E2E spec (c51589cd) to `test-automator`, which is NOT listed in `command-center/AGENTS.md`. The catalog provides `ui-comprehensive-tester` (Playwright live-site verification) and `head-tester` (T-block gate); the ci.yml job authoring sits with `devops-engineer`/`head-ci-cd`. The spec body and approach are correct and agent selection finalizes at the B/C/T blocks, so this is a routing-name note, not a spec defect. Resolve at B/C by substituting the closest catalog match (`ui-comprehensive-tester` for the smoke spec + `devops-engineer` for the CI job) per always-on rule 11, and noting the swap.
- **Citation provenance:** P-0 flagged the 839af17f legacy "wave-2/wave-3 T-8" stamp; the spec head no longer carries the stale literal (ACs cite the architecture mandate directly). Resolved.

## Security-scope tightened gate
APPLIES — wave_touches ∩ {auth, rate-limit, sessions} ≠ ∅ (839af17f is the auth rate-limit surface). T-8 Security is mandatory this wave and Phase 2 carries the tightened gate semantics (≥2 Phase-2 iterations if the first Phase-2 pass returns BLOCK with >2 medium-or-higher findings). Recorded for Phase 2 + T-block.

## Stage-exit checklist (Phase 1)
- P-0 frame: problem-framer + ceo-reviewer both PROCEED, reconciled; cause-layer fixes to verified gaps; mapped to M1. PASS.
- P-1 decompose: RESCOPE-AUTO-MERGE justified (sub-floor single spec); 6-spec bundle; design_gap_flag=false; no in-bundle dep on unbuilt out-of-bundle task. PASS.
- P-2 spec: 6 specs, each AC independently verifiable; empty/loading/error/offline + edge-cases enumerated per block; non-goals (Resend-domain excluded, no Redis) explicit; auth surface flagged for tightened gate; full contract embedded as YAML head of the primary task's description (verified via DB read). PASS.
- P-3 plan: reuses locked architecture (throttler in-memory, no parallel path; presigned POST content-length-range for size enforcement); introduces no MVP-unneeded infra (no Redis/multi-replica/billing); each step maps to a bundle task + observable artifact; ci.yml coordination flagged. PASS.

## Cascade
N/A — APPROVED, no rework.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini (merged) — PASS
- **Karen: APPROVE** — all 6 per-task source claims VERIFIED/plausible (throttler not yet a dep; presign exists w/ real 503 + genuine no-ContentLengthRange gap; health version fallback stale 0.1.0 vs pkg 0.0.1; ci.yml actions@v4 bumpable; 5 CI jobs for branch-protection; no playwright yet). No gold-plating (Redis avoided per arch). CARRY: (1) test-automator NOT in AGENTS.md → use ui-comprehensive-tester + devops-engineer (rule 11). (2) HIGH RISK — rate-limit must intercept SuperTokens /auth/* (SDK Express middleware forRoutes('*')); route-level @Throttle MISSES it → use global APP_GUARD OR Express limiter ordered BEFORE SupertokensMiddleware; 429 probe → /auth/signin. (3) ci.yml double-touch (node-20+E2E) serialize/single-owner.
- **jenny: APPROVE** — 6/6 MATCH; faithful to the 2026-06-29 founder ruling (exactly the 2 priorities + 4 folded-in; Resend-domain correctly excluded). No drift, no M2 pull-forward. In-memory throttler scaling-limit + avatar creds + Resend-domain = documented deferrals.
- **Gemini: CONCERN (triaged NON-MATERIAL)** — in-memory throttler ineffective on horizontal scaling. Documented H2 deferral (_library L423/L43; single-pod MVP); NOT a defect. Logged, proceed.
GATE: PASS → B-block. Security-tightened gate APPLIES (rate-limit auth surface) → T-8 mandatory. CARRY to B: rate-limit-middleware-ordering (the load-bearing detail); avatar credential-gated (founder bucket); test-automator swap; ci.yml coord.
