# Wave 5 — P-3 Plan (multi-spec M1 hardening)

## Per-spec approach + file-level + specialist
1. **839af17f rate-limit** (backend-developer): `pnpm --filter @studyhall/api add @nestjs/throttler`. ThrottlerModule (in-memory; ttl 60s, limit 10) in AppModule; apply guard to auth routes (global APP_GUARD ThrottlerGuard + @SkipThrottle on /health, OR @Throttle on the /auth proxy + /profile). SuperTokens /auth/* is SDK-mounted middleware — throttle at the app level (a guard/middleware in front, or @nestjs/throttler global). Verify 429 live. Files: app.module.ts, a throttler config. Security-tightened → T-8.
2. **84e09891 avatar** (devops-engineer infra + backend-developer): B-0 set founder Railway Bucket creds on api (AWS_*); server-side 2MB — switch presign to presigned POST with content-length-range OR add a bucket size policy (files.service.ts). Verify live presign→PUT→confirm→render + >2MB reject. CREDENTIAL-GATED (founder bucket pending).
3. **e38c306e version** (backend-developer, XS): health.controller reads version from process.env.npm_package_version ?? package.json version (build-time inject or import). Set npm_package_version or read package.json.
4. **a7667fb7 node-20** (devops-engineer, XS): bump .github/workflows/ci.yml action versions (actions/checkout, setup-node, etc.) to current majors clearing the Node-20 deprecation.
5. **478e9d43 branch-protection** (head-ci-cd/orchestrator ops, XS): enable GitHub branch protection on main via gh API (require PR + the 5 required status checks). Verify direct push blocked.
6. **c51589cd CI-browser-E2E** (test-automator + devops): add a ci.yml job installing chromium (npx playwright install --with-deps chromium) running a minimal Playwright spec (load web /login, assert renders). New: a playwright config + smoke spec + the CI job.

## Specialist routing (AGENTS.md): backend-developer ✓, devops-engineer ✓, head-ci-cd ✓ (C-block owner, does branch-protection ops), test-automator ✓.
## Deps: @nestjs/throttler (api); @playwright/test (CI/dev, for the E2E job).
## Parallelization (multi-spec, per-spec independent): rate-limit, version, node-20, branch-protection, CI-E2E can proceed in parallel (independent files: app.module/throttler, health.controller, ci.yml[node-20], gh-API[ops], ci.yml+playwright[E2E] — note ci.yml touched by both node-20 + E2E → serialize those two or one agent does both CI changes). Avatar (84e09891) credential-gated → its build/verify waits on founder creds; the other 5 ship independently.
## Commit-per-spec (multi-spec B discipline): one commit per task_id.
## Self-consistency: each spec's ACs → file-level step + specialist. design_gap_flag=false. Security-tightened (rate-limit) → T-8. Founder-dep (avatar) flagged. CI-yml conflict (node-20 + E2E) noted → coordinate.
