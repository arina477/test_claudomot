# Wave 43 — P-3 Plan

## Approach section

### Architecture deltas
- **NEW scheduling module (apps/api/src/scheduling/)** mirroring the assignments module: schema + module + service + controller. Owns the `scheduled_sessions` entity. Reuses the assignments authz pattern verbatim: `assertOrganizer(userId, serverId)` → `rbacService.can(userId, serverId, 'manage_assignments')` (no new permission), `assertMember`, soft-delete, `serverId`-derived-from-row on :id routes (IDOR-safe), `rowToDto`.
  - **Approach — recurrence:** store a single row + a CLOSED-enum descriptor (`recurrence` none|weekly, `recurrence_until` nullable). **Occurrence expansion is compute-on-read, server-side, within a bounded window** (the GET list accepts from/to; the service expands weekly occurrences up to recurrence_until AND the window end; hard cap the window span, e.g. ≤ 90 days, to bound expansion). **Alt considered:** materialized per-occurrence rows (a row per weekly instance). **Why compute-on-read wins:** materialization is a scheduling-engine rabbit hole (edit/delete-series semantics, drift) for zero gain at this scope; a single row + descriptor keeps edit/delete trivial and the fence intact (problem-framer #2). **Alt considered:** client-side expansion — rejected: keeps the API honest + testable (the list returns concrete occurrences the calendar renders).
  - **Failure-domain:** new module, same authz boundary as assignments (no new permission surface). No transaction-scope expansion (each write is a single upsert/update). server_id derived from the session row on every :id route.
- **web scheduling surface (apps/web/src/shell/):** a NEW SessionForm authoring modal (mirror AssignmentForm), a NEW class calendar/agenda view (date-grouped session list, member-visible), a NEW session detail view (role-gated edit/delete). D-block designs the calendar view (design_gap_flag=true).

### Data model
- **NEW `scheduled_sessions`** (migration, mirror assignments shape): id uuid pk; server_id uuid NOT NULL FK->servers(id) ON DELETE cascade; organizer_id text NOT NULL FK->users(id); title text NOT NULL; description text NULL; starts_at timestamptz NOT NULL; ends_at timestamptz NOT NULL; recurrence text NOT NULL default 'none' (app-enforced none|weekly); recurrence_until timestamptz NULL; is_deleted boolean NOT NULL default false; created_at/updated_at. **INDEX(server_id, starts_at).** ONE migration, offline, no backfill.

### API contracts (concrete)
1. `POST /servers/:serverId/scheduled-sessions` — organizer (assertOrganizer=manage_assignments); req CreateScheduledSessionSchema; res 200 ScheduledSession; 400 (ends<=starts, weekly+until<starts); 403.
2. `PATCH /scheduled-sessions/:id` — organizer (serverId from row); req UpdateScheduledSessionSchema; 200; 403; 404.
3. `DELETE /scheduled-sessions/:id` — organizer (serverId from row); soft-delete; 204; 403; 404.
4. `GET /servers/:serverId/scheduled-sessions?from&to` — member (assertMember); res 200 {sessions:[occurrences within window, starts_at ASC]}; 403. Occurrence expansion server-side, bounded window.
5. `GET /scheduled-sessions/:id` — member (assertMember, serverId from row); 200 ScheduledSession; 404.

### New deps
None. Reuses RBAC can(), Drizzle, the assignments patterns, the web fetch wrapper.

### SDK pre-build checklist
N/A — no new external SDK.

## Plan section

### File-level steps (grouped by B-stage)

**B-1 Schema (migration)** — serial, first:
- `apps/api/src/db/schema/scheduling.ts` (NEW) — scheduled_sessions table def. *sql-pro*.
- `apps/api/drizzle/migrations/00NN_*.sql` — generated + committed (drizzle-kit generate). *sql-pro*.

**B-2 Contracts (shared Zod)** — after schema:
- `packages/shared/src/scheduling.ts` (NEW) + index export — ScheduledSessionSchema, CreateScheduledSessionSchema (.refine ends>starts + weekly/recurrence_until guard), UpdateScheduledSessionSchema (partial), ScheduledSessionListResponseSchema. *typescript-pro*.

**B-3 Backend (module + service + controller)** — after contracts:
- `apps/api/src/scheduling/scheduling.service.ts` (NEW) — create/update/softDelete/getOne/listForServer (with bounded weekly occurrence expansion), assertOrganizer/assertMember (reuse the rbac pattern), rowToDto. *node-specialist*.
- `apps/api/src/scheduling/scheduling.controller.ts` (NEW) — 5 routes (server-prefixed create/list; :id get/patch/delete; serverId derived on :id). *node-specialist*.
- `apps/api/src/scheduling/scheduling.module.ts` (NEW) + register in the app module. *node-specialist*.

**B-4 Frontend** — after contracts (∥ B-3 once shared types land):
- `apps/web/src/auth/api.ts` — createSession/updateSession/deleteSession/listSessions/getSession client fns. *react-specialist*.
- `apps/web/src/shell/SessionForm.tsx` (NEW, mirror AssignmentForm) — authoring modal. *react-specialist*.
- `apps/web/src/shell/ClassCalendar.tsx` (NEW) — date-grouped calendar/agenda view (member) + New-session CTA gated on manage_assignments. *react-specialist* (against D-block adopted mockup).
- `apps/web/src/shell/SessionDetail.tsx` (NEW) — session detail + role-gated edit/delete. *react-specialist*.

**B-5 Wiring/verify:** module registration verified, typecheck fixers, `pnpm lint` (biome) + typecheck. *node/react*.

### Specialist routing (validated vs AGENTS.md)
- sql-pro (schema/migration) ✓ · typescript-pro (Zod) ✓ · node-specialist (NestJS module) ✓ · react-specialist (web) ✓. All in AGENTS.md.

### Parallelization map
- B-1 → B-2 strictly serial (backend + web depend on shared types).
- B-3 (module→service→controller serial within backend) ∥ B-4 (web) after B-2 lands.
- Within B-4: api.ts client fns first, then SessionForm / ClassCalendar / SessionDetail in parallel (distinct files).

### Self-consistency sweep
1. Every P-2 AC maps to a step: session CRUD (B-1/B-2/B-3 + SessionForm), calendar list w/ occurrence expansion (B-3 listForServer + ClassCalendar), detail (B-3 getOne + SessionDetail), validation (Zod + service), authz (assertOrganizer/assertMember), no-RSVP/reminders/ICS (schema/DTO/UI omit) ✓.
2. Every step has a specialist ✓.
3. No file in multiple parallel batches ✓.
4. design_gap_flag=true referenced → D-block runs before B-4 calendar UI ✓.
5. Architecture deltas have alt trade-offs (compute-on-read vs materialized; server vs client expansion) ✓.
6. Contracts concrete, no TBD ✓.
7. No new deps ✓.
8. SDK N/A ✓.

**Sweep clean.**
