# V-1 Karen — source-claim verification (wave-85)

**Scope:** Truth-of-claims for wave-85 LOAD-BEARING claims in merged main + deployed state. Not spec conformance (jenny's lane).
**Wave:** AssignmentCard optimistic toggle-revert — snapshot prior status + restore on error, visible error toast, a11y announce-once.
**Merged:** PR #105, squash `9d22df4e`, on `main` (verified `git branch --contains`). Deployed @62bae5fd, T-5-confirmed bundle `index-DbePiYZE.js`.

## Verdict: APPROVE — all 8 claims VERIFIED

---

### Claim 1 — Snapshot-restore fix on main — VERIFIED
`apps/web/src/shell/AssignmentCard.tsx:703` captures `const prev = assignment.myStatus;` BEFORE the optimistic flip (`newState` computed at :704, `onStatusChange(...)` at :705). On error the catch restores the snapshot: `onStatusChange(assignment.id, prev);` at :711 — comment at :710 "Restore the captured snapshot (not the assumed opposite)."
The old buggy assume-opposite pattern is GONE: `grep -rn "=== 'done' ? 'todo' : 'done'" apps/web/src/` → NOT FOUND.

### Claim 2 — Visible toast — VERIFIED
`StatusErrorToast` component at `AssignmentCard.tsx:619-645`: red-bordered (`border: '1px solid #ef4444'` :634 + red WarningCircleIcon :639-641), `aria-hidden="true"` :627, `data-testid="status-toggle-error-toast"` :628, auto-dismiss via `setTimeout(onGone, 3500)` :621. Rendered on failure at :917-923 gated on `statusError` state (set true at :713).

### Claim 3 — a11y announce-once — VERIFIED
Failure calls `announce("Couldn't update assignment. Please try again.")` once at `:715`. `announce` is `onAnnounce ?? noop` (:691). Toast is `aria-hidden` (:627) so AT does not double-read — the header comment :607-616 documents this exact single-announce contract (onAnnounce sr-only live region only).

### Claim 4 — Stale-closure + F1 fix — VERIFIED
useCallback dep array at `:718` includes `assignment.myStatus` (stale-closure fix) — `[assignment.id, assignment.myStatus, onStatusChange, announce]`. Toast dismiss is a STABLE callback: `const dismissStatusError = useCallback(() => setStatusError(false), []);` at `:729` (B-6 F1 fix), passed as `onGone` at :921 — NOT an inline arrow. Timer effect deps `[onGone]` at :623 therefore stable across parent re-renders.

### Claim 5 — Tests updated, not duplicated — VERIFIED
`apps/web/src/shell/assignments.test.tsx` UPDATED in place — no separate `AssignmentCard.test.tsx` (`find apps/web -name "AssignmentCard.test.tsx"` → none). The old buggy assertion is gone; test at :287-298 now asserts `onStatusChange('asgn-1','todo')` on the real path (no assume-opposite assertion remains). New tests present:
- snapshot-restore through real prop-wiring: :313-352 (`emitted === ['done','todo']`, checkbox unchecked)
- rapid double-toggle race, per-invocation prior: :354-415 (`['done','todo','todo','done']`, announce called exactly twice)
- visible-toast + announce-once: :417-451 (asserts testid present, `aria-hidden='true'`, announce ×1)
- F1 timer stability across parent re-render: :453-514 (advance 2000ms, force re-render, still visible; advance to 3600ms total, gone)

### Claim 6 — Spin-out task 3b878f96 exists — VERIFIED (DB query)
`SELECT id,status,wave_id,milestone_id,title FROM tasks WHERE id LIKE '3b878f96%'`:
`3b878f96-0fea-48f5-ac1e-7ba639e0072b | status=todo | wave_id=NULL | milestone_id=NULL | "Consistent user-facing error surface for failed optimistic writes (app-wide)…"`. wave_id is NULL as required (seedable). Consistent with the code comment at AssignmentCard.tsx:610-612 deferring the shared toast extraction to 3b878f96.

### Claim 7 — Deploy live — VERIFIED
`GET https://web-production-bce1a8.up.railway.app/` → HTTP 200, references `index-DbePiYZE.js` (matches T-5). Bundle `GET /assets/index-DbePiYZE.js` → HTTP 200, 2,063,838 bytes; contains fix markers `status-toggle-error-toast` (×1) and `Couldn't update assignment` (×1) — the shipped bundle actually carries the fix, not just a fresh hash.

### Claim 8 — Antipatterns / claimed-but-fake — VERIFIED accurate
"Single-file frontend, no contract/api/schema" is accurate: the fix is entirely within `AssignmentCard.tsx` (component + local `StatusErrorToast`) + the test file. No new API route, DTO/Zod contract, or DB schema/migration — correct for a client-only optimistic-UI revert. No claimed-but-fake artifacts detected. The intentional NON-implementation (shared toast utility across all 9 optimistic sites) is honestly deferred to task 3b878f96 rather than falsely claimed as done.

---

**No gaps. No bullshit. APPROVE.**
