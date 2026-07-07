# Wave 72 — P-block review artifacts
**Block:** P (Product)
**Wave topic:** M10 first slice — account self-deletion (right-to-erasure): API + service + shared DTO + Settings › Privacy UI
**Block exit gate:** P-4
**Status:** gate-passed
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | reframe CONVERGED (PROCEED) → account-erasure; soft-delete default; SuperTokens-auth-user + owned-server spec-gaps → P-2; regime+metric → founder checkpoint (non-blocking) |
| P-1 | stages/P-1-decompose.md | done | multi-spec (3 tasks, >floor) PROCEED; design_gap_flag=FALSE (Danger-Zone already in settings-privacy.html) → B directly |
| P-2 | stages/P-2-spec.md | done | 3-block erasure spec (soft-delete + re-auth block + owner-guard) to 9658fb0b |
| P-3 | stages/P-3-plan.md | done | erasure service + signIn re-auth block + owner-guard; B-0 deleted_at; no D |
| P-4 | blocks/P/gate-verdict.md | pending | |
## Block-specific context
- **Wave topic:** M10 account self-deletion (right-to-erasure)
- **Spec-contract short-circuit verdict:** no-prior-spec (seed is prose)
- **Roadmap milestone:** M10 (97d65b49, in_progress — just promoted; Class=product-feature; first slice)
- **claimed_task_ids:** [9658fb0b (erasure API SEED), e11f8746 (shared DTO), 898490b1 (erasure UI)]
- **Tier-3 decision to surface (P-0 Action 4):** hard-delete (GDPR/CCPA purge) vs soft-delete+PII-scrub+session-revoke (FERPA audit-friendly). Decomposer DEFAULTS to soft-delete (safe, reversible, matches shipped soft-delete convention) — NON-blocking; surface to founder for confirmation, do NOT re-pause.
- **Autonomous mode active during P-block:** automatic
## Open escalations carried into gate: none
## Gate verdict log
<appended by head-product at P-4>
