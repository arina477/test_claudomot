# Wave 3 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** Auth frontend (6 pages + display_name profile, wired to live backend) + /me per-route verify-exemption · **Gate:** B-6 · **Status:** in-progress
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch+deps; schema skipped (display_name exists) |
| B-1 | stages/B-1-contracts.md | done | Profile Zod (3fb624a) |
| B-2 | stages/B-2-backend.md | done | /profile + SessionNoVerifyGuard (6296252); a3328023 resolved |
| B-3 | stages/B-3-frontend.md | done | 6 pages+SDK+router+guards+profile (c358abd); 27/27 tests |
| B-4 | stages/B-4-wiring.md | done | router+wrapper+env (in B-3) |
| B-5 | stages/B-5-verify.md | done | typecheck/build/lint/test green (27/27) |
| B-6 | stages/B-6-review.md | pending | |
## Context
- Spec: tasks 9aae8255 (.description). claimed_task_ids [9aae8255, a3328023-bdb2-4937-8e65-0d214442bd12].
- Branch: wave-3-auth-frontend. design_gap_flag=false (D skipped). Split sibling 2a655960 deferred.
- B-2 advisory (Karen+jenny): dedicated/parameterized guard for /me+/profile exemption — do NOT mutate shared AuthGuard. Keep global EmailVerification REQUIRED.
- Security-scope gate → T-8 mandatory.
