# Wave 22 — P-3 Plan

## Approach
**New AssignmentsModule (apps/api/src/assignments/) + the assignments-panel UI.** Reuses M2 RBAC `can()` for organizer authz, the wave-19 FilesService for the optional attachment, and the adopted `design/assignments-panel.html` for the UI (D-block partial — extract the assignment-card primitive + token-fidelity).

### Data model (migration 0010, additive)
- `assignments` (id uuid pk, server_id uuid FK→servers CASCADE, organizer_id uuid FK→users, title text NOT NULL, description text, due_date timestamptz NOT NULL, is_deleted bool default false, created_at, updated_at) + index (server_id, due_date).
- `assignment_status` (id uuid pk, assignment_id uuid FK→assignments CASCADE, user_id uuid FK→users, state text 'todo'|'done', created_at, updated_at, **UNIQUE(assignment_id, user_id)**) + index (assignment_id, user_id).
- `assignment_attachments` (id uuid pk, assignment_id uuid FK→assignments CASCADE, object_key text, filename text, content_type text, size_bytes int, created_at) — a NEW association (the messages `attachments` table is message-coupled; do NOT force message_id). 0-1 per assignment this wave (UNIQUE assignment_id or just FK).
- Drizzle schema apps/api/src/db/schema/assignments.ts + export. Migration via drizzle-kit (0010).

### Backend (apps/api/src/assignments/)
- **assignments.service.ts:** createAssignment (organizer-authz via rbac can(); insert + optional attachment association), listAssignments(serverId, userId) (due_date ASC, LEFT JOIN assignment_status for myStatus, exclude is_deleted, member-authz), getAssignment, updateAssignment (organizer), softDeleteAssignment (organizer; CASCADE handles status), toggleStatus(assignmentId, userId, state) (upsert ON CONFLICT(assignment_id, user_id)), attachAssignmentFile (organizer; reuse FilesService presign/confirm + server-validate size/type like wave-19).
- **assignments.controller.ts:** POST /servers/:serverId/assignments (organizer), GET /servers/:serverId/assignments (member, due-sorted +myStatus), GET /assignments/:id, PATCH /assignments/:id (organizer), DELETE /assignments/:id (organizer soft-delete), PUT /assignments/:id/status {state} (member toggle), + presign/confirm for the assignment attachment. **Authz: organizer routes gated on rbac can(userId, serverId, <perm>) — decide perm at B-1: reuse `manage_channels` (simplest, no migration) OR add a `manage_assignments` flag (cleaner; +a roles-flag migration). Default: reuse manage_channels this wave (owner always passes; a manage_channels role = organizer) — document; the dedicated flag is a follow-on.** Member routes gated on server membership.
- **assignments.module.ts** (registers service/controller; imports RbacModule + FilesModule).

### Frontend (apps/web/src/)
- **AssignmentsPanel page** (per adopted design/assignments-panel.html): lists assignments (due-sorted), entry from the channel/server view.
- **AssignmentCard primitive:** title, due-date with amber 'due soon' (e.g. <48h) + red 'overdue' chips (per the design's thresholds), optional attachment, per-member to-do/done toggle.
- **AssignmentForm** (organizer create/edit): title/description/due/optional-attachment (reuse the wave-19 composer attachment upload flow); authz-reactive (organizer-only).
- **api.ts:** the assignments REST calls + the assignment attachment presign/confirm.

## Plan
### File-level steps (by B-stage)
**B-1 Schema** (postgres-pro): migration 0010 (assignments + assignment_status + assignment_attachments + indexes); schema/assignments.ts; **decide the organizer perm (reuse manage_channels — no roles migration this wave)**.
**B-2 Contracts** (typescript-pro): packages/shared — Assignment, AssignmentStatus, create/update/status DTOs (Zod), AttachmentRef reuse.
**B-3 Backend** (backend-developer): assignments.service.ts (CRUD + toggle upsert + organizer can()-authz + attachment), assignments.controller.ts (routes), assignments.module.ts; register in app.module.
**B-4 Frontend** (react-specialist + frontend-developer; vs adopted design): AssignmentsPanel + AssignmentCard + AssignmentForm + api.ts; mount/entry per the design.
**B-5 Wiring:** repo typecheck + route registration + boot-probe + the assignments-panel entry.

### Specialist routing (vs AGENTS.md): postgres-pro, typescript-pro, backend-developer, react-specialist, frontend-developer — present.
### Parallelization: B-1 → B-2 serial. B-3 (backend) ∥ (after B-2) the D-block primitive-extraction; B-4 (UI) after B-3 + D-block.

### Self-consistency sweep
1. Every AC → step: CRUD+toggle+authz (service+controller+migration); due-sort+myStatus (service); attachment (service+assignment_attachments+FilesService); panel/card/form (B-4 vs design); authz-403+UNIQUE+isolation (tests). ✓
2. Specialist each. ✓ 3. No file in two parallel batches. ✓ 4. design_gap TRUE-partial → D-block light (extract card + token-fidelity vs adopted design). ✓ 5. Reuse named (rbac can(), FilesService) + the attachment-coupling resolved (new assignment_attachments). ✓ 6. Contracts concrete. ✓ 7. No new dep. ✓ 8. SDK reuse (@aws-sdk existing). ✓

### B-block carries (P-4 will confirm)
- **Authz (rule-1 + BUILD rule 4):** organizer routes gated on rbac can() (owner OR manage_channels-flag — NO static educator-role); the non-organizer 403 negative paths are a B-6 Phase-2 requirement (rule 4). Member routes server-membership-gated.
- **Attachment (rule-1):** new assignment_attachments association (the messages attachments table is message-coupled — do NOT reuse it directly); reuse FilesService presign/confirm + server-validate size/type (wave-19 pattern, incl the send-time HeadObject validation).
- **One-per-member status:** UNIQUE(assignment_id, user_id) + ON CONFLICT upsert toggle; status isolation (A's toggle ≠ B's).
- **Due-sort:** ASC by due_date (require due_date NOT NULL, or sort nulls-last).
- **D-block PARTIAL:** design/assignments-panel.html ADOPTED → D-1 brief light/skip; D-block extracts the assignment-card primitive + token-fidelity/responsive check (not fresh variants).
- **OUT:** reminders/cron/Resend (deferred M5 bundle, no cred-ask); grading/rubrics/submissions.

## P-4 PHASE-2 ANNOTATIONS (carry to B-block)
- **G3 (Gemini→head-product NOT-MATERIAL, authz):** organizer authz reuses `can(userId, serverId, 'manage_channels')` this wave — a SINGLE call site in assignments.controller. The dedicated `manage_assignments` flag is a documented follow-on (product-decision logged; backlog task seeded) — the future swap is one line + an additive roles migration, no data migration. Keep the authz a single, swappable call site.
- **karen B-note 1 (attachment size gate):** the assign-attach path MUST call FilesService.headAttachment (server-derived size+type) BEFORE the assignment_attachments INSERT + reject >10MB (413) — the wave-19 send-time anti-spoof pattern (presigned-PUT can't block oversize; do NOT regress to confirm-time-only).
- **karen B-note 2 (soft-delete is NOT cascade — CORRECTION):** soft-deleting an assignment (is_deleted=true) does NOT remove its assignment_status rows (FK CASCADE fires only on a HARD row DELETE). The status rows are HIDDEN via the is_deleted-excluding list query, not cascaded. B-3: do NOT claim "CASCADE handles status on soft-delete". Tests (a5f25f9b) MUST assert status rows are HIDDEN-not-removed on soft-delete. (The CASCADE FK is still correct for a real hard-delete path if any.)
