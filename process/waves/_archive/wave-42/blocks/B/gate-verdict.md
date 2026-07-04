# Wave 42 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-b6-w42)
**Reviewed against:** process/waves/wave-42/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
REWORK

## Rationale
Three of the four backend surfaces are airtight and one cross-layer contract is broken. Authz is genuinely IDOR-safe on every :id route — submitAssignment, listSubmissions, and returnSubmission all fetch the assignment row and derive server_id from it before assertMember/assertOrganizer, never trusting a client param. The member-gated presign reuses the shipped anti-spoof validateAndHeadAttachment with the same server-scoped key regex (attachments/<serverId>/…), so a submitted attachment cannot be spoofed or cross-server key-swapped. The idempotent upsert on UNIQUE(assignment_id,user_id) is correct and genuinely clears returned_at + organizer_comment on resubmit (a returned-then-resubmitted submission becomes not-returned). returnSubmission fetches the submission by PK and guards subRow.assignment_id === path assignmentId (400 on cross-assignment), so no cross-assignment return is possible. No grade/score/points/rubric field exists anywhere in schema, DTO, service, or UI. Commit discipline is clean: three per-task backend feature commits (3e154ac db8e082a, 7010660 1746f72a, cbc2c16 b859984b) plus one frontend commit — the shared-UI exception is acceptable because AssignmentCard/AssignmentsPanel/SubmissionsRoster are one shared surface that cannot split cleanly per task. **However, the educator return action (task b859984b) is broken end-to-end by a contract mismatch between B-1/B-2 and B-3.** The backend route is `POST /assignments/:id/submissions/:submissionId/return` and the service resolves `WHERE assignment_submissions.id = submissionId` (the submission row's UUID PK — correct per the spec's authoritative api + data contract). But the roster response DTO (AssignmentSubmissionRosterRow / AssignmentSubmissionSchema) never carries the submission's `id`, and the frontend sends `row.submitter.userId` into that slot (SubmissionsRoster.tsx:503 → api.ts returnSubmission → `/submissions/${submissionUserId}/return`). So every return request resolves `WHERE id = <text userId>`, which cannot match a uuid PK → 404 "Submission not found" (or a 22P02→400 on uuid cast). AC "An organizer can mark a submission returned … 200 with the updated submission" and the roster returned/not-returned display both fail in practice. B-5's green suite (unit 354 + typecheck + build) cannot catch this: both sides type the path segment as `string`, so it is a wire-shape mismatch invisible to the compiler and to single-layer unit tests. This is load-bearing contract drift, not accepted-debt — REWORK.

## Rework instructions  (only if REWORK)

### Stages requiring rework
- B-1: add submission PK `id` to the submission DTO contract
- B-2: emit `id` from submissionRowToDto so the roster response carries it
- B-3: roster passes the submission `id` (not submitter.userId) to the return call

### Per stage

#### B-1 (contracts)
- **What's wrong:** `AssignmentSubmissionSchema` (packages/shared/src/assignments.ts:12) exposes userId/assignmentId/text/attachment/submittedAt/returnedAt/organizerComment but NOT the submission row's PK `id`. The educator return path is keyed on the submission PK, so the client has no field to send it. Stale route comments compound the confusion: line 119 says `POST /assignments/:id/submissions` (actual: `/submit`) and line 176 says `:userId/return` (actual + correct: `:submissionId/return`).
- **Heuristic fired:** contract drift between B-1 and B-3 — the return-target identifier the backend requires (submission PK) is absent from the shared schema the frontend derives from.
- **What "good" looks like:** `AssignmentSubmissionSchema` gains `id: z.string()` (the submission row PK) as its first field. The roster row and mySubmission both then carry it automatically (roster extends the base schema; mySubmission is the base schema). The two stale comments are corrected to the real routes (`/submit`, `:submissionId/return`).
- **Re-do instructions:** node-specialist (or typescript-pro) — (1) add `id: z.string()` to `AssignmentSubmissionSchema` in packages/shared/src/assignments.ts; (2) fix the two stale route comments; (3) rebuild the shared package so the new field is visible to both apps.

#### B-2 (backend)
- **What's wrong:** `submissionRowToDto` (assignments.service.ts:277-285) omits `id` from the returned object; the DB row already selects it (`.select()` full row), so it is available — just not mapped out. Without it the roster and mySubmission responses cannot carry the PK the return route needs.
- **Heuristic fired:** contract drift — service response shape does not surface the key its sibling write-route consumes.
- **What "good" looks like:** `submissionRowToDto` returns `id: row.id` as the first field, matching the updated `AssignmentSubmissionSchema`. `listSubmissions` roster rows and `getAssignment` mySubmission then both include the submission PK. No route/authz logic changes — returnSubmission already correctly filters on `assignment_submissions.id`.
- **Re-do instructions:** node-specialist — add `id: row.id` to the `submissionRowToDto` return object; confirm the `row` param type includes `id: string` (it already does via full-row select). api typecheck + the roster/mySubmission response shape now match the shared schema.

#### B-3 (frontend)
- **What's wrong:** SubmissionsRoster.tsx:503 passes `submissionUserId={row.submitter.userId}` and api.ts `returnSubmission` interpolates that into `/submissions/${submissionUserId}/return`. The backend expects the submission PK there, not a user id. The prop/variable name `submissionUserId` itself encodes the wrong mental model.
- **Heuristic fired:** contract drift between B-3 and the B-2 route contract — frontend sends the wrong identifier into a path segment.
- **What "good" looks like:** the roster passes `row.id` (the submission PK, newly present on the DTO) as the return target. Rename the prop/param from `submissionUserId` to `submissionId` for clarity. The `onReturned(row.submitter.userId, …)` callback that keys local roster state by submitter userId can stay as-is (that is a legitimate client-side keying choice, distinct from the wire identifier).
- **Re-do instructions:** frontend-developer (or react-specialist) — (1) rename api.ts `returnSubmission` param `submissionUserId` → `submissionId`; (2) in SubmissionsRoster.tsx pass `submissionId={row.id}` and thread `row.id` through the return handler; (3) keep the local-state keying on submitter.userId if that is how the roster de-dupes rows. Add/adjust the roster unit test to assert the return call is invoked with `row.id`, not `row.submitter.userId` (this is the assertion that would have caught the drift).

### Cascade

B-block cascade rules (apply where the rework stage is the trigger):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-1 contracts | B-2 (backend uses contracts), B-3 (frontend uses contracts), B-4, B-5 |

- **Stages that must re-run after the above:** B-4 (repo-wide typecheck + route registration — always repo-wide) and B-5 (full suite: lint, typecheck, unit, build, smoke). B-0 is NOT re-run — no schema/migration change (the submission PK already exists on the row; only DTO mapping + client call site change).
- **Stages that stay untouched:** B-0 (schema + migration 0019 unchanged — `id` column already exists).

## Escalation  (only if ESCALATE)
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 42 — B-6 Verdict — Attempt 2

**Reviewer:** head-builder (fresh spawn, ATTEMPT 2 re-gate)
**Reviewed against:** process/waves/wave-42/blocks/B/review-artifacts.md + Attempt-1 REWORK instructions
**Attempt:** 2  (post-rework re-gate of the single cross-layer return bug)

## Verdict
APPROVED

## Rationale
The attempt-1 REWORK — the educator return route 404'ing because the submission PK never flowed to the client — is resolved end-to-end, verified at real file/line across all four layers, not on assertion. Shared: `AssignmentSubmissionSchema` (packages/shared/src/assignments.ts) now carries `id: z.string()` as its first field, which propagates into both `mySubmission` (base schema) and `AssignmentSubmissionRosterRowSchema` (via `.extend`). Backend: `submissionRowToDto` (assignments.service.ts:279) emits `id: row.id`, and all four submission-emitting call sites route through it — submit (689), mySubmission (229), roster (733, spread as `{...dto, submitter}` so `dto.id` is preserved), and return (799) — so the PK is uniformly present. Frontend: `RosterRow` now passes `submissionId={row.id}` (was `row.submitter.userId`), the `ReturnDialog` prop/param renamed `submissionUserId`→`submissionId`, and `api.returnSubmission` (apps/web/src/auth/api.ts:509) interpolates it into `/assignments/${assignmentId}/submissions/${submissionId}/return`. Controller `@Param('submissionId')` (assignments.controller.ts:280) threads it to `service.returnSubmission(id, submissionId, ...)`, which resolves `WHERE assignment_submissions.id = submissionId` — a real UUID PK match, not the prior text-userId 404. The bug is gone. All attempt-1-confirmed invariants remain intact and unchanged by the fix: IDOR-safe server_id derived from the assignment row before assertMember/assertOrganizer on all four routes; idempotent UPSERT on (assignment_id,user_id) that clears returned_at+organizer_comment on both INSERT and onConflict paths; member-gated presign reusing the anti-spoof validateAndHeadAttachment (server-scoped key + server-derived head); cross-assignment return guard (400 when subRow.assignment_id !== path id); route-shadow ordering (submissions/presign declared before :id); and zero grade/score/points/rubric anywhere (only doc-comments noting the absence). Re-verification runnable in this gate: repo typecheck 4/4 clean (FULL TURBO — the changed wire shape compiles across all three packages); web unit suite 354/354 passing (includes the roster test now keyed on row.id); biome lint exit 0 (7 warnings, 0 errors). The api 551-test suite is DB-bound (first leg connects to Postgres on :5433) and could NOT be re-executed here — the gate sandbox has Postgres client tools only, no server binaries, and no non-privileged path to boot a cluster (rule 19). This is an environment limitation, not a code signal: the fix is a pure field-mapping addition (`id: row.id`) that typechecks against the full-row select type and touches no route/authz/query logic, so api-suite regression risk is structurally bounded to near-zero, and B-5 documented the 551 pass in an environment with the test DB up. Commit discipline: the three per-task backend feature commits (3e154ac / 7010660 / cbc2c16) + the shared-UI frontend commit remain the base; the two B-6 fix-up commits (810cca1 DTO+schema, 48be6a2 roster-by-id) land the cross-layer repair as two commits rather than per-task — acceptable, because this is one atomic wire-shape contract-drift fix spanning three layers that would only be fragmented by splitting per task (same shared-surface exception applied at attempt-1). Contract locked, every door still guarded, no grading, no scale gold-plating. Ship to C.

## Rework instructions  (only if REWORK)
n/a — APPROVED

## Escalation  (only if ESCALATE)
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1
- api_suite_reverified: false  (DB-bound; no Postgres server in gate sandbox — taken on B-5 evidence; fix is DB-independent field-mapping, typecheck-confirmed)
- runnable_checks_reverified: typecheck 4/4, web-unit 354/354, lint exit-0
- head_signoff: APPROVED
