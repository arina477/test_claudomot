# Wave 43 — B-6 Review

## Phase 1 — head-builder: APPROVED
Class-scheduling contract-faithful + authz airtight (every :id route derives server_id from the row; assertOrganizer=manage_assignments on write, assertMember on read; recurrence expansion provably bounded ≤~13 iterations/90d cap, no DoS; soft-delete excluded; scope fence grep-clean). 1 Medium accepted-debt flagged (updateSession range bypass) → confirmed + fixed at Phase 2.

## Phase 2 — /review (code-reviewer on diff)
- Round 1: HAS-FINDINGS — **H1 (HIGH):** updateSession bypasses endsAt>startsAt (+ weekly recurrenceUntil>=startsAt) on single-field PATCH → persisted ends<starts. **M2 (Medium):** startsAt/endsAt lack .datetime() → malformed input → 500. **M1 (Medium):** weekly-edit collapses occurrences (splice vs re-fetch; shared occurrence id). **M3 (Medium, DEFERRED):** bad-UUID :id → 500 (pre-existing project-wide, same as assignments — cross-cutting, not scheduling-scoped). L1-4 graceful/known/verified (recurrence bounds verified solid).
- Fixes: H1+M2 → node-specialist (updateSession effective-value re-check + .datetime() request schemas, commit 0fbeae0); M1 → react-specialist (loadSessions re-fetch on save/delete + composite occurrence key, commit dfb659e).
- Round 2 (re-review): **CLEAN** — H1/M2/M1 all FIXED, no new findings. effUntil derivation correct (input undefined vs null-clear); Date comparison sound; re-fetch deps clean; composite key avoids collisions.

## Action 6 — commit discipline (multi-spec)
- 535bdb8c: 12c5bad (backend CRUD) + B-0 schema + 03dcd5f (SessionForm) + 0fbeae0 (H1/M2 fix). cdf81427: 64d6a8a (list) + 465f5d6 (ClassCalendar) + dfb659e (M1 fix). 1216146e: 7d77797 (getSession) + 4e7038d (SessionDetail). Every task_id has ≥1 citing commit; backend/frontend file-disjoint. 2f03a04 biome-format = whole-branch B-5 fix. PASS.

## Non-blocking → V-2
- M3 (bad-UUID :id → 500): pre-existing project-wide (same as assignments); a shared 22P02/uuid filter is a cross-cutting decision → V-2/backlog.
- Weekly-series selection keys off bare session.id (selecting one occurrence highlights all; detail can't distinguish) — inherent to one-id-per-series expansion; non-blocking UX nuance → V-2.

```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 2
findings_critical: []
findings_high: []
findings_medium_accepted: ["M3 bad-UUID→500 (pre-existing cross-cutting)", "weekly-series selection by bare id (occurrence-model nuance)"]
findings_low_accepted: ["L1 left-server organizer empty identity (graceful)", "L2 unparseable from/to → [] (frontend always valid ISO)", "L3 cross-midnight single-day form constraint (scope)"]
fix_up_commits: ["H1+M2 validation (0fbeae0)", "M1 refetch+key (dfb659e)"]
final_verdict: APPROVE
```
