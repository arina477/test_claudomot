# B-3 — Frontend (wave-51)

**react-specialist af1f84e2. Commit d2c7aff (Refs: 39fc1c5e).**

## Fix
`apps/web/src/shell/AppShell.tsx` — wrapped BOTH the desktop ChannelSidebar wrapper AND the mobile overlay drawer in `{!dmHomeActive && ( ... )}`, mirroring the existing MemberListPanel guard (now line ~138). On the DM surface the grid collapses to ServerRail(72) + DmConversationList(320) + DmThread(flex-1) = canonical 3-panel; DmThread full width (632px @1024). Component-state conditional render (not routing/CSS-hide/framework).

## Test (P-4 karen carry — both DOM nodes)
`apps/web/src/shell/AppShell.test.tsx` +4 tests: (1) ChannelSidebar absent from BOTH desktop + mobile when dmHomeActive; (2) mobile overlay drawer specifically absent after DM activation (present before); (3) DM body (main) present + no sidebar = 3-panel; (4) ChannelSidebar PRESENT in server view (no regression).

## Verify
- biome ci (scoped): 0. tsc: 0. web suite: **421/421** (15/15 AppShell incl. 4 new).
- **Repo-wide `biome ci .`: 294 files, 0 (BUILD rule-10 / obs-A — clean).**

## Deviation
Extended existing AppShell.test.tsx. Incidental: added missing messagingSocket/api mock exports (onDmMessage, listDmConversations/listDmMessages/sendDmMessage/createDmConversation) so DmHome mounts in tests — test-infra gap, NOT scope (no source/routing/CSS/contract touched).
