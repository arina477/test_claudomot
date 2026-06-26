# Product Description — App Home (`/app`)

**Stage:** Self-use-mvp  
**Last updated:** 2026-06-26

---

## Purpose

The app home is the user's landing zone after login—a clean, dark-themed empty state that invites action. Its job is to:
1. Surface the "no server yet" state for new or solo users.
2. Prompt users to join an existing study server (via invite link) or create a new one.
3. Bootstrap the server rail (the spine of the app) once a server is claimed.

This is a **gateway surface**—high-stakes for retention. A confusing empty state kills onboarding; a clear call-to-action hooks users into their first server.

---

## Audience

**Persona:** P1 Student Member (primary); P2 Server Organizer (secondary)  
**Auth state:** Logged in (account created at F1, profile set)  
**Entry points:**
- First app launch after email verification (F1 completion).
- Clicking the app icon in the taskbar when the user has no active server context.
- Explicit "Home" or "Back to hub" link in the server rail (future quality-of-life).

---

## Page Anatomy

### Header
- **Logo + app title** (StudyHall, centered or left-aligned)
- **User profile pill** (top-right): avatar, username, dropdown → "Profile" / "Settings" / "Sign out"

### Hero section
- **Headline:** "Welcome to StudyHall, [Display Name]"
- **Subheading:** "Study smarter together over text, voice, and offline-first messaging."
- **Visual:** Centered empty-state illustration (optional—dark-themed, show servers/channels motif)

### Primary CTA block (card-based layout)
Two equal-width action cards:

1. **"Join a Study Server"**
   - Icon: Link / door-open
   - Copy: "Have an invite link? Paste it here to join a study group."
   - Input field: "Invite code or link" + "Join" button
   - Subtext: "You'll be added with a default member role."
   - Error handling: "Invalid or expired invite" / "You're already a member" / "You're banned from this server"

2. **"Create a New Study Server"**
   - Icon: Plus / spark
   - Copy: "Start your own study space—invite classmates, organize by subject, go offline."
   - Button: "Create Server"
   - Subtext: "You'll be owner. Customize roles and channels."

### Secondary section (once-you-join teaser)
- **Small text preview:** "Once you join or create a server, you'll see it here. Manage multiple servers, switch between them, and stay in sync across channels."
- **Visual cue:** Faded-in preview of a server rail (sample servers, sample channel sidebar) to hint at the main app experience.

### Footer
- **Links:** "Help & FAQ" / "Privacy Policy" / "Status" / dark-mode toggle (if not already in profile settings)

---

## Interactions

| Element | Interaction | Side-effect |
|---------|-------------|------------|
| **"Join a Study Server" input + button** | User pastes invite code and clicks "Join" | F2 flow: validate invite, preview server, assign default role, redirect to that server's default channel |
| **"Create a New Study Server" button** | User clicks | F7 flow: open "Create server" modal (name, icon, template selection), then redirect to server settings or default channel |
| **User profile pill** | Click → dropdown | Show logout, profile, settings options |
| **"Help & FAQ" link** | Click | Open external link or in-app help drawer (out of scope for v0) |
| **Home/back link** (if added) | Click | Stay on `/app` or navigate away from any server context |

---

## Data Requirements

### API calls
- **GET /api/auth/profile** — verify logged-in state; fetch user display name + avatar for the header pill.
- **POST /api/invites/validate** — check if an invite code is valid (called when user submits join).
  - Request: `{ invite_code: string }`
  - Response: `{ valid: boolean, server: { id, name, icon, member_count, channels_visible_to_role }, role_id }`
- **POST /api/servers** — create a new server (called when user clicks "Create").
  - Request: `{ name: string, icon?: string, template?: string }`
  - Response: `{ id, name, icon, default_channel_id }`

### WebSocket subscriptions
None at this stage (no real-time elements on the home page).

---

## Empty / Error / Loading States

### Empty state (happy path)
- User has just logged in; server list is empty.
- Display the full hero + two CTA cards.
- Light illustration + motivational copy ("Your first study server is one click away").

### Loading state
- API calls in flight (validate invite, create server).
- Disable buttons; show spinner on the active button.
- "Creating your server..." / "Checking invite..."

### Error states
1. **Invalid/expired invite:**
   - Red border on input field + error message below: "This invite isn't valid or has expired. Ask the organizer for a new one."
   - CTA: "Try another" (clear input, focus) or "Create instead".

2. **User already a member:**
   - Message: "You're already in this server! Jump in instead."
   - CTA: "Go to server" (redirect to `/servers/:id/:defaultChannelId`).

3. **User banned from server:**
   - Message: "You don't have permission to join this server."
   - CTA: "Request access" (opens a contact form; mailto or in-app appeal — out of scope v0) or "Try another".

4. **Server creation failed:**
   - Message: "Couldn't create your server. Try again or contact support."
   - CTA: "Retry" / "Help".

5. **Network offline during home load:**
   - If the user reaches `/app` offline (rare—must have cached auth), the page degrades gracefully:
   - All CTAs remain clickable (join/create queued locally; sync on reconnect).
   - Toast: "You're offline. Your actions will sync when you're back online."

---

## Responsive Breakpoints

**Desktop (1200px+):** 
- Two CTA cards side-by-side, full-width centered layout.
- Hero section spans full width; user pill fixed in top-right.

**Laptop/smaller desktop (800–1200px):**
- CTA cards may stack vertically if space is tight.
- User pill remains top-right.

**Narrow window (< 800px):**
- Full vertical layout; single-column CTA cards.
- Hero section wraps naturally; font sizes scale down slightly.

**Note:** Mobile out of scope per v0 brief; desktop app (web or Electron) only.

---

## Success Metrics

1. **Invite join success rate:** % of users who start an invite → % who complete F2 (join server). Target: > 75%.
2. **Create server success rate:** % who click "Create" → % who complete F7 (server created + first channel visible). Target: > 80%.
3. **Time-to-first-server:** median seconds from first `/app` load to entering a server. Target: < 30s.
4. **Bounce rate:** % who land on home, see empty state, and leave without action. Target: < 5% for new users (high churn risk).
5. **Return visitors:** % of new users who come back to `/app` after 24h + 7d. Target: > 60% @ 24h, > 40% @ 7d.

---

## Competitor Comparison: Discord parity + StudyHall differentiation

### Discord's "Create Server" UX
- **How Discord does it:** Modal with server name + icon upload. "Start from template" option (Gaming, Study, etc.). Minimal hand-holding.
- **What Discord does well:** Fast, low-friction, templates save a click.
- **Where StudyHall differs:** 
  - Prominent "Join via invite" option (Discord buries this in desktop client; web UX assumes you already have the link).
  - Emphasize **offline-first** in subheading: "go offline" is a StudyHall wedge Discord can't match.
  - Positioning on academic tooling ("organize by subject") vs gaming/social (Discord's default).

### Discord's empty state
- **How Discord does it:** Shows a server list on the left (empty rail), buttons to + a server or browse public servers.
- **What Discord does well:** Rail integration is immediate; the rail is the primary navigation.
- **Where StudyHall differs:**
  - Our rail is the app spine—but `/app` leads *into* the rail experience, not alongside it.
  - We don't have public server discovery in v0 (community/network-effect comes H2), so the empty state is simpler.
  - Clearer separation of "join" vs "create" flows (Discord conflates them in the + menu).

### Privacy & reliability wedge
- **Discord's gap:** No offline mode (flaky internet = broken app). No native academic tools (assignments, scheduling). Privacy concerns (behavioral data for ads, not FERPA-designated).
- **StudyHall's win:** Home page copy quietly emphasizes "offline-first" and "study smarter" (academic framing). Privacy controls deferred to H2, but positioning starts here.

---

## Technical Notes

- Session persistence: redirect unauthenticated users to login; trusted sessions only.
- Invite validation: call the API, do NOT trust client-side parsing (replay attacks).
- Invite codes are URL-safe base64; max 50 char input.
- Once a server is joined, it appears in the rail; user is redirected away from `/app` into the first channel.
- `prefers-color-scheme: dark` is the v0 default; light mode is optional future UX.

---
**Approved design (v9):** `design/app-home.html`
