# V-1 Semantic-Spec Verification — jenny — wave-22 (M5 assignments)

**Verdict: APPROVE**

Scope verified: merged `main @ 108f4a3` (LIVE). Three specs vs implementation. The wave ships the M5 post/view/mark-done spine + panel/card + optional attachment; the reminder arc is a coherent in-milestone deferral, not drift.

---

## Spec 01fcefb8 — CRUD + per-member status spine

| AC | Verdict | Evidence |
|---|---|---|
| Organizer POSTs (title req / desc / due / optional-attachment); non-organizer → 403 | **MATCHES** | `assignments.service.ts:225-278` createAssignment → `assertOrganizer` (L60-67) gates on `can(userId, serverId, 'manage_channels')` → 403. DTO `CreateAssignmentSchema` (`shared/assignments.ts:29-40`): title `min(1)` required, dueDate required ISO, description+attachment optional. |
| Member lists (due ASC) + GETs one; each carries requester's OWN status | **MATCHES** | `listAssignments` L287-297 `orderBy(asc(due_date))` + `assertMember`; `rowToDto` L161-216 fetches per-user `assignment_status` (default `'todo'`). `getAssignment` L306-319. |
| Member toggles PERSONAL status, one-per-member UNIQUE upsert; A's toggle ≠ B's | **MATCHES** | `toggleStatus` L431-463 `onConflictDoUpdate` on `(assignment_id,user_id)`; migration UNIQUE `assignment_status_assignment_user` (0010 L18). Isolation test L497. |
| Organizer EDIT + soft-DELETE (non-organizer 403); delete handles status rows | **MATCHES (documented reframe)** | `updateAssignment` L329-388 + `softDeleteAssignment` L401-421, both `assertOrganizer` on DB-derived serverId. Spec AC says "cascades the per-member status rows"; impl does **soft-delete that HIDES** status rows (is_deleted exclusion in list), CASCADE FK reserved for hard delete. This is the P-4-ratified karen carry (soft-delete-hides-not-cascade, commit d8d7d75) — coherent, documented at service L390-421. |
| Optional 0-1 attachment via NEW `assignment_attachments`; reuse FilesService; ≤10MB + type allowlist server-validated; organizer-only attach | **MATCHES** | Migration 0010 creates `assignment_attachments` (net-new, FK CASCADE). `validateAndHeadAttachment` L109-155: HeadObject BEFORE insert (anti-spoof), 413 on >10MB, 400 on disallowed type + server-scoped key regex (H1 IDOR fix L113-124). |

Migration 0010 matches `data` contract: `assignments` + `assignment_status` + `assignment_attachments`, indexes `(server_id,due_date)` and `(assignment_id,user_id)`, no new dep. API surface (7 routes) matches the `api` contract exactly (controller L66-195).

## Spec 916ecff7 — panel page + card primitive

| AC | Verdict | Evidence |
|---|---|---|
| New assignments-panel page, due-sorted, reachable from channel view | **MATCHES** | `AssignmentsPanel.tsx`; wired in `MainColumn.tsx:117-124` (renders on `assignmentsOpen`), due-sort confirmed client + server. |
| assignment-card: title, amber due-soon + red overdue chips, optional attachment, to-do/done toggle | **MATCHES** | `AssignmentCard.tsx`: `getUrgency` L44-52 (overdue `<now`, dueSoon `<48h`); `DueChip` amber `#f59e0b` / danger `#f87171` chips L92-124; attachment badge L318; real checkbox toggle L307-314. Thresholds per D-3 adoption contract. |
| Organizer sees create/edit FORM; non-organizer does not (or disabled); posts via spine + list updates | **MATCHES (minor carry)** | `AssignmentForm.tsx` create/edit; gated by `isOrganizer` (`AssignmentsPanel.tsx:96-97`, L256). See MINOR below re owner-only client gate. |
| Per-member toggle reflects MY status; due-sort; empty state; deleted hidden | **MATCHES** | Empty state L312-356; `handleStatusChange` L131; deleted hidden server-side. |

## Spec a5f25f9b — tests

| AC | Verdict | Evidence |
|---|---|---|
| CRUD + organizer-authz 403 gates + due-sort + one-per-member UNIQUE + soft-delete + non-member 403 | **MATCHES** | `assignments.service.spec.ts`: create/list/get/update/delete, 403 negatives (L217,340,428,583,625), due-sort L303, upsert L477, soft-delete L408+439, non-member L340. |
| Per-member status isolation (A ≠ B) | **MATCHES** | Service spec L497. |
| Attachment ≤10MB allowed; >10MB/disallowed rejected (server-validated) | **MATCHES** | L267 (413), L635 (bad type), H1 cross-server-key L659-740, H2 NoSuchKey→400 L753-784. |

Plus controller specs (validation/403 propagation) + web `getUrgency`/chip/toggle/panel tests. E2E journey (organizer posts → member sees → marks done) per spec acceptance sketch.

---

## Drift checks

- **Reminder deferral** — COHERENT spine-first split. This wave = post/view/mark-done spine; later M5 bundle = reminders (cron + Resend). M5 `## Success metric` ("post → see → mark done → get reminder before due") stays reachable across bundles; reminder is the only deferred clause. Not drift. Confirmed OUT in spec prose + test spec ("Reminder/Resend OUT OF SCOPE for this bundle").
- **REFRAMES** — implementation choices, not scope drift. (1) organizer = `can(userId,serverId,'manage_channels')` not a static educator-role (service L61) — reuses M2 RBAC, single call site per G3; documented future swap to `manage_assignments`. (2) attachment = net-new `assignment_attachments` table (the messaging attachments table is message-coupled) — matches spec's explicit `data` contract option. Both ratified in spec premises_rule1.
- **Scope creep** — NONE. grading/rubrics/submissions/peer-review/calendar/recurring all absent; correctly milestone-OUT.
- **M5 not claimed complete** — CORRECT. Bundle 1 of a multi-wave milestone; reminders + further academic tooling remain. No milestone-close in this wave.

## MINOR (non-blocking, no source conflict)

- `AssignmentsPanel.tsx:92-97` — client-side `isOrganizer` is **owner-only** (`myUserId === ownerId`); a non-owner member holding `manage_channels` will not see the create form client-side though the **server authorizes them** (service `can()` accepts manage_channels). The AC permits "or it's disabled" and server is the enforcement boundary, so this MATCHES the AC; flagged as a UX-completeness gap (documented in-code L92-95 as a conscious conservative default pending a `/me/roles` endpoint). Candidate follow-on, not a V-block reject.

**No DRIFTS against any named source. APPROVE.**
