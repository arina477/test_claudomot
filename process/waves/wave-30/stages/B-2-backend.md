# Wave 30 — B-2 Backend (node-specialist)
- **email (5f8e78a, Refs 0ba853e2):** `EmailService.sendAssignmentReminder(to,{assignmentTitle,dueDate,serverName})` → branded client-safe HTML → sendEmail. Non-throwing. 4 new unit tests (recipient, subject-has-title, html-has-due-date+server).
- **cron (1e7960d, Refs 4a4c2715):** NotificationsModule + ReminderScanService `@Cron(EVERY_HOUR) scanAndSendReminders()` (public, test-invokable) + app.module wiring (ScheduleModule.forRoot + NotificationsModule). Integration test `reminder-scan.spec.ts` (real-PG, skipIf DATABASE_URL_TEST → CI).
- **Scan query (correctness-critical, verified correct):**
  1. assignments WHERE `due_date > now()` AND `due_date <= now()+interval '24 hours'` AND `is_deleted=false` (E1 UTC / E2 past-due).
  2. recipients: server_members INNER JOIN users **LEFT JOIN assignment_status ON (assignment_id,user_id) WHERE state IS DISTINCT FROM 'done'** — NULL (no status row) → true → member reminded (mirrors `?? 'todo'`; inner-join-would-be-wrong AVOIDED).
  3. send-once: `INSERT ... ON CONFLICT (assignment_id,user_id) DO NOTHING RETURNING id` → email sent ONLY when RETURNING yields a row (no SELECT-then-insert TOCTOU).
  4. per-assignment + per-member try/catch (log+continue); null-email skip; whole scan non-throwing.
- 411 unit pass; biome + typecheck clean.
- **Deviation (minor, accepted):** an extra per-member `db.select({due_date})` round-trip (vs threading due_date from the window query) — correctness identical, acceptable chattiness for a fixed-window hourly cron. No functional deviation.
```yaml
skipped: false
specialists_spawned: [node-specialist]
files_implemented: [email.service.ts, email.service.spec.ts, notifications/reminder-scan.service.ts, notifications/notifications.module.ts, app.module.ts, test/integration/reminder-scan.spec.ts]
deviations: ["minor: extra per-member due_date round-trip (accepted; correctness identical)"]
simplify_applied: true
```
