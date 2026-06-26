# Wave 1 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Bootstrap monorepo + dark app shell + CI (M1 Foundation seed slice)
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-1/stages/B-0-branch-and-schema.md | done | scaffold + deps committed (3530e75); schema skipped; install+lint+typecheck green |
| B-1 | process/waves/wave-1/stages/B-1-contracts.md | done | HealthResponse Zod authored; shared typecheck+build green |
| B-2 | process/waves/wave-1/stages/B-2-backend.md | pending | NestJS api + /health |
| B-3 | process/waves/wave-1/stages/B-3-frontend.md | done | dark app shell built; typecheck+build+test (10/10) green |
| B-4 | process/waves/wave-1/stages/B-4-wiring.md | done | repo typecheck+lint+build green; a11y drift fixed via B-3 re-entry |
| B-5 | process/waves/wave-1/stages/B-5-verify.md | done | lint+test(11)+build+smoke(/health 200) all green |
| B-6 | process/waves/wave-1/stages/B-6-review.md | done | head-builder APPROVED; /review 2 findings fixed; gate PASS |

## Block-specific context

- **Spec contract:** `tasks` row cbf25dd5-95ab-4ebf-a7bc-a5e6a3714804 (DB); spec at process/waves/wave-1/stages/P-2-spec.md
- **Branch name:** wave-1-foundation-scaffold
- **claimed_task_ids:** [cbf25dd5-95ab-4ebf-a7bc-a5e6a3714804]
- **New deps added this wave:** turbo, vite, react/react-dom, @nestjs/*, zod, @anatine/zod-nestjs, @biomejs/biome, vitest, @testing-library/*, tailwindcss, typescript, vite-plugin-pwa (full scaffold — greenfield)
- **New env vars added this wave:** none committed beyond existing .env.example (API/web origins have local defaults)
- **Schema changes this wave:** none — DB is the deferred auth-backend task (b9118041)
- **B-1 fast-path approved:** false (B-1 has real contract work: HealthResponse Zod)
- **Files implemented (cumulative):** <updated at B-2, B-3, B-4>
- **Deviations from plan logged this block:** <list, or "none">
- **Node:** .nvmrc=22 (CI pin); local env is node 24 (satisfies engines >=22).

## Open escalations carried into gate

- Carry-forward (from P-4): `.nvmrc`=22 must be materialized (load-bearing — CI uses node-version-file); member-list column out of shell scope this wave.

## Gate verdict log

<appended by fresh head-builder spawn at B-6 Action 1; one entry per attempt>

## Build-block exit handoff
```yaml
build_block_status:    complete
branch:                wave-1-foundation-scaffold
stages_run:            [B-0, B-1, B-2, B-3, B-4, B-5, B-6]
stages_skipped:        [B-0-schema (no DB this wave)]
review_verdict:        APPROVE
deviations_logged:     [api-commonjs-override, inline-svg-icons, NODE_ENV-test, supertest-shim, db-placeholder-scripts]
last_commit_sha:       b51c39c
ready_for_ci:          true
```
