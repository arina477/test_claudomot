# Wave 35 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M7 privacy controls — settings-privacy (profile-visibility enforced + who-can-DM persisted) + data view/download + Sentry + privacy/terms stubs & states
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-35/stages/B-0-branch-and-schema.md | done | schema 0014; deps sentry v10; branch pushed |
| B-1 | process/waves/wave-35/stages/B-1-contracts.md | done | privacy.ts + account-data.ts (typescript-pro) |
| B-2 | process/waves/wave-35/stages/B-2-backend.md | done | privacy module, roster filter, Sentry api |
| B-3 | process/waves/wave-35/stages/B-3-frontend.md | done | page+stubs+states+Sentry web |
| B-4 | process/waves/wave-35/stages/B-4-wiring.md | done | PrivacyModule registered; repo typecheck clean |
| B-5 | process/waves/wave-35/stages/B-5-verify.md | done | lint+test+build green; 1 pre-existing flake |
| B-6 | process/waves/wave-35/stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** `tasks` row 56a50862-790e-4868-a5c5-305b08b81e40 (DB); pointer process/waves/wave-35/stages/P-2-spec.md
- **Branch name:** wave-35-privacy-controls
- **claimed_task_ids:** [56a50862 settings-privacy, a4169fac data-view/download, d40ece71 Sentry, 13b7ebfd stubs+states]
- **New deps added this wave:** @sentry/nestjs (apps/api), @sentry/react (apps/web) — set at B-0 Action 4
- **New env vars added this wave:** SENTRY_DSN (api), VITE_SENTRY_DSN (web)
- **Schema changes this wave:** 2 additive cols on users (profile_visibility, who_can_dm, text NOT NULL DEFAULT 'everyone') + drizzle migration
- **B-1 fast-path approved:** false (contract surface changes: new Zod schemas)
- **wave_type:** multi-spec — commit-per-spec discipline (B-6 Action 6 verifies)
- **BOARD:** Path A (6/7) — profile-visibility enforced; who-can-DM persisted, no active control; honest-visibility-selector AC
- **Files implemented (cumulative):** <updated at B-2, B-3, B-4>
- **Deviations from plan logged this block:** none

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-builder spawn at B-6>
