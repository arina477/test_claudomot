# Wave 87 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId head-tester-w87-t9)
**Reviewed against:** process/waves/wave-87/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
Coverage is honest and adequate for what the wave actually touched — the single production file `apps/api/src/servers/servers.service.ts` (both join paths + `resolveDefaultRoleId`). I did not take the stage summaries on faith; I verified the load-bearing claims against primary sources. **T-4 integration evidence is real and EXECUTED, not merely authored:** `apps/api/test/integration/join-default-role.integration.spec.ts` is a genuine pg-harness test (harness imported first to bind the lazy db proxy to the test DB, no DB mocking, seeds via the real `createServer` path), and CI provisions `postgres:16` + `DATABASE_URL_TEST` (ci.yml:39-46), so `describe.skipIf(SKIP)` did NOT skip — the required `test` job returned SUCCESS on merge commit 509aae84 (confirmed via `gh pr view 108`), meaning all four cases (public-join stamp, invite-join stamp, zero-default NULL fallback, re-join role preservation) ran green against live Postgres with strict `.toBe`/`.toBeNull`/exactly-one-row assertions — no weakened matchers, no mock-the-system-under-test. **The unit layer is not coverage theater:** the AC tests capture the actual membership insert values (`capturedValues`) and assert the exact `role_id` written (AC1 `role-default-1`, AC3 `null`, AC4 no reset UPDATE across both public and invite branches) — state-change assertions, not mock-call-counts; the `test` job is green on both 1d2ef9df (828 api) and 509aae84. Mutation-sanity holds structurally: reverting the production stamp to `role_id: NULL` reddens AC1/AC2. **The skips are all legitimate.** T-3 contract: the request/response shape (`{ serverId }`) is unchanged and no Zod/shared-type/SDK surface moved — nothing to contract-test. T-5 e2e / T-6 layout: no UI or user-visible behavior change (a member with the all-false default role and a NULL-role member render and flow identically). T-7 perf: one indexed `is_default` lookup inside the existing join transaction — no budget at risk. **The T-8 security skip is defensible for this RBAC-adjacent change:** the reasoning holds because the stamped role is the server's existing all-permission-flags-false default 'Member' role, which is provably ≤ NULL at the RBAC layer — an all-false role cannot grant anything a NULL role didn't, so there is no privilege delta and no escalation vector; the P-4 security-scope-tightened gate correctly did not fire (`wave_touches ∩ {auth, sessions, csrf, rate-limit, user-creation} = ∅`). Evidence cites exactly the surfaces the wave touched — no evidence-cites-fewer-surfaces gap. Both open findings are correctly non-blocking: the pre-existing e2e sign-in flake (`delete-any-message.spec.ts:53`) is confirmed FAILURE on #107 and #108 but is not a branch-protection-required check and is unrelated to wave-87 (rule-11 class, routed to V-2); the educator-analytics "No role" bucket emptying is a correct downstream consequence of the new invariant, non-breaking (breakdown still reconciles to memberCount). Zero critical/high findings.

## Cascade

T-block cascade rules — no rework, so no downstream re-runs.

- **Stages that must re-run after the above:** none
- **Stages that stay untouched:** T-1, T-2, T-3, T-4, T-5, T-6, T-7, T-8 (all final)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
