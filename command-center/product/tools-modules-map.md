# Tools / Modules Map — StudyHall

Reusable building blocks extracted from v3 flows + features. First pass — v6 architecture deepens this. Each entry: purpose + consuming features (by # from feature-list.md).

---

## External services

| Service | Purpose | Consumed by |
|---------|---------|-------------|
| Auth/identity (self-hosted or provider) | Signup, login, sessions, email verify | 1 |
| Realtime transport (WebSocket server / managed) | Message fan-out, presence, typing | 7, 8, 14 |
| Object storage (S3-compatible) | Avatars, message attachments | 2, 9 |
| WebRTC SFU (e.g. LiveKit / mediasoup) | Voice/video study rooms, screen share | 13 |
| Transactional email | Verification, invites, reminders | 1, 6, 14 |
| Error tracking | Production error capture | all (infra) |
| Analytics | North-star (weekly active students) instrumentation | all (infra) |

## Internal modules

| Module | Purpose | Consumed by |
|--------|---------|-------------|
| Authentication | Credential handling, session tokens, guards | 1, 16 |
| User / profile management | Profile CRUD, avatar, visibility | 2, 16 |
| Server & membership | Server CRUD, join/leave, member list | 5, 6, 11 |
| Channel management | Channels, categories, ordering | 5, 7 |
| Messaging service | Persist + deliver messages, history, threads | 7, 8, 9 |
| Presence service | Online/typing/voice-room presence | 7, 4(F4) |
| RBAC (roles & permissions) | Role CRUD, channel-level permission checks | 10, 11 |
| **Offline sync engine** | Local cache, outbox queue, reconnect reconciliation, conflict resolution | 12 |
| Invite system | Invite link generation, expiry/max-uses, preview | 6, 11 |
| Notification module | Mentions, DMs, assignment reminders dispatch | 14 |
| File upload | Pre-signed uploads, size/type validation | 2, 9 |
| Assignment module (light) | Assignment CRUD, due dates, student-side status | 15 |
| Privacy controls | Profile visibility, who-can-DM, account data | 16 |

## Shared primitives (UI)

| Primitive | Purpose | Consumed by |
|-----------|---------|-------------|
| Design tokens (dark theme) | Color/spacing/type scale | 3, all UI |
| Server rail + channel sidebar | Navigation chrome | 5, 6, 7 |
| Message list + composer | Core chat surface | 7, 8, 9, 12 |
| Member list | Roster + presence | 11 |
| Voice-room UI | Tiles, mic/cam controls, screen share | 13 |
| Connection-state indicator | Online / reconnecting / offline | 12 |
| Modals / toasts / forms | Cross-cutting controls | all UI |
| Assignment panel | List + due dates + status | 15 |

## Background work

| Job | Purpose | Consumed by |
|-----|---------|-------------|
| Message fan-out | Deliver to online members, push to offline queues | 7 |
| Notification dispatch | Send reminders/mentions | 14 |
| Media processing | Avatar resize, attachment thumbnails | 2, 9 |
| Sync reconciliation | Server-side merge of flushed outboxes | 12 |
| Assignment due-date reminders (cron) | Fire reminders ahead of due dates | 15 |

---

## Cross-reference audit (v3 step 4)
- Every module/tool references ≥1 consuming feature. ✓
- Offline sync engine (the wedge) has a dedicated module + primitive + background job. ✓
- WebRTC SFU isolated to feature 13 (heaviest, late-H1). ✓
- v6 architecture will turn this into concrete service/module boundaries + the locked module-list.
