verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  This is a V-2/T-6-triaged debt-clearing wave on the SHIPPED M8 core — scope was
  already sized by prior verify/test stages, so it is neither timid nor grandiose;
  the bar is execution quality, not scope. Not SCOPE-EXPANSION: the only larger scope
  available is M8's discretionary features (study-groups/DMs/search), which are
  hard-barred until the founder sets the `_TBD` success metric — expanding here would
  drive straight into the metric gate the founder escalation exists to resolve. Not
  SELECTIVE-EXPANSION: no single cheap-but-disproportionate addition beats the barred
  discretionary work, and the set already includes the one high-leverage item (the
  MAJOR live-calendar responsive defect). Not SCOPE-REDUCTION/DROP: the MAJOR
  responsive defect on the live class calendar + two real coverage gaps clear the
  worth-doing bar; even the smallest nit (CTA copy) rides inside a task that carries
  the MAJOR fix, so nothing is worth carving out.
bet_traced_to: Academic tools + offline-first win students from Discord
milestone_traced_to: 84e17739-af5e-4396-beb9-b6f3d6836fc4 — M8 Educator tools & deeper academics
proposed_scope_change: |
  none (HOLD-SCOPE)
drop_rationale: |
  n/a
escalation_reason: |
  n/a
sibling_visible: false

# Judge answers (ceo-reviewer reasoning, non-schema)

## 1. Right thing NOW?
YES. The bet's core claim is that "the shipped educator tools must WORK well" — a MAJOR
layout defect on the LIVE class calendar (a founder-named M8 core surface, task
535bdb8c/cdf81427) directly undercuts the wedge every time an educator opens it at
1024px. Clearing this while the discretionary-feature decision awaits the founder is
strictly better than idling (the loop cannot proceed on barred scope) and better than
pulling a different M-milestone forward (M9 monetization / M10 compliance / M11 growth
are all `todo` H2/later, none more urgent than a live defect on shipped H1-adjacent
educator core; jumping horizons to dodge a metric gate would be strategic drift). This
is debt on the shipped wedge, which serves the "tools that actually work" thesis.

## 2. Ambitious enough / too little?
SUBSTANTIVE, not makework. The MAJOR responsive defect alone justifies a wave; the two
real coverage gaps (assignment-submission unit+attachment integration 8d971bc2;
delete-any-message E2E with second-client fan-out ca43eb12; scheduled-session DTO
timestamps 0308cdf1) are genuine correctness/regression-guard debt on educator +
moderation surfaces, not gold-plating. No item is pure gold-plating to drop: the
CTA-copy nit and muted-member padding (8828484f) are cosmetically thin on their own,
but the CTA copy is bundled inside the same task as the MAJOR calendar fix (8e54799a)
and the padding fix is a trivially cheap roster-polish sibling — neither is worth the
ceremony of a DROP, and carving them out would not ship the outcome any sooner.

## 3. Anything MISSING (expansion candidate)?
NO expansion warranted. The tempting "while we're hardening, add X" candidates are all
the metric-barred discretionary features (study-groups, DMs, search) — adding any is
the exact move the founder checkpoint exists to gate, so it is off-limits, not merely
declined. The V-2/T-6-triaged set is the right scope: it is precisely the accumulated
follow-up debt surfaced by prior waves' own verify/test gates on the shipped core.

## 4. Does this need the M8 metric?
NO. Confirmed. Every one of the 6 tasks is a follow-up on an already-`done` M8 core
task (class scheduling 535bdb8c/cdf81427; assignment submit/return db8e082a/b859984b/
1746f72a; light-moderation delete-any-message 6ddddc2d; scheduled-session detail
1216146e). None introduces a new discretionary feature from M8's unshipped `## Scope`.
The `_TBD by founder` success metric gates NEW discretionary scope, not hardening of
already-shipped scope — so this wave is correctly metric-independent.
