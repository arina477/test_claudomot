# V-1 Karen — wave-69 (M14 moderation reports) — Source-Claim Truth Verification

**Scope:** Verify the wave's load-bearing CLAIMS are TRUE in the DEPLOYED state (files exist, exports present, routes registered, migration applied, deploy serves the merge commit). NOT spec conformance (jenny's job).
**Merge commit:** `5fdd2bb` (confirmed on `main`). **Prod:** api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app`.
**Probe date:** 2026-07-07.

## VERDICT: APPROVE

Every load-bearing claim in P-3 / B-0 / B-2 / B-3 / C-2 is TRUE against the merge tree and the deployed revision. No fabricated completion, no silently-deferred work, no decorative test. The two known T-block defects (F1, T6-M1) are honestly documented and already routed to V-2 — not hidden.

---

## Claim-by-claim findings

### F-1 — Files exist on merge tree — CONFIRMED
Claim: B-0 §Schema, B-2 §Files, B-3 §Files list 9 primary files. Evidence: `git cat-file -e 5fdd2bb:<path>` returns EXISTS for all 9:
- `apps/api/src/db/schema/reports.ts` ✓
- `apps/api/drizzle/migrations/0025_strong_gladiator.sql` ✓
- `packages/shared/src/reports.ts` ✓
- `apps/api/src/reports/{reports.service.ts,reports.controller.ts,reports.module.ts}` ✓
- `apps/web/src/shell/{ReportDialog.tsx,ReportInbox.tsx,moderation-reports.test.tsx}` ✓

### F-2 — Functions / exports present as claimed — CONFIRMED
- `reports.service.ts` (B-2 §Files line 5): exports `class ReportsService` with `async createReport` (L102), `async getServerReports` (L197), `async resolveReport` (L249). ✓
- `packages/shared/src/reports.ts` (P-3 B-1 row): `export const CreateReportSchema` (L37), `ReportSchema` (L81), `ResolveReportSchema` (L100). ✓ Re-exported from `packages/shared/src/index.ts` L258–259 (`from './reports.js'` + type re-export). ✓
- `ReportsModule` registered in `app.module.ts` (B-2 §Files line 9): imported L17, listed in imports array L56. ✓
- `rbac.module.ts` EXPORTS `ModerationService` (B-2 §Files line 8 — load-bearing for route-through injection): `exports:` array (L32) includes `ModerationService` (L37). ✓ Without this export the ReportsModule route-through would fail DI — confirmed present.

### F-3 — Routes registered on the DEPLOYED api — CONFIRMED
Live curl against prod (unauth):
- `POST /reports` → **401** (not 404 → route registered; not 500 → table present + AuthGuard active). ✓ Matches C-2 Action 3 claim.
- `GET /servers/<uuid>/reports` → **401**. ✓
- `POST /servers/<uuid>/reports/<uuid>/resolve` → **401**. ✓ (bonus — resolve route also live-gated)
- `GET /health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. ✓
- web `GET /` → **200**. ✓

### F-4 — Migration applied (reports table in prod DB) — CONFIRMED (indirect + direct-in-C-2)
Claim: C-2 §Migration-apply asserts 0025 applied before api deploy; table + index + 5 FKs verified. Independent confirmation:
- POST /reports returns **401 not 500** → the table exists (a missing `reports` table would 500 on the insert path). ✓
- T-8 live authz probe (`T-8-authz-probe.md`) filed real reports (`1bbb0739…`, `320f98b3…`), read them back via `GET /servers/…/reports`, and dismissed them — a full file→read→resolve round-trip against the prod table. A non-existent table makes this impossible. ✓
- C-2's own post-apply verification: `to_regclass('public.reports')` → `reports`, index present, FK count = 5, prod journal 24→25 with newest hash `c7d84bbc3332` = sha256(0025). Consistent. ✓

### F-5 — Deploy hash match — CONFIRMED
Claim: C-2 Action 2 table — api deployment `2522c446-…` and web deployment `a034b611-…`, both SUCCESS on commit `5fdd2bbdf85d` (= merge SHA). Cross-check: `verdict_evidence` (C-2 YAML L52–58) + `deploy_targets[]` (L59–61) both cite deployed-commit == merge SHA on both services. `head_signoff.verdict: APPROVED`. Live health 200 + web 200 + 401 on new route corroborate the new revision is serving (a 404 would signal stale revision — got 401). ✓

### F-6 — Antipattern catalog (claimed-but-fake sweep) — CLEAN
- **Integration spec real, not decorative:** `apps/api/test/integration/reports.integration.spec.ts` exists on the merge tree with **16** `it()` cases. Grep shows it genuinely exercises the 4 authz paths with live-DB assertions: no-IDOR (`expect(report.reporter_id).toBe(REGULAR_USER_ID)` + `.not.toBe(fakeReporterId)` + a raw `SELECT reporter_id FROM reports` harness query), non-mod→403 on both getServerReports and resolveReport, rank-guard timeout-on-owner→403 with post-check `status='open'`, cross-server tamper→404, bad-target→404, already-resolved→409. This is real enforcement testing, not assertion theater. ✓ (Honest caveat: B-2 §Verify documents the local run was DEFERRED to CI due to `127.0.0.1:5433 ECONNREFUSED` — clearly disclosed, not hidden; the same 4 paths were then PROVEN LIVE against prod at T-8.)
- **Migration real:** `0025_strong_gladiator.sql` CREATE TABLE reports (11 columns) + 5 named FK constraints (reporter/target_server/target_user/target_message[ON DELETE set null]/resolved_by) + `reports_target_server_status_idx` on (target_server_id, status). `grep -ic "CREATE TYPE"` = **0** — matches the B-0 Action-9 adjudicated pgEnum→text convention fix. Not a stub. ✓
- **No silent deferral:** every deferral is documented — owner unlist reuses wave-68 PATCH (B-2 §Owner-unlist, no new endpoint), pagination/filtering/appeals/analytics DEFERRED per spec (B-2 /simplify, B-3 /simplify), platform-admin unlist role DEFERRED per spec. All stated, none fabricated as done. ✓
- **Two T-block findings honestly surfaced (confirmation only — not my finding to raise):**
  - **F1** (own-content report leak, `MainColumn.tsx:343` username-vs-UUID mismatch): documented in `T-5-e2e.md:17`, `T-5-tester-1.md:61`, and `T-9-journey.md:11,29` — all tagged → V-2. Not hidden. ✓
  - **T6-M1** (mobile report inbox off-screen, `fixed inset-0` trapped in a `translateX` drawer): documented in `T-6-layout.md:8,18,32` and `T-9-journey.md:12,30` — tagged CRITICAL → V-2. Not hidden. ✓
  - Both are consistently carried into T-9 journey with severity + route target. Honest documentation confirmed.

---

## Notes for V-2 (context, not my verdict)
- F1 (MAJOR) + T6-M1 (CRITICAL) are the real functional gaps this wave carries into triage. Both have code-confirmed root causes and one-shot fixes (one-line `currentUserId` prop fix; portal-to-body). Neither contradicts a source claim — the code exists and works as *built*; these are spec-intent/layout defects, jenny/V-2 territory.
- T-8 recorded a bonus positive: a 10/60s rate limit IS present on POST /reports (the P-block "no rate limit" deferral does not reproduce on the deployed revision). Plus one LOW hardening item (`x-powered-by: Express` exposed) → V-2.

**Bottom line: the wave's load-bearing claims are TRUE in the deployed state. APPROVE.**

## V-3 fast-fix re-verification

**Scope:** Scoped re-verification of the 2 V-3 fast-fix CLAIMS against the deployed revision. Source-claim truth (files/exports present on the merge tree + deployed), not spec conformance.
**Fast-fix merge SHA:** `b1ff0642037f9c018077c68ea5eb3410de9c0db1` (2 commits squash-merged). **Re-probe date:** 2026-07-07.
**Prod web:** `https://web-production-bce1a8.up.railway.app`.

### Claim F1 — `currentUserId` bound to `profile?.userId` (not `profile?.username`) — TRUE
- `git rev-parse HEAD` → `b1ff0642037f9c018077c68ea5eb3410de9c0db1` (current `main` == fast-fix merge SHA; the tree read below IS the merge tree).
- `apps/web/src/shell/MainColumn.tsx:343` → `currentUserId={profile?.userId ?? null}` — confirmed via both `git show HEAD:…` (line 343) and direct Read.
- Neighboring line 344 `viewerUsername={profile?.username ?? null}` confirms `userId` and `username` are now distinctly bound; the wrong-prop bug (username passed as currentUserId) is corrected.
- Verdict: **PRESENT** on the merge tree.

### Claim T6-M1 — report-inbox overlay rendered via `createPortal` to `document.body` — TRUE
- `apps/web/src/shell/ChannelSidebar.tsx:16` → `import { createPortal } from 'react-dom';` — import present.
- `apps/web/src/shell/ChannelSidebar.tsx:419` → `createPortal(` wraps the overlay JSX; `:470` → `document.body,` is the second arg — portal target confirmed.
- Overlay element `apps/web/src/shell/ChannelSidebar.tsx:421-422` → `data-testid="report-inbox-overlay"` + `className="fixed inset-0 z-40 flex flex-col"` — the fixed full-viewport overlay is the portal child (escapes the sidebar's `translateX(-260px)` containing block per the inline rationale at :414-415).
- Verdict: **PRESENT** on the merge tree — import + createPortal wrap + `document.body` target + testid'd `fixed inset-0` overlay all confirmed.

### Deployed hash match — TRUE
- `git rev-parse HEAD` == `b1ff0642037f9c018077c68ea5eb3410de9c0db1` (== fast-fix merge SHA; no divergence between the tree verified above and what was shipped).
- Ship deliverable `process/waves/wave-69/stages/C-fastfix-ship.md` (deployment-state evidence, authoritative Railway deployment endpoint — NOT /healthz):
  - Merge SHA `b1ff064…`; local `main` fast-forwarded `bf7e143 → b1ff064`, HEAD == merge SHA.
  - New web deployment `bfb0276a-bb9f-4abf-8b65-7e9d840c49e6`; progression BUILDING → DEPLOYING → **SUCCESS (91s)**.
  - `web_deployed_sha: b1ff064…` with `web_deployed_sha_matches_merge: true` — the SUCCESS deployment's commitHash equals the merge SHA (no stale-revision race).
  - `web_http_status: 200`; ship deliverable overall `status: PASS`.
- Live re-probe (this pass): `GET https://web-production-bce1a8.up.railway.app/` → **HTTP 200**; served index references `/assets/index-BSP7eKaD.js` + `/assets/index-BxqJGpMW.css` (a built revision is being served, not a dev/placeholder response).
- Verdict: current `main` HEAD == merge SHA, and the web service served that exact SHA to a SUCCESS deployment.

### Fast-fix verdict: **APPROVE**
Both fast-fix commits are real, present on the merge tree at `b1ff064` (F1 → `MainColumn.tsx:343`; T6-M1 → `ChannelSidebar.tsx:16,419,421-422,470`), and deployed — Railway served `b1ff064` to deployment `bfb0276a` with status SUCCESS and the web root returns HTTP 200 on the new bundle. No divergence between the verified tree and the deployed revision.
