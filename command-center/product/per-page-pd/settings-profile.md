# Settings — Profile — StudyHall

**Route:** `/settings/profile`  
**Related features:** 1 (auth), 2 (customizable user profile), 3 (dark-theme app shell), 16 (privacy controls)  
**Related flows:** F1 (sign up & create profile)

---

## Purpose

The profile settings page is the control center for a student's identity and appearance within StudyHall. It allows users to update their username, display name, avatar, and accent color — personalizing their presence in study servers and establishing a cohort identity. Along with settings-privacy.md, this page is part of the account settings suite that gives students control over their StudyHall experience.

The page also reinforces dark-theme ownership (MVP ships in dark mode only; no light-mode toggle present) and sets expectations for privacy-first design (no telemetry, no profile tracking, no ads).

---

## Audience

**Primary persona:** P1 (Student Member), authenticated  
**Auth state:** Required — logged-in session with valid JWT  
**Entry point:** Settings menu in app header / left sidebar ("Settings" gear icon)  
**Use case:** Personalizing profile on first signup (F1 step 4) or later updating appearance/username after joining servers

---

## Entry Points

1. **First signup completion (F1):** After verifying email (step 2), user lands at `/settings/profile` with a fresh form and a "Finish setup" heading (nudge to complete). CTA: "Save & continue to [Server]" or "Save & explore servers".
2. **Settings menu (ongoing):** User clicks gear icon in app header or left sidebar → dropdown menu → "Profile" → routes to `/settings/profile`.
3. **Deep link:** Direct navigation to `/settings/profile` if session is valid.
4. **Post-join onboarding:** After first server join (F2), a small toast may prompt "Complete your profile" with a link to `/settings/profile`.

---

## Content Sections (Page Anatomy)

### Header / Navigation
- **Breadcrumb or back button:** "← Back" or "Settings › Profile" (breadcrumb style)
- **Page title:** "Profile Settings" (H1)
- **Right-side action (optional):** "Preview profile" button (toggles a read-only preview modal showing how the profile card appears in the server member list)

### Avatar section (top-center or left)

**Avatar upload:**
- **Current avatar:** Circular display of current avatar (or default initials if none)
- **Upload control:** "Change avatar" link / button (hovering shows overlay with camera icon + "Upload photo")
- **File picker:** Clicking opens native file picker; accepted formats: `.jpg`, `.png`, `.gif`, `.webp`; max size 10MB (enforced by browser + server validation)
- **Upload preview:** After selection, show a cropping tool (simple 1:1 square crop with aspect-lock; allow zoom + drag). Buttons: "Crop" (submit) or "Cancel" (discard)
- **Upload state:** Spinner + "Uploading..." (disabled) → on complete, avatar refreshes in real-time
- **Error message:** If upload fails, toast: "Couldn't upload avatar. Try a smaller file or another format." Retry available.
- **Offline:** Upload button disabled with tooltip "Go online to upload an avatar."

### Profile form (center or right column)

**Username field:**
- **Label:** "Username" (required, marked with *)
- **Input:** Text field, max 32 characters, alphanumeric + underscore allowed (no spaces)
- **Placeholder:** "e.g., alex_study"
- **Hint text (small, gray):** "Unique across StudyHall. Used to mention you in messages. Can't be changed after 30 days." (conservative; may relax later)
- **Real-time validation:** On blur or keyup (debounced 500ms), check availability via `GET /api/users/check-username?username=...`. Show inline feedback: ✓ "Available" (green) or ✗ "Already taken" (red).
- **Focus state:** Border highlight in accent color.

**Display name field:**
- **Label:** "Display name" (optional, marked as such)
- **Input:** Text field, max 64 characters
- **Placeholder:** "e.g., Alex Smith"
- **Hint text:** "How you'll appear in voice channels and member lists. Can contain spaces and emoji."
- **Real-time character count:** "[40/64]" (small, right-aligned)
- **No validation beyond length** (allows full UTF-8, including emoji).

**Accent color picker:**
- **Label:** "Accent color" (optional; visual customization)
- **Control:** Color swatch + label or color picker (clickable swatch opens color picker modal)
- **Options:** Preset 8–12 colors (curated from design system; e.g., `#7c3aed` purple, `#06b6d4` cyan, `#ec4899` pink, `#f59e0b` amber, etc.)
- **Current selection:** Highlighted with a checkmark or border
- **Custom color (optional MVP feature):** If not MVP, defer; include a "Suggest a color" feedback link for H2
- **Preview:** Accent color appears in real-time on buttons, link hover states, and the profile preview card (if modal is open)
- **Hint text:** "Accent color appears in your profile card and message reactions."

### Theme section (read-only in MVP)

**Dark theme setting:**
- **Label:** "Theme" (non-interactive in MVP)
- **Current value:** "Dark" (visual badge with moon icon, gray)
- **Explanation text (small):** "StudyHall is optimized for dark mode. Light theme is coming in a future update."
- **No toggle / no CTA** — reinforces that MVP is dark-only (simplifies design system maintenance)

### Session / Security section (bottom of form; optional MVP, likely H2)

**Active sessions (optional; deferred to H2):**
- Placeholder text: "Session management coming soon. You can sign out of your account below."
- Not interactive in MVP.

### Form actions (bottom)

**"Save changes"** (primary button)
- Disabled if no changes detected (compare current form state to initial loaded state)
- On click:
  - Validate: username required, max lengths, username not taken (if changed)
  - Disabled state with spinner + "Saving..."
  - POST to `PATCH /api/me/profile` (or PUT; see data requirements)
  - On success: toast "Profile saved!" + form resets to new state
  - On error: inline error message or toast; focus returned to first errored field
- Offline: Disabled with tooltip "Go online to save profile changes."

**"Cancel"** (secondary button)
- Discards unsaved changes, form reverts to last saved state
- No confirmation if no changes; confirmation modal if changes pending ("Discard changes to [fields]?")

**"Sign out"** (destructive link, bottom-left or right, if not in separate security section)
- Click → confirmation modal: "Sign out? You'll need to sign in again to use StudyHall."
- On confirm: `POST /api/auth/logout` → clears session → routes to landing.md
- Offline: Still functional (local session cleared immediately; sync on reconnect)

### Profile preview card (optional modal or sidebar)

**"Preview profile" button (top-right of form):**
- Opens a modal showing the user's profile card as it appears to others in a server member list
- **Profile card content:**
  - Avatar (large circle)
  - Display name (H3)
  - Username (@alex_study, gray)
  - Accent color swatch (small circle of chosen color)
  - Status (e.g., "Online" / "Idle" / "Do Not Disturb") — dummy for MVP; tied to presence in future
  - "Message" button (CTA; opens DM composer in H2; disabled in MVP with note "Direct messages coming soon")
- **Purpose:** Lets user verify their appearance before saving
- **Close:** Clicking outside modal or X button closes it
- **Sync:** If user changes accent color in the form, preview updates in real-time

### Integrations / Connected accounts section (H2+, not MVP)

- Placeholder section: "Connected accounts: Sign in with Google, GitHub (coming soon)"
- Not interactive in MVP.

---

## Interactions (Elements → Side-effects)

### Avatar upload
- Click "Change avatar" → file picker opens
- Select file → preview crop tool shows
- Adjust crop → click "Crop" → `POST /api/me/avatar` (multipart/form-data) with cropped image
- Success: Avatar in form + real-time update in app header + any open server member lists
- Error: Toast message; file picker can be re-opened to retry

### Username availability check
- User types in username field
- Blur event or debounced keyup (500ms) triggers `GET /api/users/check-username?username=alex_study`
- Response: `{ available: true }` or `{ available: false }`
- UI updates with inline ✓ or ✗ indicator
- If not available, submit button remains enabled (user can force-save and see server-side error, or change username)

### Accent color selection
- Click on color swatch → picker opens (modal or inline dropdown)
- Click color option → picker closes, swatch updates, form marks as "dirty" (unsaved)
- Form's preview card (if open) updates accent color in real-time

### Save profile
- Click "Save changes" button
- Validate: username required, no > limits, username not taken (if changed)
- If validation fails: inline error on field + focus moved
- If valid: `PATCH /api/me/profile` sent with payload:
  ```json
  {
    "username": "alex_study",
    "display_name": "Alex Smith",
    "accent_color": "#7c3aed",
    "avatar_id": "avatar_uuid_from_upload"
  }
  ```
- Server response: `{ success: true, profile: { ... } }`
- Form state updates + toast: "Profile saved!"
- If 409 Conflict (username taken): Inline error "Username already taken" + focus on field

### Sign out
- Click "Sign out" button
- Confirmation modal: "Sign out? You'll need to sign in again to use StudyHall."
- Click "Confirm" → `POST /api/auth/logout`
- Session cleared, routes to landing.md
- Browser tab shows "Sign in" / "Sign up" CTAs

### Preview profile (optional)
- Click "Preview profile" → modal opens showing profile card
- Edit form in background; modal updates in real-time
- Close modal → continue editing

---

## Data Requirements

### API endpoints (placeholder names)

#### Read (GET)
- **`GET /api/me`** (or `GET /api/users/me`, per existing auth pattern)
  - Response: `{ id, email, username, display_name, avatar_id, accent_color, created_at, updated_at }`
  - Used on page load to pre-fill form

- **`GET /api/me/avatar`** (if fetching current avatar)
  - Response: Redirects to CDN URL or returns pre-signed URL for avatar image
  - Typically cached on first load

- **`GET /api/users/check-username?username=alex_study`**
  - Response: `{ available: true }` or `{ available: false }`
  - Rate-limited (50 req/hour per IP) to prevent scraping
  - Used for real-time validation

#### Write (PATCH, POST)
- **`PATCH /api/me/profile`** (or PUT, depending on API convention)
  - Body: `{ username?, display_name?, accent_color? }`
  - Response: Updated user object
  - Errors: 400 (validation), 409 (username taken), 429 (rate-limited if username changed too often)
  - **Offline queuing:** If user saves while offline, queue this request + sync on reconnect

- **`POST /api/me/avatar`** (multipart/form-data)
  - Form field: `file` (binary, cropped image)
  - Response: `{ avatar_id, avatar_url }`
  - Size limit: 10MB (enforced browser + server)
  - Processing: Server resizes to 256×256 for profile card, 512×512 for voice room tiles; stores in object storage (feature 2 dependency)
  - Errors: 413 (file too large), 415 (unsupported media type), 500 (processing failed)

- **`POST /api/auth/logout`**
  - Body: empty
  - Response: 200 OK
  - Side effect: Session cookie cleared (if using cookie-based auth) or token blacklisted (if JWT)

### Session / auth details
- **Session persistence:** User lands on `/settings/profile` with an active session. Session can be read from JWT (localStorage) or HttpOnly cookie. If session expired, page redirects to `/auth/signin` with a return URL.
- **Username collision:** Usernames are globally unique (across all servers; username is a system-wide identity). Check uniqueness on blur + server-side re-validate on save.

### Local storage (offline support)
- **Profile form state:** Store draft values in localStorage under key `draft:profile` (e.g., `{ username_draft: "alex_study", display_name_draft: "Alex Smith" }`).
- **Avatar cache:** Cache avatar image URL + metadata in localStorage (no file blob; too large). On offline load, show cached avatar.
- **Sync on reconnect:** If user saved while offline, flush `PATCH /api/me/profile` on reconnect. Avatar upload stays queued if file blob is not retained (avatar uploads may be deferred to H2 offline flow).

### Data model schema (reference)
```
users table:
  id: UUID (PK)
  email: String (unique)
  username: String (unique, indexed)
  display_name: String (nullable)
  avatar_id: UUID (FK to file_metadata table, nullable)
  accent_color: String (hex color, default null or system default)
  password_hash: String (bcrypt)
  email_verified: Boolean
  created_at: DateTime
  updated_at: DateTime
  last_login: DateTime (nullable)
  is_active: Boolean (soft-delete via flag)

file_metadata table:
  id: UUID (PK)
  user_id: UUID (FK)
  filename: String
  mime_type: String
  size: Int (bytes)
  storage_path: String (S3 key)
  type: Enum("avatar", "attachment", ...)
  created_at: DateTime
```

---

## Empty / Error / Loading States

### Loading (page first load, no cached profile)
- Skeleton loaders: Avatar circle placeholder (gray pulse), 2–3 form fields with gray placeholder bars (400ms animation)
- Duration: Typical load <1s; spinner persists if >2s
- Fallback: After 5s, show error state "Couldn't load profile. Try refreshing."

### Loaded, no changes
- Form displays current profile data (username, display name, accent color, avatar)
- "Save changes" button disabled (grayed out, text: "No changes")
- User is ready to edit

### Unsaved changes
- "Save changes" button enabled (highlighted)
- No auto-save (requires explicit click to prevent accidental overwrites)

### Username taken (real-time validation)
- User types username, blur event triggers availability check
- Server responds: `{ available: false }`
- Inline feedback (red ✗): "Username already taken. Try another."
- "Save changes" button remains enabled (user can attempt save and see full error)

### Validation error (on save)
- User tries to save with invalid data (e.g., username > 32 chars)
- Inline error on field: "Username must be 32 characters or less."
- Focus moved to errored field
- "Save changes" button remains enabled; user can retry after fixing

### Server error (save fails with 500)
- Toast message: "Couldn't save profile. Please try again."
- Form state rolls back to last saved state (user's edits are lost; no partial save)
- Retry button in toast; clicking re-sends `PATCH /api/me/profile`

### Offline (no internet)
- Avatar upload button disabled: "Go online to upload avatar"
- "Save changes" button disabled: "Go online to save profile"
- Username availability check still shows last-known result (cached from last online session); no real-time check while offline
- User can compose changes locally (form allows edits); changes queue + sync on reconnect

### Session expired
- User navigates to `/settings/profile` after session expired
- Redirect (automatic via auth guard) to `/auth/signin?return_url=/settings/profile`
- User signs back in → redirected to `/settings/profile` to continue

### Avatar upload too large
- User selects file >10MB
- Browser file input may prevent selection (if max size set); if not caught, server responds 413
- Error toast: "Avatar must be smaller than 10MB."

---

## Responsive Breakpoints

### Desktop (≥960px)
- **Layout:** Two-column: Avatar + upload (left, ~200px wide) + form fields (right, responsive)
- **Form fields:** Full width; labels above inputs (stacked)
- **Color picker:** Dropdown opens downward, aligned to button
- **Preview button:** Right-aligned in header; preview modal centered (60–70% viewport width)

### Tablet (600–960px)
- **Layout:** Single column: Avatar (top, centered) + form fields (below)
- **Form fields:** Full width
- **Color picker:** Takes up full width (modal-style picker, not dropdown)
- **Preview button:** Below page title

### Mobile (if supported in future; <600px)
- **Out of scope for MVP.** Settings pages route to landing ("StudyHall is optimized for desktop").
- **Fallback:** Responsive stylesheet hides settings routes; user sees "Not available on mobile" message.

---

## Success Metrics

### Adoption
1. **Profile completion rate:** % of new signups (F1) who finish the profile form + save. Target: ≥80% (expected high since F1 walks user through this).
2. **Profile return rate:** % of members who revisit `/settings/profile` after initial signup. Target: ≥30% (suggests personalization is valued; expected lower for MVP).
3. **Avatar upload rate:** % of members with a custom avatar. Target: ≥40% (avatar is the highest-value personalization; helps presence in voice rooms).

### Engagement
- **Username change frequency:** Member changes username within 7 days of signup. Target: <10% (expected low; usernames are sticky identity).
- **Accent color adoption:** % of members with a non-default accent color. Target: ≥25% (nice-to-have personalization; indicates cohort identity play).
- **Display name adoption:** % of members with a custom display name vs. just username. Target: ≥50% (expected moderate; helps readability in member lists).

### Usability
- **Time to save profile:** From page load to first save click. Target: median <90 seconds (should be quick; users may want to get to servers).
- **Avatar upload success rate:** % of avatar uploads that complete (no errors). Target: ≥95%.
- **Error rate on username check:** % of username availability checks that fail. Target: <1% (API should be highly available).

### Business metrics (H2+)
- **Profile uniqueness (cohort identity):** Measure variance of accent colors + avatars across a server cohort. Target: High variance (indicates customization is being used to express individuality).
- **Retention lever:** Students with custom avatars have higher 7-day retention than those without. Target: 10%+ uplift (hypothesis; test via cohort analysis).

---

## Competitor Comparison

### vs. Discord (Tier 1 benchmark)
| Dimension | Discord | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Avatar upload** | ✓ Supported; integrates with banner/profile card | ✓ Supported; same surface | Parity. Both allow custom avatars. |
| **Username customization** | ✓ Usernames are unique globally; @-mention system | ✓ Usernames unique globally; @-mention system | Parity. |
| **Display name vs. username** | ✓ Discord allows separate display name (per-server nickname) + global username | ✓ StudyHall allows global display name + username | StudyHall simplifies: global display name (no per-server nickname complexity). Discord's per-server nicknames add choice; StudyHall's single identity is cleaner for academics. |
| **Color customization** | ✓ Four theme choices (Ash, Dark, Onyx, custom accent via Nitro) | ✓ Accent color choice (dark theme only, MVP) | Discord has more themes (paid feature in Nitro); StudyHall has accent color. Parity for MVP. |
| **Theme toggle** | ✓ Light / Dark / multiple dark themes | ✓ Dark only (MVP) | Discord wins; StudyHall deferred light theme to H2 (MVP focus on dark-first design). |
| **Session management** | ✓ Active sessions dashboard (per-device, sign-out from device) | ~ Placeholder (H2) | Discord wins; StudyHall deferred multi-device session management to H2. |

**Key positioning:** "Same identity controls as Discord, simpler. Your profile is your presence in study servers — no alt accounts, no per-server nicknames to manage."

### vs. Notion (Tier 2 secondary)
| Dimension | Notion | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Profile customization** | ~ Notion workspaces have creator profiles; limited personalization (avatar, workspace role) | ✓ Full profile settings (avatar, username, display name, accent color) | StudyHall's profile is richer; Notion's is backend-focused. |
| **Username / public identity** | ✗ Notion doesn't use global usernames; profile is workspace-scoped | ✓ Global username across all servers | StudyHall enables cross-server identity (students can be "alex_study" everywhere). Notion is document-centric, not identity-centric. |
| **Appearance customization** | ~ Notion allows workspace icon + color; user-scoped customization limited | ✓ Avatar, display name, accent color | StudyHall empowers individual identity; Notion empowers workspace branding. Different use case. |

**Key positioning:** "Your profile in StudyHall is how peers recognize you across study servers. Unlike Notion's document workspaces, StudyHall is a social platform with shared identity."

### vs. Microsoft Teams
| Dimension | Teams | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Avatar upload** | ✓ Azure AD / Microsoft account photo; custom upload | ✓ Custom upload (no institutional directory tie-in) | StudyHall's is simpler (no AD sync); Teams' is stronger for enterprise. For student use: parity. |
| **Display name** | ✓ Full name from institutional directory; editable | ✓ Custom display name (no directory sync) | Teams enforces institutional naming; StudyHall allows student pseudonym / preferred name. StudyHall advantage for privacy / pseudonymity. |
| **Accent color / theme** | ✓ Theme colors per Teams channel/team; limited user customization | ✓ User-scoped accent color | StudyHall's is simpler (personal choice); Teams' is team-scoped (branding). Different focus. |
| **Session management** | ✓ Rich session dashboard (per-device, sign-out remote) | ~ Deferred to H2 | Teams wins; StudyHall MVP lacks multi-device session management. |

**Key positioning:** "Your profile is yours, not tied to institutional directory. Choose your own identity in StudyHall; Teams syncs from your school's directory."

---

## Offline-first behavior

**On profile edit:**
- If user edits username/display name/accent color while online, changes sync immediately.
- If user edits while offline, form allows edits; clicking "Save" queues the `PATCH /api/me/profile` request locally.
- On reconnect, queued request flushes automatically.

**Avatar upload offline:**
- Upload button disabled with tooltip "Go online to upload avatar."
- Reason: Avatar file is large (>1MB); queuing the file blob in local storage is inefficient. Defer avatar uploads to when online. (This can be improved in H2 with a better offline upload queue strategy.)

---

## Ownership & Review Checklist

- **Product review (P-2 Spec):** Feature spec embedded in task description. Theme (dark-only MVP) confirmed. Username uniqueness rule finalized.
- **Design review (D-3 Review & Adopt):** Avatar upload flow (crop tool) designed. Form layout approved (avatar left, form right on desktop). Color picker options (8–12 preset colors) finalized. Dark-theme tokens verified (all text ≥4.5:1 contrast).
- **Engineering review (B-4 Specification):** Avatar resize pipeline confirmed (256×256 + 512×512 variants). Username availability check rate-limited. File size enforced (10MB browser + server validation).
- **QA review (T-2 Integration):** Test matrix: avatar upload (various formats/sizes), username check (cached + fresh), save offline + reconnect, session expiry redirect, 409 conflict on save.
- **Accessibility audit (T-3 Accessibility):** Form labels linked to inputs (for attribute). Focus states on all buttons. Color contrast verified. Accent color picker includes text labels (not color-only). ARIA labels on upload control.
- **Launch checklist (V-1 Review):** Confirmation toast text finalized. Error messages written in plain language. Help text added to fields. Avatar crop tool documented (in-app or help article).

---

## Implementation notes

### Tech stack guidance (for B-block)
- **Form state:** Use React Hook Form or similar for lightweight form management (username validation, dirty detection, error handling).
- **Avatar crop tool:** Use a lightweight library (e.g., react-easy-crop or Cropper.js) to avoid bulk. Cropping happens client-side before upload.
- **Color picker:** Use system color picker if native (e.g., `<input type="color">`) or a lightweight custom picker (Radix UI or Headless UI for accessibility).
- **API calls:** Reuse the project's HTTP client (likely Axios or Fetch); implement retry logic for flaky networks.
- **Real-time validation:** Debounce username check to 500ms to avoid hammering the server.
- **Offline support:** Reuse feature 16's data-persistence layer (IndexedDB or equivalent) to queue profile changes if offline.

### Design system tokens
- **Form labels:** Body Bold (font weight 600)
- **Placeholder text:** `--color-text-subtle` (lighter gray)
- **Error text:** `--color-error` (red, ≥4.5:1 contrast on dark background)
- **Success text:** `--color-success` (green)
- **Input focus:** Outline: 2px solid `--color-accent`
- **Button primary:** Background `--color-accent`, text white
- **Button secondary:** Border `--color-border`, text `--color-text-primary`
- **Avatar circle:** Border `--border-subtle`, size 120px (desktop), 100px (tablet)

### Accessibility considerations
- **Form labels:** Always visible; associated to inputs via `<label for="username">` (not placeholder-only).
- **Focus management:** On error, focus moves to first errored field; browser announces error via ARIA live region.
- **Color picker:** Includes text labels (e.g., "Purple" next to swatch) so color choices are not color-blind-dependent.
- **Keyboard navigation:** Tab through all interactive elements (inputs, buttons, color swatches). Enter to submit form. Escape to close preview modal.
- **Heading structure:** Page title = H1. Form sections (Avatar, Username, etc.) can use H2 if structured; otherwise body text (not headings).

---

## Deferred features (H2+)

1. **Light theme support:** Implement light-mode toggle; choose between light/dark/auto (system preference). Sync theme choice across devices.
2. **Session management dashboard:** Show active sessions (browser, IP, last active). "Sign out from this device" / "Sign out from all other devices" buttons.
3. **Pronouns field:** Add optional pronouns input (e.g., "she/her"). Displayed in profile card + voice room tiles (inclusive design).
4. **Bio / status:** Add optional short bio ("e.g., CS major, loves study groups") + status emoji ("Studying", "On break", "Available for collabs").
5. **Social links:** Add optional social media / portfolio links (Discord, GitHub, portfolio URL). Displayed in profile card.
6. **Password reset:** Integrate password change flow (separate from avatar/display name; may be own `/settings/security` page).
7. **Account deletion:** Add "Delete account" option with confirmation + data download option (feature 16 data export).
8. **Two-factor authentication (2FA):** TOTP-based 2FA setup (FIDO2 in H3 for higher-ed institutions).

---

## Cross-reference

- **Feature list:** Feature 1 (auth), 2 (customizable profile), 3 (dark theme), 16 (privacy controls)
- **User flows:** F1 (sign up & create profile)
- **Tools/modules:** User / profile management, File upload, Authentication
- **Related pages:** Landing (hero CTA leads to F1 → this page), settings-privacy (account data includes profile info), server settings (member list shows profile cards)
- **Competitive benchmarks:** Discord (avatar, username, theme), Notion (workspace creator profile), Teams (Azure AD + custom avatar)


---
**Approved design (v9):** `design/settings-profile.html`
