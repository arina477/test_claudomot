# Wave 31 — P-0 Frame

## Discover section
- **wave_db_id:** a2bd7814-4de0-483a-9c21-6d86661adf05 (wave_number 31, running).
- **Prior-work:** M5 (assignments) CLOSED wave-30 (reminders shipped LIVE). M6 (voice/video) promoted → in_progress. This is M6's FIRST wave. No VoiceModule exists (greenfield).
- **Roadmap milestone:** M6 (8702a335) in_progress, Class=product-feature, Tier=T4 (heaviest MVP piece). Metric: "students drop into a Study Room voice channel, talk + screen-share, degrade to audio-only on poor bandwidth" (multi-wave metric).
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **External SDK:** LiveKit (`livekit-integration` specialist + SDK docs command-center/dev/SDK-Docs/LiveKit/livekit.md).
- **Product decision (pre-settled):** LiveKit **Cloud** (not self-host) — product-decisions 2026-Q2, Status: Active (Railway is TCP-only; WebRTC needs UDP+TURN → Cloud SFU+TURN). NOT re-litigated.

## Reframe section
**problem-framer:** PROCEED (buildable-now, NOT credential-blocked; matched_antipatterns: []). Code-verified: greenfield VoiceModule; AuthGuard (verifySession) + `RbacService.canViewChannelById(userId, channelId)` (rbac.service.ts:428) to reuse; `channels.type` discriminator exists (schema/servers.ts:79) for the voice-channel check. Token-mint + unit tests build with a PLACEHOLDER key (assert JWT claims/grants/expiry, no live connection); client join renders/wires against @livekit/components-react with connect-on-demand (no live server). **2 build-shaping precisions for P-2/P-3:** (1) gate on `canViewChannelById` (channel-id-only), NOT the 2-param ChannelPermissionGuard (which reads serverId from req.params.id → 403 on the serverId-less voice-token route); mirror `ChannelMessageGuard`. (2) load the channel row to distinguish 404-missing from 403-non-voice/non-member (canViewChannelById returns false, doesn't throw, on missing).

**ceo-reviewer:** PROCEED (HOLD-SCOPE). Token-mint is the correct load-bearing first slice (de-risks the hardest infra: server-side short-lived room-scoped token keeping the API secret off the media path). LiveKit Cloud decided + the strategic cost decision made (product-decisions Active). Not a founder money-hard-stop at the strategic level. Op-note: verify LIVEKIT_* present in Railway before asserting live-connect (C-2/T infra-readiness).

**mvp-thinner:** THIN → **split occupancy (78f51968) to a future M6 wave** (fails trace test: metric is "drop in and talk," not "see who's inside first"). KEEP token-mint (foundation) + minimal client-join (the end-to-end de-risking slice). **Keep-OUT for the first voice wave (later M6 waves):** screen-share, low-bandwidth auto-downgrade, speaking/presence rings, multi-participant grid, reconnection, mic/cam toggle polish, occupancy. Floor: ~1,900 LOC / 2 specs (under multi-spec floor) → P-1 applies the standing override-ship precedent to the residual; do NOT re-bundle occupancy to floor-fill.

**Mediation outcome:** mvp-thinner WINS (M6-mvp-critical, zero done children) — ACCEPT the THIN split. Occupancy 78f51968 re-parented to NULL (future M6 seed). wave-31 claimed_task_ids = **[d8a85de0 (seed token-mint), 1dd1f2ca (client join)]**.

**Disposition:** PROCEED (reframed) — token-mint + minimal client-join; occupancy split out.

## ⚠️ Open escalation carried into gate — LiveKit credentials (surface, don't block)
**VERIFIED: `LIVEKIT_*` are NOT set in the Railway api service** (checked — 0 LIVEKIT vars), despite product-decisions saying "provisioned." The strategic decision (LiveKit Cloud) is settled, so the remaining gap is purely the **account-issued credentials** (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` server + `VITE_LIVEKIT_URL` client) — founder-supplied per rule 6 (I cannot self-generate them; LiveKit Cloud has a free tier).
- **This wave BUILDS without them** (token-mint + client are code/unit-verifiable with a placeholder key — problem-framer confirmed). NOT credential-blocked for the build.
- **The LIVE voice-connect verification (T-5 e2e actual connection + C-2 live deploy) NEEDS them.** Carry to T/C-2: verify LIVEKIT_* in Railway; if absent, code-verify + flag the credential need (like reminders' live-send was deferred). 
- **Proactive founder heads-up (NOT a pause):** surfaced to the founder so they can provision the LiveKit Cloud key/secret in parallel while I build the credential-independent core — so the live-connect isn't blocked when this wave reaches T/C-2. This is a proactive flag, not a rule-13 pause (the wave builds; no measured trigger fired).

## Final framing for P-block (multi-spec, claimed_task_ids = [d8a85de0, 1dd1f2ca])
- **seed d8a85de0:** VoiceModule + `POST /channels/:channelId/voice/token` — AuthGuard + `canViewChannelById` gate + load channel (404 if missing, 403 if non-voice/non-member) → mint a short-lived room-scoped LiveKit JWT (room = channel id; identity = userId; grants: join/publish/subscribe) signed with LIVEKIT_API_SECRET. Buildable with placeholder key; unit-test the JWT claims/grants/expiry. livekit-integration + node-specialist.
- **sibling 1dd1f2ca:** minimal voice-study-room client join surface (React, @livekit/components-react) — fetch token → connect-on-demand → minimal room UI (join/leave, audio; camera off default). Renders/wires without live server; live-connect needs creds. → likely design_gap (new UI) → D-block may fire (P-1 sets design_gap_flag). livekit-integration + react-specialist.
- **External SDK:** LiveKit (server `livekit-server-sdk` + client `@livekit/components-react`) — external-SDK-integration-rules at P-3; SDK docs present.

## Exit
Discovery + reframe complete. Scope = M6 first voice slice [d8a85de0 token-mint + 1dd1f2ca client-join]; occupancy split to future wave. LiveKit Cloud decided; creds NOT-in-Railway → build credential-independent core now + proactively flag the founder for the live-connect creds. design_gap likely TRUE (client UI) → P-1. → P-1 Decompose.
