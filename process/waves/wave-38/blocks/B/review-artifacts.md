# Wave 38 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Avatar storage go-live — presigned-GET redirect for avatars (Tigris bucket empirically private) + attachment activation-verify
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-38/stages/B-0-branch-and-schema.md | in-progress | schema: add users.avatar_key |
| B-1 | process/waves/wave-38/stages/B-1-contracts.md | pending | likely no-op (no new shared Zod type) |
| B-2 | process/waves/wave-38/stages/B-2-backend.md | pending | resolveAvatarUrl + confirm + GET /users/:id/avatar + users.service |
| B-3 | process/waves/wave-38/stages/B-3-frontend.md | pending | SKIP — backend-only (zero frontend change) |
| B-4 | process/waves/wave-38/stages/B-4-wiring.md | pending | typecheck + route reg + PUBLIC_API_URL |
| B-5 | process/waves/wave-38/stages/B-5-verify.md | pending | typecheck/lint/unit |
| B-6 | process/waves/wave-38/stages/B-6-review.md | pending | head-builder gate |

## Block-specific context

- **Spec contract:** tasks row 84e09891 (DB); spec at process/waves/wave-38/stages/P-2-spec.md
- **Branch name:** wave-38-avatar-storage
- **claimed_task_ids:** [84e09891]
- **New deps added this wave:** none (aws-sdk already installed)
- **New env vars added this wave:** PUBLIC_API_URL (api self base URL for stable avatar redirect URLs)
- **Schema changes this wave:** add users.avatar_key TEXT NULL (Drizzle migration)
- **B-1 fast-path approved:** pending
- **Files implemented (cumulative):** (updated at B-2)
- **Deviations from plan logged this block:** none

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-builder spawn at B-6 Action 1>
