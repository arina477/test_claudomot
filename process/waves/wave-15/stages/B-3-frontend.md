# Wave 15 — B-3 Frontend
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented:
  - apps/web/src/shell/MentionAutocomplete.tsx (popover, 4 states, keyboard nav, aria-activedescendant)
  - apps/web/src/shell/useMentionBadge.ts (unread store: socket + my-mentions bootstrap)
  - apps/web/src/auth/api.ts (getMyMentions)
  - apps/web/src/shell/MessageList.tsx (MentionPill self/other, renderBodyWithMentions, viewerUsername)
  - apps/web/src/shell/MessageComposer.tsx (@-trigger, popover, Enter-selects-not-sends)
  - apps/web/src/shell/MainColumn.tsx (serverId + viewerUsername wiring)
  - apps/web/src/shell/ChannelSidebar.tsx (unread badge + markChannelRead)
designs_consumed: [design/server-channel-view.html]
deviations:
  - "aria-activedescendant added (D-3/P-4 carry) ✓"
  - "self-mention detected by username match (ProfileResponse has no uuid) — OK"
  - "**DEFECT (B-2↔B-3 drift, routed at B-4):** autocomplete inserted displayName-derived handle, but B-2 resolver matches users.username. ServerMember lacks username. Autocomplete-created mentions would NOT resolve. → username threaded through ServerMember + endpoint + autocomplete (B-4 fix)."
simplify_applied: true
```
- Typecheck + build + 131 tests pass (pre-fix). The username-contract fix follows at B-4.
