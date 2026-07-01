# Wave 30 — P-1 Decompose

## Step 1 — Maximum size rubric (no trip)
| Measure | Threshold | Estimate | Trip? |
|---|---|---|---|
| Files touched | > 60 | ~10-14 (NotificationsModule + cron service + scan query; assignment_reminder schema + migration; EmailService.sendAssignmentReminder + template; app.module wiring; package.json @nestjs/schedule; unit + integration tests) | No |
| New primitives | > 60 | ~6 (NotificationsModule, cron scan service, assignment_reminder table, migration, sendAssignmentReminder method, email template) | No |
| Estimated net LOC | > 5,000 | ~1,800 (decomposer estimate: cron+scan ~700, schema+migration ~250, email template+method+tests ~450, wiring+dep+tests ~400) | No |
| Stage-4 working set | > 350K | moderate (Resend SDK docs + assignments/email/db source) | No |

No maximum threshold trips.

## Step 1b — wave_type + minimum floor
- `claimed_task_ids = [4a4c2715, c5c30363, 0ba853e2]` → length 3 → **wave_type: multi-spec**.
- Multi-spec floor: net LOC > 2,500 **OR** ≥ 6 specs. Estimate ~1,800 LOC / 3 specs → **floor UNMET**.

## Step 2b — RESCOPE-AUTO-MERGE → override-ship (mvp-critical right-size, NOT debt-padding)
Floor unmet, but decomposition-expansion is **wrong here** (distinct from the w23-w29 debt override-ships):
1. **This is the M5-mvp-critical feature at its minimal metric-satisfying size.** mvp-thinner ruled the 3-task set is the minimal coherent scope (when/once/what); splitting OR adding any = OVER-CUT or gold-plating (violates the keep-OUT list: opt-out, configurable window, digest, SMS, in-app center, history UI, multi-reminder). Expanding to hit an arbitrary LOC floor would ship gold-plating the P-0 reviewers explicitly excluded.
2. The floor is a heuristic against thin/padded waves; this wave is correctly scoped to exactly satisfy the M5 success metric ("get a reminder before it is due"). Unlike w23-w29 (re-homed debt), this IS the milestone headline.
3. **Verdict: override-ship** on the "correct-scope-below-floor" basis (NOT the wave-16 debt precedent). `floor_merge_attempt: 0` (decomposition-expansion is reviewer-excluded, not merely futile).

No fresh BOARD (this is a self-management sizing call on an mvp-critical, all-reviewers-PROCEED wave; the strategic decision — build reminders — is already founder-resolved Path A).

## Step 3 — design_gap_flag
**design_gap_flag: FALSE.** The wave is a backend cron + email arc. The reminder email is a **simple transactional HTML** authored via `EmailService.sendEmail({to, subject, html})` (raw html param — no template design-system exists to follow; there is no app-UI page). B authors a clean branded email following `design/DESIGN-SYSTEM.md` brand tokens (email-client-safe: light background, brand accent, assignment title + due date + server name + a link). This is NOT a new app screen/flow/icon requiring the D-block pipeline → skip D, straight to B. (If B finds the email needs genuine visual design iteration beyond a simple transactional layout, it can invoke the D-1 design-gap fallback — not expected.)

```yaml
verdict: PROCEED (override-ship under-floor — mvp-critical right-size, reviewer-excluded expansion)
wave_type: multi-spec
claimed_task_ids: [4a4c2715-019d-4687-9963-d41796d1a5ad, c5c30363-e59b-4c5a-bba9-6d6d0cabb2bf, 0ba853e2-4550-4104-b4f0-c6774b49fe62]
max_rubric_trips: []
floor_threshold: "2500 LOC OR 6 specs (multi-spec)"
estimated_net_loc: "~1800"
floor_met: false
floor_merge_attempt: 0
override_basis: "mvp-critical minimal metric-satisfying set; expansion is reviewer-excluded gold-plating (NOT debt precedent)"
board_convened: false
design_gap_flag: false
b1_contracts_fires: true   # new assignment_reminder table (Drizzle schema) + possible shared type for the reminder payload
external_sdk: ["resend (already wired via EmailService)", "@nestjs/schedule (NEW dep — B-0)"]
security_surface: "user-comms (email to users) + cron DB access — T-8 may consider: no double-send, no cross-server leak, no PII-over-exposure in email body"
specs:
  - {task_id: c5c30363, layer: "schema", scope: "assignment_reminder table (assignment_id, user_id, sent_at) + UNIQUE(assignment_id,user_id) + Drizzle migration — send-once substrate. B-0."}
  - {task_id: 0ba853e2, layer: "backend+email", scope: "EmailService.sendAssignmentReminder(to,{title,dueDate,serverName,link}) + branded transactional HTML template; unit-tested."}
  - {task_id: 4a4c2715, layer: "backend", scope: "NotificationsModule + @Cron hourly scan → due-in-24h assignments (due_date>now, !is_deleted) → members via server_members LEFT JOIN assignment_status (state IS DISTINCT FROM 'done') → not-yet-in assignment_reminder → insert-then-send. Add @nestjs/schedule. Idempotent, per-server-isolated, non-throwing."}
```

## Exit
Multi-spec (3 specs), override-ship under-floor (mvp-critical right-size — expansion reviewer-excluded, floor_merge_attempt 0, no BOARD), design_gap_flag=false → skip D. B-1 fires (new table + reminder payload type). External SDK: Resend (wired) + @nestjs/schedule (new). Carries: LEFT-JOIN done-exclusion, insert-before-send idempotency, E1/E2/E3 edge-case ACs, fixed 24h window, keep-OUT list. → P-2 Spec.
