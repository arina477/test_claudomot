# Feature List — StudyHall

Feature catalog with horizon classification. Source: v0 brief + v3 flows + v2 competitive scan. Founder stage = `self-use-mvp` → compliance-themed features default to **H2** (no named regulatory deadline overriding). Authored at v3 with founder away (automatic mode); revisable at v10.

Horizons: **H1** = MVP (desktop app usable by one class cohort) · **H2** = medium-term · **H3** = moat.
Complexity: S / M / L / XL.

---

## H1 — MVP

| # | Feature | Persona | Flow(s) | Dependencies | Cx |
|---|---------|---------|---------|--------------|----|
| 1 | Account auth (signup, login, email verify, session) | P1 | F1 | email, secrets | M |
| 2 | Customizable user profile (username, display name, avatar, color) | P1 | F1 | object storage | S |
| 3 | Dark-theme app shell + design system | P1,P2 | all | design tokens | M |
| 4 | Desktop app (web or Electron — stack decision at v5) | all | all | — | M |
| 5 | Create server + channels/categories (templates) | P2 | F7 | — | M |
| 6 | Join server via invite link (preview, default role) | P1 | F2 | invite system | M |
| 7 | Text channels — real-time messaging (send/receive, presence, typing) | P1 | F3 | realtime transport | L |
| 8 | Message actions (react, reply/thread, edit, delete, mention) | P1 | F3 | realtime | M |
| 9 | File / image attachments in messages | P1 | F3 | object storage | M |
| 10 | Roles & permissions (channel-level RBAC; owner safeguards) | P2 | F8 | — | L |
| 11 | Member management (invite, remove, ban) | P2 | F8 | — | M |
| 12 | **Offline-first messaging** (local cache read, outbox queue, reconnect sync, connection-state UI) — **the wedge** | P1 | F5 | local store, sync engine | XL |
| 13 | Voice/video study rooms (drop-in, mic/cam toggle, screen share, audio-only fallback) | P1 | F4 | WebRTC SFU | XL |
| 14 | Notifications (mentions, DMs, assignment reminders) | P1 | F3,F6 | notification dispatch | M |
| 15 | Assignment post + student-side track (title/desc/due date, to-do/done) — light academic tooling | P1,P2 | F6,F9 | — | M |
| 16 | Basic privacy controls (account data, profile visibility, who-can-DM) | P1 | F1 | — | S |

**MVP sequencing note (for v10):** core messaging + offline-first (1–12, 14–16) before voice/video (13), since H1's explicit scope names "servers, text channels, real-time messaging usable by one class cohort." Voice/video is in the brief's must-have list and stays H1 but is the heaviest piece — likely its own milestone after the text MVP proves out on a cohort.

---

## H2 — Medium-term

| # | Feature | Theme | Notes |
|---|---------|-------|-------|
| 17 | Educator/Facilitator role + light moderation tools | P3 | unlocks the educator persona |
| 18 | Deeper assignment management (collect/return; **no grading**) | academic | grading/LMS out of scope |
| 19 | Class scheduling / calendar integration | academic | the brief's "class scheduling integration" |
| 20 | Study-group tools (shared timers/Pomodoro, study sessions, whiteboard) | academic | study-group differentiation |
| 21 | Direct messages + group DMs | comms | likely pulls earlier if cohort demands |
| 22 | Freemium billing + paid school/server tiers (storage, call capacity, admin tools) | monetization | the brief's business model |
| 23 | Server discovery / public study communities | growth | network-effect leg |
| 24 | **Compliance: privacy-rights UI, consent, data export/delete, audit log** | compliance | self-use-mvp → H2 default; promote to H1 if a paying school/partner requires |
| 25 | Search across messages/channels | comms | |

---

## H3 — Moat

| # | Feature | Theme |
|---|---------|-------|
| 26 | Advanced offline-first (full content sync, offline media, conflict UI) — deepen the wedge into a moat | reliability |
| 27 | Cross-server academic identity / portable study profile | identity |
| 28 | Institution partnerships / educator admin console + analytics | B2B2C |
| 29 | Richer privacy/E2E posture as a differentiator vs Discord/Telegram | privacy |

---

## Explicitly OUT of scope (v0 brief)
- Mobile apps
- LMS grade integrations
- Monetized marketplace
- AI tutoring

---

## Cross-reference audit (v3 step 4)
- Every H1 feature maps to ≥1 flow (cols above). ✓
- Every MVP-classified feature's primary use case is covered by a flow. ✓
- Infrastructure-only items (3, 4) flagged. ✓
- Compliance features (24) horizon-defaulted per founder-stage = H2. ✓
