# T-5 — E2E (wave-16) — THE layer for this wave

**Pattern A — CI-verified (the deliverable already ran 4/4 in the C-1 e2e job + locally).** Active re-execution
NOT required: the wave's entire purpose is this E2E, and CI ran it against live prod at C-1. T-5's job here is to
RATIFY that it is a REAL test and audit coverage + anti-flake discipline.

## Scenario → acceptance-criterion trace
Single happy-path scenario (documented wave scope; edge cases deferred):

| id | criterion_ref | verdict | evidence |
|---|---|---|---|
| S1 | AC1 — authed fixture creates a server and sees #general | PASS | C-1 e2e job 84265419084: "Running 4 tests using 2 workers" → "4 passed" vs live prod |
| S2 | AC2 — sign-in via real /login persists session (setup) | PASS | auth.setup.ts asserts Server-rail visible + URL /app before storageState save |
| (edge) | loud-fail on missing fixture creds | PASS | auth.setup.ts throws on missing E2E_FIXTURE_* (no silent skip) |

## Ratification — is it a REAL test? (not coverage theater)
Audited the source directly (`apps/web/e2e/auth.setup.ts`, `create-server.spec.ts`, `playwright.config.ts`):

1. **Genuine sign-in.** `auth.setup.ts` drives the real `/login` form (`#email`/`#password`/"Sign In"), then
   persists storageState ONLY after the AuthGuard-gated `navigation[aria-label="Server rail"]` is visible AND
   URL is `/app`. A failed login cannot masquerade as success; missing env vars THROW (fails loud, no silent skip).
2. **Genuine create.** `create-server.spec.ts` opens the modal via the real `button[aria-label="Add a server"]`,
   fills the real `#server-name-input`, clicks the real "Create" submit, and waits for `modal.toBeHidden()` — a
   real round-trip through `POST /servers` against live Postgres (atomic owner-member + General category + #general seed).
3. **Real-selector assertions, not trivia.** New server asserted in the rail by its EXACT accessible name
   (`getByRole('button', { name: serverName, exact: true })` — resolves via `aria-label={s.name}`); then SELECTED
   (correctly handling that `appendServer` does not auto-select); then `#general` asserted via scoped
   `getByTestId('channel-sidebar').first().getByText('general', { exact: true })`. Every assertion targets a
   specific DOM node that exists ONLY after a successful create. None are trivially-true.
   **Mutation-sanity:** a real bug (create fails / #general not seeded / rail not updated) makes the test fail —
   the verdict to "what would have to be broken for this to fail?" is a real product break, not "nothing."

This satisfies two-client-isn't-needed here (create-server is a single-actor flow, not a realtime fan-out path —
the two-client rule applies to delivery/realtime, which this wave does not exercise).

## Anti-flake audit (honored)
- **Web-first assertions only** (`expect(locator).toBeVisible/toBeHidden`); Playwright auto-waits.
- **Zero sleeps** — no `page.waitForTimeout` anywhere in spec or setup (grep-confirmed).
- **Unique name per run** (`E2E ${Date.now()}`) → prod's shared state cannot collide; no clean/seeded-DB assumption.
- **Assertions scoped to the just-created name** with `exact: true`.
- **`retries: process.env.CI ? 1 : 0`** — first-attempt-green locally (deterministic, documented 4/4 twice);
  the CI single-retry is a safety net, NOT a flaky-masking crutch.

## Coverage adequacy
Happy-path create-server is the DOCUMENTED scope (P-2 spec). Edge cases (empty-name validation, API-failure
banner, max-servers, duplicate name) are deferred — correctly, not a gap this wave owns. This closes the
long-carried "no Playwright e2e on the authed create-server flow" V-2 gap (wave-7 V-3 carry).

```yaml
test_pattern: ci-verified
skipped: false
testers_spawned: 0   # Pattern A — CI already executed the swarm-equivalent (4/4 in e2e job); ratification not re-execution
scenarios:
  - {id: S1, criterion_ref: AC1-create-and-see-general, verdict: PASS, evidence_path: "C-1 e2e job 84265419084 (4 passed vs live prod)"}
  - {id: S2, criterion_ref: AC2-real-login-persists-session, verdict: PASS, evidence_path: "auth.setup.ts assertions"}
flakes_observed: []
fix_up_cycles: 0
findings: []
head_signoff:
  verdict: APPROVED
  stage: T-5
  failed_checks: []
  rationale: >-
    RATIFIED REAL. The E2E signs in genuinely (real /login, storageState only after AuthGuard-gated rail +
    /app URL, throws on missing creds), creates genuinely (real modal → POST /servers → live Postgres), and
    asserts against real selectors (exact accessible name in the rail + scoped #general) — every assertion is
    mutation-sane (a real create/seed/rail break fails it). Anti-flake fully honored: web-first only, zero
    sleeps, unique-name-per-run, exact-scoped assertions, first-attempt-green (retries are a net not a crutch).
    Passed 4/4 in the CI e2e job against live prod AND locally. Coverage = documented happy-path scope; edges
    correctly deferred. This is the wave's deliverable and it is verified-real + CI-green.
  next_action: PROCEED_TO_T-6
```
