verdict: OK
verdict_source: mvp-thinner
milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
milestone_title: M6 — Voice/video study rooms
milestone_class: product-feature
milestone_success_metric: |
  Students drop into a Study Room voice channel, talk + screen-share, and the room
  degrades to audio-only gracefully on poor bandwidth.
mvp_critical_status: |
  M6 mvp-critical core (talk + screen-share + graceful audio-only degradation) is NOT
  yet fully shipped — 2 of the first M6 bundle's 3 tasks are done (LiveKit token-mint
  VoiceModule d8a85de0; minimal client join surface 1dd1f2ca), both LIVE at the code
  level but live audio is gated on founder-supplied LIVEKIT_* Railway creds (wave-31 L-1
  correction). This wave's occupancy task (78f51968) is the 3rd/last task of that first
  bundle. Occupancy is a `## Scope` line-item ("who's-in-room occupancy") + the bet's
  "study room door left open" affordance — it is NOT itself a clause of the `## Success
  metric` (which names talk / screen-share / degradation). So the wave is already at or
  below the mvp-critical floor for M6: cutting the whole wave would not break the success
  metric, but the wave is a single coherent Scope-item slice and P-1 owns wave sizing, not me.

ok_rationale: |
  This is a single-task, single-Scope-item wave (server participants endpoint + client
  occupancy indicator). The two ACs are genuinely atomic, not stacked polish: the endpoint
  is inert without a client surfacing it, and the indicator is impossible without the
  endpoint — they are one slice, not "server this wave / client next." The only real
  thinness lever is count-only-vs-identities (AC-2/AC-3), and I judge identities
  mvp-necessary for the affordance's own purpose, not gold-plating — see the count-only
  analysis below. Every keep-OUT item named in the seed is confirmed excluded and the build
  must not add them. Poll-refresh (not live-push) is the thin-correct MVP choice. Nothing to
  peel off into a sibling; no OVER-CUT (the slice is coherent and demonstrable, not too thin).
floor_constraint_active: false
floor_constraint_detail: |
  Not applicable — OK was reached on the merits (atomic slice + identities mvp-necessary),
  not because a floor blocked an otherwise-valid THIN. Note for the record: this is a
  single-task feature slice; were a THIN considered, residual after peeling AC-3 (identities)
  would fall well under the single-spec 1,500-LOC floor, but that is moot here because the
  identity mapping is judged mvp-necessary, not deferrable.

# ── Analysis backing the OK (the four questions asked of this wave) ──

atomicity_judgment: |
  ATOMIC — not splittable into "server endpoint this wave, client indicator next."
  - AC-1 (GET .../voice/participants via RoomServiceClient.listParticipants, membership/RBAC
    gated, empty-room → empty list) has zero standalone user value: an occupancy endpoint no
    surface reads is dead code shipped ahead of demand — the exact anti-pattern a thinness
    lens exists to catch, but in reverse (splitting would MANUFACTURE it).
  - AC-2 (client indicator: count + identities, poll-refresh) cannot exist without AC-1.
  - The trace test confirms the pairing: neither half alone advances the "see who's inside →
    join" drop-in loop; only the two together produce the "study room door left open" signal.
  Splitting server-from-client here would create a thin dead-endpoint wave AND a dependent
  follow-up, adding ceremony and a cross-wave dependency for zero thinness gain. Keep as one.

count_only_vs_identities_judgment: |
  IDENTITIES ARE MVP-NECESSARY — do NOT defer the identity mapping; count-only is thinner but
  under-delivers the affordance's own reason to exist.
  - The affordance is the bet's "study room door left open" / "see who is already studying
    before you join" signal (seed `## Why`; bet source). "3 people inside" answers "is anyone
    there," but the drop-in decision a student actually makes is social — "is anyone I study
    WITH inside" — which requires identities ("Alice, Bob, +1"), not a bare count.
  - The identity mapping is NOT extra surface built ahead of demand: the seed already sets
    LiveKit `identity = userId` on every minted token (shipped in done task d8a85de0,
    SDK-doc gotcha #2), and the StudyHall member-display lookup reuses the existing member
    data source. The marginal cost over count-only is small; the marginal VALUE is the
    difference between a generic presence dot and the actual social drop-in signal.
  - Trace test on AC-3 (identity mapping): if absent, does the wave still deliver the M6
    "door left open" occupancy affordance? Weakly — it degrades to a number. Because the
    affordance's whole point is social presence, identities are inside the mvp-critical set
    for THIS slice's own claim. Unclear-leaning-necessary → keep (thinner's in-doubt rule).
  - This is the one place a count-only THIN split was available; I decline it deliberately.
    (If head-product or the founder prefers a strictly minimal first cut, count-only IS a
    valid thinner slice and could ship as AC-1+count with identities as a sibling — but I do
    not recommend it; the value/cost ratio favors shipping identities now.)

poll_vs_push_judgment: |
  POLL IS THE THIN-CORRECT MVP CHOICE — confirmed. Live-push occupancy (a websocket /
  presence-style occupancy channel, join/leave server events fanned out) is a materially
  bigger real-time-infra add: a new event surface, connection lifecycle, and server-push
  state to reconcile. A bounded client-side poll (or refresh on the local user's own
  join/leave) shows "who is roughly inside right now" — entirely sufficient for a pre-join
  drop-in signal at 0 users, where occupancy staleness of a few seconds is invisible. The
  seed correctly scopes "no requirement for live push in this slice." Live-push occupancy is
  a legitimate future wave IF real usage shows the poll feels stale; it is not mvp-critical
  now. Poll = thin and correct.

keep_out_confirmation:
  status: CONFIRMED — seed excludes all of these; build MUST NOT add them
  excluded_items:
    - presence rings (voice-activity halos around avatars)
    - speaking / voice-activity indicators (who is talking now)
    - live-push / websocket occupancy (poll is the MVP; server-pushed join/leave events OUT)
    - avatar / join-leave animations
    - "join from the indicator" one-click (the existing join surface — done task 1dd1f2ca —
      is the join path; the occupancy indicator is a READ, not a second join affordance)
    - occupancy history / analytics (who-was-in-when, session logs)
  creep_flag: |
    NONE detected in the seed. The seed prose explicitly fences "presence rings / speaking
    indicators / live animations are OUT (gold-plating, future waves)" and the M6 bundle
    decision log (product-decisions 2026-07-01, line 389) additionally parks screen share,
    speaking/voice-presence rings, low-bandwidth auto-downgrade, recording, breakout rooms,
    and moderation. Two watch-items for B-block (flag if they appear, do NOT pre-build):
    (1) speaking/voice-activity rings are M6-Scope-legitimate but belong to a LATER M6 wave,
        not this occupancy read — the LiveKit `identity=userId` mapping shipped here is the
        reuse hook they will want, which is fine, but no ring rendering this wave.
    (2) the poll must not quietly grow into a standing websocket subscription — keep it a
        bounded poll / on-own-join-leave refresh per AC-2.

sibling_visible: false
