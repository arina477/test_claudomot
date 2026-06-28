# Wave 2 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Auth backend — Postgres + Drizzle + SuperTokens + Resend (M1)
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-2/stages/B-0-branch-and-schema.md | done | branch+deps+env+infra(Postgres+ST core live)+Drizzle users schema/migration |
| B-1 | process/waves/wave-2/stages/B-1-contracts.md | done | MeResponse Zod (d12e3c2) |
| B-2 | process/waves/wave-2/stages/B-2-backend.md | done | full auth backend (f89f1b6); G-1 handled |
| B-3 | process/waves/wave-2/stages/B-3-frontend.md | skipped | backend-only |
| B-4 | process/waves/wave-2/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-2/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-2/stages/B-6-review.md | pending | |

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
