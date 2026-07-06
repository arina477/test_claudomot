# B-4 Wiring — wave-68
Repo typecheck: PASS (turbo 4/4). New routes: PATCH /servers/:id (api) — registered on ServersController. New web: ServerOverviewSettings mounted in ChannelSidebar (no new route — overlay). No new env. No B-2↔B-3 drift (shared UpdateServer DTO + ServerSummaryWithInvite consumed both sides).
```yaml
typecheck_passed: true
routes_registered: [PATCH /servers/:id]
env_vars_wired: []
drift_defects: []
```
