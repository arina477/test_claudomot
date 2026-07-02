# Wave 34 — P-0 Frame

## Discover section
- **wave_db_id:** 1946c399-faf6-40c3-80c9-69aac81531dd (wave_number 34, running, milestone M6).
- **Prior-work:** the FINAL M6 voice slice. w31 shipped token-mint + join; w32 occupancy; w33 param-hardening. LiveKit keys NOW LIVE (founder provided them this session; both Railway services redeployed clean) → credential block CLEARED; this wave finishes voice WITH live verification.
- **Roadmap milestone:** M6 (8702a335) in_progress, Class=product-feature. These 2 tasks close M6's success metric (talk + screen-share + audio-fallback; talk+occupancy shipped).
- **Spec-contract short-circuit:** no-prior-spec (both tasks prose) → full P-1..P-3.
- **Bundle:** seed e9cd341a (screen-share) + sibling 61e52c3e (audio-fallback) → **wave_type multi-spec** (2 tasks).

## Reframe section
**problem-framer: REFRAME → (after correction) PROCEED.** CRITICAL catch: the seed falsely claimed "token already grants canPublish" — but voice-token.service.ts:131-139 sets `canPublishSources:[TrackSource.MICROPHONE]` which SUPERSEDES canPublish + EXCLUDES screen_share → a client-only publish is server-rejected (PublishTrackError). Screen-share is a **TWO-LAYER** change: (1) API — extend the AccessToken grant to permit screen_share (add TrackSource.SCREEN_SHARE + SCREEN_SHARE_AUDIO to canPublishSources; UPDATE voice-token.service.spec.ts:156 which asserts ['microphone']); (2) client — @livekit/components-react screen-share publish/subscribe in VoiceStudyRoom.tsx (currently video={false}, :114). Sibling (audio-fallback) correctly framed (client ConnectionQuality + subscription control, no server work). **Reframe applied to the seed description; problem-framer re-run → PROCEED** (verified against voice-token.service.ts:137 + livekit.md:75/311/397 + VoiceStudyRoom.tsx:114).

**ceo-reviewer: PROCEED (HOLD-SCOPE).** Finishing voice is the right move (core Discord-displacer bet; founder just invested in the keys). Both pieces metric-critical — no defer, no expand (annotation/multi-share/recording = gold-plating at 0 users), no reduce (audio-only-fallback is an explicit metric clause, protects remote-students-on-bad-wifi — the offline-first target user; natural degradation ≠ controlled restorable fallback). **LOAD-BEARING flag: live-verification NON-NEGOTIABLE** (2 participants hear each other, screen-share renders/reverts, poor-bandwidth path degrades+restores) — a code-only ship reintroduces the exact anti-pattern the park-or-key fork prevented; no green-by-assertion. **M6-close forward flag:** after this ships + live-verified, M6 metric MET → N-block CLOSES M6 (in_progress→done, dispose non-metric child tasks to unassigned queue per M5-close pattern) → pivot to M7 (privacy/notifications/launch-polish, only H1, finishes MVP, credential-independent).

**mvp-thinner: OK** (floor_constraint false — genuine OK, both mvp-critical). Both are the last 2 unbuilt M6 metric clauses; no thinner subset closes M6; ship both in wave-34 (audio-fallback falls back from the shipped camera/video track, not dependent on screen-share build-order). **keep-OUT (advisory → P-2):** screen-share — NO annotation, multi-share grid, quality/resolution selector, custom window-picker UI, recording. audio-fallback — NO per-track granular subscription, custom bandwidth heuristics beyond LiveKit-native ConnectionQuality, graduated quality tiers, persisted cross-session pref. **Boundary: the manual opt-in toggle IS in-scope** (AC prose: "or the participant opts in") — both automatic ConnectionQuality trigger + one manual toggle are mvp; gold-plate line is at granularity/heuristic depth, not the toggle's existence.

**Mediation:** none (PROCEED/PROCEED/OK aligned post-reframe).

**Disposition: PROCEED** (post-reframe). Scope = screen-share (2-layer: token grant + client) + audio-only fallback (client), the metric-closing M6 slice. Credential-unblocked → live-verifiable.

## Open escalations carried into gate
- **Live-verification non-negotiable** (ceo) — T-block MUST live-test 2 participants + screen-share + poor-bandwidth path; no green-by-assertion.
- **Token-grant two-layer** (problem-framer) — screen-share needs the API grant extended (SCREEN_SHARE[+_AUDIO]) + the :156 spec updated, BEFORE the client publish works.
- **M6-close → M7** (ceo) — N-block closes M6 after this + pivots to M7.

## Exit
Discovery + reframe complete. PROCEED (reframe applied). multi-spec (screen-share + audio-fallback). design_gap likely TRUE (screen-share tile + audio-only-state UI — P-1 judges). Credential-unblocked, live-verification mandatory. → P-1 Decompose.
