# Wave 87 — P-1 Decompose

## Maximum-size rubric (split when over)

| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~3-4 (servers.service.ts join core + shared helper; servers.service.spec.ts; maybe integration spec) | no |
| New primitives | > 60 | 0-1 (optional `resolveDefaultRoleId` shared helper) | no |
| Estimated net LOC | > 5,000 | ~120-160 (role lookup + set role_id in shared join path + no-default-role fallback + tests) | no |
| Stage-4 working set | > 350K tok | trivial (single-file fix) | no |

**No maximum threshold trips.**

## Wave type

`claimed_task_ids = [dc4abee3]` → length 1 → **`single-spec`**.

## Minimum-size floor (merge when under)

- single-spec floor: net LOC **> 1,500**.
- Estimate: ~120-160 LOC. **FLOOR TRIPS → RESCOPE-AUTO-MERGE.**

## RESCOPE-AUTO-MERGE attempt → IMPOSSIBLE → escalate

The documented MERGE remedy (step 2b) re-invokes milestone decomposition to author new siblings from the active milestone's `## Scope` prose. **This is structurally impossible here:**
- `SELECT … milestones WHERE status='in_progress'` → 0 rows.
- `SELECT … milestones WHERE status='todo'` → 0 rows.
- Seed `dc4abee3.milestone_id IS NULL` (unassigned bug-fix-phase task).

There is no milestone to decompose from → decomposition cannot author siblings → `floor_merge_attempt` cannot be spent productively. Per step 4 recursion-guard: **escalate per active mode.** Mode = `automatic` → **BOARD**, decision-slug `P-1-floor-merge-wave-87`.

This is not unique to this wave: the roadmap is complete and the founder is in a bug-fix phase, so *every* single-fix wave will trip the feature-sized floor with no milestone to merge from. The BOARD decision should set a reusable precedent (logged to `product-decisions.md`) so future bug-fix waves route deterministically instead of re-escalating each time.

### Escalation options presented to BOARD
- **A — Override-ship the sub-floor single-spec fix** as-is (coherent, valuable, behavior-preserving; removes a standing backfill dependency). Establishes "bug-fix-phase single-fix waves may ship below the feature floor" precedent. *(orchestrator lean: recommended — a coherent small wave beats an incoherent big one.)*
- **B — Bundle ~6 small backlog bugs** into a multi-spec batch to clear the floor via `claimed_task_ids.length >= 6`. Mechanically satisfies the floor but assembles a cross-cutting grab-bag (auth + servers + privacy schema + web error surface) with wider review + blast radius.
- **C — Cancel/hold** the seed.

## design_gap_flag

```yaml
design_gap_flag: false
missing_surfaces: []
```
Backend-only data-hygiene fix (server-side membership insert + tests). No UI surface touched — the default 'Member' role has identical (all-false) permissions to NULL, so no user-visible change to design.

## Verdict — RESOLVED

Escalated to BOARD (`P-1-floor-merge-wave-87`) → **7/7 unanimous APPROVE A: override-ship the coherent sub-floor single-fix.** No hard-stops. Floor WAIVED per the BOARD ruling + wave-83 precedent + PRODUCT-PRINCIPLES #5. Final verdict: **PROCEED** to P-2. Full votes + guardrails: `escalations/board-P-1-floor-merge-wave-87.md`; precedent logged to `command-center/product/product-decisions.md`.

```yaml
wave_type: single-spec
max_rubric_trips: none
floor_applicable: 1500
floor_estimate_loc: ~140
floor_verdict: RESCOPE-AUTO-MERGE
merge_feasible: false        # no in_progress/todo milestone; seed milestone_id NULL
floor_merge_attempt: 0       # decomposition impossible — not spent
escalation_route: BOARD/automatic
decision_slug: P-1-floor-merge-wave-87
board_verdict: 7/7 APPROVE A (override-ship, floor waived)
verdict: PROCEED
design_gap_flag: false
```
