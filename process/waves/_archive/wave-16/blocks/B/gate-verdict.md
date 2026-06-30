# Wave 16 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-16/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

This is a test-infra wave — one authenticated Playwright E2E plus the storageState
harness it needs — with zero product code, zero schema, zero new deps, so the B-1/B-2
contract/backend skips are correct and the whole gate reduces to: is the test REAL, is
it anti-flake, and is the fixture password kept out of the repo. All three pass on
load-bearing evidence, not on the deliverable's say-so.

**The E2E is genuinely testing the flow (not coverage theater).** Every selector the
spec drives was confirmed against the live components by source grep, not assumed:
`auth.setup.ts` performs a real sign-in through the `/login` form (`#email` / `#password`
/ "Sign In") and only persists storageState after the AuthGuard-gated `navigation
aria-label="Server rail"` becomes visible AND the URL is `/app` — so a failed login
cannot masquerade as success, and a missing-env-var case throws loudly rather than
silently skipping (AC2 + the loud-failure edge case). `create-server.spec.ts` then
opens the modal via the real `aria-label="Add a server"` button (ServerRail.tsx:197),
fills the real `#server-name-input` (CreateServerModal.tsx:290), clicks the real
"Create" submit, waits for the modal to hide, and asserts the new server in the rail by
its exact accessible name — which resolves because `ServerIconButton` renders
`aria-label={label}` with `label={s.name}` (ServerRail.tsx:58, 178). It then selects the
server (correctly handling that `appendServer` does not auto-select) and asserts the
auto-seeded `general` channel via `ChannelItem name={ch.name}` in the scoped
`channel-sidebar.first()` (ChannelSidebar.tsx:345). None of the assertions are
trivially-true; each targets a specific, real DOM node produced only by a successful
create round-trip against live Postgres.

**Anti-flake is satisfied** (AC3/AC4): web-first `expect(locator)` assertions only, zero
`page.waitForTimeout`/sleeps anywhere in the spec or setup, a unique `E2E ${Date.now()}`
name so prod's shared state cannot collide, assertions scoped to the just-created name
with `exact: true`, and `retries: process.env.CI ? 1 : 0` with a documented
first-attempt-green local run (4/4, twice, deterministic) — the CI retry is a safety net,
not a masking crutch.

**Security — fixture password is NOT committed** (the firing-grade check): the only
occurrence of `E2E_FIXTURE_PASSWORD` in any tracked file is `${{ secrets.E2E_FIXTURE_PASSWORD }}`
in ci.yml; no literal credential appears in the branch diff or in `auth.setup.ts` (creds
read from `process.env`); `command-center/testing/test-accounts.md` is untracked; and the
live-session storageState `e2e/.auth/` is gitignored (apps/web/.gitignore:1-2) — confirmed
not in `git ls-files`.

**Harness soundness + scope hygiene:** the 3-project split keeps `chromium-smoke`
unauthenticated (no storageState, smoke spec isolated by testMatch/testIgnore), so the
existing unauthenticated smoke is not regressed (AC5); CI secrets are wired into the e2e
job env correctly. The biome.json change only re-formats one key and adds ignore globs for
the three gitignored Playwright artifact dirs (biome runs vcs:none, so explicit ignores are
needed) — appropriate. The 9 biome warnings are byte-identical on `main` (53→56 files, the
3 new files add 0 warnings), are warnings not errors, and `pnpm lint` (`biome ci .`) exits
0; B-5 correctly left this unrelated wave-14 tech-debt out of scope rather than
opportunistically touching it. Only `apps/web/{.gitignore,e2e/,playwright.config.ts}`
changed under `apps/` — no product source touched. Happy-path-only, no gold-plating
(empty-name validation correctly deferred per the spec). All five acceptance criteria and
the loud-failure edge case are met.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
