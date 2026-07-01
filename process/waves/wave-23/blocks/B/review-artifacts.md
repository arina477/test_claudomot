# Wave 23 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M5 bundle 2 — delegated assignment-organizer authz (manage_assignments permission split + /me effective-permissions CTA gate)
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-23/stages/B-0-branch-and-schema.md | in-progress | schema runs (migration 0011) |
| B-1 | process/waves/wave-23/stages/B-1-contracts.md | pending | Permission union 4→5 + shared role DTOs + EffectivePermissionsDto |
| B-2 | process/waves/wave-23/stages/B-2-backend.md | pending | rbac service/controller + assignments call-site swap + backfill seed |
| B-3 | process/waves/wave-23/stages/B-3-frontend.md | pending | AssignmentsPanel CTA gate + api.ts /me/permissions |
| B-4 | process/waves/wave-23/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-23/stages/B-5-verify.md | pending | biome format --check before commit (CI-PRINCIPLES rule 4) |
| B-6 | process/waves/wave-23/stages/B-6-review.md | pending | |

## Block-specific context

- **Spec contract:** `tasks` row `8aa67564-a142-4628-b658-f020d4d2872c` (DB); spec at process/waves/wave-23/stages/P-2-spec.md
- **Branch name:** wave-23-manage-assignments
- **claimed_task_ids:** [8aa67564 (seed, manage_assignments perm), edbdea8f (sibling, /me-permissions CTA)]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** migration 0011 — ALTER roles ADD COLUMN manage_assignments boolean NOT NULL DEFAULT false + backfill (manage_assignments=true WHERE manage_channels=true)
- **B-1 fast-path approved:** false (contract changes present)
- **Files implemented (cumulative):** <updated at B-2, B-3, B-4>
- **Deviations from plan logged this block:** none yet

## Phase-2 carries from P-4 (fold into B-2/B-3/T-8, per gate-verdict)
1. Role DTO contract lives in `packages/shared/src/rbac.ts` (RolePermissionsSchema :7-12, RoleSchema :19-28, Create/UpdateRoleSchema :46-68) — NOT rbac.service.ts:550 (that's the roleToDto mapper). Touch BOTH.
2. The nested `RolePermissionsSchema` + the `permissions:{}` block in roleToDto (rbac.service.ts:562-567) must ALSO gain manage_assignments (role-read path), beyond the flat EffectivePermissionsDto.
3. Owner-lockout guardrail (BOARD cond #4) = no-op invariant (owner superuser passes before flag lookup); T-8 must ASSERT, not assume.

## BOARD conditions (binding on B/T)
Migration no-silent-privilege-loss backfill + can() fail-closed; /me endpoint session-scoped IDOR (T-8); honest 403 CTA; owner-lockout guardrails extend; reminders deferred (no work this wave).

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-builder spawn at B-6 Action 1; one entry per attempt>
