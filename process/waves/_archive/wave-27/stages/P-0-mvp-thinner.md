verdict: OK
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: M5 — Academic tooling: assignments
milestone_class: product-feature
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside
  chat, mark it done, and get a reminder before it is due.
mvp_critical_status: |
  M5 mvp-critical scope (assignments module + due-date reminders) is largely
  shipped — assignments CRUD + per-member status spine + assignments-panel page
  + assignment-card primitive + manage_assignments permission are all done
  (per M5 task list). The reminder/Resend arc is the remaining declared
  mvp-critical scope, tracked in later M5 bundles. The seed task for THIS wave
  (6a546c7b) is NOT part of M5's mvp-critical scope at all — it is presence/perf
  DEBT re-homed under M5 as active-milestone backlog (product-decisions
  2026-06-30: "independent backlog under M5, NOT the M5 assignments feature
  scope"). So M5's mvp-critical claim does not depend on this task in either
  direction.

ok_rationale: |
  The seed is a single atomic backend query optimization: replace the full
  server_members scan in presence.service.getCoMemberUserIds (run on every
  /presence connect/reconnect) with a cheaper query shape (SELECT DISTINCT +
  supporting index), proven by one integration test / benchmark. There is no
  AC-level thinness split available — a single-query perf fix is one coherent
  change; fragmenting "optimize the query" from "prove it" would produce
  incoherent, individually-unverifiable siblings, not cleaner mvp-critical
  slices. The trace test also does not yield a split: the ENTIRE task sits
  outside M5's mvp-critical set (the success metric is assignments + reminders,
  which never touch presence perf), so there is no mvp-critical AC to keep and
  no nice-to-have AC to peel — thinness has nothing to operate on. Correct
  disposition is OK. No sibling tasks proposed. No precedence tie with
  ceo-reviewer to mediate on M5 scope, since this task is not M5-mvp-critical
  scope.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — OK was NOT emitted because of a floor block. It was emitted because the
  task is already the minimal atomic slice with no AC-level split to propose.

# Scope-guard flags (keep-OUT — NOT thinness splits; over-build risk to hold at P-1/P-2)
scope_guard_flags:
  - flag: KEEP-IT-MINIMAL — query-shape/index fix, NOT cache infrastructure
    detail: |
      The task source (wave-14 V-2) lists three candidate remedies:
      "SELECT DISTINCT / add index / cache". The FIRST two are the minimal
      coherent fix and should be sufficient. A caching layer — with its
      invalidation machinery (membership-change hooks, TTL tuning, cache
      warmup, stale-read reconciliation on join/leave) — is gold-plating for
      a 0-user / self-use-mvp app and should be held OUT of this task's scope.
      Building cache-invalidation correctness for presence co-membership is a
      materially larger, higher-risk change than the observed problem (a scan
      that is "Fine at self-use-mvp scale" per the debt note). Recommend the
      P-1/P-2 spec constrain the fix to query-shape (SELECT DISTINCT) + a
      supporting index on server_members, with a benchmark proving the
      per-connect cost drop. If a cache is ever justified it is a SEPARATE
      future task gated on real multi-server load evidence — not this one.
  - flag: DO-NOT-BUNDLE client-side presence perf (task 07361daf)
    detail: |
      The unassigned client-side presence perf task (07361daf) is a SEPARATE
      layer (client) from this server-side query fix. Bundling it is not an
      AC-thinness question and is out of mvp-thinner's lane — that is a
      scope-EXPANSION call for ceo-reviewer, not a thinness split. Noted here
      only to pre-empt accidental scope creep; mvp-thinner does not propose it.

sibling_visible: false
