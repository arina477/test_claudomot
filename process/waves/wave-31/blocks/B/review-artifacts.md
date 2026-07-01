# Wave 31 — B-block review artifacts

**Block:** B (Build) | **Wave topic:** M6 voice token-mint (server) + minimal voice-study-room client join | **Block exit gate:** B-6 | **Status:** gate-passed | **wave_type:** multi-spec | **branch:** wave-31-voice-token-mint

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + LiveKit deps (2.15.5/2.9.21); schema skip |
| B-1 | stages/B-1-contracts.md | skipped | no shared contract surface (inline {token,url}) |
| B-2 | stages/B-2-backend.md | done | VoiceModule token-mint (gate 404/400/403/503; await toJwt; dynamic ESM import); 425 unit; anti-pattern clean (448d5fa) |
| B-3 | stages/B-3-frontend.md | done | VoiceStudyRoom to adopted design (5 states, camera-off, connect-on-demand); routing wired; 13+267 tests (747b15c) |
| B-4 | stages/B-4-wiring.md | done | typecheck 4/4 + lint 0-err + build 3/3 |
| B-5 | stages/B-5-verify.md | done | api 425 + web 267 unit; build 3/3; live voice-connect deferred T-5/C-2 (creds) |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED; /review P1 enumeration-leak + 4 P2 FIXED (58aa145); APPROVE |

## Block-specific context
- **Spec contract:** multi-spec, primary d8a85de0 (2 blocks). claimed [d8a85de0 token-mint, 1dd1f2ca client].
- **Branch:** wave-31-voice-token-mint (from main fa31190). **Deps:** livekit-server-sdk 2.15.5 (api), @livekit/components-react 2.9.21 + livekit-client (web). No migration.
- **Adopted design:** design/voice-study-room.html (D-3) — B-3 builds to it.

## Binding B-block carries (P-4)
- **Security (T-8 in-scope):** token-mint gates AuthGuard + `canViewChannelById` (channel-id-only, NOT 2-param guard) + channel-load (404/403) + type='voice' (400). Short-lived room-scoped token. **API secret server-side ONLY — livekit-server-sdk NEVER imported in apps/web (anti-pattern guard test).** Runtime creds unset → 503 (not malformed token).
- **karen build-notes:** `toJwt()` is ASYNC → `await`; SDK is ESM-only → NestJS tsconfig `module: NodeNext` or dynamic import (verify B-0/B-4); assert JWT `exp` is bounded (not a specific hour).
- **LiveKit creds:** LIVEKIT_API_KEY/SECRET/URL NOT in Railway → build with PLACEHOLDER key (unit tests decode JWT, no live connect). Live-connect verification → T-5/C-2 (founder heads-up sent).
- **Client:** connect-on-demand (Join click, not on mount); mic + leave; camera OFF; error state; build to design/voice-study-room.html.
- **BUILD rule 7/8:** run biome check before commit.

## Open escalations carried into gate
- T-9: update journey F4 to audio-first slice + add token endpoint. L-1: correct product-decisions:387 stale "creds provisioned".

## Gate verdict log: <appended by head-builder at B-6>

## Block-exit handoff
```yaml
build_block_status: complete
branch: wave-31-voice-token-mint
stages_run: [B-0, B-2, B-3, B-4, B-5, B-6]
stages_skipped: [B-1 (no contract surface)]
d_block: complete (voice-study-room adopted)
review_verdict: APPROVE
fix_up_commits: [58aa145]
last_commit_sha: 58aa145
carry_to_L1: "404→403 spec reconciliation (security default-deny)"
carry_to_T5_C2: "LIVEKIT creds for live voice-connect (not set — founder heads-up)"
ready_for_ci: true
```
