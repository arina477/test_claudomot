# Wave 43 — P-2 Spec (pointer)

**Source of truth:** seed task `tasks.description` (id 535bdb8c) — YAML head + `---` + prose. Convenience copy.
**wave_type:** multi-spec · **claimed_task_ids:** [535bdb8c (scheduling backend + authoring UI), cdf81427 (calendar view), 1216146e (session detail)] · **design_gap_flag:** true

## Acceptance (copy)
### Seed 535bdb8c — scheduling backend + authoring UI
- Organizer (manage_assignments) creates session: title, optional desc, starts_at/ends_at, recurrence {none,weekly}+recurrence_until. POST 200.
- Organizer edit (PATCH) + soft-delete (DELETE); serverId derived from row (IDOR-safe); non-organizer 403.
- Validation: ends_at>starts_at (400); weekly+recurrence_until<starts_at (400); soft-deleted/unknown → 404.
- Educator authoring modal (mirror AssignmentForm) gated on getMyPermissions.manage_assignments.
- NO RSVP/reminders/timezone-negotiation/ICS.
### Sibling cdf81427 — class calendar view
- Member lists sessions GET /servers/:serverId/scheduled-sessions (assertMember); starts_at ASC; weekly occurrences expanded within window (compute-on-read, no materialized rows); non-member 403; empty → calm empty state.
### Sibling 1216146e — session detail
- Member GET /scheduled-sessions/:id (assertMember, serverId derived); organizer sees role-gated edit/delete, non-organizer read-only; unknown/deleted → 404 calm.

Key P-0 carries: recurrence bounded to closed enum {none,weekly}+recurrence_until (no RRULE/iCal — finding #1); compute-on-read occurrence expansion, no materialized rows (finding #2, P-3 owns expansion location). New scheduling module mirrors assignments authz/soft-delete; reuses manage_assignments (no new flag).
