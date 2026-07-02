verdict: OK
verdict_source: mvp-thinner
milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
milestone_title: M6 — Voice/video study rooms
milestone_class: product-feature
milestone_success_metric: |
  Students drop into a Study Room voice channel, talk + screen-share, and the
  room degrades to audio-only gracefully on poor bandwidth.
mvp_critical_status: |
  All mvp-critical M6 feature tasks are done — the token-mint service
  (d8a85de0), the client join surface (1dd1f2ca), and the who's-in-room
  occupancy indicator (78f51968) all status=done. The success metric
  (drop into voice, talk + screen-share, audio-only degrade) is already
  functionally satisfied by shipped waves 31/32. This wave (seed a2dd9f3d)
  is a wave-32 V-2 (T-8 F-32-T-8-1) robustness follow-up, NOT a
  success-metric-gating feature — it is defensive hardening layered on an
  already-shipped surface.

ok_rationale: |
  Every AC traces to a single atomic defect, and the wave is already at its
  minimum coherent slice — a THIN split is both anti-value and floor-blocked.
  The two "add ParseUUIDPipe" ACs are two halves of ONE shared-pattern defect
  (identical :channelId param on the participants + token voice routes);
  splitting them to siblings would knowingly ship the fix on one route while
  leaving the identical gap on the sibling route, for ~2 LOC of "savings" —
  the opposite of thinning. The unit-test AC is trace-bound to whichever
  route(s) ship and cannot be split away from the code it asserts. No AC here
  builds depth ahead of a first-pass (the first-pass voice surface is already
  live), no AC builds polish/extensibility ahead of demand, and no AC can be
  cut while keeping the fix coherent. Nothing traces to the M6 success metric
  because the metric is already met — this wave is post-metric hardening, so
  the trace test yields "keep all" by exhaustion, not by criticality.
floor_constraint_active: true
floor_constraint_detail: |
  current_wave_loc: ~5-10 LOC total (~2 LOC pipe per route x2 + one unit test).
  would-have-split LOC sum: N/A — no valid peel-off exists; the only candidate
  "split" (move one route's pipe to a sibling) saves ~2 LOC while breaking
  fix coherence.
  residual after any split: still far below the single-spec >1,500-LOC floor.
  floor threshold: single-spec >1,500 LOC (per P-1 § Minimum size floor).
  This is already a sub-floor hardening wave; it clears the floor only under
  the test-coverage/tech-debt exemption precedent (product-decisions.md
  wave-16 ruling). A THIN split cannot help — it would push the residual even
  lower for zero value. Floor genuinely blocks any peel-off; refuse to THIN.

# --- keep-OUT gold-plating flags (advisory to P-1/P-2/P-3) ---
keep_out_flags:
  - flag: Do NOT expand to ALL :id / :uuid route params app-wide.
    rationale: |
      The finding is scoped to the two voice routes that share the malformed
      :channelId cast. Sweeping every path param across MessagingModule,
      ServersModule, RbacModule, etc. is unrequested breadth ahead of demand —
      it is not in the seed, not traced to any finding, and would balloon a
      ~5-LOC hardening wave into a cross-module refactor. A global param-hygiene
      pass, if ever wanted, is its own future tech-debt seed, not this wave.
  - flag: Do NOT introduce a global exception filter / error-normalization layer.
    rationale: |
      Fixing 500-should-be-400 at the param boundary (ParseUUIDPipe or zod
      param schema) is the correct, local, ~2-LOC fix. Building an
      application-wide exception filter to catch downstream DB-cast errors is
      architectural gold-plating far exceeding the finding, and would touch the
      global error contract of every route — out of scope for a param-validation
      hardening wave.
  - flag: Do NOT over-test.
    rationale: |
      One unit test per route asserting 400 on a non-UUID channelId (plus,
      optionally, the existing 401-on-unauth-malformed assertion already noted
      as correct) is sufficient at the unit layer. Do NOT add a full E2E/browser
      matrix, fuzzing suite, or parametrized-across-all-routes battery — the
      surface is credential-independent and 2 endpoints; coverage beyond the
      unit assertion is theater for this blast radius.

sibling_visible: false
