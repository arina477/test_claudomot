# P-3 Plan — wave-59

## Approach
- **Architecture deltas:** NONE. Test-only wave; no service/module/state-machine/render-path change.
- **Data model:** none. **API contracts:** none. **New deps:** none (vitest already in stack).
- **Testability note (the one real decision):** `buildTypingLabel` is module-private in
  `apps/web/src/shell/useTyping.ts:65` (`function buildTypingLabel(...)`, no `export`). A true table-driven
  unit test needs it reachable. Approach: add the `export` keyword to `buildTypingLabel` (a 1-token
  visibility change — NO logic change, does not touch the 5 branches or the wave-45 `as Typer` casts).
  Alternative considered: test indirectly via the `useTyping` hook (render + dispatch typing events + assert
  `typingLabel`) — rejected as heavier, less isolated, and it wouldn't be the "transition table tested as a
  table" shape the seed calls for. Trade-off accepted: exporting a pure function purely for test is the
  standard, lowest-risk pattern and keeps the test a genuine unit test. (Spec "no production change" governs
  LOGIC; a visibility keyword is not a behavior change — problem-framer's "do NOT change the function" holds.)

## Plan (file-level steps)

### B-3 Frontend (executor: react-specialist)
1. `apps/web/src/shell/useTyping.ts` — **modify**: add `export` to `buildTypingLabel` (visibility only; no logic edit). Order: first (test imports it).
2. `apps/web/src/shell/useTyping.test.ts` — **create**: table-driven vitest test. A single `it()` iterating a
   table of `{ typers, expected }` covering all 5 buckets (0/1/2/3/4+), asserting the exact enumerated strings
   from the spec. Use real display-name strings (assert names appear verbatim in 1/2/3; constant for 4+).
   Follow `command-center/testing/test-writing-principles.md` + T-1/T-2 (behavior not implementation).
   Depends on step 1.

### Specialist routing (validated against AGENTS.md)
- **react-specialist** — B-3 executor for React/web (per AGENTS.md `frontend-developer` → stack replacement `react-specialist`). Both steps are one tightly-coupled unit; single specialist, serial (step 1 → step 2).

## Parallelization map
Serial chain: useTyping.ts (export) → useTyping.test.ts (create). No parallel batch (2 coupled files, 1 specialist).

## Self-consistency sweep
1. Every AC → a file-level step: all 5 bucket ACs + the table-driven AC map to step 2. ✓
2. Every step has a specialist (react-specialist). ✓
3. No file in multiple parallel batches. ✓
4. design_gap_flag referenced: false (test-only). ✓
5. Architecture deltas: none, trade-off named for the export-vs-hook decision. ✓
6. Data/API contracts: none (no TBD). ✓
7. New deps: none. ✓
8. SDK checklist: n/a. ✓
Sweep clean.
