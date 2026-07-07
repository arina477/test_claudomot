# Wave 74 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, Phase 1 gate reviewer)
**Reviewed against:** process/waves/wave-74/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Coverage is honest and the load-bearing claim is behavior-proven, not code-read. I independently verified the **binding verify-gate-reads THROWS test** in `apps/api/src/billing/entitlements.service.spec.ts` (Group B, l.121-190): it stubs `resolveCreateGateForOwner` to return `maxServersPerOwner=0, currentServerCount=1` and asserts `createServer(...)` rejects with `ForbiddenException` — a genuinely mutation-sane assertion that can only pass if `createServer` actually reads the entitlement and enforces it (deleting the gate branch fails it), plus a boundary case (cap=1,count=1→throws) and a non-regressive case (cap=100_000,count=0→succeeds, ForbiddenException explicitly asserted-not-thrown). This is not coverage theater. The gate source (`apps/api/src/servers/servers.service.ts` l.82-87) confirms the enforced path: `currentServerCount >= caps.maxServersPerOwner → throw ForbiddenException`. Integration honesty holds: `create-server-rollback.spec.ts` runs against **real Postgres** via `pg-harness` (sets `DATABASE_URL_TEST`, applies real migrations, wraps `pool.connect()` to inject a query fault inside a live transaction so a real ROLLBACK fires leaving zero orphan rows) — the DB is not mocked; only the outermost EntitlementsService dependency is stubbed permissively so the rollback mechanism, not the gate, is the unit under test. I confirmed CI provides a `postgres:16` service + `DATABASE_URL_TEST` (`.github/workflows/ci.yml` l.38-46, 79-97), so `SKIP=false` and the integration test genuinely ran — it was not silently skipped (the suite emits an explicit skip message locally rather than a false-green pass). The **free-cap regression was honestly caught and genuinely fixed**: T-5 LIVE verification found the placeholder cap=100 blocked a live 646-server owner (Fixture A) from createServer, the CI/unit layers missed it (fresh DB with no 100+-server owner) — an honest admission of a layer blind spot, not a paper-over. Fix commit d79dd18 (PR #92) is real; its diff matches the claim (free 100→100_000, server_pro→200_000, school→500_000), and the source carries an explicit NON-RESTRICTIVE guarantee comment naming 646 as the observed max (646 < 100_000, 155×). The non-regression claim is sound and was re-verified — the authed-create-server e2e re-ran GREEN on the fixed prod (d79dd18). The value-independent restrictive-cap-THROWS test is unaffected by the cap-value change, so the fix did not weaken the enforcement proof. T-8 security disposition is correct: the createServer gate is server-creation authz (security_scope_flag=false — no new auth/payment surface, no new endpoint/PII/Stripe), ownerId is session-derived (no-IDOR), fail-closed on resolve error, secret-grep 0. T-6/T-7 skips are justified: wave_type=backend, B-3 frontend skipped (no new UI), small additive change (not heavy). The single carried finding (boundary-TOCTOU: concurrent create at the cap boundary could exceed by 1) is correctly dispositioned to V-2 — genuinely unreachable at cap=100_000 and only becomes live when real paid-tier caps drop low in a future charging slice; deferring it does not hide a shippable-today defect. No finding is mis-dispositioned; no evidence reads as thin or fabricated.

## Escalation
N/A (APPROVED).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
