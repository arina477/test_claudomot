# Wave 76 — B-3 Frontend
Specialist: react-specialist. Commit a720dee (task d81e266d). [Note: react-specialist branched off the B-2 wave tip 09f1975 and committed there; orchestrator fast-forwarded the wave branch onto it — B-3 is on the wave branch, no fragmentation.]

## Files
- `apps/web/src/auth/api.ts` (mod) — `getServerEducatorAnalytics(serverId)` → GET /educator-tools/analytics (credentialed-fetch; single named import of ServerAnalytics from @studyhall/shared, ESM).
- `apps/web/src/shell/EducatorAdminConsole.tsx` (create) — ported from design/educator-admin-console.html; 4 states (loading skeleton / loaded / empty "No activity yet" / forbidden) + retryable error; values wired to REAL ServerAnalytics (no mockup placeholders — tests assert absence). Icons from icons.tsx inline-SVG (ShieldCheck/Users/ChatsCircle/ClipboardText/WarningCircle/Spinner) — NO CDN. aria-current; lg:(1024px) breakpoint per DS §9; p-4 sm:p-6.
- `apps/web/src/shell/ServerOverviewSettings.tsx` (mod) — mounts console gated on isOwner (getMe().userId===ownerId, opaque BUILD-13) + educatorAdminTools entitlement; server is authoritative (403→forbidden state).
- `EducatorAdminConsole.test.tsx` (create, 8) + 2 pre-existing mocks extended.

## Verify
- **Full web suite 687/687 green (47 files).** Biome clean. BUILD-12 (gating tested through real parent) + BUILD-13 (opaque userId) honored. /simplify: lean (ported design, reuses panel patterns).
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/auth/api.ts, EducatorAdminConsole.tsx, ServerOverviewSettings.tsx, EducatorAdminConsole.test.tsx, +2 mocks]
designs_consumed: [design/educator-admin-console.html]
deviations:
  - {change: "endpoint path uses real controller route /servers/:serverId/educator-tools/analytics (shared doc-comment differed)", adjudication: ACCEPTED}
  - {change: "React 19 (project actual) not 18", adjudication: ACCEPTED}
  - {change: "members educator/student split derived from roleBreakdown heuristic (ServerAnalytics has no direct split)", adjudication: "ACCEPTED — display heuristic over real data; T-5/V may refine copy"}
  - {change: "added retryable non-403 error state", adjudication: "ACCEPTED — matches ServerPlanPanel load-error pattern"}
simplify_applied: true
