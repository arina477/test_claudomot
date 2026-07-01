# Wave 32 — P-2 Spec (pointer)
**Source of truth:** YAML head + prose in `tasks.description` for row **78f51968**. Convenience copy.
- **wave_type:** single-spec · **claimed_task_ids:** [78f51968] · **design_gap_flag:** TRUE (D-block designs the occupancy indicator)

## ACs (copy)
1. `GET /channels/:channelId/voice/participants` (AuthGuard) member → 200 `{count, participants:[{userId,displayName}]}`.
2. Gate REUSES wave-31 uniform-403 (canViewChannelById FIRST → 403 missing/non-member; then load+type='voice' → 400; unauth 401).
3. RoomServiceClient.listParticipants (EXPLICIT host/apiKey/secret, gotcha #3); identity=userId → member display.
4. Empty/absent room → `{count:0,[]}` (TwirpError handled, not an error).
5. null display_name → fallback (email local-part/userId), never empty.
6. Client occupancy indicator on the voice-study-room PRE-JOIN surface (count + identities, BOUNDED poll; stop on unmount/join) — built to the D-block design.
7. Credential-independent build (mock RoomServiceClient; unset creds → {count:0,[]}/503); live-verify deferred T/C-2.

## Security → P-4 gate + T-8
membership-gated (no cross-server occupancy leak); LiveKit secret server-side (RoomServiceClient apps/api only).

## Keep-OUT (mvp-thinner)
presence rings · speaking indicators · live-push/websocket · animations · join-from-indicator · history. Poll must stay bounded (not a standing subscription).

## LiveKit creds
NOT in Railway → credential-independent build + sharpened founder ask (digest) + N-1 tripwire (3rd cred-blocked M6 → fork).
→ P-3 Plan.
