```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Premise verification (PRODUCT-PRINCIPLES rule 1) passed on every claim: rbac
  Permission union is exactly 4 (rbac.service.ts:29), assignments authz funnels
  through a single assertOrganizer call site gating can(...,'manage_channels')
  (assignments.service.ts:61), and the wave-22 code already documents this exact
  swap as intended (assignments.service.ts:34). The seed is a small, risk-free
  correctness step that removes a KNOWN, deliberately-deferred authz over-grant
  logged at wave-22 P-4 (Gemini/head-product G2), not net-new abstraction. It is
  not premature-abstraction (#4): it adds ONE concrete flag for ONE real,
  already-existing consumer (the assignment-organizer check), not a framework or
  DSL. It is not a config-knob with no consumer (#6): the consumer is the live
  assertOrganizer gate. The symptom-vs-cause check resolves to CAUSE: the real
  cause is "manage_channels is overloaded to mean two distinct capabilities
  (channel admin AND assignment-posting)", and splitting the flag fixes that
  conflation at its source rather than papering over it. Framing is sound.
symptom_vs_cause_check: |
  MANDATORY check — result: this targets the CAUSE, not a symptom. The wave-22
  reuse of manage_channels for organizer authz is a documented capability
  conflation: a single permission bit now means two unrelated things. The seed
  does not patch a downstream symptom (e.g. adding a special-case bypass); it
  separates the two capabilities at the permission-model layer where they were
  fused. Correct layer (the rbac Permission model + roles columns + DTOs), not a
  wrong-layer fix (#2) and not demo-path tunnel vision (#3 — the migration story
  is explicitly handled: no non-owner organizer roles exist yet, confirmed in
  db/backfill-roles.ts which seeds only owner roles with manage_channels/
  manage_members and no manage_assignments, so the change is purely additive).
near_trigger_assessment: |
  The seed's own stated trigger — "before any non-owner is granted
  assignment-organizer rights" — is NOT yet active (StudyHall is pre-launch,
  self-use-mvp, edtech, 0 users; only owner roles are seeded). This is the one
  honest tension. It is, however, the precise window in which the change is
  free: zero rows to migrate, single call-site swap, additive union extension.
  Doing it now (while it is a mechanical, reviewable diff) versus later (once
  delegated organizer roles exist and the swap requires a data migration +
  careful re-grant) is the cheaper ordering. The strategic "is the timing worth
  it vs the reminders arc or presence/mention debt" question is ceo-reviewer's
  call (parallel sibling), not problem-framer's — that is value/sequencing, not
  framing. From a framing standpoint the problem is correctly posed and the
  near-trigger is plausibly the next M5 delegation step, so PROCEED rather than
  REFRAME. Flagging the timing tension here for head-product + ceo-reviewer to
  weigh at P-0 merge.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
```

## Notes for P-0 merge

- **No antipattern match.** Smell-check on premature-abstraction (#4) and
  config-drift (#6) both came back clean: one concrete flag, one live consumer,
  no speculative generality.
- **Verified files (all premises true):**
  - `apps/api/src/rbac/rbac.service.ts:29` — `Permission` union is the documented 4.
  - `apps/api/src/rbac/rbac.service.ts:123-126,155-158,550-566` — role flag columns,
    create/update DTO field handling, and `roleToDto` mapping (the 4 surfaces the
    seed says to extend 4→5 — all present and consistent).
  - `apps/api/src/assignments/assignments.service.ts:34,61` — single
    `assertOrganizer` call site on `can(...,'manage_channels')`; wave-22 inline
    comment already names the `manage_assignments` swap as "one line + additive
    roles migration."
  - `apps/api/src/db/backfill-roles.ts:50` — seeds only owner roles
    (`manage_channels, manage_members`); no `manage_assignments`, confirming the
    "no rows to migrate" claim and the additive/risk-free framing.
- **One open tension carried to merge:** the stated trigger is not yet active
  (0 users, owner-only roles). That is a value/sequencing judgment (ceo-reviewer)
  — framing itself is correct. If ceo-reviewer rates this below the reminders arc
  or presence/mention debt on strategic value, head-product should mediate
  sequencing at merge; problem-framer's framing verdict stands either way.
