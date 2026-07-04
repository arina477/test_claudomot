```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  Not SCOPE-EXPANSION: the scope is already the correct size — a complete
  collect→return loop — and the one plausible expansion (grading) is a
  deliberate, strategically-correct exclusion, not an under-shoot. Not
  SELECTIVE-EXPANSION: the sole cheap-add candidate (a "your submission was
  returned" push notification over the w37 notifications infra) fails the
  disproportionate bar — the student already sees returned_at + the comment on
  the submission view (pull), so a push signal is incremental convenience, not
  loop-completion, and folding a new notification event-type + authz surface
  into this bundle mid-wave adds risk for marginal gain. Not SCOPE-REDUCTION:
  every one of the three tasks is load-bearing for the loop (submission → roster
  → return); nothing is trimmable without breaking the founder-directed
  capability. The bar here is execution quality on a right-sized, dependency-
  ordered slice — HOLD-SCOPE.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "84e17739-af5e-4396-beb9-b6f3d6836fc4 — M8 Educator tools & deeper academics"
proposed_scope_change: |
  None. Scope held as-authored.
sibling_visible: false
```

## Judge answers (founder's four questions)

**1. Right thing? YES — collect/return is the correct first-of-the-remaining M8 slice.**
Three converging signals, not one:
- **Founder anchor:** the Path-B resume directive named "assignment management" as the next educator scope explicitly and first.
- **Dependency order:** educator roles + `manage_assignments` + light moderation shipped w41; this is the capability that role now needs to *do something*.
- **Substrate reuse / lowest-risk highest-leverage:** assignment CRUD + private per-member todo/done + organizer attachments + reminders already ship. The *only* missing piece is a student-authored submission the educator can collect and return — this **completes a partially-built surface** and **reuses the shipped attachment presign**, rather than opening a net-new surface (class scheduling, DMs, search all would). First-of-remaining is correctly chosen.

**2. Ambitious enough? YES — and "no grading" is a correct ceiling, not an under-shoot.**
The bundle ships a *working* loop an educator can actually use: student submits (text + optional attachment) → educator sees the collect roster → educator returns with an optional prose comment. That is a real capability on ship, not an inert half-feature. Stopping at "no grading" is strategically correct: grading pulls in gradebook / rubrics / weighting / LMS-sync complexity that Teams and Canvas already own — chasing it would drag StudyHall out of its calm, lightweight Discord-displacement lane. A lightweight submit→acknowledge→return loop is exactly the school-aware differentiation Discord has zero of. The ceiling *reinforces* the wedge.

**3. Too ambitious / scope creep? NO gold-plating present.**
The bundle is disciplined: idempotent submit/resubmit, IDOR-safe, organizer-gated roster, return = `returned_at` + optional comment with explicit NO grade/score. No notifications, no LMS sync, no analytics folded in. Clean. One deferred candidate noted for a *later* M8 polish/notifications slice (not this wave): a return-triggered notification over the w37 in-app notifications infra — deferred per the mediation above and consistent with the standing HOLD-SCOPE discipline (cf. wave-37 deferral of live-bell-over-socket).

**4. Metric-TBD: SAFE to proceed, does not block.**
M8 `## Success metric` `_TBD by founder_` gates the *later discretionary* M8 slices (study-groups / DMs / search), not this founder-directed core dependency, which is fully specified by the `## Scope` prose ("collect/return — NO grading") + the Path-B directive. Same posture as wave-41, which proceeded. It remains a standing founder-checkpoint item but is not a wave-42 blocker.

**One-line rationale (return value):** PROCEED / HOLD-SCOPE — collect/return is the correctly-ordered, founder-anchored next educator slice that completes an already-built assignment surface with a real submit→roster→return loop; "no grading" is a deliberate wedge-preserving ceiling (not an under-shoot), there is no gold-plating, and the TBD metric gates only the later discretionary M8 slices, not this core dependency.
