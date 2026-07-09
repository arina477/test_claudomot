```yaml
verdict: SELECTIVE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SELECTIVE-EXPANSION
mode_rationale: |
  Not SCOPE-REDUCTION/DROP: the seed is genuinely worth doing. It sits on the assignments
  surface — a core academic-tools feature and the live wedge — and a wrong-revert + silent
  failure is a correctness/trust gap, made more load-bearing by the offline-first bet (offline =
  failed writes are the common case, not the edge). Not HOLD-SCOPE: holding to "fix this one card's
  revert" ships the assume-opposite-revert fix but leaves the actually-recurring problem (silent
  failure on failed optimistic writes) untouched on the exact card the founder is looking at.
  Not SCOPE-EXPANSION: the tempting big version — "fix the optimistic-revert pattern everywhere +
  build a shared error-toast system across all 8 call sites" — is grandiose here. Evidence (frontend
  sweep) shows the assume-opposite-revert bug is ISOLATED to AssignmentCard (1 of 9 optimistic sites;
  the other 8 already restore a captured prior value), so a codebase-wide revert-fix would be
  gold-plating 8 non-bugs. The one cheap-but-disproportionate addition is the user-facing error
  toast on THIS card's failed toggle — it closes the real trust gap the offline-first bet cares about,
  on the wedge surface, at trivial marginal cost over the snapshot-restore fix already in scope.

bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "unassigned — all 14 milestones are status='done'; StudyHall is in a bug-fix/backlog-clearing phase, seed came off the unassigned queue (milestone_id NULL). Traces to the live bet via the assignments (academic-tools) surface, not to an open milestone."

proposed_scope_change: |
  Keep the wave scoped to AssignmentCard's handleToggle. Two ACs, both cheap and both on the one card:
    1. (already in seed) Snapshot the prior status before the optimistic flip; on error, restore the
       captured value — NOT the assumed opposite. This is the correctness fix.
    2. (the selective addition) Surface a user-facing error toast/notification on the failed toggle
       instead of console-only. This is the trust/UX half that the offline-first bet makes matter:
       a student toggling an assignment done while their connection drops must SEE that it didn't stick,
       not silently believe it did.

  Explicitly OUT of scope for this wave (do NOT expand into them here):
    - Do NOT retrofit the other 8 optimistic-update sites — the assume-opposite-revert bug does not
      recur there; they already restore captured state. Touching them is fixing non-bugs.
    - Do NOT build/extract a project-wide shared useToast utility + wire it across all sites in this
      wave. That IS a real, worthwhile gap (8 of 9 optimistic sites lack a failure surface; no shared
      toast utility exists — each rolls its own), but it is a milestone-shaped consistency initiative,
      not a Low-severity single-card bug fix. Bolting it onto this seed would be a 9/10 build on a 3/10
      seed with no milestone to anchor it and 33 other backlog items queued.

  RECOMMENDED FOLLOW-UP (do not build now; queue it): author a standalone backlog task —
  "Consistent failed-optimistic-write error surface: extract a shared toast utility (design system
  already ships a Toast primitive) and retrofit the ~8 optimistic mutation sites that currently fail
  silently." That is the genuinely ambitious version of this theme and it earns its own wave; the
  offline-first bet makes it worth doing, but as deliberate scope, not as seed-creep. For THIS card,
  reuse the existing local-toast approach already present in ServerOverviewSettings so the fix stays
  cheap and doesn't block on the shared-utility work.

drop_rationale: |
  (n/a)
escalation_reason: |
  (n/a)
sibling_visible: false
```

## Reasoning notes (internal, not founder-facing)

**Worth doing / altitude.** Low-severity by triage, but the two multipliers the directive flags both hold up: (1) it's on the assignments surface, which is core academic-tools = the wedge; (2) the offline-first bet inverts the usual "failed toggle is a rare edge case" calculus — offline-first means failed writes are expected traffic, so a wrong-revert + silent failure is a recurring, on-wedge trust gap, not a corner case. That lifts it above "real bug that doesn't matter." It's a good, small use of a wave in a backlog-clearing phase. No higher-impact bug needs to jump it — but it is not uniquely urgent either; it's a clean, cheap correctness+trust win worth taking now.

**Ambition altitude — the 9/10 vs 3/10 call.** The directive's framing assumed the ambitious version might be "fix the assume-opposite pattern wherever it recurs." The frontend sweep kills that premise: the assume-opposite-revert bug is isolated (1/9 sites; the rest restore captured state). So the revert-fix does NOT scale into a pattern-fix — expanding it would gold-plate 8 correct sites. The real recurring theme is the *silent-failure* half (8/9 sites lack an error surface; no shared toast utility). That IS the offline-first-relevant systemic gap — but it's milestone-shaped, not seed-shaped. Therefore:
  - 3/10 = fix only the revert (ships the correctness fix, leaves the trust gap on the wedge card).
  - **9/10 for THIS wave = revert-fix + error toast on this one card** (both halves, both cheap, both on-wedge). ← selected.
  - Over-10/over-scope = revert-fix + toast + shared-utility-across-8-sites in one wave (grandiose for a Low seed with no anchoring milestone). ← rejected, spun out as a queued follow-up.

**Reprioritization.** No strategic reason to defer or reorder the seed itself. The one strategic action beyond this wave: capture the shared-error-surface initiative as an explicit backlog task so the offline-first-relevant work isn't lost — but as its own future wave, so it can be sized honestly rather than smuggled in here.
