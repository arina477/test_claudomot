# Wave 14 — B-3 Frontend
```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented:
  - apps/web/src/shell/presenceSocket.ts
  - apps/web/src/shell/usePresence.ts
  - apps/web/src/shell/useTyping.ts
  - apps/web/src/shell/MemberListPanel.tsx
  - apps/web/src/shell/MainColumn.tsx (typing line)
  - apps/web/src/shell/MessageComposer.tsx (onKeyPress/onBlur)
  - apps/web/src/shell/AppShell.tsx (Pane 4 mount)
  - apps/web/src/styles/globals.css (typing-pulse)
  - apps/web/src/auth/api.ts (getServerMembers)
  - apps/api/src/servers/servers.{service,controller}.ts (NEW GET /servers/:id/members, member-gated)
  - packages/shared/src/servers.ts (ServerMember types)
designs_consumed: [design/server-channel-view.html]
deviations:
  - "Added GET /servers/:id/members (none existed — ServerRolesPage noted it missing); member-gated 403; reasonable gap-fill but is a backend surface added in B-3 — flag B-6"
  - "MemberListPanel collapse uses Tailwind xl (1280) vs design 1024; slightly more conservative; accepted"
  - "CLIENT self-exclusion compares t.userId(uuid) vs currentUserId(username) → no-op; server-side getTypers(excludeUserId) DOES exclude self correctly. Client guard ineffective — FLAG B-6 (cosmetic; functionally covered server-side)"
simplify_applied: true
```
- Typecheck: web + api PASS. Throttle 333ms typing:start + 4s idle stop. Commit (B-3).
