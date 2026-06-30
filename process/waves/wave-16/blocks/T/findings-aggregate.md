# Wave 16 — T-block findings aggregate

> Canonical V-2 input. Wave-16 is a test-infra wave whose entire deliverable IS a test
> (authed create-server Playwright E2E), merged LIVE in PR#28 (6982ffe) and passed 4/4
> in the CI `e2e` job against live prod. No product code, no schema, no new dep.

## Wave-16-originated findings

**None.** No regressions, no coverage gaps introduced by this wave. The wave ADDS coverage
(closes the long-standing "no Playwright e2e on the authed create-server flow" V-2 gap
carried since wave-7 V-3).

## Known-item carries (NOT wave-16 findings — recorded for V-2 visibility)

### B-6 Medium (accepted, non-blocking)
- **M-1 — broad `chromium-authed` testMatch.** `testMatch: /.*\.spec\.ts/` + `testIgnore: /smoke\.spec\.ts/`
  auto-enrolls every future authed `*.spec.ts` into the authed project. INTENDED (future authed specs inherit
  the storageState harness). Watch item: a future UNAUTHENTICATED non-smoke spec would be mis-enrolled;
  revisit when a second unauthenticated route spec is added. non-blocking.
- **M-3 — prod test-server accumulation.** Each run creates a real `E2E <ts>` server row in prod Postgres with
  no teardown (no `DELETE /servers/:id` yet; no max-servers limit). SAME item P-4 Gemini triaged NOT-MATERIAL.
  Unique-name-per-run is correct (no collision) but rows accumulate. Follow-up: add teardown when DELETE ships. non-blocking, deferred.

### B-6 Low (accepted)
- **L-1 — `channel-sidebar` `.first()` DOM-order coupling.** ChannelSidebar mounted twice (desktop inline + mobile
  drawer), both `data-testid="channel-sidebar"`; spec scopes to `.first()` (desktop, rendered first at desktop
  viewport). Fails LOUD (not false-pass) if DOM order changes. Accepted.
- **L-2 — stale comment** in a test file. Cosmetic. Accepted.
- **L-3 — biome.json change is clean** (artifact-ignore globs + one-key reformat; no rule change; biome vcs:none so
  explicit ignores for the 3 gitignored Playwright artifact dirs needed). Accepted.
- **L-4 — gitignore at package level** (`apps/web/.gitignore:1-2`) covers `e2e/.auth/` + `playwright-report/`. Confirmed via `git check-ignore`. Accepted.

### Pre-existing tech-debt (out-of-scope; NOT a wave-16 finding)
- **9 pre-existing biome warnings** — `useTyping` noNonNull (wave-14) + `ServerRolesPage` unused suppressions.
  WARNINGS (not errors), live on `main`, byte-identical pre/post this wave (the 3 new test files add 0 warnings),
  do NOT fail CI (`biome ci .` exits 0). Recorded as a KNOWN CARRY, not a wave-16 finding.

## Per-layer summary

| Layer | Verdict | Evidence |
|---|---|---|
| T-1 static | PASS (Pattern A) | C-1 lint job green (Biome 0-errors; 9 pre-existing warnings unchanged) + typecheck job green; run 28437054848 |
| T-2 unit | PASS (Pattern A) | no unit tests added (deliverable is an E2E); existing api/web unit suites unchanged + green at C-1 `test` job |
| T-3 contract | SKIP | no contract/Zod/SDK surface touched |
| T-4 integration | SKIP | no schema/service/DB surface touched |
| T-5 e2e | PASS (Pattern A, ratified REAL) | authed create-server E2E 4/4 in CI `e2e` job vs live prod + local; genuine sign-in + create + real-selector assertions; anti-flake honored |
| T-6 layout | SKIP | no UI change (tests existing UI) |
| T-7 perf | SKIP | no perf surface |
| T-8 security | PASS (light, ratified) | fixture password not leaked (secrets masked; storageState gitignored; no artifact upload); no new authz/session surface |
| T-9 journey | APPROVED (gate) | create-server flow annotated now-E2E-covered; no structural map change (flow unchanged) |
