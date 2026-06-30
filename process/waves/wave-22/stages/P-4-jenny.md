# P-4 Phase-2 — jenny spec-vs-roadmap drift check (wave-22, FIRST M5 wave)

**Verdict: APPROVE** — spec matches M5 `## Scope` with a coherent spine-first split; no drift.

Spec: task `01fcefb8` (+ siblings `916ecff7`, `a5f25f9b`). Milestone M5 `a5232e16` (T3, in_progress). Sources cross-checked: M5 `## Scope`/`## Success metric`, product-decisions (M5 in v10 roadmap; assignments-panel adopted v9), feature-list #15, P-0-frame.

## Per-item MATCHES / DRIFTS

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | 3-block spec (CRUD spine + panel/card UI + tests) vs M5 `## Scope` | **MATCHES** | M5 Scope = "organizer posts assignment [title, description, due date, attachment]; members view + mark personal to-do/done; sorted by due date … Page: assignments-panel. Primitive: assignment-card [amber due/red overdue chips]." Spec task `01fcefb8` ACs cover post/view/mark-done + due-sort + attachment; `916ecff7` = assignments-panel + assignment-card; `a5f25f9b` = tests. 1:1. |
| 2 | **Reminder deferral** (cron + Resend NOT shipped this wave) | **MATCHES (clean in-milestone split)** | M5 Scope names "due-date reminder notifications (cron + NotificationsModule via Resend)"; this wave explicitly defers it (`premises_rule1`, task narrative "OUT (deferred to later M5 bundles): due-date REMINDERS"). This is a spine-first split, NOT under-ship: wave-1 ships the post/view/mark-done spine that reminders depend on (an assignment must exist + have a `due_date` before anything can remind on it). The `due_date timestamptz` column + due-sort index land THIS wave, so the deferred reminder bundle has its data substrate ready. Metric reachable across 2 bundles — see below. |
| 3 | M5 `## Success metric` reachability across the 2 bundles | **MATCHES** | Metric = "organizer posts an assignment with a due date; members see it alongside chat, mark it done, AND get a reminder before it is due." Wave-22 delivers the first three clauses (post-with-due / see-alongside-chat / mark-done) end-to-end; the final clause ("get a reminder") is the ONLY part deferred, and it is additively reachable by the later M5 reminder bundle on top of this wave's `assignments` + `due_date`. No wave-22 decision forecloses it. Split is coherent — the spine is the metric's load-bearing 75%, reminder is the additive completion. M5 is multi-wave; metric is a milestone-level (not wave-level) bar. |
| 4 | **Authz reframe** (organizer = owner OR manage-flag via `can()`, NOT a static educator-role) | **MATCHES (implementation, not scope drift)** | M5 Scope says "organizer posts" — it names the actor, not the authz mechanism. Resolving "organizer" to owner-or-manage-flag through the existing M2 `rbac.service can(userId, serverId, perm)` is an implementation choice consistent with the v6b "single-role-per-member RBAC, flag-based" architecture decision (product-decisions). No static "educator-role" exists in the locked schema; inventing one would be the drift. Reframe correctly avoids it. |
| 5 | **Attachment reframe** (net-new `assignment_attachments`, NOT reuse of message-coupled attachments table) | **MATCHES (storage impl, not scope drift)** | M5 Scope lists "attachment" as an assignment field. The attachments table is message-coupled (`message_id NOT NULL` per v6b); an assignment attachment therefore needs net-new schema. Choosing a new `assignment_attachments` association (or nullable-`message_id` generalization) reusing FilesService presign/confirm is storage implementation, fully within scope. mvp-thinner held it in this wave for the multi-spec floor (P-0 floor_constraint_active). |
| 6 | Scope creep — grading/rubrics/submissions/peer-review/calendar-sync/recurring all OUT | **MATCHES (no creep)** | None appear in any of the 3 task ACs/edge-cases. Task narrative explicitly: "OUT (milestone): grading, rubrics, submissions, peer-review, calendar-sync, recurring assignments." Consistent with feature-list #18 "Deeper assignment management … **no grading** … grading/LMS out of scope" (a later H2/academic item, not M5). Clean. |
| 7 | amber-due / red-overdue chips vs M5 `## Scope` "assignment-card (amber due / red overdue chips)" | **MATCHES** | Task `916ecff7` AC2: "amber 'due soon' chip + red 'overdue' chip (per the adopted design's chip logic)"; edge-case "amber due-soon vs red overdue (date thresholds per design)." Verbatim alignment with M5 Scope and design/assignments-panel.html (adopted v9). |
| 8 | Does NOT claim M5 complete | **MATCHES** | Task narrative: "Opens M5 … the post/view/mark-done assignments spine"; "OUT (deferred to later M5 bundles): reminders"; "OUT (milestone): grading…". P-0-frame: "M5 = FIRST wave." No completion claim — reminders + deeper academic tooling explicitly remain. Correct for a multi-wave milestone's wave 1. |

## Key judgment — the reminder deferral is a clean spine-first split, not a drift

The reminder (cron + Resend) is the only M5-Scope-named element omitted this wave. It is deferred, not dropped, and the deferral is structurally sound:
- The spine (assignment with `due_date` + per-member done-state) is a hard prerequisite for any reminder — reminders cannot exist before the data they fire on does.
- This wave lands `due_date` + the `assignments`/`assignment_status` tables, so the later reminder bundle is purely additive (a cron job + NotificationsModule wiring on existing rows) — no rework, no schema migration of this wave's output.
- The M5 success metric is a milestone bar reachable across the 2 bundles; wave-22 satisfies it through "mark it done," the reminder bundle satisfies the trailing "get a reminder before it is due." No wave-22 choice forecloses that path.
- Deferring reminders also correctly avoids a premature founder Resend-credential ask (the cred is needed only when the reminder bundle ships) — consistent with `premises_rule1`.

No source conflicts. Spec, M5 milestone prose, product-decisions, feature-list (#15/#18), and P-0-frame are mutually consistent.

**APPROVE.**
