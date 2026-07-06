# B-4 Wiring — wave-67
Repo typecheck: PASS (turbo 4/4). New routes: GET /servers/discover + POST /servers/:id/join-public (api, registered on ServersController) + /discover (web React Router, AuthGuard) + ServerRail Discover entry — all registered. No new env. No B-2↔B-3 drift (shared DiscoverServer DTO consumed both sides). No orphan imports (typecheck clean).
```yaml
typecheck_passed: true
routes_registered: [GET /servers/discover, POST /servers/:id/join-public, /discover]
env_vars_wired: []
drift_defects: []
```
