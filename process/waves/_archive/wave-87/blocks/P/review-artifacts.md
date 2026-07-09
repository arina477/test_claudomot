# Wave 87 — P-block review artifacts
**Block:** P (Product) · **Wave topic:** converge new-join role assignment onto server's existing default 'Member' role (behavior-preserving data-hygiene; NOT a security fix) · **Block exit gate:** P-4 · **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | REFRAMED→PROCEED. Security-gap framing EVAPORATED (NULL role_id = intended-safe base member, verified rbac.service). Reduced to behavior-preserving data-hygiene: assign server's existing is_default 'Member' role in shared join-insert so joins stop creating NULL rows backfill-roles.ts must repair. NOT a security fix. Both reviewers converged; no re-spawn (churn). |
| P-1 | stages/P-1-decompose.md | done | single-spec; ~140 LOC trips 1500 floor; RESCOPE-AUTO-MERGE impossible (no milestone). BOARD P-1-floor-merge-wave-87 → 7/7 APPROVE A override-ship. Verdict PROCEED. design_gap_flag=false. |
| P-2 | stages/P-2-spec.md | done | |
| P-3 | stages/P-3-plan.md | done | |
| P-4 | stages/P-4-gate.md | done | |
## Block-specific context
- **Wave topic:** joinPublicServer + joinViaInvite insert server_members with role_id=NULL (confirmed servers.service). OPEN RBAC question: is NULL role_id an intended "plain member" state RBAC handles safely, or a GAP where NULL-role members misbehave (denied base actions / defaulted wrong)? Source: wave-67 V-1 F67-T5-2.
- **wave_db_id:** 2c9f024d-4ac0-41a8-8f1b-4cac82d5289f (wave_number 87)
- **Spec-contract short-circuit:** no-prior-spec -> full P-1..P-3
- **Roadmap milestone:** unassigned (roadmap complete)
- **claimed_task_ids:** [dc4abee3-1e41-41aa-a76b-c65a6b38e457] (confirm P-2)
- **NOTE:** prior seed 1c728847 (server PATCH-500 + no-delete) DISSOLVED at P-0 — PATCH-500 evaporated (global 22P02->400 filter handles it); delete-route split to feature task 54ec742c. Re-seeded with this RBAC bug.
- **PREMISE for reviewers (INVESTIGATION-FIRST):** confirm whether NULL role_id = safe implicit base-member (RBAC permission checks treat NULL as base member -> intended, may evaporate like ParseUUIDPipe) OR a real gap (RBAC keys on role_id -> NULL members denied/mis-defaulted). Read the RBAC permission-check model (how canX / hasPermission resolves a member's role, and what NULL role_id does). If a default-role assignment IS needed, apply it in the SHARED membership-insert core so BOTH invite-join + public-join get it. Do NOT assume it's a bug OR safe — verify the RBAC resolution path.
- **design_gap_flag:** false (backend-only data-hygiene; no UI surface)
- **Autonomous mode:** automatic

## Gate verdict log
<P-4>
