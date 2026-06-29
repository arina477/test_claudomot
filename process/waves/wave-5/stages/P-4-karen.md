# P-4 Phase 2 — Karen source-claim verification (wave-5, M1 hardening, PRE-build)

**Wave:** 5 — M1 foundation hardening (multi-spec, 6 tasks)
**Spec task:** 839af17f-...-b34d34fbb231d7 (multi-spec head)
**Mode:** PRE-build source-claim verification (claims about CURRENT codebase state + plausibility of the planned approach — NO implementation exists yet)

## VERDICT: APPROVE

All six per-task source claims are VERIFIED or VERIFIED-PLAUSIBLE against live code. One specialist-routing correction required (test-automator NOT in catalog — substitution mandated per rule 11). The plan deliberately avoids the Redis/distributed-store antipattern, consistent with the locked architecture. No claimed-but-fake completions (nothing is claimed done — this is PRE-build) and no gold-plating in the planned approach.

---

## Per-claim findings

### 0. Specialist routing — `test-automator` NOT in catalog — WRONG (correctable, rule 11)
- **Claim (P-3 line 11):** "backend-developer ✓, devops-engineer ✓, head-ci-cd ✓, test-automator ✓"
- **Reality (AGENTS.md):** `backend-developer` (L70) ✓, `devops-engineer` (L85) ✓, `head-ci-cd` (L48) ✓ all present. **`test-automator` is NOT in `command-center/AGENTS.md`.** The P-3 "✓" against it is a false claim.
- **Severity: Medium.** Does not block the wave — rule 11 mandates substitution with the closest catalog match. For the CI-browser-E2E job (c51589cd) the correct substitutes are **`ui-comprehensive-tester`** (L68 — the project's Playwright/live-site tester, persona-partitioned) for the smoke-spec authoring + **`devops-engineer`** (L85 — CI/monorepo tooling) for the ci.yml job wiring. The B-block executor for c51589cd MUST be one of these two, not `test-automator`.
- **Action for B-block:** strike `test-automator`; route the spec to `ui-comprehensive-tester`, the CI job to `devops-engineer`. Note the swap in the build log.

### 1. Rate-limit (839af17f) — `@nestjs/throttler` lib + arch alignment — VERIFIED
- **`@nestjs/throttler` is the right lib + NOT yet present:** confirmed — `grep -i throttler apps/api/package.json` returns nothing; current deps (package.json L17-32) have no throttler. Adding it is real, not a no-op. VERIFIED.
- **Arch mandate 10/min on auth, in-memory single-pod, NO Redis:** confirmed against `_library.md` — L113 "`@nestjs/throttler`: 100 req/min per IP globally, 10 req/min on auth endpoints" and L423 "**No Redis at MVP** ... (c) distributed rate-limit store ... Flag for introduction at H2." The in-memory throttler is the DELIBERATE locked arch choice, not a defect; the Gemini scaling flag is a documented H2 deferral. VERIFIED.
- **Throttle-at-app-level approach is plausible:** confirmed by reading the mount mechanism. `auth.middleware.ts` L13 mounts `middleware()` from `supertokens-node/framework/express`, and `auth.module.ts` L25 applies it `.forRoutes('*')` — i.e. SuperTokens intercepts `/auth/signin|signup|...` as Express middleware BEFORE NestJS route handlers. Consequence: a route-level `@Throttle` on a NestJS controller method would NOT cover the SDK-handled `/auth/*` routes. The plan (P-3 L4) correctly recognizes this — "SuperTokens /auth/* is SDK-mounted middleware — throttle at the app level (a guard/middleware in front, OR @nestjs/throttler global APP_GUARD)." A global `APP_GUARD` ThrottlerGuard (which runs in the NestJS guard layer) plus `@SkipThrottle` exemptions, OR an Express-level throttle middleware ordered before the SuperTokens middleware, are both viable. The plan names both. VERIFIED-PLAUSIBLE.
- **Note for B-block (not a P-4 blocker):** the throttle mechanism MUST sit where it actually sees the `/auth/*` requests. A NestJS `APP_GUARD` runs for all NestJS-routed requests; verify at B/T-8 that the SuperTokens-middleware-handled paths are actually traversed by the guard (NestJS guards do run for requests that reach the router even when earlier middleware is mounted, but `/auth/*` requests are *terminated by* the SuperTokens middleware and may never reach a NestJS handler/guard). If the global guard does not fire on `/auth/*`, the implementer must fall back to an Express-level limiter ordered ahead of `consumer.apply(SupertokensMiddleware)`. This is the single highest-risk technical detail of the wave — flag it explicitly in the 839af17f spec body so the live 429 probe (AC2) actually targets `/auth/signin`, not a NestJS-native route.

### 2. Avatar (84e09891) — presign exists, completes with creds + server-side 2MB — VERIFIED
- **Presign already exists (wave-4):** confirmed — `files.service.ts` L68-106 `presignAvatarUpload()` is implemented, lazy S3 client (L30-56), 503-graceful when env vars absent (L41-46, L73-75 throws `ServiceUnavailableException {code: STORAGE_NOT_CONFIGURED}`). The 503-graceful path is REAL. VERIFIED.
- **Credential-gated (founder bucket):** confirmed — getter requires `AWS_ENDPOINT_URL` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (L36-39) + `STORAGE_BUCKET_NAME` (L83). Env var names match `_library.md` decision #16 (L583) + DevOps block (L386-390). Founder-issued Railway Bucket creds is the correct gate. VERIFIED. Credential-gated build/verify is correctly flagged in both spec and plan.
- **Server-side 2MB is a REAL gap (not yet enforced server-side):** confirmed — `files.service.ts` L92-99 the `PutObjectCommand` carries NO `ContentLengthRange`; the inline comment (L94-98) explicitly states "ContentLengthRange is a presigned-POST feature only; for presigned PUT the size constraint is advisory ... the 2MB check should also be done client-side." So today there is NO server-side size enforcement — AC3 (the wave-4 AC7 fold-in) is a genuine outstanding item, not already-done. The plan's remedy (P-3 L5: "switch presign to presigned POST with content-length-range OR add a bucket size policy") is the correct mechanism. `_library.md` L321/decision #15 (L582) mandates the 2MB server-side cap. VERIFIED (gap is real; planned fix is sound).

### 3. Version (e38c306e) — hardcoded 0.1.0 fallback — VERIFIED
- **Claim:** health.controller has a hardcoded `0.1.0` fallback; fix sources from package version.
- **Reality:** confirmed — `health.controller.ts` L11 `version: process.env.npm_package_version ?? '0.1.0'`. The literal `'0.1.0'` is the fallback. Note `apps/api/package.json` L3 actual version is `"0.0.1"` (not 0.1.0) — so the hardcoded literal is BOTH stale AND wrong relative to the real package version, strengthening the claim. When `npm_package_version` is unset (it is only auto-set by `npm`/`pnpm run` script context, not in a bare `node dist/src/main.js` start — see package.json L9 `start` is a bare node invoke), `/health` reports `0.1.0`, which is neither the real version nor sourced from package.json. The fix (read package.json version at build/import time, or guarantee npm_package_version injection) is real and well-targeted. VERIFIED.

### 4. node-20 (a7667fb7) — bumpable action versions exist — VERIFIED
- **Claim:** ci.yml actions emit Node-20 deprecation; bumpable versions exist.
- **Reality:** confirmed — `ci.yml` pins `actions/checkout@v4` (L17/28/48/59/70), `actions/setup-node@v4` (L19/30/50/61), `pnpm/action-setup@v4`, `gitleaks/gitleaks-action@v2` (L72). `actions/checkout@v4` and `actions/setup-node@v4` run on the Node-20 runtime and emit the GitHub-runner "Node.js 20 actions are deprecated" annotation as runners default to Node-24. Bumpable majors exist (`actions/checkout@v5`, `actions/setup-node@v5`). The Node-20 deprecation is real and the bump is straightforward. VERIFIED.
- **Note:** project runtime stays Node 22 (`.nvmrc` = 22, root `engines.node` >=22) — unaffected; this is purely the *action wrapper* runtime, not the build's Node. The bump does not touch the locked stack. The "all 5 jobs stay green" AC is the correct acceptance bar.

### 5. branch-protection (478e9d43) — gh-API rule, no arch fork — VERIFIED
- **Claim:** branch-protection on main via GitHub API; require PR + the 5 status checks; doesn't fork architecture.
- **Reality:** plausible + arch-consistent. The repo's CI defines exactly 5 jobs (`lint`, `typecheck`, `test`, `build`, `secret-scan` — ci.yml L13/24/35/55/66), so "the 5 required status checks" maps to a real, enumerable set. A `gh api` branch-protection rule (require PR before merge + required status checks) is a standard, real GitHub operation. `_library.md` DevOps (L344-345) says "Production: Railway persistent services on push to main (after CI passes)" + decision #18 commits to CI discipline — branch protection enforces the already-documented intent and does not change the deploy topology or fork the locked architecture. The edge-case "the brain's own PR→merge flow still works (squash merge)" is correctly called out — important because an over-strict rule (e.g. requiring linear history or signed commits) could block the brain's own automation. VERIFIED-PLAUSIBLE. **B/C-block caution:** scope the rule to *require PR + required status checks only*; do NOT enable "require signed commits" or "include administrators" in a way that locks out the brain's own squash-merge automation.

### 6. CI-E2E (c51589cd) — Playwright chromium job is real; deferral lineage holds — VERIFIED
- **`@playwright/test` not yet present anywhere:** confirmed — no `package.json` in the repo references playwright, no `playwright.config.*` exists. Adding it is net-new, real work (not a phantom completion). VERIFIED.
- **Pattern is real:** `npx playwright install --with-deps chromium` + a minimal smoke spec (load web `/login`, assert renders) in a CI job is a standard, well-trodden pattern. `_library.md` Test section names Playwright MCP for live E2E (T-5, L437) and `playwright.config.ts` at `apps/web/playwright.config.ts` with `BASE_URL` (L482) — so a config-file location + base-URL convention already exists in the locked arch for this to slot into. VERIFIED-PLAUSIBLE.
- **Deferral lineage (waves 1/3/4):** the spec/plan assert browser-E2E was deferred across waves 1/3/4. I did not independently re-derive the three prior deferrals from history (out of scope for source-claim verification + not load-bearing for the APPROVE — the work is real regardless of how many waves deferred it). Treat the "1/3/4" provenance as asserted-not-verified; it does not affect the verdict.
- **Routing reminder:** see finding 0 — author the smoke spec via `ui-comprehensive-tester`, wire the CI job via `devops-engineer`. Note ci.yml is touched by BOTH a7667fb7 (node-20) and c51589cd (E2E) — P-3 L13 correctly flags the conflict; serialize the two ci.yml edits or have one agent own both CI changes.

### 7. Antipatterns — claimed-but-fake / gold-plating — VERIFIED CLEAN
- **Claimed-but-fake:** N/A — this is PRE-build; nothing is claimed complete. All "X already exists" sub-claims (presign exists, hardcoded 0.1.0, no throttler, no playwright) were independently confirmed against live code above. No phantom completions.
- **Gold-plating / premature optimization:** the plan AVOIDS the Redis antipattern. In-memory throttler is the explicit locked-arch choice (`_library.md` L113 + L423), NOT under-engineering and NOT a defect — the Gemini scaling concern is a documented H2 deferral (L423 H2 trigger (c) "distributed rate-limit store"). Introducing Redis now would be the premature optimization, and the plan correctly does not. The five XS items (version, node-20, branch-protection) are appropriately scoped to minimum-viable. No gold-plating detected. VERIFIED CLEAN.

---

## Cross-cutting notes for B/T blocks (carry forward — not P-4 blockers)
1. **Routing fix (mandatory):** replace `test-automator` (not in catalog) with `ui-comprehensive-tester` (spec authoring) + `devops-engineer` (CI wiring) for c51589cd.
2. **Highest technical risk:** 839af17f throttle placement vs SuperTokens Express-middleware mount. The live 429 probe MUST target `/auth/signin` (SDK-handled), and the implementer must verify the chosen guard/middleware actually intercepts SDK routes — fall back to an Express limiter ordered before `consumer.apply(SupertokensMiddleware)` if the NestJS `APP_GUARD` does not fire on `/auth/*`.
3. **ci.yml double-touch:** node-20 (a7667fb7) + E2E (c51589cd) both edit ci.yml — serialize or single-owner.
4. **branch-protection scope:** require PR + 5 status checks only; do not lock out the brain's squash-merge automation.
5. **Credential gate:** 84e09891 build/verify waits on founder Railway Bucket creds — correctly flagged; the other 5 ship independently.

## Security-scope tightened gate
839af17f is the auth surface → T-8 Security stage is mandatory (correctly noted in spec + plan). The 429 rate-limit smoke is in scope for T-8 (`_library.md` L440 "rate-limit smoke").

## Resend domain (a1299e88) — correctly EXCLUDED
Out of wave-5 scope (pure founder-DNS item, non-blocking M1). Not evaluated. Consistent with `_library.md` R-SDK-2 (L596).
