# Wave 31 — B-3 Frontend (livekit-integration, 747b15c, Refs 1dd1f2ca)
VoiceStudyRoom.tsx + useVoiceToken hook built to the ADOPTED design/voice-study-room.html — 5 states (pre-join / connecting / in-room populated / in-room alone / error). Connect-on-demand (Join click, no auto-connect); LiveKitRoom video={false} audio={true} (camera OFF, audio-first); mic toggle + Leave (disconnect on leave + unmount); participant tiles (avatar/name, not camera grid); error state status-mapped. Routing: MainColumn renders VoiceStudyRoom when channel type='voice'. api.getVoiceToken(channelId). Phosphor icons added.
- 13 new tests + 267 web pass. Anti-pattern: no livekit-server-sdk in web; no VITE_-prefixed secret; single LiveKitRoom; disconnect on unmount. biome+typecheck+build clean. No deviation.
- Live voice connection (ICE/SFU/media plane) deferred to T-5/C-2 (needs LIVEKIT creds).
```yaml
skipped: false
specialists_spawned: [livekit-integration]
files_implemented: [shell/VoiceStudyRoom.tsx, shell/useVoiceToken.ts, shell/voice-study-room.test.tsx, auth/api.ts, shell/MainColumn.tsx, shell/icons.tsx]
designs_consumed: [design/voice-study-room.html]
deviations: []
simplify_applied: true
```
