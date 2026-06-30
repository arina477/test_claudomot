# Wave 14 — B-2 Backend
```yaml
skipped: false
fast_path_active: false
specialists_spawned: [websocket-engineer]
files_implemented:
  - apps/api/src/common/ws-auth.ts (shared WS-upgrade auth helper)
  - apps/api/src/presence/presence.service.ts (ref-count + co-member + typing TTL)
  - apps/api/src/presence/presence.gateway.ts (/presence namespace, snapshot, typing)
  - apps/api/src/presence/presence.module.ts
  - apps/api/src/messaging/messaging.gateway.ts (refactored to shared ws-auth)
  - apps/api/src/app.module.ts (register PresenceModule)
deviations:
  - "displayName resolved server-side (users.display_name) not client-provided — STRICTER (no spoofing); accepted"
  - "getCoMemberUserIds single inArray() path; accepted"
simplify_applied: true
```
- Typing scoping: presence:channel:<channelId> room (join gated by canViewChannelById; re-checked on typing:start — no leak).
- WS-auth factored to common/ws-auth.ts; messaging gateway refactored to reuse (identical behavior). Value imports for DI (wave-12 lesson).
- Typecheck: all 4 packages PASS. Commit 4772b7a.
