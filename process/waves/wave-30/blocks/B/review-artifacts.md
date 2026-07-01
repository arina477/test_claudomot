# Wave 30 — B-block review artifacts

**Block:** B (Build) | **Wave topic:** M5 assignment due-date reminders (cron scan + tracking table + Resend email) | **Block exit gate:** B-6 | **Status:** gate-passed | **wave_type:** multi-spec | **branch:** wave-30-assignment-reminders

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + @nestjs/schedule + assignment_reminder table+migration 0013 (postgres-pro 9527fb8) |
| B-1 | stages/B-1-contracts.md | skipped | no shared contract surface (internal cron; inline email param) |
| B-2 | stages/B-2-backend.md | done | sendAssignmentReminder + cron scan (LEFT-JOIN + INSERT-RETURNING send-once) + integration; 411 unit pass (5f8e78a+1e7960d) |
| B-3 | stages/B-3-frontend.md | skipped | backend-only (design_gap_flag=false) |
| B-4 | stages/B-4-wiring.md | done | typecheck 4/4 + lint 0-err + build 3/3 |
| B-5 | stages/B-5-verify.md | done | 411 unit + build 3/3; cron proven by real-PG integration (5 cases) |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED; /review no P0 (P1 accepted-MVP+tracked 4905dc3a+visible-fail fix f80cb39; N+1 fixed); APPROVE |

## Block-specific context
- **Spec contract:** multi-spec, primary tasks row 4a4c2715 (3 blocks). claimed_task_ids [4a4c2715 cron, c5c30363 table, 0ba853e2 email].
- **Branch:** wave-30-assignment-reminders (from main ac78386).
- **New deps:** @nestjs/schedule (installed B-0). **Schema changes:** YES — new assignment_reminder table (Drizzle + migration).
- **Commit-per-spec (multi-spec):** B-0 schema → Refs c5c30363; email method/template → Refs 0ba853e2; cron/module → Refs 4a4c2715.

## Binding B-block carries (P-4)
- **LEFT JOIN done-exclusion (correctness linchpin):** recipients = server members with assignment_status `state IS DISTINCT FROM 'done'` via LEFT JOIN (a member with NO status row defaults to 'todo' at service:184 → MUST be reminded; INNER join = defect).
- **Insert-tracking-before-send + rowcount (TOCTOU, karen):** insert assignment_reminder ON CONFLICT DO NOTHING, send ONLY when the INSERT's RETURNING/rowCount shows a row was created — NOT a SELECT-then-insert (race). Send-once across ticks/instances/crashes.
- **assignment_reminder.user_id = `text`** (match users.id, which is text not uuid).
- **E1** UTC window math (timestamptz); **E2** `due_date > now()` past-due guard; **E3** bounded first-deploy burst. **Fixed 24h window, hourly cron — not configurable.**
- **Keep-OUT:** no opt-out/preferences/configurable-window/digest/SMS/in-app-center/history-UI/multi-reminder. NotificationsModule is a cron host, NOT an inbox UI.
- **BUILD rule 7/8:** run `biome check --write` before commit.

## Open escalations carried into gate
- T-9: flip journey F6/F9 reminders node LIVE + inventory the email touchpoint.
- N-block: dispose M5's 6 open non-seed tasks before flipping M5→done.

## Gate verdict log: <appended by head-builder at B-6>
- **B-6 Phase 1 (head-builder, attempt 1): APPROVED.** All 7 correctness gates verified against actual code: LEFT-JOIN done-exclusion (IS DISTINCT FROM 'done', NULL-safe, real leftJoin — service:132-152); INSERT-RETURNING send-once (service:210-232, UNIQUE arbiter); UTC 24h window w/ E2 past-due guard (service:64-66, timestamptz); per-assignment+per-member try/catch + null-email skip; honest real-PG integration test (5 cases, only the email I/O leaf stubbed); scope clean (cron-host module, no UI/opt-out/digest crept in); client-safe inline-styled email leaking only title/due/server. Migration 0013 committed + no startup auto-migrate. Commits clean per-spec. Verdict: process/waves/wave-30/blocks/B/gate-verdict.md. rework_attempt_cap_remaining=2. → Proceed to Phase 2 (/review).

## Block-exit handoff
```yaml
build_block_status: complete
branch: wave-30-assignment-reminders
stages_run: [B-0, B-2, B-4, B-5, B-6]
stages_skipped: [D-block (design_gap_flag=false), B-1 (no contract surface), B-3 (backend-only)]
review_verdict: APPROVE
deviations_logged: ["B-2 minor N+1 (fixed at B-6 f80cb39)"]
fix_up_commits: [f80cb39]
followups_filed: [4905dc3a]
last_commit_sha: f80cb39
ready_for_ci: true
```
