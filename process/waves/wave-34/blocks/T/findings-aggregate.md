# Wave 34 — T findings aggregate

Active tiers this run: **T-8 Security** (deterministic token-grant re-probe), **T-5 E2E** (LIVE 2-participant voice — ceo NON-NEGOTIABLE), **T-6 Layout**. Gated at T-9 by a fresh head-tester.

## Live-verify headline (ceo mandate)
- **LiveKit connection established LIVE:** YES — two DISTINCT prod users (`21984eb2` A + `da74148e` B) reached `connected` in SFU room `RM_6mXtfPMddChR` on `wss://claudomat-test-sgf9259q.livekit.cloud` (server v1.13.1). Server-truth `listParticipants` = 2. First StudyHall wave to achieve a live LiveKit connection (w31/w32/w33 could not).
- **Screen-share publish server-ACCEPTED LIVE:** YES — A's SFU track set gained `SCREEN_SHARE/VIDEO` on share, lost it on stop; B rendered + reverted the prominent tile. Grant widening works at the SFU, not just in the JWT.
- **Audio invariant LIVE:** YES — `MICROPHONE/AUDIO` present on both participants at every step; fallback never touches audio by construction.
- **Audio-only degrade/restore LIVE:** NO — DEFERRED-TO-MANUAL (unwired manual toggle + non-headless auto trigger). Filed as high finding, not claimed green.

## T-8 Security — APPROVED
- Token-grant re-probe (LIVE): member A's minted JWT `canPublishSources=[microphone, screen_share, screen_share_audio]`, no camera, room-scoped, sub=A, TTL 3600s. Widening is live in the token.
- Auth matrix: unauth→401, malformed :id→400 (not 500, T-8 rule 2), missing→403, IDOR authed-non-member on B's real voice channel→403 vs allowed member→200. Gate NOT weakened.
- Secret grep (`87db7ec~1..87db7ec -- apps/api`): only the words secret/token in comments/tests/identifiers; zero committed values; `LIVEKIT_API_SECRET` stays server-side. CLEAN.

## T-5 E2E — APPROVED
- S1 both-join live connect — PASS (PROVEN-LIVE).
- S2 screen-share publish/subscribe/revert — PASS (PROVEN-LIVE): server-truth `[2/0]→[2/0,3/1]→[2/0]`; B tile render + clean revert, no orphan.
- S3 audio-only degrade/restore — DEFERRED-TO-MANUAL (blocked: manual toggle unwired + auto path non-headless).
- S3-AC4 audio invariant — PASS (PROVEN-LIVE).

## T-6 Layout — APPROVED
- Screen-share tile structural + token match vs design/screen-share-tile.html across 1440/1280/1024; no break.
- Token audit fully on-token (surface-950/800, radius-lg 8px, shadow.sm, max-w 1000px). token_violations: [].
- Audio-only banner live diff deferred (unreachable in prod build); component-level compliance only.

## Consolidated findings (for V-2 triage / head-verifier)
| Sev | Tier | Description | Route |
|---|---|---|---|
| **high** | T-5 S3 | Audio-only fallback has NO user-reachable trigger in prod: `enterManual()` implemented but not destructured/wired (VoiceStudyRoom.tsx:412), auto ConnectionQuality→Poor path non-deterministic. spec-2 AC1 "opts in via a manual toggle" is unverifiable live AND a real user cannot invoke audio-only. Banner + hook are otherwise complete + unit-tested. | V-2: wire the toggle (small B-3 add) → re-run S3; head-verifier adjudicates spec-2 AC1 MET-vs-partial. |
| low | T-5 S2 / T-6 | Screen-share tile aria-label `"Screen shared by "` + avatar chip render an empty name — LiveKit participant `.name` unset on mint; tile label/initials lack the identity/`Someone` fallback the sr-only announcer uses (VoiceStudyRoom.tsx:441). Cosmetic a11y label gap. | V-2: add fallback to tile label; not blocking. |
| info | T-5 S2 AC5 | Two-simultaneous-sharer behavior not exercised (single publisher this run). Single-share prominent path proven; multi-share by-construction takes `remoteScreenShareTracks[0]`. | V-2 note. |

## Teardown log (completed)
- Voice channel `840ce9bd-4204-4460-9503-e772a18a78fc` (`w34-voice-e2e`) — DELETED (verify=0).
- Throwaway server `aea7c21a-147b-4c00-be02-a7d798826750` (+ CASCADE channel `4a31cd1d-ed78-4ae5-badd-09659dafef14`) — DELETED (verify=0).
- Fixtures A/B — persistent, NOT deleted. Minted tokens self-expire (1h TTL). Temp LiveKit creds + tokens scrubbed from /tmp.
- Both browser participants left the room (`Leave`); rooms auto-close empty.
