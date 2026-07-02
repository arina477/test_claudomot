# V-1 — karen (wave-34, StudyHall: screen-share + audio-only fallback)

**Wave:** 34 · **Block:** V · **Stage:** V-1 (Review, karen lane) · **Mode:** automatic
**Merge under review:** `87db7ec` (PR #47) · **Prod api:** `73938bde` (`api-production-b93e`) · **Prod web:** `e211f14d` (`web-production-bce1a8`)
**Scope of this lane:** LOAD-BEARING-CLAIM reality check against the DEPLOYED prod state. NOT spec conformance (jenny's lane). NOT fixing (V-3's job). Every verdict below is claim → independently-checked evidence.

**VERDICT: APPROVE**

The four load-bearing claims (screen-share LIVE, grant widened + deployed, deploy real, leak-fixes shipped) all hold under independent verification against the merge tree and the live prod endpoints. The audio-only-unwired gap is confirmed as a REAL, factual product gap (not karen-fabricated) — flagged below for jenny's spec-conformance adjudication, not as a karen reject.

---

## Claim-by-claim

### 1. Files exist on merge 87db7ec — CONFIRMED
`git cat-file -e 87db7ec:<path>` returns present for all four:
- `apps/api/src/voice/voice-token.service.ts` ✅
- `apps/web/src/shell/VoiceStudyRoom.tsx` ✅
- `apps/web/src/shell/useAudioOnlyFallback.ts` ✅
- `apps/web/src/shell/icons.tsx` ✅

Not asserted — read off the merge tree object store directly.

### 2. Grant widening REAL + on the merge tree, and DEPLOYED — CONFIRMED
- **Merge tree source** (`git show 87db7ec:…/voice-token.service.ts`): `canPublishSources: [TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO]` (lines 140–143). Not a comment — the live grant array.
- **Diff vs parent** (`87db7ec~1..87db7ec`) proves it is a *this-wave change*, not pre-existing: `- canPublishSources: [TrackSource.MICROPHONE]` → `+ [MICROPHONE, SCREEN_SHARE, SCREEN_SHARE_AUDIO]`. Diff stat: 1 file, +12/-5 — a surgical grant widening, no scope creep in the api diff.
- **T-8 not fabricated:** T-8's decoded live JWT (member A, real prod mint, HTTP 200) shows `canPublishSources: ["microphone","screen_share","screen_share_audio"]`, room-scoped to the requested channel, `sub`=caller, `exp-nbf`=3600s, no `camera`. The decoded payload is internally consistent (room-scoped + TTL-bounded + identity-bound) and matches the source grant exactly. Independent unauth reprobe of the same endpoint returns **401** (auth-first), consistent with T-8's gate-unchanged claim.

### 3. Screen-share LIVE (the headline) — CONFIRMED GENUINE, not asserted
T-5 evidence is real and load-bearing-grade:
- **Two DISTINCT prod users, server-corroborated:** `RoomServiceClient.listParticipants(840ce9bd-…)` = **2 participants** (`21984eb2` = A, `da74148e` = B) in SFU room `RM_6mXtfPMddChR` on `wss://…livekit.cloud`. This is SFU server-truth (authenticated with the live `LIVEKIT_API_SECRET`), not one client's self-echo — two separate userIds confirmed server-side.
- **Publish server-ACCEPTED (the grant works at the SFU, not just in the JWT):** A's server-truth track set changed `[2/0]` (mic) → `[2/0, 3/1]` (mic + SCREEN_SHARE/VIDEO) on share, then reverted to `[2/0]` on stop. A client-only publish would be *server-rejected* if the grant were narrow — the track set change proves the widening is honored at the SFU.
- **Two-client delivery:** sender A (`21984eb2`) ≠ receiver B (`da74148e`); B rendered the prominent tile from A's published track and reverted cleanly with no orphan (layout screenshot `T-6-layout/screens/screen-share-tile-B-1440.png`).

This is the "voice actually works live" claim and it is corroborated by BOTH server-side ground truth AND client DOM. First StudyHall wave to establish a live LiveKit connection (3 prior voice waves could not). Genuine.

### 4. Resource-leak fixes (B-6 rework) SHIPPED — CONFIRMED on merge tree
- **`<VideoTrack>` (SDK-managed lifecycle, no manual attach):** `VoiceStudyRoom.tsx:795` renders `<VideoTrack>`; imported at :40; comment at :794 "SDK-managed attach/detach lifecycle; no manual ref needed". Zero `.attach(`/`.detach(` calls in the file. The prior manual-attach leak path is gone.
- **Restore timer ref-tracked + cleared:** `useAudioOnlyFallback.ts` — `restoreTimerRef` (`useRef`, :73); cleared on unmount (:149–151); cancelled-before-restart inside `restore()` (:172–174, idempotent). `poorTimerRef` (:69) similarly cleared (:129, :145). No dangling timers.
- **Unmount disconnect:** `VoiceStudyRoom.tsx:489–498` — unmount effect calls `roomRef.current.disconnect()` ("no leaked LiveKit connection / mic-hot-after-leave"). Tested (see #7).

### 5. Deploy REAL — CONFIRMED by independent live probe (not fabricated)
C-2 claims both services SUCCESS on 87db7ec with distinct deployment ids + digests (api `73938bde`/`c38ac4ed…`, web `e211f14d`/`d23f0a29…`), each distinct from the pre-deploy baselines (api `6111a6ab`/`4fec6143…`, web `c34c3bd1`/`64686633…`). I independently probed the live endpoints RIGHT NOW:
- `GET /channels/not-a-uuid/voice/participants` unauth → **HTTP 401** (voice route registered, guard-first — not 500, not 404)
- `GET /health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (clean boot on widened grant + live keys)
- `GET /this-route-does-not-exist-xyz` → **404** (the 401 is route-specific, not a blanket catch-all)
- web `GET /` → **200**

The route-flip 401 + route-specific 404 control is the load-bearing not-fabricated signal, and it reproduces live. Deployment ids referenced across T-5, T-8, and C-2 all match (api 73938bde, web e211f14d). Real deploy, real serving revisions.

### 6. Antipattern — audio-only `enterManual()` unwired — CONFIRMED (real HIGH gap, not karen-fabricated)
This is a genuine gap, verified in source on the merge tree:
- **Hook DOES export it:** `useAudioOnlyFallback.ts:46` (`enterManual: () => void` in the return type) + `:188` (`return { mode, restoreState, enterManual, restore }`). Implementation exists (:160 `enterManual = useCallback(...)`) and is unit-tested (see #7).
- **View does NOT wire it:** `VoiceStudyRoom.tsx:412` destructures ONLY `{ mode, restoreState, restore }` — `enterManual` is deliberately NOT pulled. Explicit comment at :410–411: "enterManual() available for a future manual-toggle control (not wired to a button this wave…)".
- **Control cluster is exactly [mute, share, leave], NO audio-only toggle:** mic toggle aria-label `Mute microphone`/`Unmute microphone` (:657); share toggle (:696); Leave button `data-testid=leave-voice-btn` (:729–760). No fourth "go audio-only" control exists in the cluster.

Consequence (factual): the `AudioOnlyBanner` (:1056) + the whole manual-opt-in path are **dead UI in prod** — a real user has no button to reach audio-only mode, and the auto (`ConnectionQuality→Poor`) path is not headlessly forceable (T-5 S3 DEFERRED-TO-MANUAL, correctly classified — NOT green-by-assertion). This confirms T-5's `high` finding is accurate. **Whether this fails spec-2 AC1 ("member opts in via a manual toggle") is jenny's spec-conformance call, not karen's** — I confirm only that the gap is real and load-bearing-adjacent, not fabricated.

### 7. No test theater — CONFIRMED
Real assertions, zero `expect(true)` across the wave-34 test surface:
- `apps/api/src/voice/voice-token.service.spec.ts` — 30 `expect()`, 0 theater, 5 assert `screen_share` (grant array).
- `apps/web/src/shell/useAudioOnlyFallback.test.tsx` — 24 `expect()`, 0 theater, 21 touch `audio`/`setSubscribed` (the audio-never-dropped invariant + video-only-unsub). Confirms `enterManual` implementation is exercised even though unwired.
- `apps/web/src/shell/voice-study-room.test.tsx` — 65 `expect()`, 0 theater. Covers screen-share button/toggle/aria-pressed, OwnShareView render + revert, and the **unmount-cleanup** test (:336–352: `unmount()` → asserts `mockDisconnect` called — proves the leak-fix is *tested*, not just written). `<VideoTrack>` is mocked (:78) confirming the component consumes it.
- Total 790 (api 468 + web 322) per T-2, of which 22+ are new wave-34 assertions. The assertions target real behavior (grant contents, audio invariant, unmount cleanup), not tautologies.

---

## Findings (karen lane)

| Sev | Claim | Reality | Note |
|---|---|---|---|
| — | screen-share LIVE | HOLDS — 2-client SFU server-truth + track-set change on publish/revert | Load-bearing, genuine |
| — | grant widened + deployed | HOLDS — merge-tree source + diff-vs-parent + live JWT (T-8) + independent 401 reprobe | Genuine |
| — | deploy real | HOLDS — independent live probe (401/200/404/200) reproduces C-2 | Not fabricated |
| — | leak-fixes shipped | HOLDS — `<VideoTrack>` + ref-tracked+cleared timers + unmount-disconnect (tested) | Genuine |
| HIGH (confirm, not raise) | audio-only manual opt-in | REAL GAP — `enterManual()` exists + unit-tested but NOT wired to any control; banner is dead UI in prod; auto path non-deterministic | Factual confirmation of T-5's high finding. Spec-conformance adjudication → **jenny / V-2 triage**, not a karen reject |

No test theater. No acceptance-by-assertion in the load-bearing claims. No fabricated deploy. No single-client realtime masquerade (two distinct SFU userIds).

## Why APPROVE (karen rationale)

Every load-bearing claim survives independent verification, not just doc-reading:
- The grant widening is on the merge tree AND proven live in a real minted token AND accepted at the SFU (track-set changed) — three independent corroborations, not one assertion.
- Screen-share LIVE rests on server-side ground truth from two DISTINCT userIds, not a client echo.
- The deploy reproduces under my own curl probes right now (401 route-flip + 404 control + 200 health/web).
- The leak-fixes are in source AND covered by a real unmount-cleanup assertion.
- The one real gap (audio-only unwired) is honestly disclosed by T-5 as DEFERRED-TO-MANUAL with a `high` finding — it is NOT dressed up as green. karen's job is to catch the *opposite* (claiming done when not); here the team under-claimed the gap correctly.

The audio-only-unwired item is a factual product gap that karen confirms is real; whether it blocks the wave against spec-2 AC1 is jenny's call. karen does not reject on it because the wave's headline claims (voice/screen-share actually works live, grant deployed, no leaks) are all true.

```yaml
karen_verdict: APPROVE
stage: V-1
lane: karen
merge: 87db7ec
prod: {api: 73938bde, web: e211f14d}
load_bearing_claims:
  - {claim: "files exist on merge", status: HOLDS, evidence: "git cat-file -e 87db7ec — all 4 present"}
  - {claim: "grant widened + deployed", status: HOLDS, evidence: "merge-tree canPublishSources[MICROPHONE,SCREEN_SHARE,SCREEN_SHARE_AUDIO] + diff-vs-parent proves this-wave change + T-8 live JWT + independent unauth 401 reprobe"}
  - {claim: "screen-share LIVE", status: HOLDS, evidence: "RoomServiceClient 2 distinct userIds (21984eb2/da74148e) in RM_6mXtfPMddChR; A track-set [2/0]->[2/0,3/1] on share->[2/0] on stop; B tile render+revert — server-truth, not client echo"}
  - {claim: "leak-fixes shipped", status: HOLDS, evidence: "<VideoTrack> :795 (no manual attach); restoreTimerRef ref-tracked+cleared :73/:149-151/:172-174; unmount disconnect :489-498 (tested :336-352)"}
  - {claim: "deploy real", status: HOLDS, evidence: "INDEPENDENT live probe: voice-route 401 + control 404 + /health 200 + web 200; deploy ids match across T-5/T-8/C-2"}
  - {claim: "no test theater", status: HOLDS, evidence: "790 tests (api 468 + web 322), 0 expect(true); token-spec 5x screen_share; hook 21x audio/setSubscribed; render 65 assertions incl unmount-cleanup"}
findings:
  - {severity: high, item: "audio-only enterManual() unwired", karen_fabricated: false, reality: "exists + unit-tested, NOT wired to control cluster [mute,share,leave]; banner dead UI in prod; auto path non-deterministic", route: "jenny spec-conformance (spec-2 AC1) + V-2 triage", karen_action: "confirm-only, not reject"}
independent_probes_run: true
fabrication_detected: false
single_client_realtime_masquerade: false
next: V-1 jenny (spec conformance) -> V-2 triage
```
