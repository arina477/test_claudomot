# Wave 42 — B-6 Review

## Phase 1 — head-builder
- Attempt 1: REWORK — cross-layer contract bug (return route resolves on submission PK, but roster DTO didn't expose `id`; frontend sent submitter.userId → return 404s). Everything else airtight.
  Fix: shared AssignmentSubmissionSchema += id (node-specialist); submissionRowToDto emits id (all 3 call sites); roster passes row.id + renamed submissionUserId→submissionId (react-specialist). Re-ran B-4+B-5 clean.
- Attempt 2: **APPROVED** — id flows shared→DTO→frontend; return sends submission PK; all invariants intact (IDOR-safe, idempotent resubmit-clears-return, member anti-spoof presign, cross-assignment guard, zero grading).

## Phase 2 — /review (code-reviewer on diff)
- Round 1: HAS-FINDINGS — **H1 (HIGH, data-loss):** listAssignments sent mySubmission=null (rowToDto includeSubmission default false) → student reload shows blank form → resubmit silently clears educator return + prior work. + 4 Low (L1 organizer sees own submit form; L2 N roster requests; L3 count-chip comment; L4 post-resubmit roster staleness).
  Fixes: H1 → listAssignments rowToDto(row,userId,true) (node-specialist); L1 → AssignmentCard isOrganizer prop, hide student submit for organizers; L3 → comment (react-specialist). L2 + L4 accepted-debt (no realtime this wave; future pagination).
- Round 2 (re-review): **CLEAN** — H1 FIXED (correct user-scoping, N+1 perf-only), L1 FIXED (students still see submit; organizers don't; biome-ignore reformat sound), no new findings. Out-of-scope non-blocking notes: soft-refetch pattern (pre-existing), `unretirned` comment typo.

## Action 6 — commit discipline (multi-spec)
- db8e082a: commits 3e154ac + id-contract fix + H1 fix. 1746f72a: 7010660 + L1/L3 fix. b859984b: cbc2c16 + roster-id fix. Every task_id has ≥1 citing commit.
- Frontend UI commit (b3249dd) spans the 3 tasks — the shared AssignmentCard/AssignmentsPanel surface cannot split cleanly; head-builder + code-reviewer both ratified this shared-surface exception. PASS-with-noted-exception.

```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 2
findings_critical: []
findings_high: []
findings_medium_accepted: []
findings_low_accepted: ["L2 N roster requests (future pagination)", "L4 post-resubmit roster staleness (no realtime this wave)"]
fix_up_commits: ["id-contract", "roster-id", "H1 mySubmission", "L1/L3 UI"]
final_verdict: APPROVE
```
