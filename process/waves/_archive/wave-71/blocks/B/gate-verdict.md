# Wave 71 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-71/blocks/B/review-artifacts.md + `git diff main...wave-71-block-ui-polish` + fix-up commit 98c6958
**Attempt:** 2  (re-gate after Phase-2 /review caught a P0; P0 fixed in 98c6958, /review re-ran CLEAN TO SHIP)

## Verdict
APPROVED

## Context — what changed since attempt 1

Attempt 1 approved on the deliverable + diff, but the Phase-2 `/review` surfaced a **P0 the diff-read missed**: `BlockConfirmDialog` called `api.blockUser` **directly**, bypassing the `useBlocks` module store. Because the store's `blockedSet` was never mutated, the member row never flipped Block → Unblock after a successful block — silently defeating spec-A's entire goal. The defect was masked in attempt 1 because `block-ui.test.tsx` / `block-toggle.test.tsx` wholesale-mock `useBlocks`, so they asserted a mock was called rather than proving the real store propagated. This is the classic mock-the-system-under-test failure mode, and it is exactly why an independent Phase-2 reviewer exists on top of the gate. Commit 98c6958 fixes it and adds a **real-store** test. This attempt-2 verdict verifies the fix in the live code, not the prose.

## Rationale — attempt-2 checks (verified in code)

1. **P0 genuinely fixed — PASS.** `BlockConfirmDialog.tsx` now destructures `const { blockUser } = useBlocks()` (line 108) and `handleConfirm` awaits `blockUser(targetUserId)` (line 181) — the **store** method, not `api.blockUser`. The direct `api` import is **gone** from the dialog (grep for `auth/api` in the file returns nothing). The dialog no longer owns the network call at all; it delegates to the store, which is the single owner of the optimistic `blockedSet` mutation that drives the row flip.

2. **No double-POST — PASS.** Exactly **one** `api.blockUser(userId)` call site exists in the entire web tree: `useBlocks.ts:122`, inside `doBlockUser`. `doBlockUser` does the optimistic `blockedSet.add(userId)` **before** the network call (lines 117–119) so every subscriber — including the `MemberItem` that renders Block/Unblock — flips immediately, then re-fetches for the enriched row on success. On failure it **rolls back** the optimistic add (`revert.delete(userId)`, lines 127–129) and re-throws so the dialog surfaces the error toast and stays open. Since the dialog delegates to this single method, there is structurally no second POST path.

3. **The new test is REAL, not mock-masked — PASS.** `block-dialog-store.test.tsx` mocks the **api layer only** (`vi.mock('../auth/api', …)`, lines 30–38) and imports `_resetBlocksStore` from the **real** `useBlocks` module — `useBlocks` itself is NOT mocked, so the module-level store runs for real. Test 1 renders `MemberListPanel`, clicks the actual member-row `block-member-btn-<id>` → asserts the `BlockConfirmDialog` opens → clicks `block-dialog-confirm` → asserts (a) the row flips to `unblock-member-btn-<id>` and `block-member-btn-<id>` is gone (lines 182–185), and (b) `api.blockUser` was called **exactly once** with the right id (lines 178–179). Test 2 drives the failure path: `api.blockUser` rejects → asserts one call, error toast shown, dialog stays open, and the row did **NOT** flip (rollback proven, lines 208–219). This is the exact P0 behavior exercised end-to-end through the real store — the drift that attempt 1 missed is now load-bearing-tested.

4. **No regression on attempt-1-verified items — PASS.**
   - **Launch-gate safety UNTOUCHED (critical):** `blocks.controller.ts` and `dm.service.ts` (the 5 DM HIDE seams) show **zero** diff lines. The only api-side production change remains `blocks.service.ts`, and within it only `listBlocks` (signature `Promise<Block[]>` → `Promise<BlockListItem[]>`, read-path LEFT JOIN projection). `createBlock`, `removeBlock`, `isBlockedBetween`, and the `user_blocks` schema show no functional diff. No migration/drizzle/dexie file touched. Wave-70 T-8-proven safety intact.
   - **no-IDOR preserved:** `listBlocks` still filters `WHERE blocker_id = blockerUserId` (own list only); the LEFT JOIN adds display columns from `users` on `blocked_id`, without widening the WHERE.
   - **Enrichment correct:** LEFT (not INNER) JOIN keeps a block when the user row is missing; `displayName = display_name ?? username ?? 'Unknown user'` — never the raw UUID.
   - **Loading fail-safe:** while `useBlocks` loads, `blockedSet` is empty → `has()` false → every non-self row shows Block (never a wrong Unblock).
   - **Own-row suppression (spec-D):** the `isSelf` guard fires first in both affordance branches — unchanged by the fix.

5. **Commit discipline — PASS.** Fix-up commit 98c6958 cites `task: 1193aebf-…` (spec A — the member-row affordance, exactly the spec the P0 broke), with an honest body naming the bypass, the mask, and the fix. Branch commit set: B-1 contracts `1bf82c5` (1c633d2f), B-2 backend `79a53f6` (1c633d2f), B-3 frontend `f07e3eb` (both 1193aebf + 1c633d2f — shared `useBlocks` co-location ratified in attempt 1), plus the 98c6958 fix-up (1193aebf). Every claimed `task_id` (1193aebf, 1c633d2f) has commit coverage across contracts + backend + frontend + fix-up.

**Infra note (NOT a defect, NOT grounds for REWORK):** the isolated `pnpm --filter @studyhall/web test` run is 645 green and authoritative. The parallel-turbo run trips a HOST `uv_thread_create` limit (resource exhaustion after a long session) — an environment ceiling, not a code fault. Documented in B-5. Per the re-gate charge, this does not gate the verdict.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2   # 1 rework cycle consumed by the P0 fix loop; 2 of the original 3 remain

---

## Block-exit handoff

```yaml
build_block_status:    complete
branch:                wave-71-block-ui-polish
stages_run:            [B-0, B-1, B-2, B-3, B-4, B-5, B-6]
stages_skipped:        [B-0 schema (no DB change — read-side JOIN + UI only; user_blocks unchanged)]
review_verdict:        APPROVE
deviations_logged:     []
last_commit_sha:       98c6958
ready_for_ci:          true
phase1_verdict:        APPROVED    # attempt-2 re-gate
phase2_review:         CLEAN-TO-SHIP   # Phase-2 /review re-ran clean after P0 fix
notes:
  - "Attempt-1 P0 (dialog bypassed useBlocks store → row never flipped) FIXED in 98c6958; verified in live code, not prose."
  - "api.blockUser has exactly ONE call site (useBlocks.ts doBlockUser) — no double-POST; optimistic add + rollback-on-failure."
  - "New real-store test (block-dialog-store.test.tsx) mocks api layer ONLY; proves row flip + single POST + failure rollback end-to-end."
  - "Launch-gate safety surface (createBlock/removeBlock/isBlockedBetween/user_blocks schema/5 DM HIDE seams) verified UNTOUCHED in diff."
  - "no-IDOR preserved: listBlocks still WHERE blocker_id=session."
  - "Web suite 645 green via isolated pnpm --filter @studyhall/web test (authoritative). parallel-turbo host thread-limit is infra, not a code defect — no REWORK."
```
