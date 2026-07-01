# Wave 31 — T-block review artifacts
**Block:** T (Test) | **Wave topic:** M6 voice token-mint + client join (LIVE; live-voice-connect creds-deferred) | **Block exit gate:** T-9 | **Status:** gate-passed

## Stages
| Stage | Status | Notes |
|---|---|---|
| T-1 static | done | CI typecheck+lint green (cc5929c); 0 ts-bypasses in voice diff |
| T-2 unit | done | api 425 (14 voice, JWT decode + gate) + web 269 (13 voice, 5 states + teardown); mutation-genuine |
| T-3 contract | skipped | inline {token,url} DTO; no shared/Zod/OpenAPI change |
| T-4 integration | judged | no new real-PG test; unit gate-order + live T-8 authz probe judged sufficient (canViewChannelById already wave-12 integration-tested) |
| T-5 e2e | done (deferred live-connect) | creds-independent states verified (unauth 401 route-flip; 503→error-state); LIVE voice connection DEFERRED (LIVEKIT creds unset; media plane not headless-testable) |
| T-6 layout | judged | pre-join + error states match adopted design; in-room-populated deferred (needs live SFU) |
| T-7 perf | skipped | not heavy |
| T-8 security | done (KEY) | uniform-403 enumeration-safe gate (live 403 on random UUID); secret server-side (no livekit-server-sdk/VITE_ in web); audio-scoped grant (canPublishSources=[MICROPHONE]); short-lived room-scoped; verified-fixture authz probe |
| T-9 journey | done | F4 already audio-first (D-block regen) + token endpoint inventoried; annotation-confirm |

## Carries
- **L-1:** 404→403 spec/doc reconciliation (missing channel now uniform 403 default-deny) — update d8a85de0 controller-spec "missing channel" case (F-31-T-2 fictional-404), controller JSDoc + useVoiceToken.ts 404 handling (F-31-T-3).
- **V-2:** F-31-T-1 (MEDIUM, PRE-EXISTING/wave-wide) malformed non-UUID channelId → 500 (canViewChannelById uuid-column 22P02; same on existing wave-12 messages route). No leak/bypass. → bug-security backlog; tracked task 4a92327c (ParseUUIDPipe project-wide) already exists. NOT a hard-stop.
- **T-5/future:** live voice-connect needs LIVEKIT creds (founder heads-up sent).
