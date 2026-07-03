# Wave 41 — B-3 Frontend (react-specialist) — implements design/member-moderation.html
- ServerRolesPage: moderate_members permission toggle (PERM_FLAGS entry).
- MemberListPanel: MutedIndicator (amber ph-speaker-x + sr-only "Timed out" + muted-tint, visible to ALL) + ModerationPopover (role=menu, 3 views: menu / duration 5m·1h·1day / 403-error; ArrowUp/Down/Home/End nav + Esc close+refocus + outside-click; prefers-reduced-motion; optimistic + inline 403 rank-guard error). Kebab visible only with moderate_members (prop or self-fetch getMyPermissions, AssignmentsPanel pattern).
- api.ts: timeoutMember (POST) + removeTimeout (DELETE). icons: DotsThree/SpeakerXFill/SpeakerHigh/ArrowLeft (Phosphor).
- MessageList delete-any: already worked (SentRow passes onDelete for all when non-null; backend enforces 403) — no change (deviation: none needed).
- Tests: member-moderation.test.tsx (13 cases). Also FIXED the server-roles.test.tsx flake (sync expect → waitFor) — resolves unassigned task 6832e3ea. Commits e17b187/9c5c529/e7f4dea/08cad5e/893c830.
