# Wave 26 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase-1 independent gate)
**Reviewed against:** process/waves/wave-26/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
REWORK

## Rationale
Four of the five acceptance criteria are met cleanly and verified against the source, not the deliverable's self-report: AC2 (single styling source — `PresenceDot` derives the dot color from `var(--color-accent-emerald)`; the inline hard-coded-hex dot block in `MemberListPanel.tsx` was fully replaced, and the remaining `#10b981` hits in `MessageList.tsx` at :322/:342/:897/:1208/:1209 are pre-existing non-dot uses — file icon, mention pill, reply header — not stray dot literals); AC4 (`presenceSocket.ts` opens exactly one `io('/presence')` connection at :96 as a module singleton; `AuthorPresenceDot` reads `getPresenceStatus`/`subscribePresence` off that singleton, no new socket); the CARRY-1 perf carry (each `AuthorPresenceDot` subscribes scoped to its own `authorId` and calls `setOnline` only when that author's value changes — a presence event for user-B does not re-render user-A's dot; it is NOT a bare `usePresence()` per row); and AC5 (member-panel refactor is behavior-preserving on the same `getStatus(m.userId)` source). The two incidental main-CI repairs are sound and not papering over anything: `process/**` in Biome `files.ignore` cannot drop source because `process/` contains zero source files (transcripts/markdown only), and the `assignments.test.tsx` clock-mock pins a fixed `NOW` constant via `vi.setSystemTime` with proper `afterEach` teardown — a legitimate determinism fix, not a masked component bug. **However, AC3 is not met.** AC3 requires: "Unknown-presence author (not a co-member / not in store) → NO dot (graceful degrade, no error, no default-online)." The implementation renders a `<PresenceDot>` for every `SentRow` unconditionally; for an author absent from the presence store, `getPresenceStatus` collapses the unknown case into `'offline'` (`presenceStore.get(userId) ?? 'offline'`), so an unknown author gets a persistent muted **offline dot** — precisely the "default" AC3 forbids ("no default-online" pairs with the requirement of dot *absence*, not a false-offline signal). The store genuinely distinguishes the three cases (`.has()` = known online/offline vs absent = unknown), so the safe-degrade is implementable and was simply not implemented. Worse, the B-3 test at `presence-dots.test.tsx:203-213` openly reinterprets AC3 ("the dot renders as offline (muted), which is the safe degrade") and asserts `getByText('Offline')` IS present for the unknown user — the coverage certifies the deviation instead of catching it. The CARRY-2 accept (PendingRow/FailedRow render no dot) is itself correct — `OptimisticMessage` genuinely has no stable `authorId`, so no-dot is the right degrade there — but it was adjudicated against the same wrong reading of AC3, and the real-message unknown-author path was never given the same no-dot treatment. This is contract drift that ships a wrong-per-spec indicator, blessed by a test that asserts the wrong behavior. It goes back.

## Rework instructions

### Stages requiring rework
- B-3: implement AC3 true no-dot degrade for unknown-presence authors on real message rows, and fix the test that certifies the deviation.

### Per stage

#### B-3
- **What's wrong:** `AuthorPresenceDot` (`apps/web/src/shell/MessageList.tsx`) always renders `<PresenceDot online={...}>`; an author absent from `presenceStore` renders a muted offline dot because `getPresenceStatus` returns `'offline'` for unknown users. AC3 requires NO dot (element absence) for the unknown case. The distinction between "known-offline" and "unknown/never-in-store" is collapsed. The test at `presence-dots.test.tsx:203-213` asserts the offline dot IS present for `user-unknown`, locking in the wrong behavior.
- **Heuristic fired:** H-B (offline-contract / spec drift) + coverage-theater — the acceptance test reinterprets the AC's plain wording and asserts the deviating behavior, so the miss passes CI green. AC3 as written = element absence; implementation = false-offline dot.
- **What "good" looks like:** `AuthorPresenceDot` renders `null` (no `PresenceDot`, no sr-only label, no dot node) when the author is unknown — i.e., not present in the store. Expose a store predicate to distinguish unknown from known-offline: add `export function hasPresence(userId: string): boolean { return presenceStore.has(userId); }` in `apps/web/src/shell/presenceSocket.ts` (adjacent to `getPresenceStatus` at :148), and gate on it in `AuthorPresenceDot`. `getPresenceStatus`'s `?? 'offline'` default is fine for the KNOWN case (a member observed offline), but the render decision must key on `hasPresence(authorId)`: `if (!present) return null;` before rendering the dot. Known-online → emerald dot; known-offline → muted dot; unknown/absent → no dot at all. Keep the CARRY-1 scoped subscription (subscribe to react to a later `presence:snapshot`/`presence:online` that adds the author, then flip from no-dot to a dot live).
- **Re-do instructions (route to react-specialist per command-center/AGENTS.md; orchestrator does NOT edit directly):**
  1. Add `hasPresence(userId): boolean` to `presenceSocket.ts` returning `presenceStore.has(userId)`.
  2. In `AuthorPresenceDot`, track both presence-known and online state off the same scoped `subscribePresence` handler; when `!hasPresence(authorId)`, return `null` (no dot). Re-sync on mount and on every notification so a later snapshot/online event flips no-dot → dot without reload (preserves AC1 live-update).
  3. Rewrite the `presence-dots.test.tsx` "unknown author" test (:203-213) to assert **no dot renders** for an author absent from the store — `expect(screen.queryByText('Online')).not.toBeInTheDocument()` AND `expect(screen.queryByText('Offline')).not.toBeInTheDocument()` AND `expect(document.querySelector('[data-testid="presence-dot-inner"]')).toBeNull()`. Add a distinct known-offline test (`setPresence('user-known-off', 'offline')`) that DOES assert a muted dot renders, so the two cases are separated. Remove the reinterpreting comment block.
  4. Re-run B-4 (typecheck repo-wide) and B-5 (lint, typecheck, unit, build) — the added export and null-return path both touch the type surface and test count.

### Cascade

B-block cascade rules (trigger stage = B-3 frontend):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| B-3 frontend | B-4 (route registration / typecheck), B-5 (re-verify) |

- **Stages that must re-run after the above:** B-4 (typecheck, repo-wide), B-5 (full suite — lint, typecheck, unit, build, smoke). Then re-enter B-6 Action 0 fresh spawn (Attempt 2).
- **Stages that stay untouched:** B-0 (branch/schema — no change), B-1/B-2 (skipped — no contract/backend surface). AC1, AC2, AC4, AC5 and both incidental repairs are already correct and must NOT be re-touched.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 26 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase-1 independent gate)
**Reviewed against:** process/waves/wave-26/blocks/B/review-artifacts.md
**Attempt:** 2  (post-rework, verifying AC3 fix in commit 22437a3)

## Verdict
APPROVED

## Rationale
The single Attempt-1 blocker — AC3, the unknown-presence author rendering a false-default offline dot instead of no dot — is genuinely fixed at the source, not just in the deliverable's self-report. Verified line-by-line against the tree: `presenceSocket.ts:159` adds `hasPresence(userId)` returning `presenceStore.has(userId)`, and since `presenceStore` is a real `Map` (:51) whose membership is only ever established by an observed snapshot/online/offline event (:106/:113/:119), `.has()` is a true KNOWN-vs-UNKNOWN discriminator — it does NOT collapse absent into offline the way the old `?? 'offline'` default did. `AuthorPresenceDot` (MessageList.tsx) is now correctly tri-state (`boolean | null`): the initializer and the `subscribePresence` handler both compute `hasPresence(authorId) ? (status === 'online') : null`, and `if (status === null) return null` short-circuits before any `<PresenceDot>` renders — so an absent author emits no dot node and no sr-only label. The three real presence states now map correctly: KNOWN-online → emerald dot; KNOWN-offline → muted `color-surface-500` dot (offline is a real observed state and STILL gets a dot — only absence is no-dot); UNKNOWN/absent → nothing. The certifying test was inverted from the deviation-blessing form: the "unknown author" case (presence-dots.test.tsx:204) now asserts `queryByText('Offline')` is NOT present AND `queryByTestId('presence-dot-inner')` is NOT present — element-absence, matching AC3's plain wording — and the reinterpreting comment block was removed. `presence-dot-inner` is a load-bearing testid: it exists on the real `PresenceDot` node (PresenceDot.tsx:54), so the assertion keys on the actual dot DOM, not a phantom. A new online→unknown live-transition test (:229) proves the degrade is reactive — `clearPresence` deletes from the mocked `_store` (mirroring real `presenceStore.delete` on eviction), the scoped subscription recomputes `null`, and the dot disappears. No regression from the fix: the subscription/fan-out model is unchanged (AC4 single `/presence` socket intact — the import is still off the same singleton module, no second `io()`), CARRY-1's per-author scoped memo still only setStates when THIS author's value changes, the KNOWN-offline dot still renders (:196 test unchanged and asserts the muted dot present), and CARRY-2 (PendingRow/FailedRow no-dot, :246) is untouched. The four ACs Attempt 1 approved (AC1 live update, AC2 single emerald-token styling source, AC4 single socket, AC5 member-panel refactor) are not disturbed by a fix that is fully contained to the render decision inside `AuthorPresenceDot` plus one additive store accessor. Test count moved 15→16 in this file (the added transition case), consistent with the reported green web 250/250. All five ACs now met; the contract drift that shipped a wrong-per-spec indicator is closed.

## Escalation
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1
