# Wave 85 — P-4 Verdict

## Phase 1 — head-product: APPROVED
Premise re-verified in source (assume-opposite revert :660, console-only :659, onAnnounce :650, status binary). Framing correct-by-construction; "Low" honest; spin-out right; 5 ACs falsifiable; floor-waive legit (PRODUCT-5). Watch items: stale-closure + test-honesty (folded to spec).

## Phase 2 — Karen + jenny + Gemini: APPROVED (gate passes, with 2 corrections folded)
- **karen: APPROVE** — 7/8 claims VERIFIED file:line (defect real :660; onAnnounce error-surface :650/:264/:222; status binary shared:41; single-site confirmed vs MemberListPanel/StudyTimerWidget; stale-closure deps :663; spin-out 3b878f96 filed; single-file). 1 WRONG (non-blocking): a test suite ALREADY exists (assignments.test.tsx:312, currently asserts the buggy behavior) → B-3 must UPDATE it, not create new. Folded.
- **jenny: APPROVE** (with head-product ratification) — no drift; NAMED GAP: onAnnounce is sr-only (AssignmentsPanel renders it into sr-only aria-live), so it does NOT satisfy "user-facing error" for sighted users; the app convention + DESIGN-SYSTEM.md:106 want a VISIBLE toast. RATIFIED: this wave delivers a visible error toast (ceo-reviewer's explicit in-scope addition) + onAnnounce for a11y; the shared cross-site utility stays spun out to 3b878f96. AC3 corrected in spec.
- **Gemini: UNAVAILABLE** (429). Degrades; does not block.
- **head-product ratification (orchestrator, on-record):** the AC3 scope is a VISIBLE toast + a11y announce for THIS card; the app-wide shared-toast harmonization is the spun-out task. Both Phase-2 corrections folded into the spec.

## Footer
- verdict_complete: true
- gate_result: APPROVED (spec corrected: AC3 visible-toast + update-existing-test)
