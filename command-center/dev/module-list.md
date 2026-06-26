---
status: locked
locked_at: 2026-06-26T07:30:00Z
locked_by: v6b
---

# Module List (v6 snapshot)

## MVP modules

### Backend (NestJS)
- **Auth Module** — account lifecycle (signup, login, email verify, session, token refresh) via SuperTokens; exposes AuthGuard + CurrentUser decorator consumed by all other modules
- **User / Profile Module** — display name, username, avatar, color CRUD; UserSummaryDto embedded in messages and member lists
- **Server + Membership Module** — study-server CRUD, member join/leave/kick/ban, membership roster
- **Channel Management Module** — channel and category CRUD within a server; ordered channel tree; text and voice channel types
- **Messaging Service** — message persistence, cursor-paginated history, fan-out via Socket.IO, reactions, edit/delete, reply threading, mention parsing; nonce-based idempotency for offline outbox
- **Presence Service** — ephemeral online/away/offline status per user per server, typing indicators per channel, voice-room occupancy; Socket.IO-driven, in-process for MVP
- **RBAC Module** — server-scoped role definitions, channel-level permission overrides, PermissionGuard + can() check; owner safeguard
- **Offline Sync Engine (server side)** — outbox flush endpoint (nonce dedup), catch-up delta endpoint (messages since timestamp); the wedge's server half
- **Invite System** — invite link generation (max-uses, expiry), public preview, redemption, revocation
- **Notification Module** — in-app notification dispatch (Socket.IO) + transactional email (Resend) for mentions, assignment reminders, verification, invites
- **File Upload Module** — Railway Buckets pre-signed PUT URL generation + confirm; content-type and size validation for avatars and attachments
- **Assignment Module (light)** — assignment CRUD (title, description, due date), student-side to-do/done status toggle, due-soon cron event; no submission or grading
- **Privacy Controls Module** — profile visibility and who-can-DM settings; gates public profile access

### Frontend (React SPA)
- **Auth Context / Guards** — global session state, login/logout, PrivateRoute / PublicOnlyRoute wrappers via SuperTokens JS SDK
- **User Profile Feature** — profile display + edit, avatar upload, UserAvatar + UserBadge shared components
- **Server Rail** — leftmost icon rail of joined servers, unread badges, add-server entry point
- **Channel Sidebar** — channel + category tree for active server, unread indicators, voice-room occupancy count
- **Message List + Composer** — virtualized infinite-scroll history, optimistic send, typing indicator, reply UI, reaction picker, mention autocomplete, attachment upload; reads from IndexedDB cache first
- **Member List** — role-grouped server roster with presence dots and profile popover
- **Voice-Room UI** — participant video/audio tile grid, mic/cam/screen-share controls; wraps LiveKit React SDK
- **Offline Sync Engine (client side)** — three-layer design: IndexedDB cache (Dexie), outbox queue, reconnect reconciler; exposes useMessages, useConnectionState, useOutboxState; the wedge's client half
- **Connection-State Indicator** — slim banner showing Connected / Reconnecting (N queued) / Offline; reads from Offline Sync Engine
- **Notification Bell + Toast System** — in-app notification bell with badge + dropdown; ephemeral toast layer for action feedback
- **Invite Flow UI** — /invite/:code preview page + invite-link generator modal in server settings
- **Server Settings Shell** — multi-tab settings surface (Overview, Channels, Roles, Members, Invites); RBAC-gated tab visibility
- **Assignment Panel** — assignment list sorted by due date, to-do/done toggle, create/edit form
- **Design Tokens + Theme System** — CSS custom properties + Tailwind config extension; dark theme only; single source of truth for all UI components
- **Modal / Sheet / Form Primitives** — cross-cutting dialog management and form field components (Radix UI via shadcn/ui); shared/ui layer
- **Privacy Settings Feature** — /settings/privacy page; profile visibility selector, who-can-DM stub

## H2 modules

- **Direct Messages Module** — 1:1 and group DM channels outside server context; shares Messaging Service internals
- **Educator / Facilitator Role Module** — promoted role with moderation tooling (warn, timeout, bulk delete); extends RBAC
- **Deeper Assignment Management** — submission collection (file upload per student) and return flow; no grading
- **Class Scheduling / Calendar Integration** — server-level event calendar; Google Calendar / iCal sync
- **Study-Group Tools** — shared Pomodoro timer, study sessions, optional whiteboard canvas
- **Freemium Billing Module** — Stripe integration for paid server/school tiers; storage + call capacity quotas
- **Server Discovery** — public server directory; opt-in listing; tag-based search
- **Compliance Module** — privacy-rights UI (data export/delete), consent management, audit log; stub pages exist in MVP
- **Message Search** — full-text search across readable channels (Postgres tsvector or Meilisearch)
- **Browser Push Notifications** — Service Worker + Web Push API for backgrounded/closed PWA notifications

## H3 modules (planned)

- **Advanced Offline Sync** — full-content sync (all media, all channels since last online), conflict resolution UI, offline media playback; deepens the wedge into a moat (feature 26)
- **Cross-Server Academic Identity** — portable study profile and academic record linkable across servers/institutions
- **Institution Admin Console** — B2B2C admin surface for school IT; bulk provisioning, analytics, SSO
- **E2E Encryption Layer** — end-to-end encrypted DMs and private channels as a privacy differentiator

---

Last updated: 2026-06-26, source: v6 Modules branch
status: locked  # v6b locked this snapshot (see front-matter)
