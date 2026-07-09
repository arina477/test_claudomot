```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  HOLD-SCOPE, not the other three. This is an INVESTIGATION-first correctness item on the
  core-wedge membership surface (students join study servers; roles gate who can do what) — the
  disposition is conditional on problem-framer's gap-vs-safe finding, so the strategic call is
  "confirm the scope is exactly right, then hold it," not expand or reduce. NOT SCOPE-EXPANSION:
  there is no adjacent capability the live bet implies bolting on — RBAC correctness is the whole
  job, and inventing a broader roles-redesign here would be scope drift off a bug-fix seed. NOT
  SCOPE-REDUCTION/DROP: IF the gap is real, joined members are mis-permissioned on the wedge's
  central join experience — a genuine correctness bug the founder cares about, not a trivial one.
  NOT SELECTIVE-EXPANSION: no cheap-but-disproportionate single addition beats simply fixing the
  shared membership-insert core cleanly. So: hold whatever scope problem-framer's finding sizes.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "unassigned — cross-cutting membership/RBAC (seed prose: 'not M11-specific'); waves.milestone_id stays NULL, roadmap COMPLETE / bug-fix phase"
proposed_scope_change: |
  (n/a — HOLD-SCOPE)
conditional_disposition: |
  The VALUE of this wave is CONTINGENT on problem-framer's technical finding (gap-vs-safe), which
  runs in parallel and is not yet visible to me. Frame both branches:

  - IF problem-framer finds NULL role_id is a REAL RBAC gap (RbacService.can() keys on role_id and
    NULL-role members are denied base member actions / defaulted incorrectly) → PROCEED at
    core-wedge-correctness altitude. A student who joins a study server and then can't do basic
    member things is a broken join experience on the single most central flow of the live bet.
    Worth fixing. This is the branch where the wave has real weight.

  - IF problem-framer finds NULL role_id is INTENDED-SAFE (RBAC treats NULL as implicit base/plain
    member — the seed's own alternative hypothesis) → the fix largely EVAPORATES to a legibility/
    doc item (make the intended-safe contract explicit in code + a guard test so a future RBAC
    change can't silently break the implicit-base assumption). In that branch the wave is THIN and
    should NOT be inflated to justify its own existence — re-seed to a heavier scope item and let
    this ride as a cheap doc/test follow-up. Do not manufacture scope to keep a hollow wave alive.
ambition_note: |
  IF a default-role assignment IS needed (gap-real branch), two very different scopes exist and the
  difference is strategically load-bearing:

  1. CLEAN shared-core fix (the target): assign the base role in the ONE shared membership-insert
     that both joinPublicServer and joinViaInvite reuse (seed prose confirms shared core at
     servers.service.ts ~671-675) + a regression test proving both join paths land a non-NULL role.
     Tight, low-blast-radius correctness fix. Hold here.

  2. BIGGER RBAC-model question (the scope trap to fence): "assign the base role" PRESUMES a base/
     @everyone role EXISTS per server. Resolved architecture is single-role-per-member
     (server_members.role_id; permission flags are boolean columns on `roles`, product-decisions
     v6b + wave-10) — but nothing in the record confirms a default role row is seeded at
     server-creation. If it is NOT, the "fix" is no longer a one-line insert: it forces (a) seed a
     base role per server (at creation + existing servers), and (b) a DATA MIGRATION to backfill
     role_id for existing NULL-role members across all servers.

  STRATEGIC CALL: whether a per-server default role already exists is the pivot that decides if this
  is a small clean fix or a roles-seeding + backfill wave. P-1 sizing / P-2 spec MUST resolve it
  explicitly before committing scope. If it becomes "design + seed a default-role model + migrate
  existing members," that is a real roles feature, NOT a bug-fix seed — surface it rather than let a
  bug-fix wave silently absorb a data migration. Ship the smallest correct slice that makes both
  join paths land the right permissions; defer any broader roles-model redesign.
risk_note: |
  Blast radius: this touches RBAC/membership — the authz core of the wedge. Guardrails: (1) any role
  assignment must re-derive server-side, never client-supplied role/permission trust (standing RBAC
  security note, product-decisions 2026-06-29); (2) if a backfill migration is needed, it must be a
  committed, re-runnable, idempotent migration (NOT auto-migrate-on-boot) — same discipline the
  wave-9 BOARD bound onto invite_code backfill. Timing mitigant: ZERO external users today, so a
  NULL-role gap has no live victim yet and any backfill touches near-zero rows — which is exactly why
  fixing it NOW (before real students join) is cheap and correctly-timed, not a reason to defer. No
  strategic reason to deprioritize: core wedge, cheap while empty, latent correctness landmine if
  left for post-launch.
escalation_reason: |
  (n/a — no strategic conflict beyond my authority. Conditional on problem-framer's finding, but that
  is a P-0 merge concern, not an ESCALATE.)
sibling_visible: false
```

## Strategic summary

**The single most important point:** value is CONDITIONAL on problem-framer's gap-vs-safe finding. If NULL role_id is a real RBAC gap, PROCEED at core-wedge-correctness altitude — a member who joins a study server and can't do basic member things is a broken join experience on the most central flow of the live bet, worth fixing. If NULL is intended-safe, the wave evaporates to a doc/test legibility item and should be re-seeded, not inflated to survive. **The scope pivot to fence at P-1/P-2:** "assign a default role" presumes a per-server base/@everyone role already EXISTS — the resolved model is single-role-per-member (`server_members.role_id`), but the record does not confirm a default role is seeded at server-creation. If it isn't, this stops being a one-line shared-core insert and becomes a roles-seeding + data-migration/backfill wave — a real feature, not a bug-fix. Ship the smallest correct shared-core fix that makes both join paths land the right permissions; surface (don't silently absorb) any migration; zero external users means now is the cheap, correct time to close this before real cohorts arrive.
