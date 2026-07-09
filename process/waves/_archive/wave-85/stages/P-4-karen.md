# P-4 Phase-2 Claim Verification — wave-85 (karen)

**Wave:** Fix AssignmentCard optimistic toggle-revert (snapshot prior status + restore on error + onAnnounce failure message).
**Spec task:** `3ad35a42-efe5-4e9d-8f90-d22d6fe345e8`
**Plan:** `process/waves/wave-85/stages/P-3-plan.md`
**Verdict:** **APPROVE** — every load-bearing SPEC/PLAN claim is VERIFIED. One correction to the orchestrator's framing (claim 6) is noted as a **High-severity B-block watch item**, but it does NOT invalidate any spec/plan claim; it strengthens the fix.

---

## Per-claim results

### Claim 1 — The defect is real + exactly as described — **VERIFIED**
`apps/web/src/shell/AssignmentCard.tsx:652-664`, `handleToggle`:
```
652  const handleToggle = useCallback(
653    async (e: React.ChangeEvent<HTMLInputElement>) => {
654      const newState = e.currentTarget.checked ? 'done' : ('todo' as const);
655      onStatusChange(assignment.id, newState);
656      try {
657        await api.setAssignmentStatus(assignment.id, { state: newState });
658      } catch (err) {
659        console.error('[AssignmentCard] status toggle failed', err);
660        onStatusChange(assignment.id, newState === 'done' ? 'todo' : 'done');
661      }
662    },
663    [assignment.id, onStatusChange],
664  );
```
- Assume-opposite revert: line 660 `onStatusChange(assignment.id, newState === 'done' ? 'todo' : 'done')` — reconstructs prior by negating `newState`, not by restoring a captured snapshot. VERIFIED.
- Console-only surface, no onAnnounce on failure: line 659 `console.error(...)` is the sole failure output. No `announce(...)` in the catch. VERIFIED.

### Claim 2 — onAnnounce is a prop, `announce = onAnnounce ?? noop` in scope, already the error surface — **VERIFIED**
- Prop declared: `AssignmentCard.tsx:619` `onAnnounce?: (msg: string) => void;` (destructured at `:637`).
- In-scope noop wrapper: `AssignmentCard.tsx:650` `const announce = onAnnounce ?? (() => {});`.
- Already the established error-surface pattern (StudentSubmitForm, which receives `announce` as its `onAnnounce` at `:840`):
  - Submission failure: `:264` `onAnnounce('Submission failed. Please try again.');`
  - Upload failure: `:222` `onAnnounce('Attachment upload failed.');`
  - Also `:197`, `:201` (file-type / size rejections).
  Reusing this channel (not a new toast) is justified. VERIFIED.

### Claim 3 — Status is BINARY (`z.enum(['todo','done'])`) → "Low" honest — **VERIFIED**
`packages/shared/src/assignments.ts:41` `myStatus: z.enum(['todo', 'done']),` (Assignment). Also `AssignmentStatusSchema` `state: z.enum(['todo', 'done'])` at `:94`. Binary domain confirmed: assume-opposite yields the correct value on any single toggle and diverges only under a concurrent/rapid double-toggle race → "Low" impact rating is honest. VERIFIED.

### Claim 4 — Single-site claim; AssignmentCard is the UNIQUE assume-opposite offender — **VERIFIED (spot-checks confirm)**
Spot-checked two of the eight other optimistic sites:
- **MemberListPanel** `MemberListPanel.tsx:854-856` — `handleMutedChange` uses functional setState `setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, mutedUntil } : m)))`, applied after success (comment `:851-852` "applied immediately after a successful API call"). NOT assume-opposite.
- **StudyTimerWidget** `StudyTimerWidget.tsx:806-823` — `handleApplyConfig` applies `setTimer(t)` inside the `try` after the API resolves (`:807-810`); the `catch` sets an error flag, never a negated-value restore. Apply-after-success. NOT assume-opposite.
Both use distinct, safe patterns. Consistent with problem-framer's grep of all 9 sites. VERIFIED.

### Claim 5 — Stale-closure watch item is real (deps `[assignment.id, onStatusChange]`) — **VERIFIED**
`AssignmentCard.tsx:663` dep array is exactly `[assignment.id, onStatusChange]`. `assignment.myStatus` is NOT in the deps, so `const prev = assignment.myStatus` captured inside the callback is only current if the callback re-creates when `assignment` changes — which it will not on a `myStatus`-only change under these deps. The B-block MUST capture the value that reflects click-time status (add `assignment.myStatus`/`assignment` to deps, or read from the parent-owned source). Real, load-bearing watch item. VERIFIED. Mirrors spec `p4-watch-items[STALE-CLOSURE]`.

### Claim 6 — "No existing AssignmentCard test" — **WRONG (correction; does not block APPROVE)**
An AssignmentCard test suite ALREADY exists: `apps/web/src/shell/assignments.test.tsx`.
- It imports and renders `AssignmentCard` (`:16-17`), describes `AssignmentCard per-member toggle` (`:261`), and — critically — **already contains a revert test** at `:312` `it('reverts optimistic update if PUT fails', ...)` which asserts the CURRENT buggy behavior: `:326` `expect(onStatusChange).toHaveBeenNthCalledWith(2, 'asgn-1', 'todo')` (the assume-opposite result for a todo→done→fail path).
- **Severity: High (B-block correctness, not a spec/plan defect).** The plan step (`P-3-plan.md:22`) says "create, or extend the nearest existing shell test" — so the plan already anticipates an existing file and is not wrong. But the B-block MUST:
  1. EXTEND `assignments.test.tsx` (do not create a new `AssignmentCard.test.tsx` — that would fragment the suite), and
  2. The existing `:312` test at line 326 will still PASS on the fixed code for the todo→done case (captured prior 'todo' == opposite of 'done'), so it is coverage theater for this bug. The new failing-restore test MUST be constructed so `opposite(newState) != capturedPrior` (per spec `p4-watch-items[TEST-HONESTY]`), otherwise it green-lights the old code. The existing `:312` assertion should be reconciled/kept as the happy-revert case only.
- Net: the spec/plan claims are intact; the orchestrator's framing line "No existing AssignmentCard test" is factually WRONG and is recorded here so the B-block does not create a duplicate file or ship a theater test.

### Claim 7 — Spin-out task 3b878f96 exists (filed, not just claimed) — **VERIFIED**
DB query returned:
- `3b878f96-0fea-48f5-ac1e-7ba639e0072b` | status `todo` | wave_id NULL | "Consistent user-facing error surface for failed optimistic writes (app-wide) + s…"
Filed as a real `tasks` row, unassigned to a wave (correct for a spun-out follow-up). VERIFIED. (Spec task `3ad35a42` also confirmed present, status `todo`.)

### Claim 8 — Antipatterns: "single-file frontend, no contract/API/schema change" — **VERIFIED**
- Contract stability: `api.setAssignmentStatus(id, data: AssignmentStatusInput)` unchanged (`apps/web/src/auth/api.ts:554`); spec `contracts.api: []`, `data: []`, `types: []`, `sdk: []`. `AssignmentStatusSchema` untouched.
- Single-file: the production change is confined to `AssignmentCard.tsx` `handleToggle` (+ its test). No backend/schema/migration. `design_gap_flag: false` consistent (reuse onAnnounce, no new component).
- Working tree clean for `apps/web/src/shell/` + `packages/shared/` — no B-block work prematurely started. VERIFIED.
- No claimed-but-fake artifacts detected other than the claim-6 framing correction above.

---

## Verdict

**APPROVE.** All load-bearing SPEC + PLAN claims (defect reality, onAnnounce reuse, binary status, single-site uniqueness, stale-closure watch item, spin-out filing, single-file/no-contract scope) are VERIFIED against the live codebase. No over-engineering; scope is a one-handler correctness fix + honest test.

**One correction (does not block):** the "no existing AssignmentCard test" premise is WRONG — `apps/web/src/shell/assignments.test.tsx:312` already tests the revert (asserting the buggy behavior). B-block MUST extend that file (not create `AssignmentCard.test.tsx`), reconcile the `:312` assertion, and build the new failure test so `opposite(newState) != capturedPrior` to avoid coverage theater (spec `p4-watch-items[TEST-HONESTY]`).
