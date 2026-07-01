# V-1 jenny — semantic-spec verification (wave-30, M5 reminders arc)

**Agent:** jenny (semantic-spec / does-LIVE-behavior-match-INTENT)
**Wave:** 30 — M5 assignment due-date reminders (the milestone headline)
**Spec authority:** `tasks.description` YAML head of task `4a4c2715-...` (multi-spec: c5c30363 table + 0ba853e2 email + 4a4c2715 cron) + M5 milestone success metric.
**Deployed:** api LIVE (https://api-production-b93e.up.railway.app /health 200), migration 0013 applied prod-first (C-2), RESEND_API_KEY_AUTH set (count=1). Cron is hourly + internal (no on-demand trigger) — runtime correctness relied on the T-4 real-PG integration tier (CI run 28543197997, 5 cases executed nonzero), whose claims I verified against the shipped source and the spec intent.

## VERDICT: **APPROVE**

The deployed reminder loop delivers the M5 success metric — "members get a reminder before it is due." Every AC's INTENT is satisfied by live/proven behavior, not merely code-present. No spec-DRIFT. No blocking spec-GAP. Two non-blocking notes carried below (both already tracked; neither breaks the metric).

---

## 1. M5 success metric — MET (intent, not just code)

Metric (milestone `a5232e16`): *"An organizer posts an assignment with a due date; members see it alongside chat, mark it done, and get a reminder before it is due."* The reminder clause is M5's sole unbuilt Scope item (assignment CRUD + mark-done shipped wave-22/23; F6/F9 LIVE).

Deployed loop (verified end-to-end against source + T-4):
- Hourly `@Cron(EVERY_HOUR)` (`reminder-scan.service.ts:36`) scans assignments with `due_date > now()` AND `due_date <= now()+24h` AND `is_deleted=false` (`:71-76`) → "before it is due," bounded to the imminent window.
- For each, resolves eligible members and emails them via `EmailService.sendAssignmentReminder` (`:258-262`) → members "get a reminder."
- Send happens strictly before the due date (past-due excluded), one email per member per assignment.

The intent — a member is warned ahead of the deadline — is realized by live infrastructure (module boots on the serving revision without crash per C-2 Step 3; a misconfigured cron would fail boot). **Metric MET.**

---

## 2. AC-by-AC intent (the 3 blocks) — all match

### Block c5c30363 — tracking table (send-once substrate)
- **AC1 table+UNIQUE:** `assignment_reminder(id uuid pk, assignment_id uuid FK→assignments CASCADE, user_id text FK→users, sent_at timestamptz default now)` + `UNIQUE(assignment_id,user_id)` — schema `assignment-reminder.ts:17-33`, migration `0013_smooth_tattoo.sql:1-10`. Matches the spec `contracts.data` shape column-for-column. **MATCH.**
- **AC2 forward-only migration applies:** 0013 applied prod-first before api cutover, confirmed via public proxy `to_regclass('public.assignment_reminder')` + drizzle journal hash 9d229cc9 (C-2 Step 1). **MATCH.** (Note: the app DB is a separate Railway Postgres; I cannot re-query it from the brain `$CLAUDOMAT_DB_URL` — I rely on C-2's proxy verification, which is a legitimate independent live probe.)
- **AC3 duplicate = no-op via ON CONFLICT:** `onConflictDoNothing()` (`reminder-scan.service.ts:246`) against the real UNIQUE — T-4 case (c) ran the scan twice, second scan left row-count AND email-count unchanged. Intent (send-once arbiter, never errors, never a 2nd row) **MATCH.**
- **Edge (FK cascade / concurrent insert):** `onDelete:'cascade'` on assignment_id → no orphans; UNIQUE+ON CONFLICT → exactly one row under concurrency. **MATCH.**

### Block 0ba853e2 — email template + method
- **AC1 signature + content:** `sendAssignmentReminder(to, {assignmentTitle, dueDate, serverName})` (`email.service.ts:21-24`); subject `Reminder: "<title>" is due soon` names the assignment (`:38`); body states due-soon, the due date/time (`:73`), and the server name (`:65`); delegates to `sendEmail({to,subject,html})` (`:95`). **MATCH.**
- **AC2 client-safe HTML:** inline styles only, light `#f4f4f5` background, amber brand accent `#f59e0b`, table-based layout, no external assets (`:43-93`). Plain-text-legible. **MATCH.**
- **AC3 non-throwing + unit-tested:** `sendEmail` is a safe no-op when `RESEND_API_KEY_AUTH` unset (`:99-102`) and never throws on Resend error (`:111-114`, "Do not throw"). T-2 has 4 unit tests asserting composed recipient/subject/body (not mock-counts). **MATCH.**
- **Edge (key-unset no-throw / UTC-labeled date):** no-op path confirmed; `dueDate` rendered `timeZone:'UTC'` with `timeZoneName:'short'` → "... UTC" label (`:28-36`), tying E1. **MATCH.**

### Block 4a4c2715 — NotificationsModule + @Cron scan
- **AC1 hourly cron + window:** `@Cron(EVERY_HOUR)`; window `due_date > now()` AND `<= now()+24h` AND `is_deleted=false` (`:71-76`). **MATCH.**
- **AC2 LEFT-JOIN done-exclusion (THE linchpin):** recipients = `server_members` INNER JOIN `users`, LEFT JOIN `assignment_status` on (assignment_id, user_id), WHERE `state IS DISTINCT FROM 'done'` (`:155-175`). NULL-safe: no status row → NULL → `IS DISTINCT FROM 'done'` = true → member IS reminded (mirrors the `?? 'todo'` default). An INNER JOIN would have silently dropped the majority — the single most important correctness detail, and it is implemented correctly AND proven by T-4 case (a), which seeds a no-status member and asserts they ARE reminded (both DB row + email capture). Mutation-genuine (would fail if inner). **MATCH.**
- **AC3 insert-before-send send-once:** `INSERT ... ON CONFLICT DO NOTHING RETURNING id`; email sent ONLY when `inserted.length > 0` (`:240-262`). TOCTOU-safe at-most-once across ticks/instances/crashes. T-4 case (c) proves it. **MATCH.**
- **AC4 per-server isolation + non-throwing:** per-assignment try/catch (`:88-100`), per-member try/catch (`:187-199`), per-query try/catch (`:57-81`, `:154-182`) — one failure logs and continues; whole scan non-throwing. **MATCH.**
- **AC5 @nestjs/schedule + ScheduleModule registered:** `ScheduleModule.forRoot()` (`app.module.ts:33`) + `NotificationsModule` (`:43`) registered in AppModule; cron in-process (single-instance Railway api). **MATCH.**

---

## 3. Edge-case ACs (E1/E2/E3) — satisfied as intended

- **E1 UTC window math:** `due_date` is `timestamptz`; window arithmetic done in DB via `now()` and `now()+interval '24 hours'` (`:71-73`) — pure UTC, no app-side TZ math. Email date UTC-labeled. Fixed ~24h window → exactly one reminder ~24h before due. **MATCH.**
- **E2 past-due guard:** `gt(due_date, sql\`now()\`)` (`:71`) — overdue assignments excluded. T-4 case (d) (`hoursAgo(1)`) asserts 0 rows / 0 emails. **MATCH.**
- **E3 first-deploy / late-joiner:** window is `[now, now+24h]`, not a history backfill → bounded first-deploy burst (only imminent assignments). Late-joiner handled naturally by per-(assignment,member) tracking — reminded on the next tick if still in-window + not done. T-4 case (e) (48h-out excluded) proves the upper bound bounds the burst. **MATCH.**
- **Member no-email:** `if (!recipient.email) skip+log` (`:232-237`). **MATCH.**

---

## 4. Channel — email-only, NOT drifted

Deployed sends exclusively via `EmailService`/Resend (`:258`). No SMS/push/in-app path exists. This matches the settled channel decision ("email-only is the pre-decided M5 channel; in-app = M7 scope, deferred"). **No DRIFT.**

## 5. Fixed 24h window — deployed as a hard constant, NOT drifted

`now() + interval '24 hours'` is a literal in the query (`:73`); no config/env/per-assignment override, no organizer setting. Matches the settled "fixed hard-coded default, not an organizer setting." **No DRIFT.** The mvp-thinner keep-OUT list (per-user opt-out, configurable window, digest/batch, SMS/push, in-app center, reminder-history UI, multiple reminders) — none present in the deployed code. No gold-plating.

## 6. Journey map (T-9) — correctly flipped, nothing dropped/mis-stated

`command-center/artifacts/user-journey-map.md`:
- F6 node (`:230-232`): "automated due-date reminder email (LIVE wave-30)" with an accurate reminder-touchpoint paragraph (hourly cron, 24h window, past-due excluded, LEFT JOIN done-exclusion, send-once UNIQUE, server-scoped, migration 0013, subject/body accurately quoted).
- F9 node (`:246`): due-date reminder email auto-sent within 24h of due (LIVE wave-30).
- `last_updated_wave30` annotation (`:18`): correctly records backend-only wave (annotation-only regen, no new route/screen), the F6/F9 aspirational→LIVE flip, and the shipped mechanics.
- Page-14 row (`:50`) already lists "notifications" as a module — consistent.

The touchpoint is correctly inventoried as the transactional email (no app screen/route), which matches reality (backend-only wave, apps/web diff empty). This resolves the jenny P-4 carry (the F6/F9 reminders node was aspirational; it is now correctly LIVE). **Nothing silently dropped or mis-stated.** **MATCH.**

---

## 7. Does this close M5? — metric MET; mechanically-closeable needs 6-task disposition

- **Metric MET:** YES. The reminder loop is the last unbuilt Scope item; "members get a reminder before it is due" is now delivered live. M5's headline capability is complete.
- **Mechanically closeable:** NOT YET, and correctly so. Distinct from the metric. Beyond the 3 wave-30 spec tasks (`in_progress` — V-block closes them), M5 (`milestone_id=a5232e16`) still owns **6 open non-metric `todo` tasks**:
  - `3ad35a42` — assignments optimistic-toggle revert (code-debt)
  - `4b397de0` — assignments controller-spec IDOR assertion (test-debt, F22-T-1)
  - `6f257c82` — assignments rowToDto N+1 fold (perf-debt, F22-T-3)
  - `72cb6ebb` — sweep stale manage_channels references (docs-debt, F23-T-8b)
  - `226c7e42` — integration-tier CI executed-count assertion hardening
  - `fdb444fc` — extend presence dots to DM/mention/hover (presence follow-on)

  None of these is on the M5 success-metric path — they are accumulated code/test/docs debt and a presence extension. **N-block must dispose of them** (close/re-home to a debt milestone / defer) before flipping M5 to done. This is a disposition question, not a semantic-correctness question, and does NOT gate V-block APPROVE.

---

## Findings summary

**Blocking (semantic incorrectness):** NONE.

**Non-blocking:**
- **F30-T4-a (LOW, spec-GAP-minor, already tracked):** the email HTML-render leaf is stubbed at the integration tier (legitimate network-boundary stub; the render is unit-covered at T-2 by 4 tests). Does not weaken any AC intent — the send-decision path (the correctness surface) is real-PG unmocked.
- **B-6 follow-up 4905dc3a (INFORMATIONAL, already filed):** current design is at-most-once (insert-before-send). A crash between the successful INSERT and the email send would drop that one reminder (row exists → never retried). This is a *deliberate, spec-consistent* choice — AC3's own wording ("only when the insert created a row … so a crash/re-tick never double-sends") explicitly prioritizes no-double-send over guaranteed-delivery. So this is NOT drift from the spec; it is a known trade-off already filed as a future at-least-once-retry task. Flagging for V-2 visibility only.
- **F30-T8-a (INFORMATIONAL):** no HTTP surface → standard endpoint probes N/A; correctness proven at the real-PG integration tier. Expected for an internal cron.

**Spec-DRIFT:** none.
**Spec-GAP:** none blocking (only the F30-T4-a render-stub coverage gap, non-blocking + unit-covered).

## Files (absolute)
- Spec: `tasks.description` of `4a4c2715-019d-4687-9963-d41796d1a5ad` (Postgres, brain DB)
- `/home/claudomat/project/apps/api/src/notifications/reminder-scan.service.ts`
- `/home/claudomat/project/apps/api/src/notifications/notifications.module.ts`
- `/home/claudomat/project/apps/api/src/email/email.service.ts`
- `/home/claudomat/project/apps/api/src/db/schema/assignment-reminder.ts`
- `/home/claudomat/project/apps/api/drizzle/migrations/0013_smooth_tattoo.sql`
- `/home/claudomat/project/apps/api/src/app.module.ts` (ScheduleModule + NotificationsModule wiring)
- `/home/claudomat/project/process/waves/wave-30/stages/T-4-integration.md`
- `/home/claudomat/project/process/waves/wave-30/stages/C-2-deploy-and-verify.md`
- `/home/claudomat/project/command-center/artifacts/user-journey-map.md`
