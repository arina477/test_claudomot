verdict: OK
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: "M5 Academic tooling: assignments"
milestone_class: product-feature
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside
  chat, mark it done, and get a reminder before it is due.
mvp_critical_status: |
  M5 headline (assignments spine + delegated authz) is DONE (w22/w23). The
  remaining mvp-critical clause of the success metric — the due-date reminder
  arc (cron + NotificationsModule via Resend) — is CRED-BLOCKED (founder Resend
  key pending), NOT scheduled this wave. Wave-24 is a re-homed M3/M4 debt wave
  (real-PG integration coverage) parked under M5; it does not advance the M5
  success metric and is not intended to. This is the correct disposition given
  the reminders arc cannot proceed.

ok_rationale: |
  The seed's proposed scope is already minimal-coherent and well-classified —
  there is no gold-plating bundled to split off, and it cannot be thinned
  without producing a dead wave. Detail below.

  (1) SCOPE IS THE MINIMUM COHERENT SLICE. Seed 02fa8011 is a solo-task bundle
  narrowly scoped to two real-DB integration specs on load-bearing paths that
  are currently mock-DB-only: presence.service co-member resolution
  (getCoMemberUserIds) + servers.service member-gate (GET /servers/:id/members).
  That is exactly the wave-14 F-3/F-3b gap, re-confirmed w15/w17/w18. Both paths
  are auth/visibility-bearing and only carried today by live T-8 two-client
  probes — the classic coverage gap this debt seed closes. Neither spec can be
  deferred without leaving the wave empty; there is no "keep vs split"
  partition to draw. Applying the literal trace test here would flag every AC
  as non-critical (none traces to the assignments success metric), which is an
  artifact of debt-under-a-product-milestone, not real gold-plating — so the
  trace test is inapplicable and I do NOT recommend splitting on that basis.

  (2) NO GOLD-PLATING IS BUNDLED — the seed is already disciplined. The DB
  description explicitly frames this as a "THIN CONSUMER of the harness ...
  rather than a from-scratch build" (existing wave-17 apps/api/test/integration/
  pg-harness.ts + vitest.integration.config.ts + CI postgres:16). Nothing to cut.

  (3) EXPANSION VECTORS TO KEEP OUT AT P-2/P-3 (pre-emptive out-of-scope flags,
  so spec/plan do not silently add them):
    - Rebuilding the tier / testcontainers / docker-compose: FORBIDDEN. The
      pg-harness + CI postgres service already work. Any P-2 AC that re-derives
      the harness is pure gold-plating — reject on sight.
    - A new dedicated CI job: NOT needed. The existing `test` job already runs
      the integration tier. No new job.
    - Exhaustive edge-case integration specs beyond the two load-bearing paths:
      out of scope. One real-DB happy + one real-DB deny assertion per path is
      the load-bearing minimum; combinatorial edge matrices are deferrable and
      should NOT be authored into this wave.

  (4) rbac/assignments authz coverage is NOT this wave's scope — and is NOT
  mine to add. The checklist carry-in mentions "extend to rbac/assignments
  authz" (the wave-23 F23-T-4 gap), but (a) that is a different module from the
  seed's presence/servers scope, and (b) the assignments authz gap already has
  its own todo task, 4b397de0 (controller-spec /assignments/:id IDOR-derivation).
  Pulling rbac/assignments authz into this wave is scope-EXPANSION —
  ceo-reviewer's lane, not mine (Hard rule: never propose new ACs). Flag for
  head-product: IF P-1 finds this two-spec wave under its size floor, the
  coherent pairing to raise with ceo-reviewer is the rbac/assignments authz
  integration specs (same harness, same "authz surface shipped without real-DB
  test" rationale) — but that is an ADD decision owned by ceo-reviewer/P-1, not
  a thinness split. I do not author it.

  (5) DEAD-TEST / FALSE-GREEN CAVEAT (do not thin below execution). The
  wave-17 lesson (Turbo strict-env stripped DATABASE_URL_TEST → integration
  SKIPPED despite green) means the load-bearing assertion in each spec IS the
  real-DB round-trip. Thinning must never remove the DATABASE_URL_TEST guard or
  reduce a spec to a mock that no longer hits Postgres — that would ship a
  passing-but-inert test, which is worse than the current gap. This reinforces
  OK: the minimum here is already the real-DB hit; there is nothing safe to cut.

floor_constraint_active: false
floor_constraint_detail: |
  N/A — OK was not emitted to block a floor-violating THIN. There is simply no
  gold-plating in the seed to split; a THIN was never warranted. (Separately
  flagged above: if P-1's own floor check fires, the rbac/assignments authz
  pairing is an ADD for ceo-reviewer/P-1, not an mvp-thinner split.)

sibling_visible: false
