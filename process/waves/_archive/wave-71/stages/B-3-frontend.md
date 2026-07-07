# B-3 — Frontend (wave-71)
Specialist: react-specialist (owns MemberListPanel + BlockedUsersPanel — specs A+B co-located, one shared fetch).
- CREATE useBlocks.ts (module-level store, mirrors presenceSocket — ONE GET /blocks fetch feeds both surfaces; subscriber Set; _fetchPromise dedup; optimistic doBlockUser/doUnblockUser + blockedSet). block-toggle.test.tsx (14 tests).
- MODIFY api.ts (getBlocks → BlockListItem[]), BlockedUsersPanel (render blockedUser.displayName + avatar/initials, no UUID; useBlocks), MemberListPanel (isBlocked=blockedSet.has(userId) → Block↔Unblock toggle, Unblock→unblockUser; loading fail-safe empty-set→Block; own-row !isSelf guard preserved [spec-D]), + 5 test files stubbed vi.mock('./useBlocks') so the module store doesn't fire in unrelated suites.
## One-fetch (problem-framer): useBlocks store — first subscriber fires GET /blocks; both BlockedUsersPanel + MemberListPanel share the resolved state. Optimistic on block/unblock.
## Loading fail-safe (P-4 AC): loading→blockedSet empty→every non-self row shows Block (never wrong Unblock). Own-row: isSelf short-circuits before the block check (spec-D intact).
## Verify: apps/web typecheck clean; biome clean; 643/643 (42 files, 14 new + 11 wave-70).
## Deviations: none.
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [useBlocks.ts, block-toggle.test.tsx, api.ts, BlockedUsersPanel.tsx, MemberListPanel.tsx, +5 test stubs]
designs_consumed: [design/block-ui.html]
deviations: []
simplify_applied: true
```
