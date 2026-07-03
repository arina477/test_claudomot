# Wave 41 — B-2 Backend (node-specialist)
- RbacService: can(moderate_members) resolves the new boolean; role CRUD + getEffectivePermissions handle it. Naming: manage_members (membership admin, existing) ≠ moderate_members (delete-any+timeout, NEW).
- ModerationService: setMemberTimeout / clearMemberTimeout + RANK GUARD (blocks self, owner, manage_server holder, manage_roles holder → 403).
- ModerationController: POST /servers/:serverId/members/:userId/timeout → 200 {mutedUntil}; DELETE → 204 (moderate_members-gated + rank guard).
- delete-any: deleteMessage moderator branch widened manage_channels → moderate_members OR author; reuses message.deleted fan-out.
- send-gate: createMessage refuses sender with muted_until > now() (server-side, time-based expiry, no cron).
- servers.service listServerMembers exposes mutedUntil (public state, all viewers).
- Tests: moderation.integration.spec (real-PG, 7 rank-guard cases + can() round-trip + timeout set/clear/auto-expiry) + rbac.service.spec + messages.service.spec updated. Commits 82b5b6d/24ec3a6/1c603d7/87b5a71/893c830.
