# Wave 31 — B-0 Branch & schema
- **Claim:** 2 tasks (d8a85de0, 1dd1f2ca) → in_progress, wave_id=wave-31 (a2bd7814). RETURNING 2.
- **Branch:** wave-31-voice-token-mint from main fa31190.
- **Deps:** `livekit-server-sdk@2.15.5` (apps/api), `@livekit/components-react@2.9.21` + `livekit-client` (apps/web). Committed. Anti-pattern boundary: server SDK in api only.
- **Schema:** SKIP (no DB migration — a voice room maps to an existing channels row type='voice'; no new table this wave; occupancy tracking split out).
```yaml
branch: wave-31-voice-token-mint
deps_added: ["livekit-server-sdk@2.15.5 (api)", "@livekit/components-react@2.9.21 (web)", "livekit-client (web)"]
env_vars_added: []   # LIVEKIT_* founder-supplied at deploy (not committed); build uses placeholder
schema_skipped: true
migrations: []
deviations: []
```
