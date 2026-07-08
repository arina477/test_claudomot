# Wave 80 — B-4 Wiring
- **Repo typecheck:** turbo 4/4 (shared/api/web) — no B-1↔B-2↔B-3 drift.
- **Routes:** no new routes (PUT/GET /profile/privacy pre-existed; showPresence rides the existing full-replace body). Presence WS emits unchanged at the contract level (server-side gate only).
- **Env:** none. Import sanity: covered by typecheck.
```yaml
typecheck_passed: true
routes_registered: []
env_vars_wired: []
drift_defects: []
```
