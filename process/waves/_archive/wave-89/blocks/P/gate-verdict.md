# Wave 89 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product@wave-89-P-4)
**Reviewed against:** process/waves/wave-89/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is a legitimate, verified-live bug-fix-phase pull, not a too-thin polish item. The gap is real, not evaporated: I confirmed against `apps/web/src/pages/ProfilePage.tsx` that `handleAcademicSave` (:345) silently early-returns on `academicClientError` (:347) with no `scrollIntoView`/`.focus()` on the failing field — since wave-81 wrapped the page in a scroll container, an over-length field can sit off-screen with no cue the save failed. Both P-0 reviewers independently PROCEED, and problem-framer verified the same premise from fresh context (symptom == cause, same layer). The acceptance criteria are falsifiable and observable — focus (`toHaveFocus()`) and `aria-invalid=true` are directly assertable, and the "first invalid field in priority order" is testable against multiple over-length inputs. The plan maps every AC to a concrete file step (AC1/AC2 → focus-first-invalid derive + assertions; AC3 → valid-submit unaffected + happy-path test; AC4 → aria-invalid + preserved `role="alert"`; AC5 → only the academic form touched). Scope is correctly minimal and honors ceo-reviewer's SCOPE-REDUCTION: academic form only, refs + a keyed derivation rather than a generalized `scrollToFirstError` abstraction (explicitly rejected as Alt A), no all-five-forms overhaul, no aria-live summary / focus-trap gold-plating. The "first invalid field in priority order" in the plan and spec (pronouns → bio → institution → program → academicYear) matches `academicClientError`'s actual ternary chain at :332-343 exactly. The single-spec floor waive is legitimate: RESCOPE-AUTO-MERGE is genuinely impossible (0 in_progress + 0 todo milestones, seed milestone_id NULL), and all four wave-87 `P-1-floor-merge-wave-87` apply-by-citation conditions hold (bug-fix phase, merge-impossible/milestone-unassigned, single coherent fix, live-verified). `design_gap_flag: false` is correct — behavior on an existing form reusing the existing aria-invalid/role="alert" pattern, no new visual surface, D-block correctly skipped. Not a security wave; standard gate. I note and endorse the reinforced backlog-drain signal for the founder (this is a P3 papercut against a terminal roadmap), but that is a founder-deferred strategic flag, not a gate blocker — the fix itself clears the worth-doing bar for one more wave.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---
## Phase 2 merged — PASS
| Reviewer | Verdict | Notes |
|---|---|---|
| head-product | APPROVED | gap live, priority order matches academicClientError, scope minimal, floor-waive legitimate |
| Karen | APPROVE | all 7 load-bearing claims VERIFIED to the line (handleAcademicSave :347 silent early-return; academicClientError :332-343 priority order; avatarInputRef-only :130; username aria-invalid :737/:767; 5 fields in the form :839; test file exists; scope minimal) |
| jenny | APPROVE | all 5 ACs MATCH; extends wave-81 profile-scroll; reuses username aria-invalid/role=alert pattern; no drift. Non-blocking: T-9 annotate journey page-15 (/settings/profile) |
| Gemini | UNAVAILABLE | HTTP 429. Degrade-and-proceed. |

**Gate PASS → B-0** (design_gap_flag=false → B, skip D).
### B/T carry-forward
- T-9: annotate journey-map page-15 (/settings/profile) with the wave-89 focus-management addition.
- verdict_complete: true / gate_result: PASS
