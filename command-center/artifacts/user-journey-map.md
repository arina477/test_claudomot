---
name: User Journey Map
description: Canonical inventory of every user flow, screen, route, API endpoint. Regenerated at T-9 from production state.
last_updated: 2026-06-26 (T-9 wave-1 regen)
version: 0.2
status_legend:
  - "✅ Live: page renders correctly with real content in production"
  - "🟡 Live but degraded: renders but missing data, broken interaction, or minor known issue"
  - "🟠 Coded but blocked: route exists in code but redirects/crashes/blank in production"
  - "❌ Not built: documented in flow but no matching route in code"
  - "🚫 Deferred: explicitly out of scope"
  - "🆕 Design-only: designed but no code route yet"
---

# User Journey Map — StudyHall

Canonical inventory of every screen / route / surface + flow cross-reference. Regenerated at T-9 Journey each wave from production state. v4 onboarding baseline (founder away, automatic mode — enumerated from v3 flows/features; revisable at v10). StudyHall is a dark-themed desktop communication app, so the inventory is product-screen-heavy; marketing is minimal for a `self-use-mvp` stage. All entries `❌ Not built` until the first wave ships.

## Page inventory

| # | Page | Route | Persona(s) | Related flows | Tools/modules | PD |
|---|------|-------|-----------|---------------|---------------|----|
| 1 | Landing | `/` | visitor | signup-entry | design tokens, hero | full |
| 2 | Privacy policy | `/privacy` | visitor | — | — | **[stub — compliance, H2 expansion deferred]** |
| 3 | Terms | `/terms` | visitor | — | — | **[stub — compliance, H2 expansion deferred]** |
| 4 | Signup | `/signup` | P1 | F1 | auth, profile | full |
| 5 | Login | `/login` | P1 | F1 | auth | full |
| 6 | Forgot / reset password | `/forgot-password`, `/reset-password` | P1 | F1 | auth, email | full |
| 7 | Email verify | `/verify` | P1 | F1 | auth, email | full |
| 8 | App home (no server) | `/app` | P1 | F2, F7 | server rail | full |
| 9 | Server channel view (main 3-pane) | `/servers/:id/:channelId` | P1,P2 | F3, F5 | messaging, presence, channel mgmt, offline sync, RBAC | full |
| 10 | Voice/video study room | `/servers/:id/voice/:channelId` | P1 | F4 | WebRTC SFU, voice-room UI, presence | full |
| 11 | Create server | `/app` (modal/flow) | P2 | F7 | server mgmt, channel mgmt | full |
| 12 | Invite preview / join | `/invite/:code` | P1 | F2 | invite system, server mgmt | full |
| 13 | Server settings (roles / members / channels) | `/servers/:id/settings` | P2 | F8 | RBAC, member mgmt, channel mgmt | full |
| 14 | Assignments panel | `/servers/:id/assignments` | P1,P2 | F6, F9 | assignment module, notifications | full |
| 15 | User settings — profile | `/settings/profile` | P1 | F1 | profile mgmt, file upload | full |
| 16 | User settings — privacy | `/settings/privacy` | P1 | F1 | privacy controls | full |

**Compliance-surface quota (self-use-mvp, ≤~10%):** 2 stub pages (Privacy policy, Terms) of 16 ≈ 12% — within tolerance; stubbed, no full fan-out. `/settings/privacy` is a product surface (feature 16), not a compliance-doc page → full PD.


## Deployment status — wave-1 (M1 foundation, shipped)

Live on Railway: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200).
Verified via HTTP + CI RTL component tests (live-browser crawl deferred — Playwright MCP chrome-channel absent in env; a CI chromium job is queued for the next UI wave).

| Surface | Status | Note |
|---|---|---|
| App shell chrome (server rail + channel sidebar + main column) | 🟡 Live but degraded | renders live (dark theme, ConnectionStateIndicator) with placeholder content; no real servers/channels/messages yet |
| `GET /health` (api) | ✅ Live | 200 `{status:ok,service,version}` |
| All other pages (auth, real server view, assignments, voice, settings) | ❌ Not built | per per-page-pd; auth = next wave (b9118041) |


## Deployment status — wave-3 (auth frontend, shipped)
Live: web https://web-production-bce1a8.up.railway.app (SPA + client routes) · api auth backend.
| Surface | Status | Note |
|---|---|---|
| /login, /signup, /forgot-password (+reset), /verify-email | ✅ Live | supertokens-auth-react custom forms wired to live backend |
| /settings/profile | ✅ Live | display_name edit (GET/PATCH /profile); username/avatar/accent 'coming soon' (→ 2a655960) |
| Verify-email banner (app shell, unverified) | ✅ Live | unverified users reach shell + banner; /me 200 emailVerified:false |
| First-run: signup→verify→profile→app-home | ✅ Wired | core flow live (curl-verified); full browser click-through deferred to CI chromium job (c51589cd) |

## Flows cross-reference

### F1 — Sign up & create profile (P1)
- Entry: `/` → `/signup` (or `/invite/:code` → `/signup`)
- Steps: `/signup` → `/verify` → `/settings/profile` (first-run) → `/app`
- Features: 1, 2, 16

### F2 — Join a study server (P1)
- Entry: `/invite/:code` → (auth if needed) → `/servers/:id/:channelId`
- Features: 6

### F3 — Real-time messaging (P1)
- Entry: `/servers/:id/:channelId` → select channel → read → compose → send → react/thread
- Features: 7, 8, 9

### F4 — Voice/video study room (P1)
- Entry: server view → click voice channel → `/servers/:id/voice/:channelId` → mic/cam → screen share → leave
- Features: 13

### F5 — Offline-first (P1) — the wedge
- Entry: any authed surface on connection drop → read cache → compose → outbox → reconnect → sync
- Features: 12

### F6 — View & track assignments (P1)
- Entry: `/servers/:id/assignments` → list → mark to-do/done → reminders
- Features: 15

### F7 — Create server + channels (P2)
- Entry: `/app` → Create server → name/icon → template/channels → invite link → `/servers/:id/:channelId`
- Features: 5

### F8 — Invite + roles/permissions (P2)
- Entry: `/servers/:id/settings` → invite link → roles → assign → remove/ban
- Features: 10, 11

### F9 — Post assignment / pin schedule (P2)
- Entry: `/servers/:id/assignments` → create assignment (title/desc/due) → appears for members → F6
- Features: 15

## Orphan / reachability audit (v4 step 4)
- Every MVP feature (1–16) consumed by ≥1 page. ✓
- Every page connects to ≥1 flow (stubs 2,3 reachable from Landing footer). ✓
- DMs (H2) intentionally absent from MVP map. ✓

## Per-page PDs
`command-center/product/per-page-pd/<page>.md` — full PDs for pages 1, 4–16; stubs for `privacy.md`, `terms.md`. Links resolve after v4 step 3 fan-out.

---

## Regeneration cadence

Rebuild at **T-9 Journey** from current production state cross-referenced with `design/` mockups. See `claudomat-brain/blocks/test/stages/T-9-journey.md` and `command-center/testing/test-writing-principles.md`.
