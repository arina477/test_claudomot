# Wave 30 — P-2 Spec (pointer)

**Source of truth:** multi-spec YAML head + prose in `tasks.description` for primary row **4a4c2715-019d-4687-9963-d41796d1a5ad** (3 self-contained spec blocks). This is the convenience copy.

- **wave_type:** multi-spec · **claimed_task_ids:** [4a4c2715 (cron), c5c30363 (table), 0ba853e2 (email)] · **design_gap_flag:** false

## Spec blocks (copy — see DB row for full ACs/contracts/edge-cases)
**c5c30363 — assignment_reminder tracking table** (B-0 schema): (id, assignment_id FK cascade, user_id, sent_at) + UNIQUE(assignment_id,user_id) + Drizzle migration. ON CONFLICT DO NOTHING = send-once substrate.

**0ba853e2 — reminder email + method**: `EmailService.sendAssignmentReminder(to,{assignmentTitle,dueDate,serverName})` → branded client-safe HTML → delegates to sendEmail. Non-throwing (safe no-op if key unset). Unit-tested.

**4a4c2715 — NotificationsModule + @Cron scan**: hourly scan → assignments due in [now, now+24h] AND `due_date>now()` (E2) AND !is_deleted → members via server_members **LEFT JOIN assignment_status WHERE state IS DISTINCT FROM 'done'** (the load-bearing catch — inner join skips no-status members) → per (assignment,member) not in assignment_reminder: insert-then-send (send-once). Per-server isolated, non-throwing. Add @nestjs/schedule.

## Load-bearing carries
- **LEFT JOIN done-exclusion** (not inner join — no-status member defaults to todo, must be reminded).
- **Insert-tracking-before-send** → send-once across ticks/instances/crashes.
- **E1** UTC window math (timestamptz); **E2** `due_date>now()` past-due guard; **E3** bounded first-deploy burst.
- **Fixed 24h window**, hourly cron — NOT configurable.

## Keep-OUT (mvp-thinner)
opt-out/preferences · configurable window · digest/batch · SMS/push · in-app center · history UI · multi-reminder. Email-only (in-app=M7).

→ P-3 Plan.
