# Wave 30 — V-1 Karen (source-claim verification vs LIVE deployed state)

**Verdict: APPROVE**

Reviewer: karen. Branch: main @ `28e133e`. Deployed merge: `81dc821`.
Method: read every shipped artifact in the working tree, then confirmed the working tree is byte-identical to the *deployed* merge `81dc821` via `git show 81dc821:<file>` diffs — so the code I reviewed IS the code serving prod, not a post-deploy drift copy. No prod re-hit (per instruction; C-2 deliverable + CI integration tier are the applied-migration evidence).

Every load-bearing claim holds. Findings below cite claim + evidence.

---

## Claim 1 — Code present as shipped (cron scan, LEFT JOIN, send-once)  ✓ HOLDS

**LEFT JOIN done-exclusion (NOT inner join):**
`apps/api/src/notifications/reminder-scan.service.ts:162-175` — recipients query is `.from(server_members).innerJoin(users…).leftJoin(assignment_status, …).where(and(eq(server_members.server_id,…), sql\`${assignment_status.state} IS DISTINCT FROM 'done'\`))`. The join to `assignment_status` is a genuine `leftJoin`; the predicate is `IS DISTINCT FROM 'done'` — NULL (no status row) and `'todo'` both pass, `'done'` is excluded. This is the correct semantics; an inner join would drop the no-status member. Verified genuine, not phantom.

**Send-once (INSERT … ON CONFLICT DO NOTHING RETURNING, send only when a row was created):**
`reminder-scan.service.ts:240-268` — `db.insert(assignment_reminder).values({assignment_id, user_id}).onConflictDoNothing().returning({id})`; then `if (inserted.length === 0) { … return false }` (skip send), else `await this.emailService.sendAssignmentReminder(...)`. Email fires ONLY when the INSERT returned a row. TOCTOU-safe. Genuine.

**Window guard:** `:71-75` — `gt(due_date, now())` (E2 past-due) AND `lte(due_date, now() + interval '24 hours')` AND `eq(is_deleted, false)`. Correct.

**EmailService.sendAssignmentReminder exists:** `apps/api/src/email/email.service.ts:21-96` — real method, composes branded HTML, delegates to `sendEmail`. Present.

**ScheduleModule.forRoot() + NotificationsModule registered:** `apps/api/src/app.module.ts:33` (`ScheduleModule.forRoot()`) and `:43` (`NotificationsModule` in imports). `@Cron(CronExpression.EVERY_HOUR)` at `reminder-scan.service.ts:36`. Present.

## Claim 2 — Migration 0013 + schema  ✓ HOLDS

`apps/api/drizzle/migrations/0013_smooth_tattoo.sql:1-10` — creates `assignment_reminder` (id uuid PK default gen_random_uuid, assignment_id uuid NOT NULL, user_id text NOT NULL, sent_at timestamptz default now NOT NULL) + `UNIQUE(assignment_id,user_id)` + FK `assignment_id → assignments.id ON DELETE cascade`. Journal `apps/api/drizzle/migrations/meta/_journal.json:100` records tag `0013_smooth_tattoo`. Schema file `apps/api/src/db/schema/assignment-reminder.ts:17-33` matches the DDL exactly (cascade FK, unique constraint, text user_id, timestamptz sent_at). Match confirmed.

## Claim 3 — Migration APPLIED to prod (documented, supported)  ✓ HOLDS

`process/waves/wave-30/stages/C-2-deploy-and-verify.md:5-6, 22-23` documents the claim: `to_regclass('public.assignment_reminder')` returned the table via the public proxy, and the drizzle `__drizzle_migrations` journal records 0013 (hash 9d229cc9…), applied BEFORE the api revision cutover. The claim is documented with a concrete verification method and is internally consistent (migration-before-cutover, so the cron has its table on tick 1). Not re-hitting prod per instruction; the deliverable's claim is supported (method named, hash cited) — no unsupported assertion flagged.

## Claim 4 — @nestjs/schedule dep added  ✓ HOLDS

`apps/api/package.json:29` — `"@nestjs/schedule": "^6.1.3"`. Present as a real dependency (imported at `reminder-scan.service.ts:2` and `app.module.ts:4`).

## Claim 5 — Tests exist + honest  ✓ HOLDS

**Integration (5 cases):** `apps/api/test/integration/reminder-scan.spec.ts` — cases (a) no-status-member reminded `:160-178`, (b) done-member NOT reminded `:183-195`, (c) send-once (2nd tick 0 new rows + 0 new emails) `:200-221`, (d) past-due NOT reminded `:226-240`, (e) out-of-window NOT reminded `:245-259`. All 5 present.
**Case (a) genuinely proves the LEFT JOIN:** `MEMBER_NO_STATUS_ID` is seeded with membership but NO `assignment_status` row (`:169` comment + no `insertAssignmentStatus` call for it), then asserts a reminder row + email DO exist (`:174-177`). Under an inner join this member would produce zero recipient rows → assertion would fail. The test is a real discriminator, not theater. The DB-row assertion (`reminderExistsForUser`) is the load-bearing check; the email capture is corroborating.
**4 email unit tests:** `apps/api/src/email/email.service.spec.ts` — `grep -c "it("` = 4, covering recipient, subject-has-title, html-has-due-date+server, non-throwing inheritance (`:5-8`, `:14-84`). Present.

## Claim 6 — B-6 fix-up (f80cb39): due_date lifted + per-tick failure WARN  ✓ HOLDS (in DEPLOYED tree)

**Note on commit topology:** `f80cb39` is a pre-squash commit; PR #43 was squash-merged as `81dc821`, so `f80cb39` is NOT a linear ancestor of the merge (`git merge-base --is-ancestor f80cb39 81dc821` → false). This is expected under squash-merge and is NOT a gap — I verified the fix-up *content* is present in the deployed tree:
- **due_date lifted into the window query (no per-member re-fetch):** deployed `81dc821:reminder-scan.service.ts` selects `due_date` in the window query (`:64`) and threads it through `processAssignment`/`sendReminderIfNew` (`:131`, `:211-213`) — no per-member re-query of the assignment row. Present.
- **per-tick send-failure WARN summary:** deployed tree `:86,92,105,108-109` — `sendFailures` counter accumulated, and `if (sendFailures > 0) this.logger.warn('… (with send failures)', summary)`. Present.
Both fixes confirmed in the byte-identical `81dc821`/HEAD version (270 lines).

## Claim 7 — Antipattern / gold-plating (rule 2)  ✓ HOLDS

**Real M5 scope:** feature is assignment due-date reminders (cron scan → email). On-target for M5. Send-once + LEFT-JOIN are genuine (Claims 1, 5) — not phantom.
**No keep-OUT gold-plating:** grep for `opt-out|unsubscribe|digest|configurable|in-app-notif|notification-center|preference` across `apps/api/src/notifications` + `email.service.ts` → zero hits. grep for `bullmq|bull|agenda|external-cron|queue` across notifications → zero hits (in-process `@Cron` only, as the plan justified). No opt-out, no digest, no configurable window, no in-app center. Clean.

---

## Load-bearing chain of custody
`git show 81dc821:<file>` vs `git show HEAD:<file>` — IDENTICAL for all 4 core files (reminder-scan.service.ts, email.service.ts, app.module.ts, 0013_smooth_tattoo.sql, assignment-reminder.ts). Working tree has zero uncommitted drift on these paths. The reviewed code IS the deployed code.

## Verdict
**APPROVE** — every load-bearing claim verified against the deployed tree with file:line evidence. No phantom implementations, no dishonest tests, no gold-plating, no unsupported deliverable claims. The one topology wrinkle (f80cb39 not a merge ancestor) is a squash-merge artifact, not a missing fix — content confirmed present in prod.
