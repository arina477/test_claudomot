# V-1 Karen — source-claim verification (wave-22 M5 assignments)

**Verdict: APPROVE**
**Scope:** merged main @ 72b5a0f (PR#34), migration 0010 applied, deployed LIVE. 3 tasks (01fcefb8 spine / 916ecff7 panel / a5f25f9b tests).
**Method:** static verification of merged source vs DB specs. Live runtime behavior carried from T-8 (curl 401 on route, gitleaks clean). App DB not queried (control-plane only, per prompt).

All 7 claim-groups VERIFIED. No claimed-but-not-built, no gold-plating. The four load-bearing claims (can()-authz / cross-server-IDOR-fixed / per-member-isolation / soft-delete-hides) hold in code with matching negative-path tests.

---

## Per-claim

### 1. CRUD + per-member status spine — VERIFIED
- `createAssignment` (organizer authz) — assignments.service.ts:225-278
- `listAssignments` (member authz, due-sorted ASC + myStatus) — :287-297 (`orderBy(asc(assignments.due_date))` :294; `where ... is_deleted=false` :293)
- `getAssignment` (member authz, serverId from row) — :306-319
- `updateAssignment` (organizer authz) — :329-388
- `softDeleteAssignment` (organizer authz, is_deleted=true) — :401-421
- `toggleStatus` (ON CONFLICT upsert) — :431-463 (`onConflictDoUpdate` :457-460)
- myStatus default 'todo' via per-user lookup — :176-184
- All 7 routes wired w/ AuthGuard — assignments.controller.ts:66-195; module imports Rbac+Files — assignments.module.ts:18-29; mounted in app.module.ts:38.

### 2. can()-authz (load-bearing) — VERIFIED
- `assertOrganizer` SINGLE call site → `rbacService.can(userId, serverId, 'manage_channels')` — :60-67. Owner passes via rbac superuser path (G3 carry documented :32-34).
- Non-organizer → 403 ForbiddenException — :62-66. Test: service.spec.ts:217, :428, :583, :625.
- `/assignments/:id` routes derive serverId from the fetched ROW, never client param: get :316 (`row.server_id`), update :343 (`existing.server_id`), delete :411, toggle :446. Controller comments confirm IDOR-safe intent (controller.ts:47-48).

### 3. Cross-server attachment IDOR fix (the /review High) — VERIFIED
- `validateAndHeadAttachment` anchored regex `^attachments/<serverId>/[A-Za-z0-9._-]+$` — :117-118, tested BEFORE `headAttachment` + INSERT — :120-130.
- serverId is route-derived (create :243) / row-derived (update :375 `existing.server_id`) — never client.
- Char class excludes `/`, so path-traversal (`.../../etc/passwd`) fails the `$` anchor → rejected. Cross-server key (different serverId prefix) → no match → 400. Tests: cross-server create :659, path-traversal :676, cross-server update :716; each asserts headAttachment NOT reached.
- NoSuchKey/NotFound → 400 BadRequest — :132-134; infra errors rethrown → 5xx — :135. Matches T-8 ratification (a)/(b)/(e) and H2.

### 4. Per-member isolation (load-bearing) — VERIFIED
- `toggleStatus` inserts SESSION userId — :453 (`user_id: userId`), userId sourced from `req.session.getUserId()` (controller.ts:193). Request DTO `AssignmentStatusSchema` has only `{ state }`, NO user_id field — shared/src/assignments.ts:71-73.
- UNIQUE(assignment_id, user_id) — schema/assignments.ts:77; migration 0010:18.
- Upsert targets the composite key — :457-460. A cannot set B's status. Tests: isolation :497, one-per-member upsert :477.

### 5. Soft-delete HIDES not cascade — VERIFIED
- softDelete sets `is_deleted=true` only — :413-416; explicitly does NOT delete assignment_status rows (:418-420).
- `is_deleted=false` filter on every read path: list :293, get :310, update :337, toggle :440.
- CASCADE FK exists but fires only on hard row DELETE (migration 0010:34). Status rows preserved on soft-delete. Tests: :408 (rows not deleted), :439 (hidden by exclusion).

### 6. Migration 0010 + Frontend — VERIFIED
- Migration additive: 3 CREATE TABLE (assignment_attachments / assignment_status / assignments), 5 FKs, UNIQUE(assignment_id,user_id), 3 indexes incl. (server_id, due_date) — 0010_typical_harry_osborn.sql:1-40. No ALTER/DROP on existing tables.
- `getUrgency`: isDone→'done' short-circuit; dueAt<now→'overdue'; <48h→'dueSoon'; else 'normal'; NaN→'normal' — AssignmentCard.tsx:44-52. Border accent + chips render per state :92-135, :176-181; done suppresses chip → muted due line :81-90.
- `--danger-text` `#f87171` promoted in DESIGN-SYSTEM.md:36 (6.30:1 over danger/10 tint, AA PASS); used in overdue chip AssignmentCard.tsx:101.
- Panel: due-sort, empty state, organizer-only New/form gate — AssignmentsPanel.tsx:97, :256, :312, :399-409.

### 7. Antipatterns — VERIFIED CLEAN
- No claimed-but-not-built: all spine methods, routes, DTOs, tables, panel/card present and wired.
- No gold-plating: grep for reminder/cron/resend/grading/rubric/submission in assignments/ → empty. Reminders/Resend correctly DEFERRED; grading/rubrics/submissions correctly OUT (milestone scope).
- Tests present for both spine + controller — assignments.service.spec.ts (28 cases), assignments.controller.spec.ts.

---

## Minor (non-blocking) observations
- Frontend organizer gate is owner-only (AssignmentsPanel.tsx:92-97): a manage_channels non-owner organizer won't see the New/edit CTA client-side. This is a convenience gate only — server enforces via can() (assertOrganizer), so it's a UX under-reach, not a security gap. Documented in-code (:92-95). Acceptable; flag for a later UX follow-on (needs a /me/roles surface).
- toggleStatus optimistic revert on PUT failure (AssignmentCard.tsx:166-170) logs to console; no user-facing toast. Acceptable for this wave.

Neither blocks APPROVE.
