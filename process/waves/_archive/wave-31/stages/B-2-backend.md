# Wave 31 — B-2 Backend (livekit-integration, 448d5fa, Refs d8a85de0)
VoiceModule + `POST /channels/:channelId/voice/token` (AuthGuard). Service gate order: channel-load 404 → type!='voice' 400 → canViewChannelById 403 → creds-unset 503 → mint. Mint: `new AccessToken(key,secret,{identity:userId,ttl:'1h'})` + `addGrant({roomJoin,room:channelId,canPublish,canSubscribe})` + **`await at.toJwt()`** (async). ESM-only SDK bridged via cached dynamic `import('livekit-server-sdk')` (tsconfig is CommonJS). Secret server-side only.
- 425 unit pass (14 new: 10 service + 4 controller — decode JWT for identity/room/grants/exp-bounded, 403/404/400/503). Anti-pattern guard: no livekit-server-sdk in apps/web (grep clean). biome+typecheck+build clean.
- Deviation: ttl '1h' (spec block) over the doc's '4h' example — spec-correct, no functional deviation.
```yaml
skipped: false
specialists_spawned: [livekit-integration]
files_implemented: [voice/voice.module.ts, voice/voice-token.service.ts, voice/voice-token.controller.ts, voice/voice-token.service.spec.ts, voice/voice-token.controller.spec.ts, app.module.ts]
deviations: ["ttl 1h per spec block (doc example was 4h) — spec-correct"]
simplify_applied: true
```
