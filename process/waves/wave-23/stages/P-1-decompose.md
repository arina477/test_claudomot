# Wave 23 — P-1 Decompose

## Bundle
claimed_task_ids (provisional) = [8aa67564 seed (manage_assignments permission split), edbdea8f sibling (/me effective-permissions endpoint + assignments CTA gate)]. **wave_type = multi-spec** (2 tasks).

## Maximum rubric (split when over) — NO threshold trips
| Measure | Estimate | Threshold | Trip? |
|---|---|---|---|
| Files touched | ~12-14 (rbac.service.ts + roles schema + migration 0011 + role create/update DTOs in shared + roleToDto + assignments controller/service call-site swap; /me-permissions controller+service + shared DTO + AssignmentsPanel CTA gate + api.ts + tests) | >60 | no |
| New primitives | ~4 (1 permission union value, 1 roles column + migration, 1 /me read endpoint, DTO surface updates) | >60 | no |
| Net LOC | ~310-380 | >5,000 | no |
| Stage-4 working set | small (~plan + rbac/assignments module briefs) | >350K | no |

## Minimum floor — TRIPS (below)
multi-spec floor = net LOC >2,500 **OR** claimed_task_ids ≥6. Estimate ~380 LOC / 2 specs → **below floor → RESCOPE-AUTO-MERGE**.

### MERGE protocol (one mandated decomposition-expansion attempt)
- Fired milestone-decomposer `expand-current-bundle` (agentId a91734294e5f98408) → **`incomplete-scope`**. M5 ## Scope = {assignment feature (SHIPPED) + reminder arc (cred-blocked on founder Resend key, logged deferral)}. No unblocked, non-duplicate adjacent scope to floor-fill; debt-padding is bloat. No DB write.
- `floor_merge_attempt: 1` (cap reached).

### Recursion-guard escalation → BOARD (automatic mode)
- decision-slug `P-1-floor-merge-wave-23` → **BOARD 6/7 APPROVE A (override-ship)**, 1/7 counter-thinker dissent (hold). No hard-stops. Logged: `process/waves/wave-23/escalations/board-P-1-floor-merge-wave-23.md` + product-decisions.md 2026-07-02.
- **Resolution:** override-ship the under-floor coherent slice. Floor exception logged (extends wave-16/wave-21 precedent to authz-completion waves).

## design_gap_flag

```yaml
design_gap_flag: false
missing_surfaces: []
```

**Rationale:** backend RBAC change (Permission union + roles flag + migration + DTOs + call-site swap) + a `/me` effective-permissions READ endpoint (no UI) + an authz-reactive visibility change on the EXISTING assignments create/edit CTA (AssignmentsPanel.tsx — gate condition swaps owner-only → manage_assignments; no new page/primitive). Any role-editor checkbox for the new permission is a token-level add to an existing component covered by DESIGN-SYSTEM, not a net-new mockup. P-2/P-3 confirm whether a role-editor surface is in scope; no design gap either way. → next block: **B** (skip D).

## Verdict
**ESCALATED-FLOOR-UNMET → BOARD override-ship (PROCEED with logged floor exception).** wave_type=multi-spec. No siblings created/removed (bundle stays [8aa67564, edbdea8f]).

```yaml
wave_type: multi-spec
verdict: ESCALATED-FLOOR-UNMET-RESOLVED-OVERRIDE-SHIP
maximum_rubric_tripped: false
minimum_floor_tripped: true
floor_merge_attempt: 1
decomposition_expansion_result: incomplete-scope
board_decision: "P-1-floor-merge-wave-23 → 6/7 APPROVE override-ship"
claimed_task_ids: [8aa67564-a142-4628-b658-f020d4d2872c, edbdea8f-71c9-43f0-8f1f-0bcea355f183]
design_gap_flag: false
```

## Exit
Sizing recorded. Floor exception BOARD-ratified. design_gap_flag=false (→ B after P-4). → P-2 Spec.
