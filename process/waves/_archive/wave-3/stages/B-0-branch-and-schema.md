# Wave 3 — B-0 Branch & schema
- Tasks claimed in_progress: 9aae8255 (auth frontend) + a3328023 (/me verify-gating reconcile).
- Branch: wave-3-auth-frontend.
- Deps (web): supertokens-auth-react ^0.51.2, react-router-dom ^7.18.0. (browser-tabs-lock postinstall ignored — benign sub-dep.)
- Env: web needs VITE_API_ORIGIN (live api URL) — add to apps/web/.env.example at B-4 wiring.
- **Schema: SKIPPED** — display_name column already exists (users table, wave-2). No migration (username/avatar_url/accent_color deferred to sibling 2a655960).
```yaml
branch: wave-3-auth-frontend
deps_added: [supertokens-auth-react, react-router-dom]
env_vars_added: [VITE_API_ORIGIN]
schema_skipped: true
schema_skip_reason: "display_name exists; profile-customization columns deferred to 2a655960"
```
