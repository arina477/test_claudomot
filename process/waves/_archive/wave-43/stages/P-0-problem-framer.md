verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): PASS. "Class scheduling" is a founder-named
  (Path-B) + M8-scoped root capability, not a symptom-layer patch. A dedicated
  scheduled_sessions entity IS the correct root primitive — there is no deeper
  missing primitive it papers over (server/RBAC/user substrate all exist). The
  problem is framed at the capability layer, which is the right layer.

  Antipattern sweep against the universal catalog: no matches.
  - #2 (wrong layer / don't-rewrite-working-authz): AVOIDED. Verified in
    apps/api/src/assignments/assignments.service.ts that assertOrganizer=
    can(userId,serverId,'manage_assignments') (L68), assertMember (L81), IDOR-safe
    serverId-from-row derivation, soft-delete (is_deleted), and rowToDto are the
    shipped patterns. The spec reuses them rather than rebuilding — correct.
  - #4 (premature abstraction / invented taxonomy): AVOIDED, and this is the
    load-bearing finding. Verified in apps/api/src/rbac/rbac.service.ts that the
    permission model is a CLOSED set of 5 boolean columns (manage_server,
    manage_roles, manage_channels, manage_members, manage_assignments) — not an
    extensible string permission. The spec's explicit "reuse manage_assignments,
    NO new scheduling flag" is the correct anti-abstraction call: a distinct
    manage_scheduling permission would require a new roles-table column + migration
    + wiring across createRole/updateRole (L130-134, L164-168) + superuser/default
    seeds (L295-318) + every role DTO/UI, with zero consumer demand. Educators who
    manage assignments are the same population that schedules classes.
  - #3 (demo-path tunnel vision): AVOIDED. Sibling tasks cover member calendar
    (assertMember read) + role-gated detail edit/delete, not just the organizer
    happy path. Soft-delete + is_deleted-excluding reads carry from the mirror.
  - #5 (scope creep through coupling): AVOIDED. The CRUD fence (no reminders/RSVP/
    ICS/timezone-negotiation) is appropriately minimal; store/display server-local
    + UTC mirrors the shipped assignments due_date convention exactly.

  Reuse-vs-generalize (red-team axis 4): the assignments mirror is a
  code-organization mirror (module/service/controller layout + authz + soft-delete
  + rowToDto), NOT a schema clone. The one genuine structural divergence — single
  due_date timestamp vs starts_at/ends_at + recurrence descriptor — is correctly
  modeled as a different schema, not force-fit onto the assignments shape. Sound
  reuse boundary, no over-forced reuse.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false

# Non-blocking notes for P-1 / P-3 (not verdict-affecting):
# 1. RECURRENCE RABBIT-HOLE RISK — the highest live risk in this wave. "simple
#    recurring (weekly)" must be held to a bounded descriptor (e.g. one_off |
#    weekly + recurrence_until), NOT an RRULE/iCal expansion engine. P-3 should
#    lock the recurrence descriptor as a small closed enum + until-date and
#    explicitly fence out RRULE, multi-rule, exceptions/overrides, and per-instance
#    edits. If P-1 sizing shows recurrence expansion creeping, split it to a
#    sibling and ship one-off + weekly-flat only in the seed.
# 2. STORAGE MODEL FOR RECURRENCE — flag for P-3: single row + recurrence
#    descriptor (compute occurrences on read) vs materialized per-occurrence rows.
#    The former keeps the mirror clean and avoids a scheduling-engine; recommend it
#    as the default framing but leave the decision to P-3 approach.
# 3. FUTURE PERMISSION SPLIT is deliberately deferred, not foreclosed — reusing
#    manage_assignments now does not prevent a later wave from splitting out a
#    scheduling permission if a real "schedule-but-not-grade" consumer appears.
#    No reason to pre-build it. Correct as-is.
