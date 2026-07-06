# B-6 Review — wave-68
Phase 1: head-builder APPROVED (ab791b38) — all 8 ACs; owner-authz gate verified (unit + real-PG integration non-owner-reject row-unchanged); memberCount LEFT-JOIN fix + live-DB test; opt-in/unpublish/pre-populate/read-contract sound. Flagged AC9 C-block obligation (integration must run green in CI).
Phase 2: /review (workflow, high, 16 files) → 22 verified findings; SECURITY gate CONFIRMED CORRECT (no holes). Triage:
- FIXED before push (dc34e41 + 9af167d): #1 owner-gate whole editable surface (non-owner read-only, no Save); #2 post-save reconcile (ServerContext.refetchDetail + baseline — CLOSES the stale-selectedDetail clobber; the seam-wiring at ChannelSidebar was the attempt-1 REWORK, fixed 9af167d + seam test); #3 OwnerStatus loading/error (no silent owner lockout); #5 403 via HttpError.status; #6 partial patch (only-changed fields); #4 private-exclusion integration assertion; GROUP BY→servers.id (PK).
- ACCEPTED-DEBT (low/DRY): useToasts dup (extract shared — cheap follow-up-worthy); IconButton dup; DTO snake_case. Not blocking.
Re-verify: head-builder attempt-1 REWORK (dangling onSaveSuccess seam) → fixed → attempt-2 APPROVED (9af167d, seam wired+tested, no regression). web 603/603, api 764/764.
CARRY to C-block (AC9, LOAD-BEARING): CI MUST run the live-DB integration tier (DATABASE_URL_TEST set, real Postgres) so the wave-68 integration tests (memberCount real-count, PRIVATE-EXCLUSION, updateServer owner-reject) execute GREEN — NOT skip. head-ci-cd verifies at C-1.
```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 1
findings_critical: []
findings_high: []   # #1/#2 FIXED (dc34e41 + 9af167d, 1 rework)
findings_medium_accepted: []
findings_low_accepted: ["useToasts/IconButton DRY dup; DTO snake_case"]
fix_up_commits: [dc34e41, 9af167d]
final_verdict: APPROVE
