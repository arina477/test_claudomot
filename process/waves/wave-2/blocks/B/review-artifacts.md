# Wave 2 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Auth backend — Postgres + Drizzle + SuperTokens + Resend (M1)
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-2/stages/B-0-branch-and-schema.md | done | branch+deps+env+infra(Postgres+ST core live)+Drizzle users schema/migration |
| B-1 | process/waves/wave-2/stages/B-1-contracts.md | done | MeResponse Zod (d12e3c2) |
| B-2 | process/waves/wave-2/stages/B-2-backend.md | done | full auth backend (f89f1b6); G-1 handled |
| B-3 | process/waves/wave-2/stages/B-3-frontend.md | skipped | backend-only |
| B-4 | process/waves/wave-2/stages/B-4-wiring.md | done | AppModule+main.ts (in B-2) |
| B-5 | process/waves/wave-2/stages/B-5-verify.md | done | lint/typecheck/build/test green; smoke→deploy |
| B-6 | process/waves/wave-2/stages/B-6-review.md | done | head-builder APPROVED; Phase2 clean |

## Block-specific context
- **Spec contract:** tasks row b9118041-06c0-4478-9d15-dfc715e3b97a (DB)
- **Branch name:** wave-2-auth-backend
- **claimed_task_ids:** [b9118041-06c0-4478-9d15-dfc715e3b97a]
- **New deps added this wave:** supertokens-node, resend, drizzle-orm, pg (+dev drizzle-kit, @types/pg, tsx)
- **New env vars added this wave:** DATABASE_URL, SUPERTOKENS_CONNECTION_URI, SUPERTOKENS_API_KEY, RESEND_API_KEY (founder), WEB_ORIGIN, API_DOMAIN
- **Schema changes this wave:** Drizzle users table (apps/api/drizzle/migrations) — UsersModule-owned
- **Open escalation:** RESEND_API_KEY is a founder-supplied account credential (rule 6) — requested at B-2 email module.

## Gate verdict log
<appended by head-builder at B-6>

## Block-exit handoff
```yaml
build_block_status: complete
branch: wave-2-auth-backend
stages_run: [B-0, B-1, B-2, B-4, B-5, B-6]
stages_skipped: [B-3 (backend-only — auth frontend is task 9aae8255)]
review_verdict: APPROVE
deviations_logged: [drizzle-lazy-accessor, no-@types/express, biome-unsafeParameterDecorators, biome-ignore-useImportType-DI, DATABASE_URL_UNPOOLED=URL-no-pgbouncer]
last_commit_sha: <set at commit>
ready_for_ci: true
accepted_debt: [G-1 orphan-on-DB-fail → lazy /me self-heal, /me verification-gated 403]
note: "Resend API key (RESEND_API_KEY_AUTH) = founder-supplied at C-2 runtime for verify/reset emails to send. Migration applies at deploy."
```
