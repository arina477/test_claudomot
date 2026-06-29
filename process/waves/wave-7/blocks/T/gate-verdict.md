# Wave 7 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-block gate)
**Reviewed against:** process/waves/wave-7/blocks/T/review-artifacts.md + T-6/T-7/T-8 deliverables + B-2/B-6 source + live prod (api + web)
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The suite is honest for the layers it claims, and the core's first LIVE feature is proven end-to-end at the right level. T-1/T-2 unit tests assert user-observable outcomes, not mock trivia: the create-server service test asserts the mapped `ServerResponse` shape AND the captured insert payloads (`General`/position-0 category, `#general` text/non-private/category-linked channel), and `findServerDetail` asserts the 404-before-403 ordering and correct category→channel grouping (mutation-sane — flip the order or drop the innerJoin and these fail). T-3 contract coverage is complete on `CreateServerSchema`: parse-valid (trim) plus four parse-invalid cases (missing, empty, >100 chars, non-object) each asserting the typed `BadRequestException` (400), not a bare throw. T-8 (mandatory, security-tightened) is the strongest layer and the verdict's load-bearing evidence: I confirmed in source — not just in the deliverable's prose — that all three routes carry `@UseGuards(AuthGuard)`, `userId` is always derived from `req.session.getUserId()` (never body/params, so no IDOR via parameter substitution), `findMyServers` innerJoins `server_members` filtered by `user_id` (server-side membership scoping, not a client filter), and `findServerDetail` performs the exists-check first (404) then the member-check (403) to prevent existence fingerprinting; both the unauthorized-403 and the not-found-404 negatives are asserted, and unauthed→401 is live-verified (curl `/servers` → 401 just now). The access-control boundary for the core is genuinely enforced server-side, not UI-only. Web component tests use role/label queries throughout (no `getByTestId`), cover all four render states (loading/empty/loaded/error) plus the API-failure banner and client-side validation, satisfying the a11y-as-query-contract rule. No realtime path ships this wave, so the two-client rule does not apply and no false single-client realtime claim was made. T-7 skip is justified (not heavy; the 641kB bundle is a pre-existing advisory, not this wave). The remaining gaps are real but non-blocking and correctly do not hide a broken product, because the happy path is live-verified at C-2 (201 + list + `#general`) and the access boundary is live-verified (401/403): (1) transaction **rollback-on-failure** is asserted only at unit level with a mocked `db.transaction` that always invokes the callback — the negative atomicity path is unproven and can only be proven against real Postgres; (2) the new authenticated create-server flow has **no browser E2E** — the Playwright smoke suite covers only `/` and `/login` (env historically lacks a chrome channel); (3) **no visual-regression baseline/diff threshold** exists for the new rail/sidebar/modal — coverage is component-state-level only; (4) **no real-Postgres integration harness** (T-4 was satisfied by the live C-2 probe rather than an automated rollback-per-test harness — real evidence, but not repeatable in CI); (5) the **L-flag**: no persistent VERIFIED prod test fixture (C-2 verified email via the SuperTokens core admin API). All five are info/significant-severity items for V-2 triage and L capture, not gate blockers.

## Findings (routed to findings-aggregate → V-2 / L)
- {severity: significant, layer: T-4, description: "Transaction atomicity asserted only via mocked db.transaction (always invokes callback); rollback-on-partial-failure path unproven. Needs a real-Postgres integration test that forces a mid-transaction failure and asserts no orphaned server row. Tracked behind the no-local-PG limitation."}
- {severity: significant, layer: T-5, description: "New authenticated create-server flow (rail '+' → modal → POST → server selected → #general shown) has no browser E2E; Playwright smoke covers only / and /login. Covered today by component tests (mocked api) + live C-2 HTTP probe. Add an authenticated e2e once a chrome channel + verified fixture exist."}
- {severity: info, layer: T-6, description: "No visual-regression baseline/diff threshold for the new rail/sidebar/create-modal; coverage is component render-state level only. Acceptable for first slice; flag for visual-regression infra when it lands."}
- {severity: info, layer: T-8/L, description: "No persistent VERIFIED prod test fixture (C-2 verified email via SuperTokens core admin API). L-flag: record a verified fixture in command-center/testing/test-accounts.md."}
- {severity: info, layer: T-8, description: "No per-user server-creation rate limit (routes are session+verify gated; abuse requires a valid verified session). Later hardening."}

## Cascade
T-block cascade rules: APPROVED — no rework triggered, no downstream re-run required.
- **Stages that must re-run:** none
- **Stages that stay untouched:** all (T-1 … T-8)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
