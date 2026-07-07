# Wave 75 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, gate reviewer)
**Reviewed against:** process/waves/wave-75/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both reviewers ran and APPROVE against the DEPLOYED state (merge `3b94e276` LIVE), not the diff — this is acceptance-by-behavior, not acceptance-by-assertion. karen verified 6/6 source-claims against the merge tree plus live curl probes, using a control-404 on an unknown route as load-bearing counter-evidence that the three 401s are real routes behind an active AuthGuard (not a catch-all). jenny exercised all 17 ACs across the 3 spec blocks LIVE via SuperTokens Bearer auth (owner 200 / non-owner 403 / unauth 401 / invalid 400 / unknown 404; educator gate flips 403→200 on school; panel refresh/error/mock-label confirmed in the shipped bundle), found zero spec-DRIFT, and corroborated the T-5 M9 success metric (free→server_pro in-place refresh, persisted across close+reopen). I did not accept the clean verdicts at face value: I independently re-read `billing.controller.ts`, `entitlement.guard.ts`, `educator-tools.controller.ts`, `entitlements.service.ts`, and `mock-billing.provider.ts` on tree `3b94e276` and confirmed each load-bearing claim first-hand — the owner-check-before-write ordering (validate → 404 → 403 → provider write) that makes the tier mutation IDOR-safe; AuthGuard on all three endpoints with auth-before-authz on educator-tools; TIER_CAPS canonical byte-exact with the `free.maxServersPerOwner=100_000` wave-74 non-regression guard intact; and `onConflictDoUpdate` on `subscriptions.server_id` for one-row-per-server upsert. V-2's 0-blocking classification is correct and every finding carries a severity + disposition. Fast-fix queue is empty → Phase 2 skips; Phase-1 APPROVED issued.

## Judgment on the two downgraded mediums

**(a) educator-tools no owner/member check (T8-F1 / jenny-G1) — correctly non-blocking THIS wave.** Verified first-hand on `3b94e276`: `getStatus` returns only `{ serverId, enabled: true }` — a GET, boolean-only, no PII, no mutation, no server-scoped data. The controller's own header states it "Models ONLY the entitlement enforcement... not the actual educator tools (those stay fenced for a later slice)," and the guard documents the deliberate gap ("does NOT perform an owner/member check... compose with an owner/member check separately when the endpoint requires one"). Spec block 2's AC required only the tier flag-gate, which passes — so this is a spec-GAP in the authz SCOPE of a stub, not spec-drift and not a shipped IDOR (no confidential data leaks; tier-status boolean is low-sensitivity). It is genuinely load-bearing for the fenced real tools, and V-2 routed it to a real follow-up task (ecf79f4a, wave_id NULL → seedable) with the owner/member gate named as a hard prerequisite. Correct disposition.

**(b) pg-harness upsert test uncommitted/unrun (T4-F2 / karen) — acceptable, NOT green-by-suppression.** This is the critical no-suppression check, and it passes: no finding was closed by disabling a test or loosening an assertion. The real-Postgres `ON CONFLICT` dedup is proven LIVE end-to-end (T-5: free→server_pro→school, exactly one effective tier per server, persisted across close+reopen), so the behavior is demonstrated — only the *automated* real-DB regression guard is deferred, and honestly (skipIf(!DATABASE_URL_TEST) prevents a false-pass; the deferral is disclosed as T4-F2, not silent). The mechanism ships working; the missing artifact is a durability net, tracked on PR #94 + task ab75b8d8. I confirmed the reviewers' own nuance — the spec file is authored-but-not-persisted (absent from the merge tree and disk), which "authored" slightly overstates — but this is disclosed, so it is a tracked follow-up, not a silent gap. Non-blocking is correct. T1-cast (test-only idiom) and jenny-G2 (hardcoded panel prices, neutralized by the mock disclosure and inherent to the fenced real-Stripe slice) are correctly classified as noise.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
