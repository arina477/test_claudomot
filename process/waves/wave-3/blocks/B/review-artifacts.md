# Wave 3 — B-block review artifacts
**Block:** B (Build) · **Wave topic:** Auth frontend (6 pages + display_name profile, wired to live backend) + /me per-route verify-exemption · **Gate:** B-6 · **Status:** in-progress
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch+deps; schema skipped (display_name exists) |
| B-1 | stages/B-1-contracts.md | pending | Profile Zod (shared) |
| B-2 | stages/B-2-backend.md | pending | /profile GET+PATCH + dedicated /me+/profile verify-exempt guard |
| B-3 | stages/B-3-frontend.md | pending | 6 pages + auth SDK + router + verify-banner + profile form |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | |
## Context
- Spec: tasks 9aae8255 (.description). claimed_task_ids [9aae8255, a3328023-bdb2-4937-8e65-0d214442bd12].
- Branch: wave-3-auth-frontend. design_gap_flag=false (D skipped). Split sibling 2a655960 deferred.
- B-2 advisory (Karen+jenny): dedicated/parameterized guard for /me+/profile exemption — do NOT mutate shared AuthGuard. Keep global EmailVerification REQUIRED.
- Security-scope gate → T-8 mandatory.
