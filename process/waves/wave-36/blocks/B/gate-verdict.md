# Wave 36 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-wave36-b6-p1)
**Reviewed against:** process/waves/wave-36/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
This is a test-hardening wave where the tests ARE the product, so the gate turns on test honesty and provable CI execution — both hold. The two integration specs import the REAL system-under-test (`ServersService` from src/servers/servers.service.ts and `AccountDataService` from src/privacy/account-data.service.ts), carry NO `vi.mock` on those SUT modules, seed real rows through the pg-harness fixtures, set `profile_visibility` via a real `harnessQuery` UPDATE, and assert on genuine row counts — the one failure mode that voids this wave (mock-the-SUT test-theater) is absent. `pg-harness.ts` sets `DATABASE_URL=DATABASE_URL_TEST` at module-eval time so the lazy db singleton resolves to the real test Postgres, and applies drizzle migrations fail-loud. The wave-17/24 false-green lesson is provably closed end-to-end: ci.yml provisions a `postgres:16` service and sets `DATABASE_URL_TEST` (ci.yml:46) then runs `pnpm test:ci` (ci.yml:53); turbo.json `test:ci` declares `env:["DATABASE_URL_TEST"]` for passthrough; api `test:ci` explicitly appends `vitest run --config vitest.integration.config.ts`; that config globs `test/integration/**/*.spec.ts` with `fileParallelism:false`; each spec's `skipIf(!DATABASE_URL_TEST)` therefore does NOT skip in CI. Silent-skip-as-green is further defeated by the `countRows>=2` sanity assertions plus the before/after roster-length delta (2→1) in the visibility spec. Test correctness is faithful to the ACs: the visibility spec asserts nobody-hiding (A absent from B's roster), caller-sees-self (A present in A's own roster despite `nobody`), and everyone/server-members visibility; the IDOR spec asserts self-scoping (A's data only, B's `SERVER_A` never leaks into A→B or B→A, export===get); the controller spec asserts enum-400 short-circuits BEFORE any service call (`updatePrivacy` not called) and derives userId from session not body; the beforeSend unit test replicates the real instrument.ts scrub verbatim (verified field-for-field against src/instrument.ts). Non-test production changes are minimal and behavior-neutral: `toUiVisibility` gained only the `export` keyword (body unchanged), PrivacyPage/TermsPage moved the stub date 2024→2026, product-decisions gained a docs note. Commit discipline holds: every claimed_task_id has a citing commit (622a7bf3 tests, b7feab30 date, 73e96a9d docs), each commit cites one task_id, and the api+web test-file span under 622a7bf3 is within that single spec block. The B-5 server-roles failure is a pre-existing full-suite-parallel flake in a file untouched by wave-36 (24/24 green isolated, absent from the diff) — legitimately excluded.

## Accepted-debt note (non-blocking, low severity)
- **beforeSend replica drift risk:** the Sentry `beforeSend` scrub is inlined inside `Sentry.init()` in src/instrument.ts and is not exported, so privacy.service.spec.ts tests a verbatim REPLICA rather than the real function. Confirmed the replica currently matches the source field-for-field (user.{email,username,ip_address} + request.{data,cookies}, mutate-in-place, return event). The spec documents the sync obligation ("If instrument.ts ever exports beforeSend, this replica should be removed"). Acceptable for a self-use MVP; a future cheap hardening would be to export `beforeSend` from instrument.ts and import it directly, eliminating the drift surface. Not rework-worthy.

## Escalation
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — production-bug review (recorded by orchestrator)
**Reviewer:** code-reviewer on `git diff main...HEAD`. **Result: production diff CLEAN, no Critical/High.** (Only production changes: `export` on pure toUiVisibility, stub date 2024→2026 — both verified safe/isolated.)
**2 Medium test-quality findings — FIXED in-branch** (this wave's deliverable IS the tests, so gaps in the security-boundary coverage warranted the cheap fix):
- **M1 (fixed):** beforeSend was a hand-copied replica (zero drift protection for the PII-scrub AC) → extracted as exported `scrubPii` in instrument.ts; spec now imports the REAL SUT. Commit on branch.
- **M2 (fixed):** controller-layer IDOR defense (getAccountData/exportAccountData deriving userId from session, not attacker input) was untested → added controller session-scoping tests. Commit on branch.
- Low (redundant IDOR structural-proof test) → accepted-debt (harmless).
Re-verified: repo typecheck 4/4 clean, api unit 507/507 pass. No critical/high existed → no re-review iteration needed.

## Phase 2 — commit-discipline (Action 6, multi-spec) — PASS
Commits cite single task_ids: 622a7bf3 (tests + B-6 fixups), b7feab30 (stub date), 73e96a9d (docs). Every claimed_task_id has ≥1 commit.

## Final verdict: APPROVE — B-block gate-passed.
