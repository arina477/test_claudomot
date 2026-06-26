# Invite & Join — `/invite/:code` route [H1 MVP]

**Purpose:** Enable P1 (Student Member) to accept an invite link, preview the server (name, member count, visible channels), and join with a default role. Critical handoff from P2's invite generation (F8) to P1's onboarding (F2). Implements feature 6 (Join server via invite link with preview and default role) and drives member acquisition.

---

## Audience

**Primary:** P1 — Student Member, unauthenticated or authed, clicking an invite link from P2 or from a shared invite code.

**Secondary:** P1 already authed (session exists); can accept invite directly from current account. Unauthenticated P1 is prompted to sign up or log in before joining.

**Auth state:** May be unauthenticated (Anon) OR authenticated (authed). Route is fully accessible to both.

**Role-gating:** None on preview; joining requires a valid session. After join, user's role is determined by server's "default member role" setting (usually "Member"; set by P2 in feature 11).

---

## Entry Points

1. **Invite link in chat/external channel:** e.g., `https://studyhall.app/invite/abc123xyz` (shared by P2 via Discord, email, Slack, etc.). Link targets this route with `:code` param.
2. **Invite code paste:** User can manually enter a code in an "Join by code" input on the server rail (e.g., "Paste invite code here") — routes to `/invite/{code}`.
3. **Deep link from onboarding:** Post-signup flow (F1) offers "Join a server now" with invite input, routing to `/invite/{code}`.
4. **Email invite (H2):** Invite links shared via email include this route. MVP is link-only; H2 adds email invites with pre-filled code.

---

## Content Sections (Page Anatomy)

Full-page flow (not a modal). Dark theme. If authed, user sees server preview + join button; if not authed, user sees preview + sign-up/login prompt.

### Section 1: Loading State (transient)

**Heading:** "Loading server preview..."

**Content:** Spinner centered on screen. This fetches server metadata and invite validity. Very brief (< 1s on good connection).

**Offline behavior:** If offline, this state persists with tooltip "Fetching server preview. Connect to continue."

---

### Section 2: Server Preview (Core)

Displays once invite metadata is loaded (whether authed or not).

**Layout:**
- Center column (500px max on wide; 90% width on narrow); white/dark-card background.
- Header area with server icon + name.
- Channel list (read-only).
- Member count.
- CTA buttons (auth-dependent).

**Header:**
- **Server icon:** 80×80px, centered at top.
- **Server name:** Large heading, centered. E.g., "Organic Chemistry Study Group"
- **Description (if provided by P2):** Optional 1-line description under name. E.g., "Fall 2025 cohort — O-chem section 3"

**Channels section:**
- **Heading:** "Visible channels (as a new member)"
- **Channel list:** Read-only; shows channels the default member role can see. Grouped by category if categories exist.
  - Text channels: # prefix.
  - Voice channels: speaker icon prefix.
  - Format: "# general" or "# questions", "🔊 Study Room".
- **Max channels shown:** 8; if more, show "... and X more channels." (can expand on click; H2 feature).
- **If no channels visible:** "No channels visible to new members yet." (e.g., invite-only server; happens if P2 locked down permissions).

**Member count:**
- "X members" or "X members, Y online" (if presence data available on preview). Small text below channel list.

**Invite validity info (if applicable):**
- If invite has expiry: "Invite expires in 2 hours." or "Expires in 3 days." (countdown format).
- If invite has max uses: "3 spots left." (if limit is close).

---

### Section 3: CTA — Authed vs Unauthed

**If user is authenticated (session exists):**

- **Primary button:** "Join {server_name}" (large, dark-themed, prominent).
- **Secondary button:** "Cancel" (inline, lower visual weight).
- **Optional:** "Already a member? Go to server" (if user is already in this server; detection via `GET /api/invites/{code}/preview`).

**If user is unauthenticated:**

- **Primary button:** "Sign up to join" (routes to signup flow with invite code pre-filled; see F1 + F2 handoff).
- **Secondary button:** "Log in" (routes to login with invite code pre-filled in session store; redirects to this preview after login).
- **Additional text:** "Sign up takes 30 seconds. No credit card needed." (framing to reduce friction).

---

### Section 4: Error States (In-place replacements for Section 2)

**Expired invite:**
- **Heading:** "Invite expired"
- **Body:** "This invite link is no longer valid. Ask the server organizer for a new one."
- **CTA:** "Go to home" (routes to `/app` if authed; routes to `/` home page if not).

**Invalid invite code:**
- **Heading:** "Invite not found"
- **Body:** "This link is broken or was entered incorrectly. Double-check and try again."
- **Input field:** Allow manual code re-entry (e.g., "Paste invite code here"). On Enter, retry.
- **CTA:** "Go to home".

**Invite max-uses exceeded:**
- **Heading:** "Invite limit reached"
- **Body:** "This invite link has reached its max uses. Ask the server organizer for a new one."
- **CTA:** "Go to home".

**User already a member:**
- **Heading:** "You're already a member"
- **Body:** "You've already joined this server."
- **CTA:** "Go to server" (routes to server's default channel).

**Banned from server:**
- **Heading:** "You cannot join this server"
- **Body:** "You're banned from this server. If you believe this is a mistake, contact the server organizer."
- **CTA:** "Go to home".

**Server full:**
- **Heading:** "Server is full"
- **Body:** "This server has reached its member limit. Ask the organizer to increase capacity or wait for someone to leave."
- **CTA:** "Go to home".

**Network error (online):**
- **Heading:** "Couldn't load server preview"
- **Body:** "Check your connection and try again."
- **CTA:** "Retry" (re-fetch preview).

**Offline:**
- **Section 2 state persists** if preview was already fetched (cached).
- **If preview not yet fetched:** "Offline — can't fetch server preview. Connect to continue."
- **Join button behavior (if offline):** "Join" button disabled; tooltip "Connect to join."

---

## Interactions (Elements → Side-Effects)

| Element | Interaction | Side-effect |
|---------|-------------|------------|
| Page load (authed) | Load `/invite/:code` | Fetch `GET /api/invites/{code}/preview`. Show loading spinner. On success, render Section 2 + authed CTA (Section 3). On error, show error state (Section 4). Cache preview in sessionStorage. |
| Page load (unauthed) | Load `/invite/:code` | Fetch `GET /api/invites/{code}/preview` (anon-accessible). Show loading spinner. On success, render Section 2 + unauthed CTA (Section 3). |
| "Join {server}" button (authed) | Click | POST `/api/servers/{server_id}/members` with { invite_code: code }. Show spinner on button; disable. On success: close preview, navigate to server's default channel (e.g., #general). Show toast "Joined {server_name}!" On error: show inline error toast (see Error interaction below). If offline, queue join in outbox; show toast "Queued join — will complete when online." |
| "Sign up to join" button (unauthed) | Click | Store invite code in session store; navigate to `/signup?invite={code}`. After signup completes, auto-accept invite (F1 → F2 handoff). See flow F1 for signup details. |
| "Log in" button (unauthed) | Click | Store invite code in session store; navigate to `/login?next=/invite/{code}`. After login, redirect back to this preview (which now renders authed CTA). |
| "Cancel" button | Click | Navigate back (history.back()) or to `/app` (if authed) / `/` (if not). |
| "Go to home" button (error state) | Click | Navigate to `/app` (authed) or `/` (unauthed). |
| "Go to server" button (already member) | Click | Navigate to server's default channel URL (e.g., `/app/servers/{server_id}/channels/{default_channel_id}`). |
| "Retry" button (network error) | Click | Re-fetch `GET /api/invites/{code}/preview`. Retry state management (max 3 retries, then show fatal error). |
| "Paste invite code" input (manual entry) | Type & Enter | Re-route to `/invite/{code}` with the entered code. |

---

## Data Requirements

**Endpoints:**

- **GET `/api/invites/{code}/preview`**
  - Request: None (GET; code in URL path).
  - Response: 
    ```json
    {
      "server_id": "uuid",
      "server_name": "Organic Chemistry Study Group",
      "server_icon_url": "https://...",
      "server_description": "Fall 2025 cohort",
      "member_count": 42,
      "online_count": 8,
      "channels": [
        {"id": "ch1", "name": "general", "type": "text", "category_id": null},
        {"id": "ch2", "name": "questions", "type": "text", "category_id": null},
        {"id": "ch3", "name": "Study Room", "type": "voice", "category_id": null}
      ],
      "invite": {
        "code": "abc123xyz",
        "created_by": "user_id",
        "created_at": "2025-06-20T...",
        "expires_at": "2025-06-27T..." or null,
        "max_uses": 50,
        "uses": 10,
        "is_expired": false,
        "is_full": false
      },
      "current_user_status": "not_member" | "already_member" | "banned" | null (if unauthed)
    }
    ```
  - Auth: Optional (anon + authed both work).
  - Error codes: 404 (invite not found), 410 (invite expired or max-uses reached), 400 (malformed code).

- **POST `/api/servers/{server_id}/members`**
  - Request: `{ invite_code: string }`
  - Response: 
    ```json
    {
      "membership_id": "uuid",
      "user_id": "uuid",
      "server_id": "uuid",
      "role_id": "uuid", (default member role)
      "joined_at": "2025-06-26T...",
      "default_channel_id": "uuid"
    }
    ```
  - Auth: Requires valid session.
  - Error codes: 404 (server not found), 410 (invite invalid/expired), 409 (already a member), 403 (banned or server full), 401 (no session).

**Local state during flow:**
- Invite code (from URL path; immutable).
- Preview data (cached in sessionStorage after first fetch; can survive back-nav).
- Invite code (if manual entry; stored in component state during retry).

**Offline behavior:**
- **If preview already cached:** Render preview from cache (no network fetch required).
- **If preview not cached and offline:** Show "Offline — can't fetch server preview. Connect to continue."
- **On "Join" click (offline):** Queue `POST /api/servers/{server_id}/members` in the outbox (feature 12). Show toast "Queued join — will complete when online."
- **On reconnect:** Flush queue; on success, show toast "Joined {server_name}!" and navigate to server.
- **Conflict case:** If user is banned or already a member (server-side state changed after offline queue), show inline error on flush: "Can't join — you're already a member" or "You're banned from this server."

---

## Empty/Error/Loading States

**Loading (fetch preview, authed or unauthed):**
- Spinner centered.
- Heading: "Loading server preview..."
- Subtext: "This takes a moment." (manage expectations for slow networks).

**Error — Expired:**
- Icon: clock with strikethrough.
- Heading: "Invite expired"
- Body: "This invite link is no longer valid. Ask the server organizer for a new one."
- CTA: "Go to home"

**Error — Invalid code:**
- Icon: question mark or warning.
- Heading: "Invite not found"
- Body: "This link is broken or was entered incorrectly. Double-check and try again."
- Input: "Paste invite code here" (allow manual re-entry).
- CTA: "Go to home"

**Error — Max uses exceeded:**
- Icon: users with X.
- Heading: "Invite limit reached"
- Body: "This invite link has reached its max uses. Ask the server organizer for a new one."
- CTA: "Go to home"

**Error — Already a member:**
- Icon: checkmark.
- Heading: "You're already a member"
- Body: "You've already joined this server."
- CTA: "Go to server"

**Error — Banned:**
- Icon: prohibition (🚫).
- Heading: "You cannot join this server"
- Body: "You're banned from this server. If you believe this is a mistake, contact the server organizer."
- CTA: "Go to home"

**Error — Server full:**
- Icon: people overflow.
- Heading: "Server is full"
- Body: "This server has reached its member limit. Ask the organizer to increase capacity."
- CTA: "Go to home"

**Error — Network failure:**
- Icon: cloud with X.
- Heading: "Couldn't load server preview"
- Body: "Check your connection and try again."
- CTA: "Retry" (re-fetch).

**Offline (preview already cached):**
- Server preview renders normally.
- Connection-state indicator in header shows "Offline".
- "Join" button disabled; tooltip "Connect to join server."

**Offline (preview not cached):**
- Icon: cloud with X + offline symbol.
- Heading: "Offline"
- Body: "Can't fetch server preview. Connect to internet and try again."
- CTA: "Retry" (re-fetch on connection).

---

## Responsive Breakpoints

**Desktop wide (>1000px):**
- Center column 500px fixed width.
- Server icon 80×80px.
- Channel list 2-column (if >8 channels, show single column instead).
- Buttons full-width (CTA stack vertically).

**Desktop narrow / tablet (600–1000px):**
- Center column 90% width, max 500px.
- Server icon 60×60px.
- Channel list single column.
- Buttons full-width.

**Phone (<600px):**
- Full-screen (padding 20px sides).
- Server icon 50×50px.
- Channel list single column.
- Buttons full-width.
- **Note:** Out of scope (mobile app not planned for MVP), but responsive CSS prepared for H2.

---

## Success Metrics

**North-star indicators:**
- **Invite conversion rate:** % of invite links that result in a successful join (feature 6 adoption).
- **Unauthed-to-authed conversion:** % of unauthed users who click "Sign up to join" and complete signup (signup friction via invite link entry point).
- **Invite redemption speed:** Time from invite link clicked to join completed (measures friction).
- **Offline join queue success:** % of offline join attempts that successfully flush on reconnect (validates offline-first feature 12 for joins).

**Secondary:**
- **Preview load latency:** Time to fetch and render preview (network performance indicator).
- **Error rate by type:** Breakdown of 404 / 410 / 409 / 403 errors (signals misconfigured invites, expired codes, over-used invites, or bans).

**Instrumentation:**
- Track event `invite.preview_loaded(server_id)`.
- Track event `invite.join_started(invite_code, auth_state)` (authed vs unauthed).
- Track event `invite.join_completed(server_id, invite_code)` on POST success.
- Track event `invite.join_failed(error_code)` on POST failure.
- Track event `invite.signup_initiated(invite_code)` if unauthed → sign up.
- Track event `invite.signup_completed(invite_code)` if unauthed signup succeeds.
- Track page load time (preview render latency).

---

## Competitor Comparison

**vs Discord (Tier-1 benchmark):**

- **Discord parity:** Both show a server preview before join (icon, name, member count, visible channels). Discord's invite link model is similar.
- **StudyHall advantage:** Default role is simpler (Discord has complex role hierarchy; StudyHall MVP defaults to "Member" with readable channels only). Invite preview is faster (StudyHall caches; Discord is dynamic). Offline queueing (feature 12) allows offline join in StudyHall; Discord requires internet.
- **Discord strength:** Invite expirations and max-uses are more granular (StudyHall MVP has basic support; H2 can expand). Discord's bot-driven invite management is more flexible (StudyHall MVP is owner-only; feature 11).

**vs Microsoft Teams (Tier-1 benchmark, academic dimension):**

- **Teams model:** Only institutional admins can send invites. Students receive a "Join team" link generated by IT. No preview (Teams expects institutional context to be known).
- **StudyHall advantage:** P2 (student organizer) generates invites without institutional gatekeeping. P1 (any student) can join instantly via preview. No approval step. This is the core "student self-provisioning" wedge.
- **StudyHall weakness:** MVP invite management is simpler (no bulk invites, no enrollment codes, no class roster imports). H2+ can add these features.
- **Conclusion:** StudyHall's invite-accept-join flow is the opposite of Teams' institutional-approval model — enabling rapid, peer-driven onboarding.

**Offline differentiation:** If user is offline after joining, the outbox queue (feature 12) persists the join and syncs on reconnect. Discord and Teams both require internet; offline users see a broken experience.

---

## Notes

- **Preview caching strategy:** SessionStorage (persists through back-nav within same session; clears on browser close). If preview is stale (server details changed), user can refresh page to re-fetch.
- **Invite code length:** 12–16 alphanumeric chars (case-insensitive for UX; backend normalizes to lowercase). Examples: `abc123xyz456`, `StudyGrp2025`.
- **Invite link format:** `https://studyhall.app/invite/{code}` (or custom domain if deployed). Short URLs (H2 feature) can use a custom shortener or QR codes.
- **Default member role:** Configured per-server by P2 in server settings (feature 11, role management). Common default: "Member" (can read all channels, cannot edit server or ban). More restrictive defaults (e.g., "Guest" with limited channel access) can be set by P2.
- **Presence data on preview:** Member count is always available; online count is fetched but optional (may omit if presence service is slow). Fall back to member count only if latency > 500ms.
- **Channel visibility filtering:** Only channels the default member role can see are shown in the preview. If P2 has locked down permissions (no visible channels), show "No channels visible to new members yet." to signal a permission mismatch.
