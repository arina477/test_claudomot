verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1, 2, 4]
symptom_vs_cause_check: |
  Ran (mandatory). The task frames the M8-opening need as "introduce a distinct educator ROLE
  + an educator-scoped PERMISSION, and re-gate assignments on it." Reconnaissance of the shipped
  RBAC (apps/api/src/rbac/rbac.service.ts + packages/shared/src/rbac.ts + apps/api/src/db/schema/servers.ts)
  shows the CAUSE-layer reality differs from the framing:
    - Assignments are ALREADY gated on can(userId, serverId, 'manage_assignments') — a real RBAC
      permission, NOT owner/organizer-hardcoded (assignments.service.ts assertOrganizer, line 56).
      The task's premise "currently organizer/owner-gated" and the implied "re-gate to let educators
      manage" is largely already true: any role with manage_assignments=true manages assignments today.
    - The RBAC has NO concept of a "role type." A role is a per-server row (roles table) carrying five
      independent boolean permission columns; members are single-role-per-member. "Educator" is not a
      new KIND of role — it is a role row whose flags happen to include moderation permissions.
    - The genuinely-absent CAUSE-layer capability is MODERATION permissions + a timeout mechanism,
      NOT a role type. Delete-any is currently gated on manage_channels (messages.service.ts) with the
      socket fan-out already shipped (message:deleted → channel room). Timeout has ZERO substrate:
      no muted_until column on server_members, and the send path (ChannelMessageGuard) only checks
      channel visibility, never member mute-state.
reasoning: |
  The wave is framed around the wrong noun. It asks for a "distinct educator role + educator
  permission," but the shipped RBAC has no role-type taxonomy (antipattern #4, premature abstraction):
  a role is just a named bundle of boolean permission flags. The correct model is to ADD the missing
  moderation permission flag(s) to the existing roles-schema and let "educator" be a role that carries
  them — not to invent a new role kind. The framing also carries a false-present/false-absent premise
  (PRODUCT-PRINCIPLES rule 1; antipatterns #1 symptom-vs-cause, #2 wrong-layer): "re-gate assignments"
  overstates the delta because assignments already ride can('manage_assignments'), and it understates
  the real delta, which is moderation. Separately, the two moderation powers are NOT symmetric:
  delete-any reuses the shipped can() + shipped socket fan-out (cheap), while timeout is a NEW STATEFUL
  mechanism (schema column + a new authorization gate in the previously visibility-only send path) —
  materially heavier and a distinct concern the seed treats as one line ("time out a member").
  This is recoverable with a re-noun, so REFRAME, not ESCALATE (no product-decisions/founder-bet
  contradiction found). Not RESCOPE-AUTO-SPLIT: the two tasks are causally coupled (moderation power
  needs a permission to gate on), so the split belongs to P-1 sizing on the timeout weight, not here.
proposed_reframe: |
  Reframe the M8-opening slice around the ACTUAL substrate delta:

  SEED (6cf06f99) — "Add an educator permission to the existing RBAC + seed an educator role":
    - Do NOT introduce a new "role type." Add one (or more) new boolean permission column(s) to the
      shipped `roles` schema (packages/shared/src/rbac.ts RolePermissionsSchema + roles pgtable +
      the Permission union in rbac.service.ts) — e.g. `moderate_members` (and reuse the existing
      `manage_channels` for delete-any, OR add a dedicated `moderate_messages` — a P-2/P-3 contract
      choice). Provide a shipped "Educator" role preset that bundles these + manage_assignments so an
      owner can grant one role that covers the educator job.
    - "Educators manage assignments" is ALREADY satisfied by manage_assignments; the seed should NOT
      claim to re-gate assignments. At most it verifies the educator preset carries manage_assignments
      and confirms the existing can()-gate is unchanged (guard against a regression, not a rewrite).
      If the intent is a distinct assignment-permission separate from the current one, that must be
      stated explicitly and justified — otherwise drop it (antipattern #2 avoided: no gratuitous
      re-gate of a working owner/RBAC path).
    - Grant/revoke UI stays as-is: assigning the educator role via the existing single-role member view.

  SIBLING (6ddddc2d) — "Educator moderation, gated on the new permission":
    - Delete-any: LOW cost — the socket fan-out (message:deleted) and a can()-based delete-any path
      already exist (currently manage_channels). Wire it to the new educator permission; enforce the
      "can't moderate an owner/admin above me" rule (position/owner check).
    - Timeout: FLAG AS THE HEAVY, SEPARABLE PIECE. It is a NEW stateful mute mechanism — needs a
      `muted_until` (nullable timestamp) column on server_members AND a new send-time authorization
      check in ChannelMessageGuard (which today only checks channel visibility). This is a distinct
      concern from delete-any and should be called out to P-1 as a candidate for its own sibling if
      sizing runs hot. Do not treat "delete + timeout" as one uniform-cost power.

  Net: the wave is "add moderation permission(s) + moderation powers to the existing flag-based RBAC,"
  NOT "introduce a new educator role type and re-gate assignments." Same user-visible outcome
  (educators moderate + manage assignments), correct underlying model, no invented taxonomy, and the
  timeout-weight surfaced for P-1.
escalation_reason: |
  n/a
sibling_visible: false
