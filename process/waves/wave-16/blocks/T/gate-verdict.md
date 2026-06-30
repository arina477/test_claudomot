# Wave 16 — T-9 Verdict

**Reviewer:** head-tester (T-block owner spawn)
**Reviewed against:** process/waves/wave-16/blocks/T/review-artifacts.md + findings-aggregate.md + T-1..T-8 deliverables
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
Wave-16 is a test-infra wave whose ENTIRE deliverable is one authed create-server Playwright E2E plus the
storageState harness it needs — zero product code, zero schema, zero new dep — already merged LIVE (PR#28,
6982ffe) and already passed 4/4 in the CI `e2e` job against live prod. The T-block therefore reduces to three
honest questions, all answered on load-bearing evidence (source-audited, not deliverable say-so):

**(1) Is the test REAL?** Yes — ratified at T-5. `auth.setup.ts` signs in through the real `/login` form and
persists storageState only after the AuthGuard-gated Server-rail is visible AND URL is `/app` (a failed login
cannot fake success; missing creds THROW — fails loud). `create-server.spec.ts` opens the real modal, fills the
real `#server-name-input`, submits "Create" (a real `POST /servers` round-trip against live Postgres with atomic
#general seeding), then asserts the new server by its EXACT accessible name in the rail, selects it (correctly
not assuming auto-select), and asserts the auto-seeded `#general` in the scoped channel sidebar. Every assertion
is mutation-sane: a real product break (create fails / #general not seeded / rail not updated) fails the test.
Not coverage theater. (Two-client rule is N/A — create-server is single-actor, not a realtime delivery path.)

**(2) Is it anti-flake?** Yes — web-first assertions only, zero `page.waitForTimeout`/sleeps (grep-confirmed),
unique `E2E ${Date.now()}` name so prod's shared state cannot collide, assertions scoped to the just-created name
with `exact: true`, and `retries: CI?1:0` with documented first-attempt-green local runs — the CI retry is a
safety net, not a flaky-masking crutch.

**(3) Is the fixture credential kept safe?** Yes — ratified at T-8. The fixture password exists only as a masked
GitHub Actions secret (`${{ secrets.E2E_FIXTURE_PASSWORD }}`; gitleaks green at C-1; `auth.setup.ts` reads from
`process.env`); the live-session storageState `e2e/.auth/` is gitignored (`git check-ignore` confirms; not in
`git ls-files`); and there is no `upload-artifact` or `pull_request_target` path that could leak the secret or
the live cookie.

Static (T-1) + unit (T-2) are CI-verified green (run 28437054848). T-3/T-4/T-6/T-7 are HONEST skips — no
contract, schema, UI, or perf surface was touched; each skip is recorded with its reason rather than silently
dropped. The journey map's create-server flow is annotated now-E2E-covered (annotation-only regen — the flow is
structurally unchanged so no crawl was warranted), closing the long-carried wave-7 V-3 / T-9-significant gap.

**Coverage is honestly scoped:** happy-path create-server is the documented P-2 scope; edge cases (empty-name,
API-failure banner, max-servers) are deferred, not hidden. Zero wave-16-originated findings. Carries recorded for
V-2 visibility, all non-blocking: B-6 M-1 (broad authed testMatch — intended), M-3 (prod test-server accumulation
w/o teardown until DELETE /servers/:id ships — = the P-4 Gemini NOT-MATERIAL item), L-1..L-4, and the 9 pre-existing
wave-14 biome WARNINGS (not errors; on main; do not fail CI). None of these is a green-suite-hiding-a-broken-product
risk — the suite is honest.

## Cascade
- **Stages that must re-run:** none (APPROVED).
- **Stages untouched:** all.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
