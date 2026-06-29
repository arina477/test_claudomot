# Wave 5 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-5/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
REWORK

## Rationale
Five of six specs are implemented correctly and the two load-bearing ones hold up under scrutiny. The auth rate limiter (839af17f) is sound: the Express `app.use(authRateLimiter)` in `main.ts` is registered after `NestFactory.create()` but before `app.listen()`, and NestJS module-configured middleware (`AuthModule.configure()` → SuperTokens via `consumer.apply().forRoutes('*')`) is only registered during `app.init()` — which `app.listen()` triggers. Express runs middleware in registration order, so the rate limiter genuinely runs *before* the SuperTokens middleware and will intercept `/auth/signin|signup|reset` (the exact P-4 Karen finding the spec called out). It is in-memory (no Redis, per `_library` L423), `/health` is exempt via `@SkipThrottle`, and the limit is 10/60s. The avatar 2MB enforcement (84e09891) is real and server-side — `checkAvatarSize()` issues a `HeadObject` and throws 413 `AVATAR_TOO_LARGE` at confirm time before `setAvatarUrl`, with the 503 graceful-boot path preserved (verified: API boots and tests pass with no storage creds). `/health` version (e38c306e) reads the real package version via `require('../package.json')` with `npm_package_version`/fallback. CI Node-20 bumps (a7667fb7) are correct (checkout@v5 + setup-node@v5 across all jobs, 5 original jobs intact). The CI E2E job (c51589cd) is sound — Playwright config + 2-test smoke spec + dedicated e2e job; the vitest-collision fix is verified working (web vitest collects only its 2 src test files, 37 tests; it does NOT scan `e2e/`, which `tsconfig.json` still includes for typecheck and Playwright still runs). Branch protection (478e9d43) is ACTIVE on main with all 5 required checks, `required_approving_review_count: 0`, and `enforce_admins: false` — so the bot's PR→squash-merge flow is not locked out. Commit-per-spec discipline PASSES (every claimed task_id has ≥1 commit; the only multi-task commit is the legitimate B-0 deps commit; no cross-spec logic commit). **However, one gate-blocking defect blocks APPROVED:** `apps/api/src/version.ts` line 22 fails the biome formatter (redundant outer parentheses). Because branch protection now makes `lint` a *required* status check on main, this format failure will fail the `lint` CI job and render the bot's PR unmergeable. B-5 reported lint green; this regressed or was inaccurately reported. The defect is mechanically trivial but its consequence (unmergeable PR) is gate-blocking, so it cannot pass through to Phase 2.

## Rework instructions

### Stages requiring rework
- B-5: clear the `apps/api/src/version.ts` biome format failure and re-confirm the full verify suite is green.

### Per stage

#### B-5
- **What's wrong:** `apps/api/src/version.ts` line 22 fails `pnpm lint` (biome `format` check: "File content differs from formatting output" — redundant outer parentheses around the `??` chain). The `lint` job is one of the 5 required status checks on the now-protected `main`, so a failing `lint` makes the wave PR unmergeable.
- **Heuristic fired:** Build-health regression — a stage reported its exit gate (B-5 lint) green when it is not; the false-green would have shipped an unmergeable PR into C-block.
- **What "good" looks like:** `pnpm lint` exits 0 across all 88 files. `version.ts` line 22 reads `process.env.npm_package_version ?? (pkg.version as string | undefined) ?? '0.0.1';` (no outer wrapping parens). `pnpm typecheck`, `pnpm build`, and the full test suite (94 tests: 57 api + 37 web) stay green.
- **Re-do instructions:**
  1. Route to `node-specialist` (per `command-center/AGENTS.md`): run `pnpm --filter @studyhall/api exec biome format --write src/version.ts` (or remove the outer parentheses on line 22 by hand), landing it as a `fix:` commit on the wave branch citing task `e38c306e`.
  2. Re-run B-5 in full: `pnpm lint && pnpm typecheck && pnpm build && pnpm --filter @studyhall/api test && pnpm --filter @studyhall/web test`. All must be green.
  3. Re-enter B-6 Action 0 (fresh head-builder spawn, attempt 2).

### Cascade

B-block cascade rules (B-5 is the trigger stage):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-5 verify | (terminal — only itself) |

- **Stages that must re-run after the above:** B-5 (re-verify), then B-6 (re-gate).
- **Stages that stay untouched:** B-0, B-1, B-2, B-3, B-4 (no contract, schema, route, or logic change — formatting-only fix in one file).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 5 — B-6 Verdict (Attempt 2)

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-5/blocks/B/review-artifacts.md + attempt-1 verdict above
**Attempt:** 2

## Verdict
APPROVED

## Rationale
The single attempt-1 blocker is cleared. The fix commit `7bd1a42` ("fix(api): biome-format version.ts (task e38c306e)") touches exactly one file, `apps/api/src/version.ts`, and is formatting-only: it removes the redundant outer parentheses around the `??` chain on the export, leaving the expression `process.env.npm_package_version ?? (pkg.version as string | undefined) ?? '0.0.1'` — semantically identical to before, so the attempt-1 finding that `/health` reports the real package version still holds. The full verify suite was re-run in this turn and is green across the board: `pnpm lint` (biome ci) checked all 88 files with 0 errors — the exact `lint` required status check that the now-active branch protection would have failed on attempt-1 now passes, so the bot's PR→squash-merge flow is no longer locked out; `pnpm typecheck` 4/4 successful; `pnpm build` 3/3 successful (shared + api + web, including the web PWA precache); `pnpm test:ci` 94/94 passing (57 api across 7 files + 37 web across 2 files), matching the claimed counts exactly, including the two health-version specs and the web avatar-2MB / 503-presign specs. The fix is correctly scoped to the B-5 cascade table (terminal — re-verify only), so the six specs verified clean in attempt-1 (auth rate-limit Express ordering, avatar 2MB confirm-HEAD, version-from-pkg, Node-20 actions@v5, CI-E2E + vitest-scope-fix, bot-safe branch protection) and the commit-per-spec discipline are unchanged and remain APPROVED. No new scale infrastructure was introduced by the fix; no contract, schema, route, or auth-door change. Blocker cleared, nothing regressed.

## Stage-exit checklist (B-6)
- [x] Code reviewed by an agent other than its author (head-builder gate, independent of the fix author) [STABLE]
- [x] No over-engineering introduced — the fix removes characters, it does not add abstraction
- [x] Failure root-cause classified and routed (attempt-1 routed the format failure to node-specialist with a `biome format --write` instruction; no debug-by-deploy)
- [x] Required `lint` status check green → wave PR is mergeable under branch protection

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1
- next_action: PROCEED_TO_PHASE_2 (C-block handoff)
