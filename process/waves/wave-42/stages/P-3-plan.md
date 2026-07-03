# Wave 42 — P-3 Plan

## Approach section

### Architecture deltas
- **assignments module (apps/api/src/assignments):** adds a NEW submission sub-surface. Today the module owns assignment CRUD + a private `assignment_status` todo/done toggle + organizer attachments. This wave adds `assignment_submissions` (student-authored, educator-visible) + 4 endpoints (submit, member-presign, roster, return). No new module; extends `AssignmentsService` + `AssignmentsController`.
  - **Approach:** attachment stored as **on-row nullable columns** on `assignment_submissions` (object_key/filename/content_type/size_bytes), single optional attachment per submission. **Alt considered:** a separate `assignment_submission_attachments` join table (mirrors `assignment_attachments`). **Why on-row wins:** the AC is exactly one optional attachment per submission — a join table adds a second write + a JOIN for zero multiplicity gain; on-row keeps the upsert atomic. Trade-off accepted: if multi-file submissions are ever needed, a later migration promotes to a join table (not this slice).
  - **Approach:** `returned_at` + `organizer_comment` authored nullable in the initial CREATE (single migration for the whole wave). **Alt:** seed creates the table, return-sibling ALTERs it. **Why single-migration wins:** avoids a same-wave same-table ALTER ordering hazard (problem-framer #2); the return sibling is pure service/UI over pre-existing columns.
  - **Failure-domain:** adds a member-gated presign call site (new permission boundary — assertMember, not assertOrganizer). server_id derived from the assignment row on every route (IDOR-safe). No transaction-scope expansion (each endpoint is a single upsert/update).

- **web assignments surface (apps/web/src/shell):** AssignmentCard/Form gain a student submit control + returned-state display; a NEW educator submissions roster (gated on manage_assignments) surfaces from the assignments panel/card with per-row return action. D-block designs the roster/return surface (design_gap_flag=true).

### Data model
- **NEW `assignment_submissions`** (migration, generated + committed):
  - `id` uuid pk; `assignment_id` uuid NOT NULL FK->assignments(id) ON DELETE CASCADE; `user_id` text NOT NULL;
  - `text` text NULL; `object_key`/`filename`/`content_type` text NULL; `size_bytes` integer NULL;
  - `submitted_at` timestamptz NOT NULL default now(); `returned_at` timestamptz NULL; `organizer_comment` text NULL;
  - `created_at`/`updated_at` timestamptz default now();
  - **UNIQUE(assignment_id, user_id)** (idempotent upsert key); **INDEX(assignment_id)** (roster fetch).
  - Migration: offline, no backfill (new table). **ONE migration file this wave.**

### API contracts (concrete)
1. `POST /assignments/:id/submit` — authed member (assertMember, serverId from assignment row); req `SubmitAssignmentSchema {text|null, attachment?{key,filename,contentType}|null}`; res 200 `AssignmentSubmission`; 400 empty; 403 non-member; 404 unknown/deleted. Idempotent upsert on (assignment_id,user_id); resubmit clears returned_at+organizer_comment.
2. `POST /servers/:serverId/assignments/submissions/presign` — authed member (assertMember); res 200 `{uploadUrl,key}`; 403 non-member. Declared BEFORE `/assignments/:id`.
3. `GET /assignments/:id/submissions` — organizer (assertOrganizer, serverId from row); res 200 `{submissions:[roster rows]}` submitted_at DESC; 403 non-organizer; 404 unknown.
4. `POST /assignments/:id/submissions/:submissionId/return` — organizer (assertOrganizer); req `ReturnSubmissionSchema {comment|null}`; res 200 `AssignmentSubmission`; 403; 404 (unknown or submission-not-under-assignment).
5. `GET /assignments/:id` — existing; DTO += `mySubmission` for authed member.

### New deps
None. Reuses `FilesService.presignAttachmentUpload`, `validateAndHeadAttachment`, RBAC `can()`, Drizzle, existing attachment URL resolver.

### SDK pre-build checklist
N/A — no new external SDK.

## Plan section

### File-level steps (grouped by B-stage)

**B-1 Schema (migration)** — serial, first:
- `apps/api/src/db/schema/assignments.ts` — CREATE add `assignment_submissions` table def (incl. returned_at/organizer_comment nullable). *sql-pro* (schema) then generate migration.
- `apps/api/drizzle/migrations/00NN_*.sql` — generated + committed (drizzle-kit generate). *sql-pro*.

**B-2 Contracts (Zod/shared)** — after schema, before backend:
- `packages/shared/src/assignments.ts` — add AssignmentSubmissionSchema, SubmitAssignmentSchema (refine text-or-attachment), AssignmentSubmissionPresignResponseSchema, AssignmentSubmissionsListResponseSchema (roster row + submitter), ReturnSubmissionSchema; AssignmentSchema += mySubmission. *typescript-pro*.

**B-3 Backend (service + controller)** — after contracts; the 3 spec blocks share the service, so serialize within the file:
- `apps/api/src/assignments/assignments.service.ts` — add: submitAssignment (upsert + resubmit-clears-return + validateAndHeadAttachment), presignSubmissionAttachment (assertMember), listSubmissions (assertOrganizer + submitter/URL resolve), returnSubmission (assertOrganizer + submission-belongs-to-assignment guard); rowToDto extended for mySubmission. *node-specialist*.
- `apps/api/src/assignments/assignments.controller.ts` — 4 new routes (member-presign declared before `/assignments/:id`); Zod parse; serverId derived. *node-specialist*.

**B-4 Frontend** — after contracts (can parallelize with B-3 once shared types land):
- `apps/web/src/auth/api.ts` — submitAssignment / presignSubmissionAttachment / listSubmissions / returnSubmission client fns. *react-specialist*.
- `apps/web/src/shell/AssignmentCard.tsx` — student submit control + own returned-state display. *react-specialist*.
- `apps/web/src/shell/AssignmentForm.tsx` — submit affordance (if applicable). *react-specialist*.
- `apps/web/src/shell/AssignmentsPanel.tsx` (+ NEW submissions-roster component) — educator roster + return-with-comment control, gated on manage_assignments. *react-specialist* (against D-block adopted mockup).

**B-5 Wiring/verify:**
- route registration (controller already in AssignmentsModule — verify), typecheck fixers, `pnpm lint` (biome) + web/api typecheck. *node-specialist* / *react-specialist*.

### Specialist routing (validated vs AGENTS.md)
- sql-pro (schema/migration) ✓ · typescript-pro (Zod) ✓ · node-specialist (NestJS service/controller) ✓ · react-specialist (web) ✓ · (B-6 code-reviewer + T-block testers per their blocks). All in AGENTS.md.

### Parallelization map
- B-1 → B-2 strictly serial (backend + web both depend on shared types).
- B-3 (service→controller serial within backend) ∥ B-4 (web) can run in parallel AFTER B-2 lands, since web codes against the shared Zod types + the adopted D-block mockup.
- Within B-4: api.ts client fns first (serial), then AssignmentCard / roster component in parallel.

### Self-consistency sweep
1. Every P-2 AC maps to a step: submission upsert+DTO (B-1/B-2/B-3 service + AssignmentCard), member-presign (B-3 presign route + api.ts), roster (B-3 listSubmissions + roster component), return (B-3 returnSubmission + roster control), no-grade (schema/DTO/UI omit score) ✓.
2. Every step has a specialist ✓.
3. No file in multiple parallel batches ✓ (service/controller serial; web files partitioned).
4. design_gap_flag=true referenced → D-block runs before B-4 roster UI ✓.
5. Architecture deltas have alternative trade-offs (on-row vs join table; single vs two migration) ✓.
6. Contracts concrete, no TBD ✓.
7. No new deps ✓.
8. SDK checklist N/A ✓.

**Sweep clean.**
