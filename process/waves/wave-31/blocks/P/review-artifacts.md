# Wave 31 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** M6 voice/video study rooms — FIRST wave: LiveKit token-mint (server-side) + minimal client join surface + occupancy
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-31/stages/P-0-frame.md | done | PROCEED (buildable-now); mvp THIN split occupancy→future; LiveKit Cloud decided; CREDS NOT in Railway → build core now + proactive founder heads-up for live-connect |
| P-1 | process/waves/wave-31/stages/P-1-decompose.md | done | multi-spec (2, occupancy split); override-ship residual; design_gap_flag=TRUE → D-block FIRES (voice-room UI); LiveKit SDK |
| P-2 | process/waves/wave-31/stages/P-2-spec.md | done | 2 spec blocks → d8a85de0.description; token-mint (session+RBAC+voice-type, secret server-side) + client join; design_gap=TRUE |
| P-3 | process/waves/wave-31/stages/P-3-plan.md | done | livekit-integration (B-2 token-mint + B-3 client); D-block fires (voice-room UI); LiveKit SDK pre-build; B-1 skip |
| P-4 | process/waves/wave-31/blocks/P/gate-verdict.md | done | head-product APPROVED; karen+jenny APPROVE; Gemini 429; gate-passed. Carries: toJwt-async/ESM, T-8, D-block next, LiveKit creds T-5/C-2 |

## Block-specific context
- **Wave topic:** M6's first bundle — start voice/video. seed d8a85de0 (VoiceModule LiveKit token-mint: server-side, after SuperTokens session + RBAC → short-lived room-scoped LiveKit token) + siblings 1dd1f2ca (minimal client join surface) + 78f51968 (who's-in-room occupancy indicator). ~2,200 LOC (decomposer estimate).
- **Roadmap milestone:** M6 (8702a335) in_progress (promoted at wave-30 N-block after M5 closed). Class=product-feature, Tier=T4. Metric: "students drop into a Study Room voice channel, talk + screen-share, degrade to audio-only gracefully on poor bandwidth."
- **wave_db_id:** a2bd7814-4de0-483a-9c21-6d86661adf05 (wave_number 31).
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **External SDK: LiveKit** — `livekit-integration` specialist in AGENTS.md; SDK docs at command-center/dev/SDK-Docs/LiveKit/livekit.md. external-SDK-integration-rules apply at P-3.
- **DESIGN:** the client join surface + occupancy are new UI (design/voice-study-room.html referenced) → **design_gap_flag likely TRUE** → D-block may fire (P-1 sets it).
- **⚠️ INFRA/CREDENTIAL/COST DECISION (surface at P-0):** M6 `## Scope` names "self-host-on-Railway vs LiveKit Cloud decision + cost." LiveKit Cloud needs account-issued `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` (founder-supplied per rule 6) + usage-based billing (a money commitment → always-on hard-stop even under automatic). Self-host avoids the account but is Railway infra. The reframe trio (esp. ceo-reviewer) must surface whether: (a) THIS wave (token-mint code + tests) is buildable without live credentials (mock/local-key in tests), deferring the live-connect + credential/cost decision to a later wave; OR (b) it needs the founder's LiveKit-Cloud-vs-self-host + credential/cost call NOW (Tier-3 → BOARD under automatic, OR money-hard-stop → founder). Prior art: product-decisions may carry a LiveKit-Cloud decision (jenny referenced "LiveKit Cloud decided 2026-Q2") — VERIFY.
- **Tier-3 product decisions this wave:** the LiveKit infra/cost decision (above). Autonomous mode: automatic.

## Open escalations carried into gate
<to be set by P-0 reframe — likely the LiveKit Cloud-vs-self-host + credential/cost decision>

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
