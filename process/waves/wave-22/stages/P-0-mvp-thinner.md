verdict: OK
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: M5 — Academic tooling: assignments
milestone_class: product-feature
milestone_tier: T3
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside chat,
  mark it done, and get a reminder before it is due.
  (NOTE: the "reminder before it is due" clause is the DEFERRED later M5 bundle —
  decomposer note 2026-06-30, seed 01fcefb8 prose. THIS wave's effective metric
  target = post / view / mark-done.)
mvp_critical_status: |
  M5 just activated (wave-22 is the FIRST assignments wave); zero done assignments
  tasks under M5. This 3-task bundle (CRUD+status spine / panel+card UI / tests) IS
  the mvp-critical core for the post/view/mark-done metric. No prior assignments
  scope shipped.

# OK rationale — every retained AC traces cleanly; one valid THIN (attachment defer)
# is BLOCKED BY FLOOR, so emitted OK per contract instead of THIN.
ok_rationale: |
  The indivisible post/view/mark-done core all traces to the metric and stays:
  (1) assignment CREATE → "organizer posts an assignment with a due date" (without it
  the metric is unsatisfiable); (2) LIST sorted by due_at → "members see it alongside
  chat" (sort rides the same query, INDEX(server_id, due_at) — free, keep with list);
  (3) per-member to-do/done TOGGLE → "mark it done"; (4) organizer authz gate (owner
  OR manage-flag via can(userId,serverId,permission)) → the T3 academic-tooling
  differentiator is organizer-controlled posting + it is a security surface; (5) the
  panel page + assignment-card with amber-due/red-overdue chips → the create-form is
  required (no form = organizer can't post) and the chips are the T3 "feels like
  academic tooling" signal, not polish; (6) tests → ## Scope-mandated verification.

  TWO ACs trace as genuinely nice-to-have (metric satisfiable without them):
    - the OPTIONAL ATTACHMENT (problem-framer flag: attachments table is
      message_id-NOT-NULL-coupled, so an assignment attachment needs NET-NEW schema —
      generalize attachments OR an assignment_attachments table/nullable-message_id —
      ~350-450 LOC of migration + association + upload wiring + a UI picker). The
      metric "posts an assignment with a due date → members mark it done" works fully
      on text title/desc/due alone; the attachment is enrichment. This is the single
      strongest THIN-defer candidate on the merits.
    - organizer EDIT/DELETE (PATCH/DELETE + edit-form UI, ~250-350 LOC). Post + view +
      mark-done satisfies the metric without it; it is management polish.

  I am NOT emitting THIN because both defers are FLOOR-BLOCKED (see
  floor_constraint_detail). Deferring even the attachment alone would push the wave
  below its multi-spec LOC floor. The correct disposition is to KEEP both this wave to
  hold the floor, and the orchestrator should re-evaluate the attachment defer at P-1
  if the build LOC estimate firms up materially above ~2800 (the residual math reopens
  the THIN once headroom exists).

floor_constraint_active: true
floor_constraint_detail: |
  Applicable floor: multi-spec wave → >2500 LOC OR ≥6 specs (only ONE branch needs to
  clear; this wave is 3 specs, so the LOC branch is the live constraint).
  current_wave_loc_estimate: ~2800 LOC (3 specs).
  ACs I would otherwise have proposed to split, with est LOC:
    - optional attachment: ~350-450 LOC (NET-NEW schema — message-coupled attachments
      table forces a new assignment-attachment association or nullable message_id +
      upload path + UI picker + its tests).
    - organizer edit/delete: ~250-350 LOC (PATCH/DELETE endpoints + edit-form UI +
      tests).
  residual_loc after attachment-only defer: ~2800 − ~400 = ~2400 LOC → BELOW the 2500
  multi-spec LOC floor.
  residual_loc after both defers: ~2800 − ~750 = ~2050 LOC → well below floor.
  Why the floor blocks the split: neither defer (nor both) leaves a wave that clears
  the 2500-LOC multi-spec floor, and the wave is only 3 specs (the ≥6-specs branch is
  not met either). Per the mvp-thinner floor-awareness contract, a THIN that pushes the
  wave below its floor is refused → emit OK with floor_constraint_active: true. Both
  nice-to-have ACs stay in the current wave to hold the floor.
  Escalation note for head-product: if head-product / P-1 judges the ~2800 estimate
  conservative and the real net-new feature LOC is materially higher (e.g. attachment
  schema + upload come in heavier), the attachment defer becomes a clean THIN — re-run
  the residual check at P-1. The floor-exemption precedent (product-decisions 2026-06-30,
  wave-16 / wave-21: infra-reuse / UX-completion waves are floor-exempt) does NOT apply
  here — wave-22 is genuine net-new feature LOC, so the floor binds normally.

# No cross-milestone moves proposed. No new ACs proposed. Read-only; no code edits.
sibling_visible: false
