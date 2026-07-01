# Wave 30 — P-0 Frame

## Discover section
- **wave_db_id:** 869ac982-954b-4560-8cb1-877ad8d829b2 (wave_number 30, running).
- **Prior-work citation:** M5 assignments spine shipped (post/CRUD, view+mark, sort, panel, card, permissions — 12 done). This wave builds the SOLE unbuilt `## Scope` item: due-date reminder notifications (cron + NotificationsModule via Resend).
- **Roadmap milestone:** M5 (a5232e16) in_progress, Class=product-feature, Tier=T3. This wave targets M5's success metric directly → likely the milestone-closing wave.
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **Product-decision (resolved):** the founder resolved the park-or-key fork → **Path A** (build reminders), supplied the Resend key (now set on Railway `api` as `RESEND_API_KEY_AUTH` + exported locally). Recorded product-decisions.md. This wave executes it.
- **Bundle (multi-spec, claimed_task_ids = [4a4c2715, c5c30363, 0ba853e2]):** NotificationsModule+@Cron scan (seed) + assignment_reminder tracking table (sibling) + reminder email template+EmailService.sendAssignmentReminder (sibling). ~1,800 LOC.

## Reframe section
**problem-framer:** PROCEED (matched_antipatterns: []). Genuine feature completion at the right layer. All 6 code-verify checks passed against real files:
1. `email.service.ts` — live Resend client, reads `RESEND_API_KEY_AUTH` (:11), non-throwing `sendEmail` (:34-37). Add a thin `sendAssignmentReminder` delegating to sendEmail.
2. `assignments.ts` — `due_date` timestamptz (:36), `is_deleted` (:37), `assignment_status.state` (:71), index (server_id,due_date) (:43) all present.
3. `assignment_reminder` UNIQUE(assignment_id,user_id) + ON CONFLICT DO NOTHING = correct instance-safe + tick-safe send-once (mirrors assignment_status UNIQUE precedent).
4. server_members UNIQUE + users.email → leak-free recipient resolution (mirror `assertMember`).
5. `@nestjs/schedule` confirmed ABSENT → add it; in-process @Cron right for single-instance Railway.
6. In-process cron scan appropriately simple at 0-user scale (no queue gold-plating).
**CRITICAL defect-prevention catch (must be in P-2/P-3):** the done-exclusion MUST be a **`LEFT JOIN assignment_status ... WHERE state IS DISTINCT FROM 'done'`**, NOT an inner join — a member with NO status row defaults to `'todo'` (service :184 `?? 'todo'`), so an inner join would silently skip every member who never opened the assignment (the majority). Insert-into-tracking-table BEFORE (or same-txn as) send, so a crash mid-send doesn't double-send.
**Edge cases for P-2 ACs:** E1 UTC/DST window math on the timestamptz; E2 strict `due_date > now()` past-due guard (don't remind for already-overdue); E3 first-deploy backfill burst + late-joiner semantics (acknowledge). Cadence: hourly scan, ~24h-before-due window.

**ceo-reviewer:** PROCEED (HOLD-SCOPE) — highest-conviction. This builds M5 metric clause 3 (clauses 1-2 shipped). **Email-only is the pre-decided M5 channel** (`## Scope`: "via Resend"); in-app notification = M7 scope, correctly deferred — NOT a founder re-poll. All 3 tasks load-bearing (the tracking table is what separates a real system from a demo that double-sends on redeploy). No gold-plating (no retry queue / preferences / digest / multi-window). **N-BLOCK CAVEAT (carry):** M5 has 6 open non-seed tasks (5 assignments tech-debt/hardening + presence-dots follow-up fdb444fc) — per roadmap-lifecycle Invariant #3, N-1 must dispose them (re-home forward / cancel) before flipping M5→done. They don't block the metric, but block the mechanical close.

**mvp-thinner:** OK — the 3 tasks are the minimal coherent set (when/once/what); splitting any = OVER-CUT (would ship a wave that doesn't deliver the metric). **Keep-OUT (no gold-plating in B):** per-user opt-out/preferences, configurable per-assignment window, digest/batch emails, SMS/push, in-app notification center, reminder-history UI, multiple reminders per assignment. **Fixed default:** reminder window = single hard-coded ~24h constant, NOT configurable (do not surface as an organizer setting). mvp-thinner WINS ties vs ceo expansion (M5-mvp-critical wave). Build watch-item: NotificationsModule is a server-side cron host — do NOT drift toward an inbox UI; `UNIQUE(assignment_id,user_id)` = exactly one reminder, do not "improve" to multi-stage.

**Mediation outcome:** none required — all three aligned (PROCEED / PROCEED-HOLD-SCOPE / OK) on the 3-task minimal set. mvp-thinner's minimal-set ruling is authoritative (M5-mvp-critical).

**Disposition:** PROCEED. Scope = the 3-task reminders arc, held to the minimal metric-satisfying set.

**Final framing for P-block (multi-spec, claimed_task_ids = [4a4c2715, c5c30363, 0ba853e2]):**
- **seed 4a4c2715:** NotificationsModule + `@Cron` hourly scan → find assignments with `due_date` in [now, now+24h] (or the window), `is_deleted=false`, `due_date > now()` (E2); resolve members via server_members; **LEFT JOIN assignment_status, exclude state='done'** (problem-framer catch); for each (assignment, member) not already in `assignment_reminder`, insert-tracking-then-send via `EmailService.sendAssignmentReminder`. Idempotent, per-server-isolated, non-throwing. Add `@nestjs/schedule`.
- **sibling c5c30363:** `assignment_reminder` table (assignment_id, user_id, sent_at) + UNIQUE(assignment_id, user_id) + Drizzle migration. ON CONFLICT DO NOTHING = send-once substrate.
- **sibling 0ba853e2:** branded due-soon reminder email template + `EmailService.sendAssignmentReminder(to, {assignmentTitle, dueDate, serverName})` → delegates to sendEmail. Unit-tested.
- design_gap_flag: P-1 judges (likely FALSE — backend cron + a server-rendered email template, no new app UI page; but the email template's brand/visual could warrant a light D-check — P-1 decides).
- External SDK: Resend (already wired) + @nestjs/schedule (new dep) → external-SDK-integration-rules at P-3; SDK docs at command-center/dev/SDK-Docs/Resend/resend.md.
- Edge-case ACs (E1 timezone, E2 past-due guard, E3 first-deploy burst) explicit in P-2.

## Open escalation
None — M5 park-or-key RESOLVED (Path A). Carry to N-block: dispose M5's 6 open non-seed tasks before flipping M5→done (ceo-reviewer).

## Exit
Discovery + reframe complete. Scope = 3-task M5 reminders arc (the milestone headline, unblocked). All reviewers PROCEED/OK, no mediation. Key carries: LEFT-JOIN done-exclusion, insert-before-send idempotency, E1/E2/E3 ACs, fixed 24h window, keep-OUT list, N-block M5-task-disposition. → P-1 Decompose.
