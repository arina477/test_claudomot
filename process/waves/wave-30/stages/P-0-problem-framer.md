```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
sibling_visible: false
reasoning: |
  Symptom-vs-cause: PASS. This is a genuine feature-completion wave (M5's last
  unbuilt scope item), not a symptom-patch. The stated cause — "no reminder loop
  exists" — is the real gap; the fix (a NotificationsModule cron scan) is at the
  correct layer (backend service, where the send + dedupe logic belongs).
  All six code-verify checks passed against real code: EmailService is a live,
  non-throwing Resend client reading RESEND_API_KEY_AUTH; the assignment schema
  has due_date (timestamptz), is_deleted, assignment_status.state, and the
  (server_id, due_date) index; server_members + users.email give race-safe
  recipient resolution; @nestjs/schedule is confirmed NOT yet a dependency; the
  UNIQUE(assignment_id,user_id) tracking table with ON CONFLICT DO NOTHING is the
  correct instance-safe send-once substrate. No antipattern matched — in-process
  @Cron at 0-user/self-use scale is appropriately simple, not over-engineered
  (no queue, no per-assignment scheduled job — correct call). Three edge cases
  the spec MUST cover are enumerated below; they are framing-completeness gaps,
  not framing errors, so PROCEED (not REFRAME) with the forward framing attached.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
```

## Code-verified findings (all decomposer claims confirmed)

1. **EmailService / Resend — CONFIRMED live.** `apps/api/src/email/email.service.ts`
   is a working Resend client: reads `process.env.RESEND_API_KEY_AUTH` (L11),
   from-address `EMAIL_FROM ?? 'onboarding@resend.dev'` (L18), `sendEmail({to,
   subject, html})` logs-and-returns on error, never throws (L34-37). The
   `resend === null` no-op path (L22-25) is a safe no-op when the key is unset —
   good for unit tests. **Adding `sendAssignmentReminder` is the right extension**
   (keeps copy out of the cron, unit-testable in isolation) — but it should be a
   thin builder that delegates to the existing `sendEmail`, NOT a second Resend
   call path. Keep EmailService the single Resend surface.

2. **Assignment schema — CONFIRMED.** `apps/api/src/db/schema/assignments.ts`:
   `due_date timestamptz notNull` (L36), `is_deleted` (L37),
   `assignment_status.state` text 'todo'|'done' app-enforced (L71),
   index `assignments_server_id_due_date_idx` on (server_id, due_date) (L43).
   The scan can efficiently find due-soon assignments via the existing index.

3. **Idempotency — CONFIRMED correct.** A dedicated `assignment_reminder` table
   with `UNIQUE(assignment_id, user_id)` + `INSERT ... ON CONFLICT DO NOTHING`
   is instance-safe AND tick-safe (the DB unique constraint is the arbiter, not
   an app guard). This mirrors the existing `assignment_status_assignment_user`
   UNIQUE precedent (L77). **Send-AFTER-insert-succeeds ordering matters** — see
   edge case E2 below. There is NO simpler existing column that could carry this;
   the new table is warranted.

4. **Membership + recipient resolution — CONFIRMED.** `server_members` has
   UNIQUE(server_id, user_id) (servers.ts L58); `users.email` is notNull unique.
   `assignments.service.ts assertMember` (L74) is the membership pattern to
   mirror. Recipients = members of the assignment's `server_id` — no cross-server
   leak, no non-member leak. **Done-filter: a member with NO assignment_status
   row defaults to 'todo'** (service L184: `(statusRow?.state) ?? 'todo'`), i.e.
   "not done" = remind. So the exclusion is `state IS DISTINCT FROM 'done'` via a
   LEFT JOIN, NOT an inner join on status (an inner join would wrongly skip every
   member who never opened the assignment — the majority).

5. **@nestjs/schedule — CONFIRMED absent** (package.json has `@nestjs/common`
   `resend` but no `@nestjs/schedule`). For a single-instance Railway `api`,
   in-process `ScheduleModule.forRoot()` + `@Cron` is the right mechanism (no
   external cron infra needed). `EventEmitterModule.forRoot()` is already wired
   in app.module.ts — the module-registration pattern is established.

6. **Architecture — CONFIRMED appropriately simple.** In-process @Cron scan vs
   queue/per-assignment-job: at 0-user/self-use scale the scan is correct and
   NOT gold-plated. No under-design in the core loop. The gaps are the three
   edge cases below, which the P-2 spec must make explicit ACs.

## Forward framing for P-1/P-2 (exact shapes)

- **Modules/files:** new `apps/api/src/notifications/` (NotificationsModule +
  reminder service); `ScheduleModule.forRoot()` registered in
  `apps/api/src/app.module.ts` imports; NotificationsModule imports EmailModule.
  Add `@nestjs/schedule` to `apps/api/package.json`.
- **Scan query shape (single sweep):** non-deleted assignments where
  `due_date > now() AND due_date <= now() + interval '24 hours'`, LEFT JOIN
  `server_members` on server_id, LEFT JOIN `assignment_status` on
  (assignment_id, member.user_id), LEFT JOIN `assignment_reminder` on
  (assignment_id, member.user_id), WHERE `assignment_status.state IS DISTINCT
  FROM 'done'` AND `assignment_reminder.id IS NULL`. Join `users` for `.email`.
- **Send-once ordering:** per (assignment, user), `INSERT ... ON CONFLICT DO
  NOTHING` FIRST; only if a row was inserted, call sendAssignmentReminder.
  (Insert-then-send makes a crash-after-insert a silent miss rather than a
  double-send; the reverse risks double-send on retry. Insert-first is the
  safer default at this scale — spec should state the chosen order explicitly.)
- **Cron cadence:** hourly `@Cron`, 24h reminder window. Per-server / per-send
  try-catch so one failure does not abort the sweep (mirror EmailService's
  non-throwing contract).

## Edge cases the P-2 spec MUST cover (framing-completeness — enforce as ACs)

- **E1 — timezone / DST.** `due_date` is timestamptz; the window math must be
  done in UTC (`now()` server-side) — do not format-then-compare in local time.
  State this so no naive local-time truncation slips in.
- **E2 — past-due guard.** The window MUST be `due_date > now()` (strictly
  future), else the hourly tick would "remind" about assignments already past
  due. The seed AC says "not yet past" — make it a hard `> now()` bound.
- **E3 — cold-start / backfill on first deploy.** On the first cron tick after
  this ships, every assignment already inside the 24h window fires at once. At
  self-use scale this is harmless, but the spec should acknowledge it (an
  intentional one-time burst, not a bug) so V-1 does not flag it as a defect.
  A secondary consideration: a member added to a server AFTER an assignment's
  reminder already sent will not be reminded (no row for them yet, but the
  assignment may still be inside the window) — acceptable at this scale; note it.
