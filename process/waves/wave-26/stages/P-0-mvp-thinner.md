verdict: THIN
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: "M5 — Academic tooling: assignments"
milestone_class: product-feature
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside chat,
  mark it done, and get a reminder before it is due.
mvp_critical_status: |
  M5's mvp-critical scope is the assignment module (assignments-panel + AssignmentsModule +
  due-date reminders via NotificationsModule/Resend). This task (10b9d18e) is re-homed M3
  presence debt riding under M5 as active-milestone backlog — NOT part of M5's mvp-critical
  scope. Every AC here is presence-surface work; none traces to the assignment success metric.
  Therefore the milestone's mvp-critical claim does NOT depend on any AC in this task, and no
  precedence-tie with M5 assignment scope exists. The split below is a within-task coherence
  split, not an mvp-critical vs nice-to-have peel-off against the metric.

# THIN — the task's ACs cover ONLY message-row author dots; the title/What "DM/member-mention/
# hover affordance" extension is unspecified (no AC) and is a clean, separable thinner sibling.
proposed_split:
  acs_to_keep:
    - ac: "AC1 — message-row author avatars show a live presence dot from /presence (online/offline, updates live)"
      rationale: >
        Core of the coherent minimal slice. This is the one surface with a real design
        reference (server-channel-view.html message-row author avatar) and the whole
        stated user value ("tell at a glance whether a message author is online").
    - ac: "AC2 — uses the SHARED presence-dot primitive/token; degrades gracefully on unknown presence"
      rationale: >
        ESSENTIAL to the slice, not splittable. A dot with no unknown-presence degrade path
        is a broken dot (non-co-member authors would render wrong or crash). The shared-token
        clause is the anti-divergence guarantee the task's Why exists for. Keep.
    - ac: "AC3 — NO additional /presence socket; author dots + member panel share one presence client/store"
      rationale: >
        ESSENTIAL architectural constraint, not a relaxable AC. The task's entire Why is
        "single presence subscription powering every author-status indicator, avoiding
        divergent presence sources." Relaxing it defeats the reason to do the work at all
        and creates the duplicate-socket debt the sibling was authored to prevent. Keep.
  acs_to_split:
    - ac: "Extend presence dots to DM / member-mention / hover affordances (from the task title + ## What parenthetical: 'and any member-mention/hover affordance already present')"
      rationale: >
        This extension appears ONLY in the task title and a What-prose parenthetical — it has
        NO backing Acceptance criterion, so it is unspecified surface, not a verifiable AC of
        this wave. It is a distinct surface (DM lists / mention pills / hover cards) from the
        message-row author avatar, gated on which of those affordances actually exist yet, and
        carries its own coverage. Splitting it leaves BOTH halves coherent: the message-row-author-dot
        slice (AC1-3) is a complete, shippable, testable unit on its own, and the affordance-extension
        sibling is a clean follow-on that reuses the exact same shared presence store this wave
        establishes. Neither half is part of M5's mvp-critical assignment claim, so the split
        does not touch the milestone success metric either way — it is a scope-hygiene split that
        keeps this wave's spec tied to verifiable ACs and defers unspecified surface.
      sibling_task_seed:
        title: "Extend presence dots to DM / member-mention / hover affordances"
        description: |
          ## What
          Extend the shared presence-dot indicator (established for message-row author avatars)
          to the remaining member-facing affordances in the app where a user identity is shown:
          member-mention pills, hover/preview cards, and DM/member surfaces — wherever such an
          affordance actually exists at build time. Driven by the same live /presence state and
          the same single presence client/store, so presence is consistent everywhere a member
          identity appears.

          ## Why
          Completes the presence surface beyond message-row authors without opening a second
          presence subscription or a second styling source. Deferred from the message-row-author
          dots wave because it targets a different, partly-not-yet-built surface and carries no
          Acceptance criterion of its own there; splitting keeps the author-dot wave's spec tied
          to verifiable ACs and avoids building against affordances that may not be present.

          ## Acceptance (sketch — to be firmed at the picking wave's P-2)
          - Every member-identity affordance that exists at build time (mention pills, hover/preview
            cards, DM/member surfaces) renders a live presence dot from /presence, or is explicitly
            recorded as not-yet-present and out of scope.
          - Reuses the SAME shared presence-dot primitive/token AND the SAME single presence
            client/store the author-dot wave established — no new /presence socket, no second
            styling source; degrades gracefully on unknown presence.

          # Orchestrator: INSERT as a tasks row with
          #   milestone_id = a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d (M5, active),
          #   wave_id = NULL,
          #   parent_task_id = 10b9d18e-5071-41dc-85de-ef257b9dfde0 (this seed),
          #   status = 'todo', prose description above.
          # Note: like the seed, this sibling is re-homed presence debt, NOT M5 mvp-critical
          # assignment scope — it rides under M5 as active-milestone backlog.

sibling_visible: false

# Gold-plating watch (out-of-scope reminders for the picking wave's spec — none are in the ACs, keep OUT):
#   - presence hover-CARDS with rich profile content (this task is a DOT, not a card)
#   - study-status / away / busy states beyond binary online/offline
#   - dot entry/exit animation or pulse
#   Any of these appearing in P-2 spec would be scope-expansion, not thinning — flag at P-4.
