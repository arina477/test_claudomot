# V-1 Source-Claim Verification — wave-42 (assignment collect/return)

**Reviewer:** karen (V-1 source-claim verification)
**Scope:** Are the wave's load-bearing CLAIMS true in the merge-commit tree (07ebda95) + deployed state? (Spec conformance is jenny's lane — not evaluated here.)
**Merge commit:** 07ebda9 (PR #56 squash). Deployed api https://api-production-b93e.up.railway.app · web https://web-production-bce1a8.up.railway.app · bundle `index-BCqGLUBX.js`.

**VERDICT: APPROVE** — 8/8 load-bearing claims verified true; 0 contradictions; 2 disclosed deferrals confirmed genuinely disclosed (not hidden).

---

## Claim-by-claim

### CLAIM 1 — Migration 0019 exists + reflected in deployed DB — VERIFIED
- `07ebda95:apps/api/drizzle/migrations/0019_sturdy_psylocke.sql` exists. Creates `assignment_submissions` with `returned_at` + `organizer_comment` columns and `CONSTRAINT assignment_submissions_assignment_user UNIQUE("assignment_id","user_id")` (file lines 1–24). FKs to `assignments`(cascade) + `users`; index `assignment_submissions_assignment_id_idx`.
- Drizzle journal `meta/_journal.json` lists `"tag": "0019_sturdy_psylocke"` as the final entry — migration is registered, not orphaned.
- Applied to prod: `C-2-deploy-and-verify.md:5-13` documents `drizzle-kit migrate` against the public TCP proxy, `migrations applied successfully!` (exit 0), plus post-apply verification `to_regclass('public.assignment_submissions')` → table exists, constraint `_assignment_user` + 3 indexes confirmed on prod DB.
- Live corroboration: all 4 submission routes return **401** (guarded), never 500 — consistent with the table existing behind the auth gate. No missing-table symptom observed.

### CLAIM 2 — Backend service + controller with claimed methods — VERIFIED
`07ebda95:apps/api/src/assignments/assignments.service.ts`:
- `submitAssignment` (L609): idempotent UPSERT `onConflictDoUpdate` target `[assignment_submissions.assignment_id, assignment_submissions.user_id]` (L670-671); resubmit clears return — `returned_at: null` (L667/L680), comment noted "new submission supersedes prior return" (L679).
- `presignSubmissionAttachment` (L577): `assertMember` (L582).
- `listSubmissions` (L701): asserts organizer (L550 assertOrganizer path).
- `returnSubmission` (L37 in tail block): `assertOrganizer` (L51) + **cross-assignment guard** `if (subRow.assignment_id !== assignmentId) throw new BadRequestException('Submission does not belong to this assignment')` (L62-63).
- `submissionRowToDto` emits `id` (schema requires it; DTO maps row).
- `rowToDto` embeds `mySubmission` when `includeSubmission=true` (L215-242).

`07ebda95:apps/api/src/assignments/assignments.controller.ts`:
- 4 routes present: `@Post('assignments/:id/submit')` (L235), `@Post('servers/:serverId/assignments/submissions/presign')` (L137), `@Get('assignments/:id/submissions')` (L258), `@Post('assignments/:id/submissions/:submissionId/return')` (L275).
- Member-presign declared **before** `/assignments/:id` — presign at L137, `@Get('assignments/:id')` at L159. Comment L133-134 explicitly notes the ordering guards against `:id` shadowing. Correct.

### CLAIM 3 — Shared contract — VERIFIED
`07ebda95:packages/shared/src/assignments.ts`:
- `AssignmentSubmissionSchema` (L12) includes `id: z.string()` (L13, comment "needed by educator return route").
- `SubmitAssignmentSchema` (L124) with `.refine(... text non-empty OR attachment ...)` (L136).
- Presign / roster-row (`AssignmentSubmissionRosterRowSchema` L159) / `ReturnSubmissionSchema` (L181) present.
- `AssignmentSchema.mySubmission` (L43) — `AssignmentSubmissionSchema.nullable().optional()`.
- Exported from `index.ts` (L120/L134 `from './assignments.js'`).

### CLAIM 4 — Frontend — VERIFIED
All 4 files present in merge tree:
- `AssignmentCard.tsx`: `StudentSubmitForm` (L174), `OwnSubmissionCard` (L481), `isOrganizer` gate (L624/L637/L826 `!isOrganizer && …`).
- `SubmissionsRoster.tsx`: `ReturnDialog` (L74), `role="dialog"` + aria-modal + focus trap documented + implemented (header L18-24, dialog L61+, focus-on-open L94).
- `AssignmentsPanel.tsx`: `SubmissionsRoster` integrated (import L29, render L422) + `aria-live="polite"` (L205).
- `auth/api.ts`: `submitAssignment` (L462), `presignSubmissionAttachment` (L473), `listAssignmentSubmissions` (L501), `returnSubmission` (L509).

### CLAIM 5 — Routes LIVE (401 unauth, not 404) — VERIFIED
On deployed api:
- `POST /assignments/<uuid>/submit` → **401**
- `POST /servers/<uuid>/assignments/submissions/presign` → **401**
- `GET /assignments/<uuid>/submissions` → **401**
- `POST /assignments/<uuid>/submissions/<uuid>/return` → **401**
- `/health` → **200**
- Discriminator sanity: bogus path `/assignments/<uuid>/nonexistent-xyz` → **404**. Confirms the 401s are real guard hits on registered routes, not a catch-all — routing distinguishes registered-and-guarded from unknown.

### CLAIM 6 — Deploy hash match — VERIFIED
- Live web serves `index-BCqGLUBX.js` (matches claim; changed from prior deploy).
- Bundle contains submission UI strings: `Submissions` (x3), `Return` (x30), `mySubmission`, `organizerComment` — the roster + return + submission surface is in the shipped JS.
- api serves the 4 routes (Claim 5). Web + api both carry the wave-42 surface.

### CLAIM 7 — T-4 integration: 14 real cases, ran+passed in CI — VERIFIED (not decorative)
- `apps/api/test/integration/assignment-submissions.integration.spec.ts` exists (at HEAD 93e56d3 / T-block; correctly NOT in 07ebda95 merge tree — added later in T-block, consistent with T-4 "Pattern B" authored-post-B disclosure).
- **14** `it()` cases (grep count = 14).
- **Ran + passed for real:** CI run `28689560816` = `conclusion: success`; `test` job = success. Raw logs show green `✓` per case with real ms timings (submit happy path 147ms, idempotent resubmit 92ms, resubmit-clears-return 77ms, 400/403 authz cases, organizer-list, etc.). Not skipped, not decorative.
- The `describe.skipIf(SKIP)` (L116) + `it.skip('SKIPPED: DATABASE_URL_TEST not set…')` (L444) are the standard local-no-DB guard; in CI `DATABASE_URL_TEST` was set so the real 14 executed. This is a compensating fallback, not test-suppression.

### CLAIM 8 — Antipatterns / disclosed deferrals — VERIFIED (genuinely disclosed, not hidden)
- **Student submit-button UI E2E deferral:** disclosed as `T-5-F1 (LOW)` in `T-5-e2e.md:18` (single-account/organizer-everywhere fixture constraint, backend proven live+T-4), surfaced again in `T-9-journey.md:4` + `:19` coverage_gaps, tracked as **task c50f3040**. Prominent, layered, tracked.
- **Attachment-presign integration deferral:** disclosed as `T4-F1 (LOW)` in `T-4-integration.md:16` + `:27` (no S3 creds in CI test env; verified live at T-8). Compensating layer named.
- No claimed-but-fake, no decorative tests, no deferred-but-undocumented findings detected. The M8 return-notification push deferral is also documented (P-0-ceo-review, D-1 brief, D-3) — clean scope discipline.

---

## Findings summary
- **Contradictions found: 0**
- **Claims verified: 8/8**
- **Disclosed deferrals confirmed non-hidden: 2** (c50f3040 UI-E2E; presign integration)

No claimed-but-fake code, no decorative/skipped-passing-off-as-run tests, no hidden deferrals. Merge tree, shared contract, deployed artifacts, live route guarding, and CI test execution all corroborate the wave's load-bearing claims.

**VERDICT: APPROVE**
