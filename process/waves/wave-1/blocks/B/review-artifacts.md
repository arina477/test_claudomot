# Wave 1 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Bootstrap monorepo + dark app shell + CI (M1 Foundation seed slice)
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-1/stages/B-0-branch-and-schema.md | done | scaffold + deps committed (3530e75); schema skipped; install+lint+typecheck green |
| B-1 | process/waves/wave-1/stages/B-1-contracts.md | done | HealthResponse Zod authored; shared typecheck+build green |
| B-2 | process/waves/wave-1/stages/B-2-backend.md | pending | NestJS api + /health |
| B-3 | process/waves/wave-1/stages/B-3-frontend.md | pending | Vite/React dark app shell |
| B-4 | process/waves/wave-1/stages/B-4-wiring.md | pending | scripts + e2e typecheck |
| B-5 | process/waves/wave-1/stages/B-5-verify.md | pending | lint/typecheck/test/dev smoke |
| B-6 | process/waves/wave-1/stages/B-6-review.md | pending | head-builder + /review gate |

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
