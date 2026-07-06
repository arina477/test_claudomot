verdict: THIN
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  A class cohort runs coursework end-to-end in StudyHall without falling back to
  Discord: the teacher side is live (roles, assignment collect/return, scheduling)
  AND students can hold private 1:1 and small-group conversations outside class
  channels — real-time and offline-tolerant. First slice: direct + group messages.
mvp_critical_status: |
  DM first-slice mvp-critical scope is already shipped — all DM MVP-surface tasks
  are status='done' (a48f1910 schema+backend spine, d8264800 offline-tolerant send,
  32f5d29e Socket.IO fan-out, 1ceffdc9 DM UI, 10967558 start-picker/candidate source,
  03ccf636 who_can_dm=nobody exclusion, 344eabde server-members positive control).
  The seed c5051444 is a wave-47 scope-fenced FUTURE slice (INFO-severity, no defect
  at MVP scale), not part of the mvp-critical floor. Remaining M8 open tasks are
  polish/test-hardening, not blockers of the success metric.

# THIN — proposed sibling split
proposed_split:
  acs_to_keep:                                    # stay in current wave (mvp-critical-now safety)
    - ac: "AC-A — defensive LIMIT cap on getDmCandidates (apps/api/src/dm/dm.service.ts:677)"
      rationale: >
        An unbounded co-member query is a latent correctness/safety bug regardless of
        scale; capping it protects the SHIPPED DM candidate surface (10967558) that the
        success metric's "students can hold private 1:1 and small-group conversations"
        depends on. Value is scale-independent — keep. Est ~5-20 LOC.

  acs_to_split:                                   # become sibling task (nice-to-have, future scaling wave)
    - ac: "AC-B — cursor/pagination + client 'load more' affordance on DM candidates"
      rationale: >
        Pagination is user-facing UX that only pays off at real server scale. StudyHall
        is pre-launch (~0 users); the success metric ("students can hold private 1:1 and
        small-group conversations — real-time and offline-tolerant") is fully satisfiable
        without it, since the candidate list is already reachable and (post AC-A) bounded.
        wave-47's mvp-thinner already fenced ranking/presence/pagination OUT of the DM MVP;
        deferring AC-B keeps that fence intact. Trace test: absent AC-B, the metric still
        holds → nice-to-have → split.
      sibling_task_seed:
        title: "DM: add cursor/pagination + load-more to getDmCandidates (large-server scaling)"
        description: |
          Problem: getDmCandidates (apps/api/src/dm/dm.service.ts:677) returns co-members
          as a single bounded page once the defensive LIMIT lands (AC-A, current wave).
          At large-server scale a single capped page is insufficient — members past the
          cap become unreachable in the DM start-picker.

          Acceptance sketch: extend the LIMIT'd query with stable keyset/cursor pagination
          (opaque cursor, deterministic tiebreak on a monotonic key) and surface a client
          "load more" affordance in the DM start-picker so all shared-server co-members are
          reachable. Reconsider server-side typeahead only if founder lifts the global-directory
          reservation (currently founder-reserved). Defer to a large-server scaling wave —
          not needed at MVP/pre-launch scale.

          Orchestrator INSERTs as a tasks row: milestone_id = 84e17739-af5e-4396-beb9-b6f3d6836fc4,
          wave_id = NULL, parent_task_id = c5051444-318f-4a90-a79a-947b4452e42f.

# OK only
ok_rationale: |
  n/a
floor_constraint_active: false
floor_constraint_detail: |
  Post-split residual (AC-A only, ~5-20 LOC) is far below any single-spec/multi-spec floor.
  Per mvp-thinner floor-awareness: this would normally block the THIN. It does NOT here
  because the wave is sub-floor EITHER WAY — the seed as a whole (AC-A + AC-B) is a small
  defensive/scale slice that will not clear the floor regardless of the split. The floor
  exists to prevent under-packed waves, not to force premature pagination UX into a pre-launch
  wave. Flagging for head-product: the correct disposition is likely to merge AC-A into a
  larger sibling bundle at P-1 (RESCOPE-AUTO-MERGE) OR ship AC-A as the coherent minimum with
  the AC-B sibling pre-authored for a future scaling wave. Either path keeps AC-B deferred;
  neither reduces total wave size (P-1's authority). head-product decides the floor handling.

sibling_visible: false
