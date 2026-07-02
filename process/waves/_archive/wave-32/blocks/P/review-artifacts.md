# Wave 32 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** M6 voice occupancy — who's-in-room indicator (server participants endpoint + client count/identities)
**Block exit gate:** P-4
**Status:** P-block COMPLETE (P-4 APPROVED) → D-block

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-32/stages/P-0-frame.md | done | PROCEED×3 (occupancy, credential-independent build); ceo LiveKit-creds flag SHARPENED → P-4 + founder ask; N-1 tripwire (3rd cred-blocked M6 → fork) |
| P-1 | process/waves/wave-32/stages/P-1-decompose.md | done | single-spec override-ship (atomic occupancy); design_gap_flag=TRUE → D-block (bounded occupancy indicator); LiveKit RoomServiceClient |
| P-2 | process/waves/wave-32/stages/P-2-spec.md | done | 7 ACs → 78f51968.description; participants endpoint (reuse gate + RoomServiceClient) + client poll indicator |
| P-3 | process/waves/wave-32/stages/P-3-plan.md | done | livekit-integration (B-2 participants + B-3 indicator); D-block fires; reuse wave-31 gate; B-1 skip |
| P-4 | process/waves/wave-32/blocks/P/gate-verdict.md | done | APPROVED — Phase 1 head-product + Phase 2 karen/jenny APPROVE + Gemini degradable-pass; → D-block |

## Block-specific context
- **Wave topic:** M6 who's-in-room occupancy (78f51968, the wave-31 mvp-thinner split-out). `GET /channels/:channelId/voice/participants` (session + membership/RBAC gate, same as the wave-31 token-mint) → `RoomServiceClient.listParticipants(channelId)` (explicit host/apiKey/secret per SDK gotcha #3; empty/absent room → empty list, not error). Client occupancy indicator (participant count + member identities, mapped identity=userId → StudyHall display; poll-refresh) on the voice-study-room entry. Keep-OUT: presence rings, speaking indicators, live animations (future).
- **Roadmap milestone:** M6 (8702a335) in_progress, Class=product-feature, Tier=T4. Completes the drop-in loop (see who's inside → join). M6 metric still not fully met after this (screen-share, audio-fallback future).
- **wave_db_id:** d25f8c47-7cff-430d-bbf2-3fc3bb68b093 (wave_number 32).
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **Builds on:** wave-31 VoiceModule + canViewChannelById gate + identity=userId token convention. External SDK: LiveKit (RoomServiceClient — server-side, api-only; SDK docs present).
- **DESIGN:** the occupancy indicator is a small UI on the voice-study-room entry surface (design/voice-study-room.html adopted wave-31) — P-1 judges whether it's a design_gap (small addition to the adopted surface) or reuses it.
- **⚠️ LiveKit creds (standing carry):** LIVEKIT_* still NOT in Railway → the participants endpoint reads live LiveKit occupancy → build credential-independent (mock RoomServiceClient in tests; endpoint 503/empty when unset) + live-verify deferred to T/C-2 (same as wave-31 token-mint; founder heads-up standing). NOT blocking the build.
- **Autonomous mode:** automatic.

## Open escalations carried into gate
- LiveKit creds for live occupancy verification (standing founder heads-up; not blocking).

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
