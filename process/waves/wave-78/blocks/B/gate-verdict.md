# Wave 78 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-wave78-b6-attempt1)
**Reviewed against:** process/waves/wave-78/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both spec blocks are implemented exactly to contract, verified against the real diff (not the deliverable summaries) at branch HEAD c5786ed.

**Block 1 (academicRole clearable, 4be3b084).** The WRITE contract is the only schema touched: `UpdateProfileSchema.academicRole` becomes `z.preprocess(''→null, z.enum(ACADEMIC_ROLES).nullable().optional())` — read schemas (ProfileResponseSchema/PublicProfileSchema) untouched, as the spec mandates. `users.service.ts` correctly distinguishes the three states: the gate `if (fields.academicRole !== undefined)` is preserved so absent→filtered-out (leave unchanged), while the param type and patch-column type are widened to `AcademicRole | null | undefined` / `string | null` so an explicit `null` writes SQL NULL (this closes the exact karen P-4 gap — the old `string` column type could not carry null). The editor (`ProfilePage.tsx`) now sends `academicRole: academicRole === '' ? null : academicRole` unconditionally on the academic-save (was `...(academicRole ? {academicRole} : {})`, which silently omitted and made the empty option a dead no-op). The integration spec (`profile-academic-role-clear.integration.spec.ts`) is real — pg-harness against real Postgres with a separate harness connection proving committed cross-connection visibility — and covers all four cases: null→SQL NULL + round-trip via findById, undefined→unchanged (the anti-clobber case), string persists, and idempotent clear-from-null.

**Block 2 (card hidden-vs-error, 3b3530d8) — LOAD-BEARING anti-oracle: PRESERVED.** The 404→hidden path is byte-identical: the diff shows the hidden-state JSX body is untouched entirely; the only edits near it are a removed comment and the addition of an `error` branch to the aria-label ternary (the `hidden`→'Profile Unavailable' label is unchanged). Branching is purely client-side on `err instanceof HttpError && err.status === 404` → hidden (no retry); everything else — network TypeError throw, timeout, and 5xx HttpError — falls to the new retryable `error` state. A 5xx is correctly classified transport, never hidden. No new server field and no server why-signal are introduced. Tests run through the REAL parent `MemberListPanel` (BUILD rule 12, confirmed via the `openCard`/`render(<MemberListPanel/>)` helper) and assert the anti-oracle guard (404→no retry button + no "couldn't load" copy), transport→retryable with button, 5xx→retryable, retry-refetches-then-renders, and repeated-404-after-retry→byte-identical hidden.

**Cross-cutting.** Repo-wide `turbo run typecheck` 4/4 clean (B-4, no B-1↔B-2↔B-3 drift — the widened types line up end to end). Biome CI-identical lint clean after the B-3 re-entry that scoped a `biome-ignore` on the intentional `attempt`-in-deps retry trigger (mirrors the file's existing useLayoutEffect suppression idiom — I re-ran biome on the three core files, 0 findings). BUILD rule 14 (portal to body) preserved — `createPortal` unchanged; rule 13 (opaque userId) preserved. No schema change (users.academic_role already nullable text). No silent deviation from plan or P-4 findings; both P-4 notes (write-path lands in users.service.ts, not a profile.service; T-9 to add the 5th card state to the journey map) are respected — the second is a T-block obligation, correctly carried forward, not a B-block gap.

**Commit discipline (multi-spec, Action 6 preview).** Every source commit cites exactly one task_id and touches only that spec block's files: 4be3b084 → 43465db (contract) + a7fa31d (backend) + 0f11579 (editor); 3b3530d8 → 890658e (card) + ecf6560 (lint fix). No source commit crosses spec blocks. Both task_ids have source commits. Docs commits cite both task_ids but touch only `process/waves/` (no source overlap) — permitted.

The only item worth flagging (non-blocking): the API integration spec is `describe.skipIf(!DATABASE_URL_TEST)` and runs green in CI on postgres:16, not locally — the null round-trip is proven-in-CI, matching the established project pattern for every integration spec (no local pg server). B-5 documents this correctly. Not a gate failure; the C-block CI run is the enforcement point.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
