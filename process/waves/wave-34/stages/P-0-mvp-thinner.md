verdict: OK
verdict_source: mvp-thinner
milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
milestone_title: M6 — Voice/video study rooms
milestone_class: product-feature
milestone_success_metric: |
  Students drop into a Study Room voice channel, talk + screen-share, and the
  room degrades to audio-only gracefully on poor bandwidth.
mvp_critical_status: |
  4 of 6 milestone tasks done (token-mint, client join surface, occupancy indicator,
  endpoint param hardening). The 2 remaining tasks — screen-share (e9cd341a) and
  audio-only fallback (61e52c3e) — are the FINAL two unbuilt success-metric clauses.
  Both are mvp-critical; delivering both closes M6's metric.

ok_rationale: |
  Both ACs trace 1:1 to named clauses of the milestone success metric and cannot be
  split to a sibling without breaking the mvp-critical claim. Trace test: remove
  screen-share (e9cd341a) → the metric's "+ screen-share" clause is unsatisfiable →
  KEEP. Remove audio-fallback (61e52c3e) → the metric's "degrades to audio-only
  gracefully on poor bandwidth" clause is unsatisfiable → KEEP. There is no thinner
  atomic subset that still closes M6. The "talk" clause is already shipped (done tasks);
  these two are the last two. This is a clean, well-classified two-task closing slice —
  nothing to defer. My contribution is the AC-level gold-plate keep-OUT boundaries below,
  handed to P-2 Spec so depth is not built ahead of demand at 0 users.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — verdict is a genuine OK (both ACs mvp-critical), not a floor-blocked THIN.
  Wave est ~1,800–2,600 LOC; no split proposed, so no residual-floor calculation applies.

# ---------------------------------------------------------------------------
# Advisory to P-2 Spec — AC-level gold-plate boundaries (keep-OUT list).
# NOT verdict-bearing (no AC re-classified, no sibling seeded). These are the
# "which flavor of packed" notes: draw the spec's acceptance line HERE so the
# two mvp-critical ACs don't grow depth/polish/extensibility ahead of demand.
# ---------------------------------------------------------------------------
spec_advisory:

  pairing_verdict: |
    Ship BOTH in wave-34, not screen-share-first + audio-fallback-as-follow-up-wave.
    Rationale: (1) audio-fallback's dependency ("something to fall back FROM") is ALREADY
    satisfied by the shipped camera/video track from the done client-join task — it does
    not depend on screen-share existing first, so there is no build-order forcing function
    that would justify splitting into two waves. (2) Both are single-file client work in
    the same component (VoiceStudyRoom.tsx) touching the same LiveKit track/subscription
    surface — splitting waves would re-pay the same context/setup cost twice. (3) Both are
    the LAST two metric clauses; shipping them together is what CLOSES M6 in one wave, which
    is the point of a closing slice. Splitting delays milestone close for no risk-reduction.
    Wave-sizing itself is P-1's call — this only argues the two belong in the SAME wave.

  screen_share_ac_e9cd341a:
    mvp_in:
      - Start/stop a screen-share track from study-room controls (single publisher).
      - Shared screen renders as a distinct, prominently-sized tile for every subscriber.
      - Clean revert when sharing stops (tile removed, layout restored).
      - Only one active screen-share surfaced at a time in a sensible way (metric-named).
    keep_OUT_gold_plate:
      - Annotation / drawing-on-shared-screen — no demand at 0 users; large surface.
      - Simultaneous multi-participant screen-share / multi-share grid — the AC itself
        scopes to "only one active screen-share at a time"; multi-share contradicts it.
      - Quality/resolution selector or manual bitrate control for the share track —
        LiveKit-native adaptive handling is sufficient; a selector is premature tuning.
      - Per-region / window-vs-full-screen picker UI beyond the browser's native
        getDisplayMedia chooser — the native picker is the baseline; no custom UI.
      - Recording / save-the-share — explicitly deferred in the wave-30 M6 decomposition
        ("per-room recording" listed OUT); do not reintroduce here.

  audio_fallback_ac_61e52c3e:
    mvp_in:
      - Automatic trigger on LiveKit ConnectionQuality drop → unsubscribe/pause inbound
        video (camera + screen-share) so audio continues cleanly.
      - Manual opt-in path to the same audio-only state (AC prose names "or the participant
        opts in" — so a single user-facing audio-only toggle IS in-scope, not gold-plate).
      - UI clearly communicates audio-only state + a restore-video affordance when
        conditions recover; audio stays uninterrupted across the transition.
    keep_OUT_gold_plate:
      - Per-track / per-participant granular subscription control (e.g. "keep Alice's video,
        drop Bob's") — the AC is room-level audio-only, not a per-tile bandwidth manager.
      - Custom bandwidth-estimation / downgrade heuristics beyond LiveKit's native
        ConnectionQuality signal — the wave-30 decomposition explicitly ruled OUT
        "low-bandwidth auto-downgrade heuristics beyond LiveKit-native"; honor that.
      - Graduated quality tiers (e.g. low-res video step before full audio-only) — the
        metric says "degrades to audio-only," a binary state; intermediate tiers are depth
        ahead of demand.
      - Persisted per-user audio-only preference across sessions — session-scoped state is
        enough to satisfy the metric; persistence is a later polish concern.
    ac_boundary_note: |
      The manual toggle is IN (AC prose: "or the participant opts in"), so this is not an
      automatic-only vs. also-manual gold-plate question — both the auto trigger and one
      manual toggle are mvp. The gold-plate line is at GRANULARITY (per-track) and
      HEURISTIC DEPTH (custom BWE / tiers), not at the existence of the manual control.

sibling_visible: false
