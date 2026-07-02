# V-1 — jenny (wave-34, M6 FINAL: screen-share + audio-only fallback)

**Wave:** 34 · **Block:** V · **Stage:** V-1 (spec-conformance review, parallel with Karen) · **Mode:** automatic
**Reviewer:** jenny (independent spec-vs-deployed-behavior verifier)
**Prod under review:** web `e211f14d` · api `73938bde` · merge `87db7ec` · LiveKit `wss://claudomat-test-sgf9259q.livekit.cloud`
**Authoritative spec:** `tasks` rows `e9cd341a` (screen-share) + `61e52c3e` (audio-only), read live from DB this stage.
**Scope discipline:** I verify DEPLOYED BEHAVIOR matches SPEC-CONTRACT INTENT. I do NOT re-verify Karen's source-claim truth (whether `VoiceStudyRoom.tsx:412` really destructures what T-5 says). I do NOT fix. I classify each miss as spec-DRIFT (code wrong vs spec) or spec-GAP (spec/design wrong).

---

## VERDICT: **REJECT** — spec-2 (audio-only) is PARTIAL, and it is spec-DRIFT that blocks M6-close as currently framed.

Spec-1 (screen-share) is fully **MET live**. Spec-2 (audio-only fallback) is **PARTIAL**: 2 of 5 ACs are met, AC1's manual-opt-in path and AC5's live-verify are NOT met because the manual toggle has no user-reachable entry point in prod. This is **spec-DRIFT** (the code/design under-delivered against a requirement the spec AND the D-1 brief §6 AND the mvp-thinner all explicitly named), NOT spec-GAP. Because the milestone success metric's "degrades to audio-only gracefully on poor bandwidth" clause has NO working user path in the deployed build, **M6 cannot honestly close on this wave's shipped state without disposition** (V-3 fast-fix wire-the-toggle, or an explicit founder/ceo scope acceptance recorded as a decision). Detail below.

---

## SPEC 1 — Screen-share (`e9cd341a`) — **MET (all 6 ACs), APPROVE**

| AC | Spec intent | Deployed evidence | Verdict |
|---|---|---|---|
| AC1 | Member starts share → track published, others see it | T-5 S2 PROVEN-LIVE: A (sender `21984eb2`) publishes; B (receiver `da74148e`, distinct userId) renders it. Two-client, sender≠receiver, SFU-corroborated. | **MET** |
| AC2 | Renders as DISTINCT, PROMINENT tile | T-5 S2 + T-6: B's tile dominates main column (`max-w-[1000px] mx-auto`), "LIVE SHARE" emerald pill, "Presenting" label, avatar strip demoted below; screenshots at 1440/1280/1024, structural + token match vs `design/screen-share-tile.html`, 0 token violations. | **MET** |
| AC3 | Stop → clean revert, no orphan tile/error | T-5 S2: A's server-truth track set reverts `[2/0,3/1]`→`[2/0]`; B tile disappears, no orphan, B page text loses "sharing". | **MET** |
| AC4 | Token grant permits `screen_share` (member) / non-member can't mint | T-8 PROVEN-LIVE: member A's real prod JWT decodes `canPublishSources:[microphone,screen_share,screen_share_audio]`, no camera, room-scoped, 1h TTL, sub=A. **Server ACCEPTED the publish at the SFU** (A's track set gained `SCREEN_SHARE/VIDEO`), so the widening works at the SFU not just the JWT. Non-member mint → 403; IDOR pair 403/200 on a REAL private channel; wave-31 uniform-403 intact. | **MET** |
| AC5 | One share at a time / deterministic multi-share, no tile explosion | Deployed derives active share as `remoteScreenShareTracks[0]` → single prominent tile by construction (no unbounded explosion). Two-simultaneous-sharer NOT exercised live (single publisher this run) — INFO carry, not a spec miss: the AC + mvp-thinner scope to "only one active screen-share at a time", which the deployed behavior satisfies. | **MET** (multi-sharer edge is info-only) |
| AC6 | LIVE-VERIFIED 2-participant (ceo non-negotiable) | T-5 S1+S2: two DISTINCT prod users, live LiveKit connection, `RoomServiceClient.listParticipants`=2, publish/subscribe/revert all corroborated by server-truth AND client DOM. First live LiveKit connection in StudyHall history. | **MET** |

**Keep-OUT conformance (spec-1):** No annotation/drawing, no multi-share grid, no quality/resolution selector, no custom window-picker (browser-native `getDisplayMedia`), no recording. B-3 + D-3 evidence confirms none were built. **CLEAN — no gold-plate.**

**Spec-1 low carry (non-blocking, already filed):** screen-share tile aria-label renders `"Screen shared by "` (empty name — LiveKit participant `.name` unset on mint; tile label lacks the identity/`Someone` fallback the sr-only announcer uses). Cosmetic a11y, does not affect any AC. → V-2/V-3 (LOW).

**Spec-1 disposition: APPROVE.** Every AC met with load-bearing two-client live evidence; keep-out clean.

---

## SPEC 2 — Audio-only fallback (`61e52c3e`) — **PARTIAL (2/5 ACs met), spec-DRIFT, BLOCKS M6-close as framed**

### AC-by-AC

| AC | Spec intent | Deployed evidence | Verdict |
|---|---|---|---|
| AC1 | On ConnectionQuality→Poor **OR manual toggle** → inbound video unsubscribed, audio uninterrupted | Hook `useAudioOnlyFallback` implements BOTH the auto path (debounced 3s ConnectionQuality→Poor → `setSubscribed(false)` on video, audio untouched) and `enterManual()`. **BUT** `enterManual()` has NO control-cluster button in prod — live control cluster is `[Mute mic, Share screen, Leave]` (T-6 confirms this exact cluster in the live capture). The auto path is on the non-headless LiveKit media plane. So: **the manual-opt-in half of AC1 has no user-reachable trigger; the auto half is un-forceable-headlessly (unverified, not disproven).** | **NOT MET** (manual path un-invokable; auto path unverified) |
| AC2 | Audio-only state SURFACED in UI (calm banner/pill) | `AudioOnlyBanner` component exists, matches `design/audio-only-state.html` (auto amber / manual neutral / restoring), `role=status aria-live=polite`, mic-active reassurance, restore button — verified at component/source + T-6 design-diff. **But it can never render in the live DOM** because `audioOnlyMode` is only set by the two blocked triggers. So the banner is correct-but-dead. | **NOT MET live** (renders only in tests, never reachable in prod) |
| AC3 | Restore-video affordance; restore or ConnectionQuality→Good → re-subscribe, normal layout | Restore button + auto-restore-on-Good implemented in the hook + banner. Same reachability blocker: you cannot reach the restore affordance because you cannot enter the state. | **NOT MET live** (unreachable — downstream of AC1) |
| AC4 | Audio NEVER dropped by the fallback | **PROVEN-LIVE (T-5 S3-AC4):** across join/share/stop, both participants retained `MICROPHONE/AUDIO` at every server-truth step; the fallback code iterates only `Track.Kind.Video` (`VIDEO_SOURCES=[Camera,ScreenShare]`) so audio publications are structurally untouched; 11 hook unit tests corroborate. | **MET** |
| AC5 | LIVE-VERIFIED poor-bandwidth degrade/restore (non-negotiable) | Could NOT run: manual path un-invokable (no button) + auto path non-headless (no exposed `Room` handle to emit synthetic `ConnectionQualityChanged`; CDP throttles HTTP transport, not the established WebRTC/DTLS media path the SFU uses). T-5 honestly classified DEFERRED-TO-MANUAL, not green-by-assertion. | **NOT MET** (unverifiable in the deployed build) |

**Net: AC4 MET (audio invariant, proven-live). AC1/AC2/AC3/AC5 NOT MET live → spec-2 is PARTIAL.**

### Keep-OUT conformance (spec-2) — CLEAN
No per-track granular subscription UI, no custom bandwidth-estimation heuristics beyond LiveKit-native ConnectionQuality, no graduated quality tiers (no simulcast-layer selector), no persisted cross-session audio-only preference. D-3 `/ui-ux-pro-max` explicitly confirmed all four keep-outs held. **No gold-plate.** (Ironically, the wave under-built the required manual toggle while staying clean on every gold-plate boundary — the miss is under-delivery, not over-build.)

---

## ADJUDICATION — DRIFT vs GAP (the crux)

**This is spec-DRIFT, not spec-GAP.** The manual toggle was a NAMED requirement at three independent upstream layers, and the deployed code does not deliver it. The spec is not wrong; the implementation (and the design that fed it) under-delivered against the spec.

Trace of where the requirement was affirmed, then dropped:

1. **Spec AC1 (`61e52c3e`)** — verbatim: *"When a member's connection quality drops … **OR the member opts in via a manual toggle**, inbound video … is unsubscribed."* The manual toggle is a first-class disjunct of AC1, not an optional flavor. **[requirement present]**
2. **mvp-thinner P-0 (`P-0-mvp-thinner.md:72, :86-90`)** — explicitly ruled the toggle IN-scope and NOT gold-plate: *"a single user-facing audio-only toggle IS in-scope, not gold-plate … both the auto trigger and one manual toggle are mvp. The gold-plate line is at GRANULARITY … not at the existence of the manual control."* **[requirement re-affirmed as mvp-critical]**
3. **D-1 brief §6 (`D-1-brief/audio-only-state-brief.md:29`)** — verbatim: *"Manual: a toggle (in the control cluster) → audio-only on/off."* **[requirement handed to design, with placement specified]**
4. **D-2/D-3 design DRIFT — the origin of the miss.** The adopted mockup `design/audio-only-state.html` rendered the banner permutations (auto/manual/restoring) and the **restore** control, but did NOT render the **entry** toggle in the control cluster. Its "manual" state is shown as an *already-entered* state (header comment "Trigger: User toggled video off") — the toggle that performs that entry was never designed. The D-3 gate (both `/plan-design-review` and `/ui-ux-pro-max` APPROVE) reviewed the banner/restore states against brief §3/§4/§7/§9 and passed them, but **neither reviewer checked the mockup against brief §6's control-cluster entry toggle** — so the design shipped a self-inconsistent surface (satisfied its own §3 states, silently dropped its own §6 entry control). **[requirement lost here]**
5. **B-3 implementation faithfully consumed the drifted design** — `enterManual()` capability was built and (per T-5) is reachable in code, but no control-cluster button was wired because the adopted design showed none. B-3 self-flagged this as a WATCH deviation → V-1 jenny (this stage): *"the adopted audio-only-state.html design showed only the auto-trigger + restore, not a manual-entry toggle, though brief §6 + mvp-thinner named a control-cluster manual toggle."* **[requirement's absence correctly surfaced, routed here]**

**Why DRIFT and not GAP:** a spec-GAP would mean the spec asked for something wrong/impossible/undesired and the code correctly diverged. Here the spec is coherent, cheap (a single button wired to an already-built `enterManual()`), explicitly mvp-critical per mvp-thinner, and named down to its placement by the brief. Nothing in the spec is wrong. The failure is that the design mockup silently dropped a §6 requirement and the D-3 gate didn't catch the design-vs-brief drift, so the code inherited the omission. The correct repair is to make the code/design match the spec (wire the toggle), not to amend the spec. **DRIFT.**

(For completeness: the *auto-path AC5 live-verify* being un-runnable headlessly is a genuine media-plane boundary, not drift — that half is honestly DEFERRED and would become verifiable the moment the manual path exists, since entering audio-only via the toggle deterministically drives the same `setSubscribed(false)` + banner + restore surface the auto path uses. So wiring the toggle repairs BOTH the AC1 manual disjunct AND unblocks AC2/AC3/AC5 live-verification in one small move.)

---

## Does the deployed state satisfy the M6 success-metric clause? — **NO, not as shipped.**

M6 metric: *"Students … talk + screen-share, and the room degrades to audio-only gracefully on poor bandwidth."*

- **talk** — shipped w31 (done). ✅
- **screen-share** — w34 PROVEN-LIVE (spec-1, above). ✅
- **degrades to audio-only gracefully on poor bandwidth** — **NOT satisfiable by any user in the deployed build.** The auto path (the literal "on poor bandwidth" trigger) is present in code but unverified live AND has no way for a real user to confirm it fires; the manual path (the spec's deterministic fallback for exactly this reason) is un-invokable (no button). A student on weak internet in prod today gets NO controlled audio-only fallback they can trigger, and the auto fallback is unproven. The metric clause's user-observable behavior does not exist in the shipped product.

The audio-invariant (AC4, "audio never dropped") is proven — but that is the *floor* the fallback protects, not the fallback itself. "Degrades to audio-only gracefully" requires the degrade to actually happen and be user-reachable. It is not.

**Therefore M6-close is BLOCKED on this wave's shipped state.** N-block cannot honestly flip M6 `in_progress→done` claiming the metric is MET while the "degrades to audio-only gracefully on poor bandwidth" clause has no working user path. This is consistent with T-9's own conditional: *"N-block close of M6→M7 is CONDITIONAL on the audio-only-reachability disposition at V-2."* My adjudication resolves that condition: **the metric is NOT met until the toggle is reachable (or the clause is formally descoped by founder/ceo with a recorded decision).**

---

## Journey-map fidelity (T-9 regen `v0.22`) — **HONEST, PASS**

- **Screen-share (F4/page-10):** map states "screen-share tile (wave-34, LIVE — proven 2-participant)" — matches shipped reality (proven-live). ✅
- **Audio-only (F4/page-10):** map states "audio-only banner (wave-34, **shipped but not user-reachable** — HIGH → V-2)" and the F4 flow annotates it "shipped + unit-tested + audio-invariant-proven-live, but NO user-reachable trigger (dead UI)." This is an honest, non-papered representation of the exact gap I'm rejecting on — it does NOT claim the audio-only degrade is user-usable. ✅
- `coverage_gaps` carries the HIGH audio-only-not-reachable finding forward. ✅

The journey map's honesty is exactly right; my REJECT is not because the map hid anything, but because the shipped BEHAVIOR (which the map faithfully records as "not user-reachable") does not meet spec-2 / the M6 metric.

---

## Recommendations (routing only — I do not fix)

1. **V-2 triage / V-3 fast-fix (HIGH, spec-DRIFT repair):** wire `enterManual()` to a control-cluster audio-only toggle in `VoiceStudyRoom.tsx`, per brief §6 placement + the already-built hook. This is a small, bounded add (one button + destructure `enterManual`). It repairs spec-2 AC1's manual disjunct AND unblocks AC2/AC3/AC5 live-verification via the deterministic manual path (enter → assert inbound video `setSubscribed(false)` while mic audio continues → restore → re-subscribe). Recommend @task-completion-validator confirm the wired toggle actually drives the state end-to-end live after the fix.
2. **Design-process note for L-2 (root cause):** the D-3 gate APPROVED a mockup that dropped its own brief §6 entry-control requirement — the gate rubric checked banner/restore states but not the control-cluster entry affordance. Candidate L-2 observation: D-3 review must diff the adopted mockup against EVERY numbered brief interaction, not only the rendered states.
3. **If founder/ceo elects to descope** the manual toggle instead of wiring it (turning DRIFT into an accepted scope-cut): that requires an explicit recorded decision in `command-center/product/product-decisions.md`, AND the M6 metric's "degrades to audio-only" clause must then be adjudicated as met-by-auto-path-only — which still leaves AC5 live-verify unsatisfied (auto path unproven live). This path is weaker and I do not recommend it over the small toggle-wire fix.
4. **Spec-1 LOW carry:** add the identity/`Someone` fallback to the screen-share tile aria-label (empty-name a11y). Non-blocking, bundle into V-3 if a fast-fix cycle opens for #1.

---

```yaml
reviewer: jenny
stage: V-1
verdict: REJECT
spec_1_screen_share:
  task_id: e9cd341a-a093-459a-8ffb-72ba82e7a1ab
  status: MET
  acs: {AC1: MET, AC2: MET, AC3: MET, AC4: MET, AC5: MET, AC6: MET}
  keep_out: CLEAN
  disposition: APPROVE
  low_carry: "tile aria-label empty name (participant .name unset) — cosmetic a11y, V-2/V-3"
spec_2_audio_only:
  task_id: 61e52c3e-689a-4837-9cec-a08f1b051171
  status: PARTIAL
  acs: {AC1: NOT_MET, AC2: NOT_MET_LIVE, AC3: NOT_MET_LIVE, AC4: MET, AC5: NOT_MET}
  keep_out: CLEAN
  classification: spec-DRIFT
  drift_origin: "D-2/D-3 adopted design omitted brief-§6 control-cluster entry toggle; D-3 gate did not diff mockup vs brief §6; B-3 faithfully inherited the omission (enterManual built but unwired)"
  requirement_provenance:
    - "spec AC1 (61e52c3e): 'OR the member opts in via a manual toggle'"
    - "P-0-mvp-thinner.md:72,86-90: manual toggle explicitly IN-scope, mvp-critical, not gold-plate"
    - "D-1-brief audio-only §6 (line 29): 'Manual: a toggle (in the control cluster) -> audio-only on/off'"
  disposition: REJECT
m6_close:
  metric_clause: "degrades to audio-only gracefully on poor bandwidth"
  satisfied_by_deployed_state: false
  reason: "auto path unverified-live + un-forceable; manual path un-invokable (no button). No user-reachable audio-only degrade in prod."
  blocks_m6_close: true
  resolves_t9_condition: "T-9 said M6 close is CONDITIONAL on audio-only-reachability disposition; jenny resolves: NOT met until toggle reachable OR clause formally descoped via recorded founder/ceo decision"
journey_map_fidelity: PASS  # v0.22 honestly records audio-only as shipped-but-not-user-reachable
recommended_route: V-2-triage -> V-3-fast-fix (wire enterManual toggle, small bounded add); repairs AC1 + unblocks AC2/AC3/AC5 live-verify
pause_evidence: null  # no measured pause trigger (b/d/e/f) fired
```
