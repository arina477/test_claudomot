# Wave 22 — B-block Gate Verdict (B-6 Phase 1)

**Block:** B (Build) | **Wave topic:** M5 assignments (CRUD + per-member status + panel/card UI + optional attachment) | **Gate:** B-6 Phase 1 (head-builder) | **Branch:** wave-22-m5-assignments @ 44122c0
**Gating agent:** head-builder | **Date:** 2026-06-30

---

## Verdict: **APPROVED** → proceed to B-6 Phase 2 (/review adversarial pass)

Repo verified green this turn: api 379/379 tests pass (21 files). Typecheck 4/4 + build 3/3 per manifest. Every load-bearing check (can()-403 organizer authz, soft-delete-hides, per-member isolation, headObject-before-insert anti-spoof) is implemented AND genuinely tested.

---

## Load-bearing checks (the four that decide this gate)

### 1. Organizer authz — can()-403, single call site, IDOR-safe (rule-1 + rule-4) — PASS
- `assertOrganizer` (service L59-66) is a **single** private method: `rbacService.can(userId, serverId, 'manage_channels')` → `ForbiddenException` on false. Owner passes via the rbac superuser path (G3 annotation honored). Called from create / update / softDelete / presign only.
- **Negative paths genuinely tested:**
  - create non-organizer → 403 + `mockInsert` NOT called (service.spec L195-206).
  - update non-organizer → 403 + `mockUpdate` NOT called (L561-570).
  - softDelete non-organizer → 403 + `mockUpdate` NOT called (L406-415).
  - presign non-organizer → 403 + FilesService NOT called (L603-611).
  - non-member list → 403 (L318-324). Controller layer mirrors 403 propagation (controller.spec L152, L236).
- **IDOR-safe `/assignments/:id`:** `serverId` is derived from the fetched assignment ROW (service L274 get, L301 update, L365 softDelete, L400 toggle), never from a client param. The `:serverId` path param is only used on the collection routes, which is correct. Confirmed in controller comments + service code.

### 2. Soft-delete HIDES not cascade (karen carry) — PASS
- `softDeleteAssignment` (L355-375) sets `is_deleted=true` via UPDATE only; an explicit code comment documents that `assignment_status` rows are intentionally retained and CASCADE fires only on hard DELETE.
- `listAssignments` (L251) filters `eq(assignments.is_deleted, false)`; get/update/softDelete/toggle all re-assert `is_deleted=false`.
- **Genuine test:** L386-404 asserts `mockUpdate` called once with `is_deleted: true` in the set-patch AND **`mockDelete` NOT called** — proving status rows are not removed. L417-435 asserts soft-deleted assignments are excluded from list (hidden, not deleted).

### 3. Per-member status isolation — UNIQUE upsert — PASS
- `toggleStatus` (L385-417) upserts via `onConflictDoUpdate` on target `[assignment_id, user_id]`, carrying the caller's `userId`. Migration 0010 enforces `UNIQUE(assignment_id, user_id)` (constraint `assignment_status_assignment_user`).
- **Genuine test:** L455-473 asserts `onConflictDoUpdate` called once. L475-504 asserts the inserted row carries `MEMBER_ID` (not organizer/other) — A's toggle row is keyed to A, cannot touch B's. L506-522 asserts idempotent done→done.

### 4. Attachment anti-spoof — headObject BEFORE insert (karen carry, wave-19 pattern) — PASS
- `validateAndHeadAttachment` (L94-116) calls `filesService.headAttachment(key)` → rejects unsupported MIME (400) and `contentLength > 10MB` (413 `PayloadTooLargeException` with `ATTACHMENT_TOO_LARGE` code) BEFORE any `assignment_attachments` INSERT. Server-derives size+type from HeadObject, not client claim.
- create (L201-209) and update (L324-339) both validate before insert.
- **Genuine test:** L208-243 asserts call-order `headAttachment` THEN `attachmentInsert`. L245-261 asserts 11MB → 413 + `mockInsert` NOT called (no assignment row written).

---

## Secondary checks — PASS

- **Due-sort ASC + myStatus:** `listAssignments` orders `asc(assignments.due_date)` (L252); `rowToDto` LEFT-JOIN-equivalent status lookup defaults `'todo'` when no row (L145). Tested L281-316 (sorted + default todo).
- **Migration 0010 additive:** three new tables only (assignments / assignment_status / assignment_attachments); UNIQUE + indexes `(server_id, due_date)`, `(assignment_id, user_id)`, `(assignment_id)`; FK cascades correct (status/attachments CASCADE to assignment; assignment CASCADE to server; user FKs no-action). No ALTER of existing tables, no startup auto-migrate.
- **Frontend AssignmentCard chip logic:** `getUrgency` (L44-52) overdue<now / dueSoon<48h / normal / done-short-circuits. Overdue chip uses `#f87171` (--danger-text) NOT --danger; due-soon amber `#f59e0b`; normal no-chip; done suppresses chip + muted due line. Matches D-3 contract.
- **--danger-text promoted to DESIGN-SYSTEM §1:** present in the color table (line 36) with documented AA math (6.30:1 PASS over danger/10 vs 3.93:1 FAIL for --danger). D-carry satisfied.
- **Per-member toggle:** real `<input type="checkbox">` + `<label>` (L307-314), wrapper `onClick stopPropagation` (L289), optimistic-then-revert on PUT failure (L158-173). api client `setAssignmentStatus` present.
- **Organizer-only form:** AssignmentForm rendered only on `isOrganizer`; AssignmentsPanel gates CTA + empty-state CTA on `isOrganizer`.
- **No gold-plating:** reminders/Resend + grading/rubrics correctly OUT. No Redis/queue/multi-replica added.

---

## The deviation — ASSESSED AS ACCEPTABLE (non-blocking → V-2 note)

**Finding:** The CLIENT organizer gate (`AssignmentsPanel` L92-97) is **owner-only** (`myUserId === ownerId`), NOT the full `manage_channels`-role check the server enforces. `ServerMember` does not expose `roleId` client-side (a `/me/roles` endpoint does not yet exist), so a role-based client check is not derivable this wave.

**Why this is acceptable, not a B-block defect:**
- **Server authz is correct and complete** — `can(manage_channels)` is enforced at every door (rule-1/rule-4 satisfied). The client gate is strictly MORE restrictive than the server, which is the safe direction: no privilege escalation, no IDOR, no unguarded door.
- **Consequence is UX-only:** a non-owner `manage_channels` organizer doesn't see the "New Assignment" CTA, but the server would accept their valid POST. The common MVP organizer IS the owner, so the gap is narrow.
- The code documents the limitation explicitly (L93-95) and names the server as the enforcement boundary.

**Routing:** logged as a non-blocking UX-completeness note for V-2 triage (consider a `/me/roles` or `isOrganizer` server signal in a later M5 bundle). Does NOT block this gate — the firing-grade failures (contract drift, unguarded door) are absent; server-side-at-every-door holds.

---

## Stage-exit checklist

- [x] Zod schema single source (@studyhall/shared) → controller derives via `safeParse`; error shape `{code,message}` on 413.
- [x] Drizzle migration 0010 generated + committed; additive; no startup auto-migrate.
- [x] Every protected REST route composes `AuthGuard`; organizer routes add `assertOrganizer`; member routes add `assertMember`.
- [x] `/assignments/:id` IDOR-safe — serverId from row.
- [x] Idempotency: status upsert keyed on UNIQUE(assignment_id,user_id).
- [x] Attachment token/URL minted server-side after RBAC check (organizer-only presign).
- [x] Frontend optimistic-render-then-revert on toggle.
- [x] Reviewed by an agent other than author at B-6 Phase 2 (next).
- [x] No over-engineering / scale gold-plating.

---

## head_signoff
```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6-phase-1
  reviewers: {}   # Phase 2 (/review adversarial) runs next per author
  failed_checks: []
  rationale: >
    All four load-bearing checks pass with genuine (not theatrical) tests — can()-403 organizer
    authz is a single call site with negative paths asserting the write was blocked; soft-delete
    sets is_deleted=true and the test proves mockDelete was never called (rows hidden, not removed);
    per-member status upserts on UNIQUE(assignment_id,user_id) keyed to the caller's userId with an
    isolation test; attachment headObject-before-insert anti-spoof verified by call-order + 413
    rejection with no insert. Migration 0010 is additive with correct FK cascades and no startup
    auto-migrate. The owner-only client gate is a strictly-more-restrictive UX gap over correct
    server authz (no escalation/IDOR) and is routed to V-2 as non-blocking. api 379/379 green.
  next_action: PROCEED_TO_B-6-PHASE-2
  deviation_routed_to: V-2 (owner-only client organizer gate — server authz correct; UX-completeness only)
```
