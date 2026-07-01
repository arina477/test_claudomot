# Wave 30 — P-3 Plan (multi-spec: M5 reminders arc)

## Approach section

### Architecture deltas
- **New `NotificationsModule`** (apps/api/src/notifications/) hosting a `ReminderScanService` with an hourly `@Cron` (via `@nestjs/schedule`, new dep). In-process cron is correct for the single-instance Railway api — no external queue/scheduler (gold-plating at 0 users). **Alternative:** per-assignment scheduled job / external cron (Railway cron, BullMQ) — REJECTED: over-engineered; an hourly table scan over a tiny dataset is O(nothing) and instance-safe via the DB UNIQUE. **Failure domain:** the cron reads assignments/members + writes assignment_reminder + calls EmailService; a per-item error is caught + logged, never aborts the scan (per-server isolation).
- **New `assignment_reminder` table** (send-once substrate) — the durable idempotency ledger. **Alternative:** an in-memory Set / a `reminded_at` column on assignment_status — REJECTED: in-memory resets on redeploy (double-sends); a column on assignment_status conflates member-todo-state with reminder-state and doesn't exist for members with no status row. A dedicated table with UNIQUE(assignment_id,user_id) is the clean arbiter.
- **`EmailService.sendAssignmentReminder`** — a thin typed method composing branded HTML → delegates to the existing `sendEmail`. No Resend re-wiring (EmailService already reads RESEND_API_KEY_AUTH, now set).

### Data model
NEW `assignment_reminder` (id uuid pk, assignment_id uuid FK→assignments.id ON DELETE CASCADE, user_id text, sent_at timestamptz default now) + UNIQUE(assignment_id, user_id). Drizzle schema + forward-only generated migration. No change to existing tables.

### API contracts / deps
- No HTTP endpoint (internal @Cron). No shared `@studyhall/shared` type / Zod / OpenAPI change → **B-1 SKIPS** (the reminder email param is an inline TS type on EmailService; the table is B-0 schema, not a contract-package change).
- **NEW dep: `@nestjs/schedule`** (B-0 install) — the NestJS-standard cron. External SDK: Resend (already integrated) — read `command-center/dev/SDK-Docs/Resend/resend.md` at build; no new Resend surface (reuse sendEmail).

### SDK pre-build
Resend: reuse existing EmailService.sendEmail (no new SDK method). @nestjs/schedule: standard `ScheduleModule.forRoot()` + `@Cron(CronExpression.EVERY_HOUR)`. Verify installed version at B-0.

## Plan section

### File-level steps by B-stage

**B-0 Branch & schema:**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 1 | (git) | run | branch `wave-30-assignment-reminders` from main | orchestrator |
| 2 | apps/api/package.json | modify | `pnpm --filter @studyhall/api add @nestjs/schedule` (commit lockfile) | orchestrator |
| 3 | apps/api/src/db/schema/assignment-reminder.ts (+ schema index) | create | Drizzle `assignment_reminder` table (id, assignment_id FK cascade, user_id, sent_at) + UNIQUE(assignment_id,user_id) | postgres-pro |
| 4 | apps/api/drizzle/migrations/ (generated) | create | `drizzle-kit generate` → migration; apply to local dev DB; verify `\d assignment_reminder` | postgres-pro |

**B-1 Contracts:** SKIP (no shared type / Zod / API contract; internal cron + inline email param). Record skip.

**B-2 Backend (dependency-ordered within the stage):**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 5 | apps/api/src/email/email.service.ts (+ spec) | modify | `sendAssignmentReminder(to, {assignmentTitle, dueDate, serverName})` → branded client-safe HTML → `sendEmail`. Non-throwing. Unit test (recipient, subject has title, body has due date + server). | node-specialist |
| 6 | apps/api/src/notifications/{notifications.module.ts, reminder-scan.service.ts} (+ spec) | create | NotificationsModule + ReminderScanService with `@Cron` hourly scan. **Scan query (correctness-critical):** assignments WHERE due_date > now() AND due_date <= now()+24h AND is_deleted=false; join server_members; **LEFT JOIN assignment_status ON (assignment_id,user_id) WHERE state IS DISTINCT FROM 'done'** (NOT inner join — no-status member defaults to todo, must be reminded); anti-join assignment_reminder (not already sent). Per (assignment,member): insert assignment_reminder ON CONFLICT DO NOTHING → send ONLY when insert affected a row. Per-item try/catch (log+continue), per-server isolation, non-throwing. | node-specialist |
| 7 | apps/api/src/app.module.ts | modify | register `ScheduleModule.forRoot()` + `NotificationsModule` | node-specialist |
| 8 | apps/api/test/integration/reminder-scan.spec.ts | create | real-PG (pg-harness, CF-2, skipIf(!DATABASE_URL_TEST)): seed server+owner+members+assignment due-in-12h; run the scan → asserts (a) a member with NO status row IS reminded (LEFT JOIN correctness), (b) a member marked 'done' is NOT, (c) send-once (second scan tick inserts 0 new reminder rows), (d) past-due (due<now) NOT reminded (E2), (e) out-of-window (due>now+24h) NOT reminded. Mock EmailService.sendAssignmentReminder (assert call count/args); the DB tracking is the real assertion. | node-specialist |

**B-3 Frontend:** SKIP (design_gap_flag=false; no UI — email is server-rendered HTML, no app screen).

**B-4 Wiring:** repo typecheck + `biome check` (BUILD rule 7/8) + build. Verify ScheduleModule registered; confirm the @Cron does NOT fire during unit tests (scan is invokable directly for tests, cron decorator only schedules in runtime).

**B-5 Verify:** api unit + the integration scan spec (CI integration tier — CI rule 5 executed-count) + build. **B-6 Review:** head-builder gate + /review. Commit-per-spec (multi-spec): B-0 schema cites `Refs: c5c30363`; email method/template cites `Refs: 0ba853e2`; cron/module cites `Refs: 4a4c2715` (B-6 Action 6 verifies).

### Specialist routing (validated against AGENTS.md)
- `postgres-pro` — assignment_reminder schema + migration (DB). In AGENTS.md.
- `node-specialist` — NestJS NotificationsModule + @Cron + Drizzle scan query + EmailService method + email template + tests. In AGENTS.md.

### Parallelization
Serial within B-2 by dependency: step 5 (email method) ∥ step 3-4 (schema, B-0) are independent, but the cron (step 6) consumes BOTH the table (B-0) and the email method (step 5) → step 6 after 3-5. step 7 (wiring) after 6. step 8 (integration) after 6. B-0 postgres-pro schema ∥ can overlap with step 5 email (disjoint files) but B-0 gates B-2 per block sequence. Effectively: B-0 (postgres-pro) → B-2 (node-specialist, steps 5→6→7→8).

### Action 8 — self-consistency sweep
- c5c30363 ACs (table + UNIQUE + migration + ON CONFLICT no-op) → steps 3-4 + step 8(c). 0ba853e2 ACs (sendAssignmentReminder + branded HTML + non-throwing + unit) → step 5. 4a4c2715 ACs (hourly cron, 24h+past-due window, LEFT-JOIN done-exclusion, insert-before-send send-once, per-server isolation, @nestjs/schedule) → steps 2,6,7 + integration 8(a-e). Every AC maps to a step.
- Edge cases: E1 (UTC window) → step 6 query (timestamptz, UTC math); E2 (past-due) → step 6 (`due_date > now()`) + 8(d); E3 (first-deploy burst) → bounded by the 24h window (step 6), no history backfill. All covered.
- Every step has a specialist; no file in two batches; design_gap_flag=false referenced; contracts concrete (table DDL, scan query shape, cron cadence); new dep (@nestjs/schedule) justified; SDK (Resend) reused, no new surface. Clean.

## Exit
Multi-spec plan: B-0 assignment_reminder table (postgres-pro) → B-2 email method + NotificationsModule/@Cron scan + integration proof (node-specialist). B-1/B-3 skip. design_gap_flag=false → skip D. External SDK @nestjs/schedule (new) + Resend (reused). Carries: LEFT-JOIN done-exclusion, insert-before-send send-once, E1/E2/E3, fixed 24h window, keep-OUT. → P-4 Gate.
