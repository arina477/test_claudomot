# Wave 89 — P-block review artifacts
**Block:** P (Product) · **Wave topic:** scroll+focus the first errored field on a failed profile save (a11y/UX) · **Block exit gate:** P-4 · **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | both reviewers PROCEED (gap live, per-form scope, academic form load-bearing). Backlog-drain signal REINFORCED for founder. |
| P-1 | stages/P-1-decompose.md | done | single-spec ~60 LOC; floor waived by citation; design_gap_flag=false; PROCEED |
| P-2 | stages/P-2-spec.md | done | spec written to task 45f0a88d |
| P-3 | stages/P-3-plan.md | done | frontend-only: ProfilePage academic form refs + focus-first-invalid + test (react-specialist). No schema/API/dep. |
| P-4 | stages/P-4-gate.md | done | head-product APPROVED; karen+jenny APPROVE; Gemini UNAVAILABLE. PASS. |
## Block-specific context
- **Wave topic:** on a failed profile-save validation, scrollIntoView + focus the first errored field (ProfilePage). Now that /settings/profile scrolls (wave-81), an off-screen errored field gives no visible cue. Source: wave-81 B-6 /review F5 (P3, pre-existing UX).
- **wave_db_id:** 6d995b9d-f7a4-453a-85a8-6cbb15108164 (wave_number 89)
- **Spec-contract short-circuit:** no-prior-spec -> full P-1..P-3
- **Roadmap milestone:** unassigned (roadmap complete; bug-fix phase — backlog THINNING, 4+ evaporations + 3 more found already-fixed at wave-88 N-2; founder digest written)
- **claimed_task_ids:** [45f0a88d-90dd-47b1-a827-e6cf8bbf606e]
- **UI wave** (frontend ProfilePage) — D-block may fire if design_gap; likely a standard a11y pattern (no new design).
- **Autonomous mode:** automatic
## Gate verdict log
<P-4>
