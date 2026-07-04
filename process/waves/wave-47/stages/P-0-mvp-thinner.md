verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  A class cohort runs coursework end-to-end in StudyHall without falling back to
  Discord: the teacher side is live (roles, assignment collect/return, scheduling)
  AND students can hold private 1:1 and small-group conversations outside class
  channels — real-time and offline-tolerant. First slice: direct + group messages.
  [Working target set by Claudomat 2026-07-04 on founder delegation; founder can
  adjust anytime.]
mvp_critical_status: |
  DM engine slice shipped LIVE wave-46 (schema+spine a48f1910, Socket.IO fan-out
  32f5d29e, offline outbox d8264800, minimal UI 1ceffdc9 — all done). But the
  metric clause "students can HOLD private 1:1 and small-group conversations" is
  NOT yet satisfiable: DMs are UNSTARTABLE via UI (wave-46 F-A CRITICAL). This
  wave's 2 ACs are the minimal set that makes the shipped engine reachable.
  Sibling M8 DM polish (5bcbd27f off-token surfaces, 39fc1c5e redundant column,
  a1dda389 E2E hardening) correctly sits OUTSIDE this bundle — already deferred.

ok_rationale: |
  Both ACs trace cleanly to the metric's "hold private 1:1/small-group
  conversations" clause and represent the minimum slice to make the shipped DM
  engine startable — there is no fat to peel into a sibling.

  Trace test:
  - AC-A (seed 10967558 — GET /dm/candidates + candidate source + StartDmPicker
    rebuild): ABSENT → the picker's only candidate source is gated on a non-null
    serverId that the DM-home surface never has, so it renders zero candidates
    from its only entry point. No DM can be started through the UI → metric NOT
    satisfiable. mvp-critical, KEEP.
  - AC-B (sibling 379978a4 — username-vs-opaque-userId id-space fix): ABSENT →
    self-exclusion compares a username against opaque users.id text and silently
    fails (picker can list the caller as a DM target / mis-key self) AND the
    sender's own optimistic row renders "Unknown user" (F7). A picker that offers
    you yourself and a thread that can't name its own author is not a working
    "hold a conversation" flow. The fix is load-bearing for picker correctness and
    cures F7 in the same id-resolution change. mvp-critical, KEEP.

  This is genuinely a 2-AC minimum, not a packed wave with deferrable depth: the
  engine is already shipped; these two ACs are purely the "make it reachable +
  correct" entry-point layer. No AC here builds depth on an unshipped surface, no
  AC builds polish/extensibility ahead of demand, and cutting either breaks the
  mvp-critical "startable" claim. No THIN split available; no OVER-CUT (removing
  either would strand the shipped engine as UI-unreachable).

  SCOPE-FENCE FLAG (not a split — a P-2 guardrail on AC-A's single candidate-source
  decision): the seed prose leaves the candidate SOURCE as an open product
  question ("union of caller's servers' members? a directory? who_can_dm-filtered?").
  The thin answer is a SINGLE sensible source — the caller's server co-members,
  who_can_dm-filtered — returned as a plain list. A full user-search / directory /
  typeahead / ranking / presence / pagination system would be OVER-scope for the
  slice-1 entry point and must NOT be built to satisfy "make it startable." This
  is a scoping instruction on the one existing candidate-source AC, not a separable
  AC that can be peeled into a sibling task — so it does not change the verdict from
  OK, but P-2 should fence the /dm/candidates contract to "server co-members,
  who_can_dm-filtered, list only."

  NOT-BLOCKING-FOR-STARTABLE note (deliberately NOT added back): surfacing a
  who_can_dm restriction reason IN the picker (greying out / explaining
  non-DM-able targets) is a nice-to-have, not mvp-critical for "startable" — the
  backend already 403s a restricted target, so a picked-then-403 path is degraded
  but the metric ("hold a conversation") is still satisfiable for allowed targets.
  Correctly left to a later slice (aligns with open sibling 5bcbd27f disabled-send
  surface). Do NOT expand this wave to add it.

floor_constraint_active: false
floor_constraint_detail: |
  n/a — verdict is OK on merit (both ACs mvp-critical), not floor-blocked. No THIN
  split was suppressed by the floor.

sibling_visible: false
