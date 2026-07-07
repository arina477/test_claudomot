# B-3 — Frontend (wave-69)
Specialist: react-specialist. Report dialog + owner inbox + affordances per D-3 design/moderation-report.html (spec C, task 96d5ed58).

## Files
- CREATE apps/web/src/shell/ReportDialog.tsx — shared dialog (server/member/message); focus-trap+Esc, 300-char counter, idle/submitting/success/error, success toast+auto-close, error toast+dialog-stays (double-submit disabled).
- CREATE apps/web/src/shell/ReportInbox.tsx — moderator inbox (loading skeleton/empty/error), rows target+reason+reporter+time + Timeout/Delete/Dismiss→resolveReport, row-removal on success, non-destructive error. Secondary null-gate when !canModerateMembers.
- CREATE apps/web/src/shell/moderation-reports.test.tsx — 15 tests (5 required cases + affordance wiring; rule-12 through-parent).
- MODIFY apps/web/src/auth/api.ts — createReport / getServerReports / resolveReport.
- MODIFY icons.tsx (FlagIcon), ServerDiscoverPage.tsx (report-server-btn), MemberListPanel.tsx (report-member-btn + exactOptionalPropertyTypes fix), MessageList.tsx (report-message-btn, non-own only), ChannelSidebar.tsx (getMyPermissions gate + report-inbox-btn + overlay), shell-components.test.tsx (getMyPermissions mock for pre-existing ChannelSidebar tests).

## Moderator gate
ChannelSidebar api.getMyPermissions(selectedId) → gates the Reports inbox button behind perms.owner||perms.moderate_members; ReportInbox secondary null-gate.

## Design surfaces consumed
design/moderation-report.html: --danger-btn #b91c1c (Delete), --accent-emerald (Submit dark-on-emerald), --surface-950 dialog bg, --danger-text flag tint, modal chrome (mirrors InviteShareModal), mobile bottom-sheet / sm+ centered, toast role=alert/status.

## Verify
- apps/web typecheck: 0 errors. biome: clean (10 files). Tests: 618/618 pass across 40 files (15 new + shell-components suite fixed).

## /simplify
Lean; no filtering/triage/appeals/user-block UI (DEFERRED per spec). Covered by B-6 gate.

## Deviations: none (MemberListPanel serverId conditional-spread is an exactOptionalPropertyTypes correctness fix).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/shell/ReportDialog.tsx, ReportInbox.tsx, moderation-reports.test.tsx, apps/web/src/auth/api.ts, icons.tsx, ServerDiscoverPage.tsx, MemberListPanel.tsx, MessageList.tsx, ChannelSidebar.tsx, shell-components.test.tsx]
designs_consumed: [design/moderation-report.html]
deviations: []
simplify_applied: true
```
