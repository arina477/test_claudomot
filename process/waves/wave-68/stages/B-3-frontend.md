# B-3 Frontend — wave-68
Specialist: react-specialist (initial 749de16 + pre-populate fix 93d0fb9).
- api.updateServer(serverId, patch) → PATCH /servers/:id.
- ServerOverviewSettings.tsx (NET-NEW per karen — Overview shell didn't exist): owner-only publish toggle (is_public, §8 dark-on-emerald) + description(500)/topic(100) edit; isOwner gate (ServerRolesPage:675 pattern, non-owners never see control); save→api.updateServer; error banner non-destructive; escape close. PRE-POPULATED from selectedDetail.server (initialIsPublic/Description/Topic props from ChannelSidebar) → reflects real state, save preserves untouched (no clobber); reset on serverId change.
- ChannelSidebar: settings-btn → Overview (gear icon); new roles-btn → Roles (preserved, untouched matrix).
- Read-contract fix (backend-dev 184ea81): is_public/description/topic added to ServerSummaryWithInvite + findServerDetail projection (so the settings can read current state).
Tests: 13 overview settings (owner sees/non-owner doesn't; toggle→PATCH; edit→PATCH; pre-populate ON+real-values; edit-one preserves-others; error) + 5 fixture fixes. web 596/596, api 764/764; typecheck 4/4, biome clean.
Deviations (ACCEPT): (1) 'in patch' null-clear (B-2); (2) read-contract extension needed for pre-populate (fixed 184ea81 — real gap, not deferred); (3) 5 test fixtures updated for the schema extension (necessary).
```yaml
skipped: false
specialists_spawned: [react-specialist, backend-developer]
files_implemented: [api.ts, ServerOverviewSettings.tsx, ChannelSidebar.tsx, servers.service.ts(detail projection), packages/shared/servers.ts]
designs_consumed: [design/server-settings.html (Overview shell)]
deviations: [{change: "read-contract extension for pre-populate", why: "settings must reflect real state (clobber risk)", adjudication: accept-fixed}]
simplify_applied: true
```
