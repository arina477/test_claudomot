# Wave 85 — P-block review artifacts
**Block:** P (Product) · **Wave topic:** AssignmentCard optimistic toggle-revert (restore captured prior state + error toast) · **Block exit gate:** P-4 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | PROCEED; single-card snapshot-restore + toast; consistency spun out |
| P-1 | stages/P-1-decompose.md | done | single-spec PROCEED (floor waived); design_gap_flag false (reuses Toast) |
| P-2 | stages/P-2-spec.md | done | 5 ACs; snapshot-restore + onAnnounce error |
| P-3 | stages/P-3-plan.md | done | single-file AssignmentCard handleToggle; react-specialist |
| P-4 | stages/P-4-gate.md | pending | |
## Block-specific context
- **Wave topic:** AssignmentCard.tsx optimistic toggle: capture prior status before the flip + restore on error (currently assumes opposite of newState) + surface an error toast (currently console-only)
- **wave_db_id:** 582fd530-a95e-46f5-9416-2a336664ef9e (wave_number 85)
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3
- **Roadmap milestone:** unassigned (roadmap complete)
- **claimed_task_ids:** [3ad35a42-efe5-4e9d-8f90-d22d6fe345e8] (confirm P-2)
- **Premise:** VERIFIED HOLDS (head-next N-2: AssignmentCard.tsx handleToggle computes opposite-of-newState, no captured prior, console-only error)
- **Autonomous mode:** automatic
## Gate verdict log
<P-4>
