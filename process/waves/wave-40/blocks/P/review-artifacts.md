# Wave 40 — P-block review artifacts
**Block:** P (Product) · **Wave topic:** Harden avatar endpoints (2 LOW 500s → 4xx) — ParseUUIDPipe + catch NoSuchKey · **Block exit gate:** P-4 · **Status:** in-progress
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | REFRAMED: fix#1 not ParseUUIDPipe (breaks non-UUID ids); NUL-byte boundary-reject + catch NoSuchKey |
| P-1 | stages/P-1-decompose.md | done | single-spec backend; floor-merge override-ship; design_gap_flag=false |
| P-2 | stages/P-2-spec.md | done | spec in 7525b759 |
| P-3 | stages/P-3-plan.md | pending | |
| P-4 | blocks/P/gate-verdict.md | pending | |
## Block-specific context
- **Wave topic:** harden avatar endpoints (7525b759)
- **Spec-contract short-circuit verdict:** no-prior-spec (P-0 Action 3)
- **Roadmap milestone:** M7 (6e2f68d8) in_progress, class=product-polish
- **design_gap_flag:** false (P-1) — backend-only; D skips
- **claimed_task_ids:** [7525b759] (P-2)
- **Autonomous mode active during P-block:** automatic
## Open escalations carried into gate
none
## Gate verdict log
<appended by head-product at P-4>
