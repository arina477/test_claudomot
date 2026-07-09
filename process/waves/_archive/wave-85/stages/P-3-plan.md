# Wave 85 — P-3 Plan

## Approach

### Architecture deltas
- **apps/web/src/shell/AssignmentCard.tsx — `handleToggle` only.** Change:
  - Capture `const prev = assignment.myStatus;` at the top of the handler (BEFORE the optimistic `onStatusChange(assignment.id, newState)`).
  - In the `catch`, replace `onStatusChange(assignment.id, newState === 'done' ? 'todo' : 'done')` with `onStatusChange(assignment.id, prev)` — restore the captured snapshot.
  - In the `catch`, add `announce("Couldn't update assignment. Please try again.")` (the `announce = onAnnounce ?? noop` channel already in scope, used by the submit/upload error paths) — replacing the console-only surface (keep `console.error` for debug, optional).
  - Add `assignment.myStatus` (or `prev`) is captured per-invocation → the `useCallback` dep array must include what it reads (`assignment.myStatus` via `assignment` is already effectively current since `assignment` is a prop; ensure the callback closes over the right value — if the dep array is `[assignment.id, onStatusChange]`, capturing `assignment.myStatus` at call time is fine because it's read at invocation from the current render's `assignment`; verify no stale-closure).
  - **Alternative considered:** functional/parent-driven revert (like the other 8 optimistic sites use). REJECTED for this wave — those sites revert via their own patterns; AssignmentCard's `onStatusChange(id, status)` is the established API here, so capturing + restoring the prior value through it is the minimal, consistent fix. (The app-wide harmonization is the spun-out task 3b878f96.)
- **Failure-domain:** none — client-only, single handler, no contract/API/state-shape change.

### Data model / API contracts / deps
None. No endpoint/type/schema change. api.setAssignmentStatus unchanged. No new deps. No design (reuse onAnnounce).

## Plan

### File-level steps
**B-3 Frontend (no B-1 contracts, no B-2 backend, no schema):**
- `apps/web/src/shell/AssignmentCard.tsx` — modify `handleToggle`: snapshot prior status + restore-on-error + onAnnounce failure message. **Specialist: react-specialist.**
- `apps/web/src/shell/AssignmentCard.test.tsx` (create, or extend the nearest existing shell test) — assert: (a) success toggle leaves state flipped; (b) FAILED toggle (mock api.setAssignmentStatus reject) restores the PRIOR status (not opposite) — test with prior='done' toggling and failing, assert it returns to 'done' after a rapid re-render, AND a scenario proving the assume-opposite bug would have failed; (c) onAnnounce is called once with the failure message on error. Test through the component's real callback wiring (BUILD-12: test success/failure through the real caller, not an isolated prop). **Specialist: react-specialist.**

### Specialist routing (validated vs AGENTS.md)
- **react-specialist** — React component + optimistic-update + testing. Exists in AGENTS.md.

### Parallelization map
- Single file + its test; serial (test after fix). No parallelism.

### Self-consistency sweep
1. All 5 ACs → steps: AC1 (success unchanged) + AC2 (snapshot restore) + AC3 (onAnnounce) + AC4 (announce once) → handleToggle edit; AC5 (no new component) → reuse onAnnounce. Tests cover AC1/2/3/4. ✓
2. Every step has a specialist (react-specialist). ✓
3. No file in multiple batches. ✓
4. design_gap_flag false referenced. ✓
5. Architecture delta has alternative (functional-revert rejected w/ reason). ✓
6. No contracts/deps (none). ✓
8. No SDK. ✓
Sweep clean.
