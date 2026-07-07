# Wave 76 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, Phase-1 gate)
**Reviewed against:** process/waves/wave-76/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
Both reviewers ran independently and APPROVED against the DEPLOYED merge d8d4d9e6 (not the diff), and I probed the load-bearing claims myself rather than accept a clean verdict at face value. Karen's 6/6 source-claim verification (guard delegates to `RbacService.can`, routes live 401-not-404, guard composition closes the wave-75 leak, analytics counts-only/no-PII/soft-delete-excluded, deploy hash, real frontend wiring) and jenny's AC-by-AC semantic check across all 4 spec blocks (composed-authz matrix proven live with two real fixtures incl. an educator grant/revoke, distinct 403 messages proving the composition is not a collapsed gate, leak closed, analytics key-exact vs `ServerAnalyticsSchema`, console gated + 4 states) genuinely cover the spec ACs against live state — this is acceptance-by-behavior, not acceptance-by-assertion. My independent probes returned 401 on `/analytics` + `/status` unauth, 404 on the nonexistent sibling (distinguishing authz from a route miss), and 401 on an unknown well-formed UUID (auth precedes existence-probe). My independent source read of d8d4d9e6 confirmed the two claims the unauth probes cannot reach: (a) the leak-close (ecf79f4a) is real — `@Get('status')` carries the identical `@UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)` stack as `/analytics`, so a non-owner/non-educator now hits `EducatorAccessGuard`; and (b) the educator predicate is delegated end-to-end — the guard's only authz query is `rbacService.can(userId, serverId, 'manage_assignments')` with session-derived `userId` (no IDOR), module imports `RbacModule`. V-2's 0-blocking classification is correct: the two LOW items are a spec-reconcile and a spec-gap follow-up (neither a misclassified blocker), and the "Educators regex heuristic" is correctly noise (display-only over an already-safe aggregate, zero authz/leak impact). No finding was closed by weakening a test or loosening an assertion — the T-8 crown-jewel matrix and leak-close were proven live, and the tester root-caused a verification-403-vs-authz-403 confusion to avoid a false-green. Fast-fix queue is empty → Phase 2 skips.

## Judgment on the two LOW non-blocking items
- **404-vs-403 unknown-server (T-4 / jenny-F1 / karen-N1):** Non-blocking, correctly routed to spec-reconcile (NOT code-fix). `EntitlementGuard` safe-defaults an unknown server to free-tier and 403s before any existence probe; `RbacService.can` also default-denies a non-existent server. The behavior is deterministic, reproducible, and security-positive (no server-existence oracle) — deny-is-deny, stronger than the specced 404, and consistent with the primary spec block's own "non-member → 403" AC. Reconcile the two spec ACs 404→403; do not touch shipped code. The billing-route 404 internal-inconsistency note is informational and out of wave scope.
- **Mid-session upgrade needs reload (T-5 / jenny-F2):** Non-blocking spec-GAP, not an AC failure. AC d81e266d-1 governs the gating predicate on load, which is proven correct (fresh loads always resolve; server-side authz is unaffected). The spec never specified a live re-fetch on an external mid-session tier change — an unanticipated UX path (upgrade in an already-open tab requires one refresh). Correctly a V-2 follow-up task, not a rework.

## Noise call
- **Educators regex heuristic (karen-N2 / jenny):** Correctly classified as noise. Display-only split of an already-authorized aggregate via role-name regex; cannot leak data and has zero authz impact — the real authz predicate uses the `manage_assignments` capability, independent of this UI string-match. No AC governs client sub-labeling of an aggregate.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
