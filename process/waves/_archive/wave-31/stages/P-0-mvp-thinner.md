verdict: THIN
verdict_source: mvp-thinner
milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
milestone_title: M6 — Voice/video study rooms
milestone_class: product-feature
milestone_success_metric: |
  Students drop into a Study Room voice channel, talk + screen-share, and the room
  degrades to audio-only gracefully on poor bandwidth.
mvp_critical_status: |
  no mvp-critical scope shipped yet — this is the FIRST M6 wave. All three bundle tasks
  are status=todo. The metric is a MULTI-WAVE metric (talk + screen-share + low-bandwidth
  audio-only degradation): no single wave delivers it, and the milestone decomposition
  already scoped screen-share / presence-rings / low-bandwidth auto-downgrade OUT of this
  first bundle. The first-wave mvp-critical floor is therefore NOT the full metric but the
  irreducible foundation: a server-minted, room-scoped, RBAC-gated token + a minimal client
  that proves that token connects to LiveKit Cloud end-to-end.

# THIN — proposed sibling split
proposed_split:
  acs_to_keep:
    - ac: "seed d8a85de0 — VoiceModule LiveKit token-mint (POST /channels/:id/voice/token, session+RBAC gate, room-scoped 4h token, server out of media path)"
      rationale: >
        True load-bearing foundation. Trace test: if absent, the metric is NOT satisfiable
        by ANY future M6 wave — nothing joins any room without a server-minted room-scoped
        token. mvp-critical by definition.
    - ac: "sibling 1dd1f2ca — minimal voice-study-room client join (single LiveKitRoom, Join-Room gesture, mic/cam toggle, audio-first video=false, disconnect-on-unmount, token-refresh)"
      rationale: >
        The token-mint is not end-to-end demonstrable without a consuming client. For a
        Tier-4 XL feature's FIRST wave, the de-risking objective IS proving the minted token
        actually connects a live client to the LiveKit Cloud SFU — the single biggest
        integration risk. Credentials are provisioned (product-decisions: LIVEKIT_URL/API_KEY/
        API_SECRET server-side + VITE_LIVEKIT_URL client, "credential-free at the code level,
        no founder-ask blocks this slice"), so this CAN be live-verified at T-block this wave.
        Splitting it out would leave a pure server endpoint with no proof against the real SFU —
        the opposite of de-risking. Keep.
  acs_to_split:
    - ac: "sibling 78f51968 — who's-in-room occupancy (GET /channels/:id/voice/participants via RoomServiceClient.listParticipants + client count/identities indicator)"
      rationale: >
        Fails the trace test. M6 ## Success metric is "drop into a voice channel and talk" —
        it does NOT require seeing who is already inside before joining. Occupancy is the
        "study-room door left open" affordance (see-before-you-join), genuinely valuable but
        a second endpoint + a second client surface whose absence does not break the first
        voice slice's mvp-critical claim (a user can still get a valid token for a room they
        are allowed in AND join it and talk). It reuses the seed's credentials + membership
        gate, so it slots cleanly into a 2nd M6 wave once the token+join path proves out on
        a live LiveKit Cloud connection. Defer.
      sibling_task_seed:
        title: Add who's-in-room voice occupancy indicator (2nd M6 wave)
        description: |
          Problem: the drop-in study-room model wants a "see who's already studying before
          you join" affordance (M6 ## Scope names "who's-in-room occupancy"). This is NOT
          required for the first voice slice's mvp-critical claim (get a valid room-scoped
          token + join + talk) and is deferred to a 2nd M6 wave so the first wave stays the
          minimal de-risking token-mint + minimal-client end-to-end proof.
          Acceptance sketch: server endpoint GET /api/v1/channels/:channelId/voice/participants
          (same session + membership/RBAC gate as the mint endpoint) returns current participant
          identities via RoomServiceClient.listParticipants(channelId) — pass host/apiKey/secret
          explicitly from ConfigService (SDK gotcha #3, no env fallback); empty/absent room returns
          an empty list, not an error (handle TwirpError as "0 in room"). Client occupancy indicator
          on the voice-study-room entry surface: participant count + member identities (LiveKit
          identity=userId mapped back to StudyHall member display), refreshed on a bounded poll
          or on join/leave (no live-push requirement in this slice). Builds directly on the seed's
          VoiceModule + membership gate; identities map because the seed sets identity=userId.
          Orchestrator INSERTs this as a tasks row: milestone_id = 8702a335-90ec-40ff-8c7d-a91bb7790a27,
          wave_id = NULL, parent_task_id = d8a85de0-3015-45f0-84be-e879ccd90c91, status = 'todo'.

# OK / OVER-CUT fields not applicable
ok_rationale: |
  n/a — verdict is THIN.
floor_constraint_active: false
floor_constraint_detail: |
  FLOOR NOTE (mandatory pre-check — surfaced, not blocking): residual after split =
  seed d8a85de0 (server VoiceModule) + sibling 1dd1f2ca (client join) = 2 specs, est.
  ~1,850–1,950 net LOC (full 3-task bundle sized ~2,200 by the decomposer; occupancy est.
  ~250–350 LOC). Residual (~1,900 LOC / 2 specs) does NOT clear the multi-spec minimum floor
  (>2,500 LOC OR >=6 specs). Per my contract this would normally push OK+floor_constraint_active.
  I emit THIN anyway and flag it for P-1/head-product because: (1) this milestone (and its
  predecessor M5) has an 8-consecutive-wave standing override-ship precedent for under-floor
  milestone waves (product-decisions w16/w23/w24/w25/w26/w27/w28/w29 — the LOC floor is a
  documented non-fit for this project's cadence, and the wave-24 BOARD ruled "do NOT re-litigate
  a Nth per-wave"); (2) the residual seed+client IS a coherent, live-verifiable end-to-end slice
  (mint a token -> join a real LiveKit Cloud room -> talk), which is exactly the de-risking first
  slice a Tier-4 XL feature needs; (3) mvp-thinner wins ties on this milestone because M6 has
  open child tasks its ## Scope flags as mvp-critical and ZERO are status=done. ACTION FOR P-1:
  apply the established override-ship precedent to the residual (do NOT floor-fill by re-bundling
  occupancy back in — that re-imports the deferred affordance and defeats the split).

# KEEP-OUT list for the FIRST voice wave (defer to later M6 waves — all are M6 METRIC items
# but NOT first-wave; the metric is delivered across multiple M6 waves):
first_voice_wave_keep_out:
  - screen-share (## Success metric item — 2nd/3rd M6 wave; needs canPublishSources + track publish UI)
  - low-bandwidth auto-downgrade-to-audio-only heuristics (## Success metric item — later wave; this
    wave carries ONLY LiveKit-native audio-only fallback = join without camera / onMediaDeviceFailure,
    which is already in the KEPT client-join AC, not the adaptive-bitrate degradation heuristic)
  - speaking / voice-presence rings (## Scope polish — later wave)
  - multi-participant grid layout (later wave; first client renders a single LiveKitRoom)
  - reconnection / network-resilience handling (later wave)
  - mic/cam toggle POLISH beyond the minimal setMicrophoneEnabled/setCameraEnabled or ControlBar prefab
    (the minimal toggle stays IN the kept client-join AC; polish/UX refinement defers)
  - who's-in-room occupancy (SPLIT this wave to sibling under seed — see acs_to_split above; 2nd M6 wave)
  - per-room recording, breakout rooms, moderation controls (out of milestone decomposition entirely)

sibling_visible: false
