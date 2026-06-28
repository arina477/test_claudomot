# V-1 Karen — Source-Claim Verification (Wave 1, StudyHall foundation)

**Verdict: APPROVE**
**Date:** 2026-06-28
**Verified against:** LIVE deploy + repo @ `486d45b` (merge commit on `main`)
**Method:** independent git/curl/gh evidence — every load-bearing claim confirmed by direct command output, not by re-reading deliverables.

---

## Scope verified
The wave's load-bearing claims: (1) claimed files exist at the merge commit; (2) export/contract truths hold; (3) the live deploy actually serves the merge commit; (4) the CI/merge claim is real; (5) no fabricated/decorative work beyond documented deferrals.

---

## Findings (claim → evidence)

### F1 — File existence — CONFIRMED
All claimed files present at `486d45b` (`git ls-tree -r 486d45b`):
- `apps/api/src/health/health.controller.ts` ✓
- `apps/api/src/main.ts` ✓
- `apps/web/src/shell/{AppShell,ServerRail,ChannelSidebar,MainColumn,ConnectionStateIndicator}.tsx` ✓ (all five)
- `packages/shared/src/health.ts` ✓
- `turbo.json` ✓ · `.nvmrc` ✓ · `.github/workflows/ci.yml` ✓

Shell components are real, not stubs (line counts at `486d45b`): AppShell 98, ServerRail 175, ChannelSidebar 282, MainColumn 146, ConnectionStateIndicator 78. AppShell carries documented responsive collapse logic + explicit "Wave 1 scope" comments (member list OUT, connection state prop-driven). Substantive implementation, not decoration.

### F2 — Export / contract truth — CONFIRMED
- `packages/shared/src/health.ts` exports `HealthResponseSchema` (Zod) **and** `HealthResponse` (`z.infer`). ✓
- `health.controller.ts` imports `HealthResponse` from `@studyhall/shared` and the `health()` handler returns that type. ✓ (`apps/api/src/health/health.controller.ts:7`)
- `.nvmrc` = `22`. ✓
- `turbo.json`: `typecheck.dependsOn = ["^build"]`. ✓
- `apps/api/package.json`: `"start": "node dist/src/main.js"`. ✓
- Bonus: served `version` `0.1.0` is honestly sourced — controller returns `process.env.npm_package_version ?? '0.1.0'`.

### F3 — Deploy serves the merge commit — CONFIRMED (curled live, this session)
- `GET https://api-production-b93e.up.railway.app/health` → **HTTP 200** `{"status":"ok","service":"studyhall-api","version":"0.1.0"}` — byte-for-byte the claimed/spec'd payload. ✓
- `GET https://web-production-bce1a8.up.railway.app/` → **HTTP 200**, serves the SPA: `<title>StudyHall</title>`, `<html lang="en" class="dark">`, `theme-color #0a0a0b`, Geist fonts, manifest + PWA register-sw. ✓
- Served HTML matches `git show 486d45b:apps/web/index.html` exactly (title, lang/dark class, theme-color, Geist link) — this is the merge-commit build, not a stale artifact. ✓
- Hashed bundles resolve: `/assets/index-CqfxJEfc.js` → HTTP 200 (215,947 B); `/assets/index-BbQcn2Sj.css` → HTTP 200 (16,958 B). Non-trivial bundle = real app, not a placeholder page. ✓
- C-2 record (`C-2-deploy-and-verify.md`) declares both services `state: SUCCESS, commit: 486d45b` — consistent with live evidence. ✓

### F4 — CI / merge claim — CONFIRMED
- `gh pr view 1` → `state: MERGED`, `mergedAt: 2026-06-26T13:14:21Z`, `mergeCommit.oid: 486d45b7…` — matches the stated merge commit exactly. ✓
- `gh run view 28240325274` → `conclusion: success`, `status: completed`. ✓
- Note (not a defect): run `headSha` is `c1f7581` (the PR-branch head), expected for a **squash** merge — CI green on the PR head, then squashed to `486d45b`. The run's `displayTitle` matches the merge-commit subject. No contradiction.

### F5 — Antipattern catalog — CLEAN (no fakes)
- `db:*` scripts in root `package.json` are `echo 'no DB yet (deferred)' && exit 0` — **honest, documented placeholders by design** (no DB this wave; Postgres/Drizzle deferred to task `b9118041`). Not disguised as working. ✓
- Postgres/Drizzle + auth deferral is documented in P-3 plan ("Data model: None this wave… deferred auth-backend task b9118041"). Documented deferral, not a fake. ✓
- No claimed-but-fake / decorative / silently-deferred work found. The plan's self-consistency sweep maps every AC to a step, and the steps landed on disk.
- **Known limitation (NOT a fabrication):** live-browser render untested — Playwright MCP needs the Google `chrome` channel binary, absent in this sandbox. Shell render is covered by CI RTL tests + live HTTP serve (correct HTML + 200 JS/CSS bundles). Documented in T-5/T-6. Acceptable; not counted against the wave.

---

## Severity summary
- **Critical:** none
- **High:** none
- **Medium:** none
- **Low:** none (the squash-merge headSha and the browser-render limitation are explained, not defects)

## Conclusion
Every load-bearing claim is TRUE against the live deployed state and the repo at `486d45b`. Files exist, contracts match, the deploy serves the merge commit (verified by independent curl + HTML diff against source), the PR is MERGED with the asserted merge commit, and CI is green. Deferrals are documented, not disguised. **APPROVE.**
