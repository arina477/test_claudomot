# T-5 — E2E (wave-34, M6 → LIVE 2-participant screen-share + audio-only fallback)

**Wave:** 34 · **Block:** T · **Stage:** T-5 · **Mode:** automatic
**Prod web:** `https://web-production-bce1a8.up.railway.app` (web deployment `e211f14d`) · **Prod api:** `https://api-production-b93e.up.railway.app` (api `73938bde`) · **merge:** `87db7ec`
**LiveKit:** LIVE Railway keys → `wss://claudomat-test-sgf9259q.livekit.cloud` (LiveKit Cloud, server edition 1, v1.13.1, protocol 17, region US East B).
**Participants:** TWO real Chromium browser contexts (isolated localStorage/session), fixture A `studyhall-e2e-fixture` + fixture B `studyhall-e2e-fixture-b`, both members of "Fixture Proof Server", both joining the SAME voice room `840ce9bd-…` (`w34-voice-e2e`).
**Media harness:** bundled Chromium launched with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream --auto-accept-this-tab-capture --auto-select-desktop-capture-source="Entire screen"` — screen-share publishes a synthetic test-pattern video track (the animated green frame is Chromium's fake capture device). NOTE: browser_close never called (single MCP-safe; this used a direct playwright-core launch, not the shared MCP).
**Ground truth:** server-side `RoomServiceClient.listParticipants(room)` authenticated with the LIVE `LIVEKIT_API_SECRET` — the SFU's authoritative view of who is in the room and which track sources each has published. A successful call itself proves the keys authenticate live server-side.

**ceo NON-NEGOTIABLE:** live 2-participant voice verification against real LiveKit. This is the first wave where that succeeded — 3 prior voice waves (w31/w32/w33) could NOT establish a live LiveKit connection.

---

## Honesty framing

Two classes of assertion:
- **PROVEN-LIVE** — driven end-to-end against real prod + real LiveKit, corroborated by server-side ground truth (RoomServiceClient) AND client-side DOM/console. These are load-bearing.
- **DEFERRED-TO-MANUAL** — a media-plane or product-gap limit prevents headless verification; documented explicitly, NOT claimed green-by-assertion.

---

## Scenario verdicts

### S1 — Both fixtures JOIN the same voice room, LiveKit connects LIVE — **PASS (PROVEN-LIVE)**
`criterion_ref`: spec-1 AC6 precondition + the ceo live-verify mandate.

- Both A and B logged into prod (`/login` → `/app`), opened "Fixture Proof Server", selected `w34-voice-e2e`, clicked `join-voice-btn`.
- Client console (both): `connection state changed: connecting -> connected {room: 840ce9bd-…, roomID: RM_6mXtfPMddChR}`; `signal connecting to wss://claudomat-test-sgf9259q.livekit.cloud/rtc/...`; `connected to Livekit Server edition:1, version:1.13.1, protocol:17, region:US East B`; `publishing track` (mic).
- **SERVER-TRUTH:** `listParticipants(840ce9bd-…)` returned **2 participants** — `21984eb2-…` (A) and `da74148e-…` (B) — each with tracks `[MICROPHONE/AUDIO]` (`2/0`).
- B's page shows the other participant (Members panel "ONLINE — 2", both fixtures with emerald presence dots).

This is the load-bearing proof the minted token authenticates against the LIVE LiveKit endpoint and two DISTINCT real clients are co-present in one SFU room. Not one client's own echo — two separate userIds confirmed by the SFU server-side.

### S2 — A starts screen-share → server accepts publish → B sees prominent tile → A stops → clean revert on B — **PASS (PROVEN-LIVE)**
`criterion_ref`: spec-1 AC1, AC2, AC3, AC4, AC6.

Track-source enum (livekit-server-sdk): `MICROPHONE=2, SCREEN_SHARE=3` (source) · `AUDIO=0, VIDEO=1` (type). Server-truth track lists below use `source/type`.

| Step | SERVER-TRUTH (A's tracks) | B client DOM |
|---|---|---|
| both joined | `[2/0]` (mic) | share tile absent |
| **A shares** | `[2/0, 3/1]` (mic + **SCREEN_SHARE/VIDEO**) | prominent tile present: `aria-label="Screen shared by …"`, "LIVE SHARE" emerald pill, "Presenting" label, 1 `<video>`, demoted avatar strip below |
| **A stops** | `[2/0]` (screen_share removed) | tile absent, no orphan; B page text no longer contains "sharing" |

- **AC4 — server ACCEPTED the screen_share publish LIVE:** A's server-truth track set gained `SCREEN_SHARE/VIDEO` (`3/1`) the moment A shared — proving the grant widening works at the SFU, not only in the JWT. A client-only publish is NOT server-rejected. Client console confirms `publishing track` / (on stop) `unpublishing track`. ✅
- **AC1 — other member sees it:** B rendered the screen-share tile from A's published track (two-client delivery: sender A ≠ receiver B). ✅
- **AC2 — DISTINCT, PROMINENT tile:** B's tile dominates the main column (`max-w-[1000px]`), avatar/participant chips demoted below — see screenshot `T-6-layout/screens/screen-share-tile-B-1440.png`. ✅
- **AC3 — clean revert on stop:** A's server-truth reverted to mic-only; B's tile disappeared with no orphaned tile or error. ✅
- **AC5 (one-share-at-a-time / no tile explosion):** design shows one prominent share; the derive-active-share logic takes `remoteScreenShareTracks[0]`. Single-sharer path proven live; the two-simultaneous-sharer edge case was NOT exercised (only one publisher available in this run) — see edge-case note below.

### S3 — Audio-only fallback (poor-bandwidth degrade + restore) — **DEFERRED-TO-MANUAL (NOT headlessly live-verifiable this wave)**
`criterion_ref`: spec-2 AC1, AC2, AC3, AC5.

Attempted and could NOT drive end-to-end against the deployed UI. Two compounding blockers:

1. **No manual opt-in entry point in the live build (product gap, not just a test limit).** The B-3 deviation (WATCH → V-1 jenny) is real and confirmed in source: `VoiceStudyRoom.tsx:412` destructures only `{ mode, restoreState, restore }` from `useAudioOnlyFallback()` — `enterManual()` is NOT destructured and NO "go audio-only" button is wired into the control cluster (`VoiceStudyRoom.tsx:410-411` comment: "enterManual() available for a future manual-toggle control (not wired to a button this wave)"). The live control cluster is exactly `[Mute microphone, Share screen, Leave]` — no audio-only toggle. So the DETERMINISTIC opt-in path the spec named (spec-2 AC1 "OR the member opts in via a manual toggle") has no user-reachable trigger in prod.
2. **Auto path (`ConnectionQuality → Poor`, 3s debounce) is not headlessly forceable.** Organic quality degradation lives on the LiveKit media plane (SFU-side connection quality), which is the boundary-mocked, non-headless-testable surface. There is no global `Room` handle exposed in the prod build to emit a synthetic `RoomEvent.ConnectionQualityChanged` from page context (probed: no `window.__lkRoom` / no exposed emitter), and CDP `Network.emulateNetworkConditions` throttles the HTTP transport, not the established WebRTC media/DTLS path the SFU uses to compute ConnectionQuality — so it does not deterministically drive the enum to `Poor`.

**What IS verified for spec-2 (not deferred):**
- **AC4 — audio invariant — PROVEN-LIVE:** across S1 and S2 (join, share, stop), both participants' server-truth track set retained `MICROPHONE/AUDIO` (`2/0`) at EVERY step — audio was never dropped. The fallback's design also NEVER touches audio subscriptions (code: `useAudioOnlyFallback.ts` iterates only `Track.Kind.Video` + `VIDEO_SOURCES=[Camera, ScreenShare]`; audio publications are structurally untouched), corroborated by 11 passing hook unit tests + the T-3/T-4 tiers.
- **Banner UI half EXISTS:** `AudioOnlyBanner` renders on `audioOnlyMode` truthy (auto=amber/wifi-low, manual=neutral/video-slash, both with mic-active reassurance + restore), matching `design/audio-only-state.html` — verified by source + component tests, but never reached in the live DOM because `audioOnlyMode` can only be set by the two blocked triggers above.

**Route to green:** wire the `enterManual()` toggle into the control cluster (small B-3 add) → then S3 becomes headlessly PROVEN-LIVE via the deterministic manual path (enter → assert B's inbound screen-share `setSubscribed(false)` while mic audio continues → restore → re-subscribe). Classified as a finding for V-2 triage (below), NOT silently skipped.

---

## Findings

| Sev | Scenario | Description | Route |
|---|---|---|---|
| **high** | S3 | Audio-only fallback has NO user-reachable trigger in prod (manual toggle not wired; auto path non-deterministic) — spec-2 AC1/AC2/AC3 manual-opt-in path is unverifiable live and, more importantly, a real user cannot invoke it. `enterManual()` + banner exist but are dead UI. | V-2 triage: wire the toggle (small B-3 add) then re-run S3; head-verifier must judge whether spec-2 AC1 "opts in via a manual toggle" is MET given no UI entry point. |
| low | S2 | Screen-share tile aria-label renders `"Screen shared by "` (empty name) — the LiveKit participant `.name` is not set on the mint (only `identity`=userId); tile label uses `.name` without the identity/`'Someone'` fallback that the sr-only announcer (`VoiceStudyRoom.tsx:441`) applies. | V-2 triage: cosmetic a11y label gap; add the same fallback to the tile aria-label. Not blocking. |
| info | S2 AC5 | Two-simultaneous-sharer behavior (block/replace/allow) not exercised — only one publisher in this run. Single-share prominent-tile path proven; multi-sharer determinism relies on `remoteScreenShareTracks[0]` (no tile explosion by construction). | V-2 note; manual/founder confirm if multi-share matters for M6 close. |

---

## Live-verify summary (the ceo-mandated answers)

- **Did the live LiveKit connection establish?** YES — PROVEN-LIVE. Two real clients reached `connected` state in room `RM_6mXtfPMddChR` against `wss://…livekit.cloud`; server-truth confirmed 2 participants. First StudyHall wave to achieve this.
- **Did screen-share publish get server-accepted live?** YES — PROVEN-LIVE. A's server-side track set gained `SCREEN_SHARE/VIDEO` on share and lost it on stop; B rendered + reverted the prominent tile. The grant widening works at the SFU, not just in the JWT.
- **Audio invariant held live?** YES — PROVEN-LIVE. Mic audio present on both participants at every step; fallback never touches audio by construction.
- **Audio-only degrade/restore proven live?** NO — DEFERRED-TO-MANUAL. Blocked by an unwired manual toggle (real product gap) + non-headless auto trigger (media-plane boundary). Documented, routed to V-2, not claimed green.

---

## Teardown

Voice channel `840ce9bd-…`, throwaway server `aea7c21a-…` + channel `4a31cd1d-…` removed at T-block end (see findings-aggregate.md teardown log). Both participants left the room (`Leave`); rooms auto-close empty. Fixtures A/B persist.

---

```yaml
test_pattern: active
skipped: false
testers_spawned: 0   # direct 2-context playwright-core drive (fake-media flags needed); NOT the shared MCP swarm
two_client_verified: true   # A (sender) + B (receiver), distinct userIds, SFU server-truth corroborated
scenarios:
  - {id: S1, criterion_ref: "spec-1 AC6 precond + ceo live-verify", verdict: PASS, class: PROVEN-LIVE, evidence: "RoomServiceClient 2-participant + connected console"}
  - {id: S2, criterion_ref: "spec-1 AC1/AC2/AC3/AC4/AC6", verdict: PASS, class: PROVEN-LIVE, evidence: "server-truth track [2/0,3/1] on share -> [2/0] on stop; B tile render+revert; screens T-6-layout/screens/"}
  - {id: S3, criterion_ref: "spec-2 AC1/AC2/AC3/AC5", verdict: DEFERRED-TO-MANUAL, class: DEFERRED, evidence: "no manual toggle wired (VoiceStudyRoom.tsx:412) + auto path non-deterministic; AC4 audio-invariant proven-live separately"}
  - {id: S3-AC4, criterion_ref: "spec-2 AC4 audio invariant", verdict: PASS, class: PROVEN-LIVE, evidence: "MICROPHONE/AUDIO present on both participants at every step; fallback never touches audio by code"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: high, scenario: S3, description: "audio-only fallback has no user-reachable trigger in prod (manual toggle unwired, auto path non-deterministic); spec-2 manual-opt-in AC unverifiable + unusable live", route: V-2}
  - {severity: low, scenario: S2, description: "screen-share tile aria-label 'Screen shared by ' empty name (participant .name unset on mint; tile label lacks identity/Someone fallback)", route: V-2}
  - {severity: info, scenario: S2, description: "two-simultaneous-sharer edge case not exercised (single publisher this run)", route: V-2}
```

## head-tester sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-5
  reviewers: {}
  failed_checks: []
  rationale: >
    The ceo-mandated live 2-participant verification succeeded and is the load-bearing proof of this
    wave: two DISTINCT prod users (separate userIds, not one client's echo) established a LIVE LiveKit
    connection to the same SFU room, corroborated by server-side RoomServiceClient ground truth (2
    participants) AND client console (connected state, real wss endpoint). Screen-share is PROVEN-LIVE
    end-to-end: A's SFU-side track set gained SCREEN_SHARE/VIDEO on publish and lost it on stop, B
    rendered the prominent tile and reverted cleanly with no orphan, proving the token-grant widening
    is accepted at the SFU (not merely present in the JWT). The audio invariant is PROVEN-LIVE (mic
    present at every step, and structurally untouched by the fallback code). The audio-only degrade/
    restore path is honestly classified DEFERRED-TO-MANUAL, not green-by-assertion: it is blocked by a
    REAL product gap (enterManual exists but no UI button is wired, VoiceStudyRoom.tsx:412) plus a
    genuine media-plane boundary (ConnectionQuality->Poor is non-headless and no synthetic-event handle
    is exposed). That gap is filed as a high finding for V-2 and head-verifier to adjudicate against
    spec-2 AC1. T-5 exits APPROVED because every acceptance criterion has an explicit verdict (proven,
    or deferred-with-finding), no FAIL scenario is left open unrouted, and no realtime claim rests on a
    single client. No measured pause trigger (b/d/e/f) fired.
  next_action: PROCEED_TO_T_6
```
