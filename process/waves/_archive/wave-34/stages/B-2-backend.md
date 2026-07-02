# Wave 34 — B-2 Backend (livekit-integration)
- **voice-token.service.ts:131-146** — canPublishSources widened `[MICROPHONE]` → `[MICROPHONE, SCREEN_SHARE, SCREEN_SHARE_AUDIO]`; header comments (:19/:30) swept (no longer "microphone only"). canPublish/canSubscribe/roomJoin/room + RBAC uniform-403 gate + token shape + secret UNCHANGED.
- **voice-token.service.spec.ts:156** — assertion `['microphone']` → `['microphone','screen_share','screen_share_audio']`; +1 test "minted grant for a member includes screen_share[+_audio], not camera".
- AC (spec-1 token layer): member token now permits screen_share publish (client publish no longer server-rejected); non-member still 403.
```yaml
skipped: false
specialists_spawned: [livekit-integration]
files_implemented: [apps/api/src/voice/voice-token.service.ts, apps/api/src/voice/voice-token.service.spec.ts]
deviations: []
```
