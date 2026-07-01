# Wave 31 — P-2 Spec (pointer)

**Source of truth:** multi-spec YAML head + prose in `tasks.description` for primary row **d8a85de0** (2 blocks). Convenience copy.
- **wave_type:** multi-spec · **claimed_task_ids:** [d8a85de0 (token-mint), 1dd1f2ca (client join)] · **design_gap_flag:** TRUE (D-block designs the voice-room UI)

## Block 1 — d8a85de0 token-mint (server)
`POST /channels/:channelId/voice/token` — AuthGuard + `canViewChannelById` gate + channel-load (404 missing / 403 non-member) + `channels.type='voice'` check (400 else) → mint short-lived (~1h) room-scoped (room=channelId, identity=userId, grants roomJoin+publish+subscribe) LiveKit JWT via `livekit-server-sdk` AccessToken → 200 `{ token, url }`. API secret server-side ONLY (livekit-server-sdk never in apps/web — anti-pattern-guard AC). Placeholder key OK for build/unit (assert decoded JWT claims/grants/exp). Unset creds at runtime → 503 (not malformed token).

## Block 2 — 1dd1f2ca client join (web)
voice-study-room React surface (@livekit/components-react) — fetch token → connect ON DEMAND (Join click, not on mount) → minimal UI (leave + audio; camera OFF default) → error state on fetch/connect failure. Follows D-block design. livekit-server-sdk NOT in web. Live-connect verified at T-5/C-2 (needs creds).

## Security → P-4 gate + T-8
credential-issuing endpoint; session+membership gate (no cross-server voice); secret server-side; short-lived room-scoped token.

## LiveKit creds
LIVEKIT_* NOT in Railway (verified) → build with placeholder + founder heads-up (provision in parallel); live-connect needs them.

## Keep-OUT (mvp-thinner, later M6 waves)
screen-share · low-bandwidth downgrade · presence rings · grid · reconnection · occupancy.

→ P-3 Plan.
