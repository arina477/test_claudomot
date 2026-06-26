# Create Server — `/app` modal/flow [H1 MVP]

**Purpose:** Enable P2 (Server Organizer — student-as-admin) to quickly spin up a study server with sensible defaults, then customize channels/categories and distribute an invite link to their cohort. The "self-provisioning" wedge vs Teams (which blocks student-created spaces). Directly implements feature 5 (Create server + channels/categories) and feeds F8 (invite → member management).

---

## Audience

**Primary:** P2 — Student Member wearing an admin hat (course rep, cohort lead, study-group founder). Must be authed. Non-gated; any authenticated student can create a server.

**Secondary:** P1 landing in empty app (no servers joined yet) sees "Create a server" prompt as entry point. Not gated — all users can create.

**Auth state:** Must have a valid session (login required).

---

## Entry Points

1. **"Create a server" button** in server rail (left sidebar) when no servers exist. Prominent, dark-themed, discoverable.
2. **"Create a server" menu item** in the server rail context menu (right-click or "+" button) — always available, even if user is already a member of servers.
3. **Programmatic deep link:** `/app?action=create-server` (e.g., from invite accept, onboarding flow).

---

## Content Sections (Page Anatomy)

Modal-based flow (layered on top of the main app, dismissible). Dark theme applied throughout.

### Section 1: Server Name & Icon (Step 1)

**Heading:** "Create a study server"

**Form fields:**
- **Server name** (text input, required, max 80 chars): label "Server name", placeholder "e.g., Organic Chemistry Fall 2025", focus on load.
- **Server icon** (optional, file upload or preset picker): label "Icon (optional)", allow upload (JPEG/PNG max 2MB) or pick from 12 preset emoji/icon templates (flask, books, mortarboard, microscope, etc.). Show preview inline.

**CTA:** "Next" (primary button, disabled until name filled).

**Error states:**
- Empty name: tooltip "Server name required."
- Name > 80 chars: inline validation "80 characters max."
- Icon upload > 2MB: "File too large (max 2MB)."
- Offline (no net): form inputs remain editable; "Next" button disabled with tooltip "Connect to internet to create."

---

### Section 2: Template or Blank (Step 2)

**Heading:** "Choose a template or start blank"

**Template options** (card-based, 3-column grid on wide window, single column on narrow):

1. **"Class cohort"** (recommended, badge)
   - Description: "Perfect for study groups — ready-made channels + voice room."
   - Channels created: #general (text), #questions (text), Study Room (voice)
   - Categories: none (flat by default)

2. **"Subject study"**
   - Description: "Organize by topic — multiple categories for unit breakdowns."
   - Channels: #announcements, #general, Study Room
   - Categories: (empty; user adds topics in step 3)

3. **"Blank slate"**
   - Description: "Empty server — you build the structure."
   - Channels: none
   - Categories: none

**CTA:** Click a template card to select, or select "Blank slate", then "Next".

**Empty/error states:**
- Offline: cards display; "Next" is disabled with tooltip "Connect to create."

---

### Section 3: Channels & Categories (Step 3)

**Heading:** "Set up channels and categories" (skipped if Blank slate selected; user can edit later in server settings).

**Layout:** Two-column (narrow: single column stacking); left = channel list, right = editor.

**Left panel — Channel list:**
- **Categories** (if template has them):
  - Collapsible category headers (chevron icon).
  - Editable inline: category name, delete button (X icon). Double-click to rename.
  - "Add category" button at bottom.
- **Channels under each category (or top-level if no categories):**
  - Channel type indicator (# for text, speaker icon for voice).
  - Editable inline: channel name, delete button.
  - Drag-and-drop to reorder (visual feedback: highlight + drop indicator).

**Right panel — Add/edit:**
- If "Add category" clicked: form to enter category name, "Save" / "Cancel".
- If "Add channel" clicked (button at bottom of left panel):
  - Type selector: "Text channel" / "Voice channel" radio buttons.
  - Name input (required, max 80 chars).
  - Description (optional, max 200 chars, for text channels only).
  - "Create" / "Cancel" buttons.
- If a channel is selected (click to select): show name, type, description editable; delete button.

**Default view (if template):** Template channels pre-populated; user can delete/rename/reorder before proceeding.

**CTAs:** "Create server" (primary, enabled after step 1 filled; will create with current channel structure); "Back" (secondary).

**Interaction details:**
- Reorder via drag-and-drop with visual feedback (gray highlight, drop zone indicator).
- Delete a channel/category: confirmation toast "Delete #channel-name? This cannot be undone." (2 buttons: "Delete" / "Cancel").
- Offline: all inputs remain editable; "Create server" button disabled with tooltip "Connect to finalize server creation."

---

## Interactions (Elements → Side-Effects)

| Element | Interaction | Side-effect |
|---------|-------------|------------|
| "Next" (step 1→2) | Click | Validate name; proceed to template picker. If offline, show toast "Connect to continue." |
| Template card | Click | Select template; pre-populate step 3 channels; proceed to step 3. |
| "Next" (step 2→3) | Click | Proceed to channel customization; display template's default channels. |
| Channel name input | Type | Inline validation: max 80 chars; greyed-out "Create" if empty. |
| Add category button | Click | Reveal form on right panel; focus category-name input. |
| Category name input | Type | Max 50 chars; validation inline. Save on Enter or "Save" button. |
| Delete channel (X) | Click | Toast: "Delete #general?" with "Delete" / "Cancel" buttons. On "Delete", remove from list; reindex categories if empty. |
| Drag channel | Drag-drop | Visual highlight; drop-zone indicator below target; reorder on drop. Persist reorder in local state until server creation. |
| "Create server" button | Click | POST `/api/servers` with { name, icon (file blob or preset ID), channels: [{name, type, description, category_id}], ...}. On success: close modal, navigate to server's default text channel (or #general if template). Show toast "Server created." On error (name conflict OK — servers not globally unique; network error; quota): show inline error toast below button. If offline: disable button. |

---

## Data Requirements

**Endpoints:**

- **POST `/api/servers`**
  - Request: `{ name: string, icon?: {file: Blob} | {preset_id: string}, channels: [{name, type: 'text'|'voice', description?, category_id?}], categories: [{id, name}] }`
  - Response: `{ server_id, name, icon_url, channels: [{id, name, type}], owner_id, created_at }`
  - Auth: Requires valid session; server.owner_id set to current user.
  - Error codes: 400 (name missing, name > 80 chars, channel name > 80 chars), 401 (no session), 413 (icon > 2MB), 500 (server error).

- **POST `/api/servers/{server_id}/upload-icon`** (if user uploads a custom icon)
  - Request: Multipart form-data with `icon` file.
  - Response: `{ icon_url }`
  - Auth: Owner or role with permissions.
  - Error codes: 400 (file format), 413 (file size), 404 (server not found).

**Local state during flow:**
- Form draft: `{ name, icon_preview_url, template_selected, channels: [...], categories: [...] }` stored in React component state (not persisted to IndexedDB until offline queue fires).

**Offline behavior:**
- All form inputs remain editable while offline.
- On "Create server" click while offline: queue `POST /api/servers` in the outbox (feature 12, offline-first messaging module). Show toast "Queued — will create when online."
- On reconnect: flush queue; on success, show toast "Server created."
- If queue item fails on flush: show inline error toast below the "Create server" button with a "Retry" option.

---

## Empty/Error/Loading States

**Loading (form submission in progress):**
- "Create server" button shows spinner; disable to prevent double-submit.
- Rest of form remains visible but inert (inputs disabled).
- Inline subheading above button: "Creating server..."

**Error — Name conflict:**
- Toast below "Create server": "A server with that name already exists locally. Rename and try again." (Server names are not globally unique; only unique per user, so conflict = name clash in current user's server list.)
- Form remains open; user can edit name and retry.

**Error — Network failure (online):**
- Toast below "Create server": "Failed to create server. Check your connection and try again." (with "Retry" button).
- Form remains open.

**Error — Icon upload too large:**
- Inline error under icon upload: "File too large (max 2MB). Try a smaller image."
- Form remains open; user can pick a preset or upload a smaller file.

**Offline state (no internet):**
- All form inputs remain editable.
- "Create server" button disabled; tooltip: "Connect to create. Your settings will be queued and synced when online."
- Connection-state indicator (feature 12) in header shows "Offline".

**Success state:**
- Modal closes; navigate to the new server's default channel (e.g., #general from template, or first text channel if blank).
- Toast: "Server created! You're the owner. Invite people to join."
- Server now appears in the server rail with the chosen icon and name.

---

## Responsive Breakpoints

**Desktop wide (>1400px window width):**
- Modal width 600px, centered on screen.
- Step 3 layout: left panel (280px) + right panel (280px) side-by-side; drag-drop reorder smooth.
- Template cards in step 2: 3-column grid.

**Desktop narrow (800–1400px):**
- Modal width 90% (max 500px), centered.
- Step 3 layout: left panel + right panel stack vertically (list above, editor below).
- Template cards: 2-column grid.

**Tablet / narrow window (<800px):**
- Modal full-width with padding; step 3 collapses to single column (list only, expand to edit).
- Template cards: single column, full-width.

**Mobile:** Out of scope per project facts (desktop app only).

---

## Success Metrics

**North-star indicators:**
- **Server creation rate:** % of P1 users who create at least one server (adoption gate for P2 workflow).
- **Cohort onboarding speed:** Time from first app open to server created + members invited (indicator of friction in the creation flow).
- **Template adoption:** % of servers created from a template vs blank (validates usefulness of templates; high adoption indicates good defaults).
- **Invite-link activation:** % of created servers where an invite link is generated and used by P1 (measures handoff to F2 — Join via invite).

**Secondary:**
- **Modal abandonment rate:** % of users who start the flow but close before step 1 complete (friction signal).
- **Step 3 customization:** % of template-based servers where user edits channels (validates degree of customization desired).

**Instrumentation:**
- Track event `server.create_started` (step 1 load).
- Track event `server.template_selected(template_name)`.
- Track event `server.create_completed(template, channel_count)` on POST success.
- Track event `server.create_failed(error_code)` on POST failure.
- Track page-load time (modal render latency) at step 1.

---

## Competitor Comparison

**vs Discord (Tier-1 benchmark):**

- **Discord parity:** Both support server creation with channels, categories, drag-reorder, template/blank choice. Discord's modal is similar.
- **StudyHall advantage:** Students can self-create servers instantly without joining a public community first (Discord's discovery model is passive). Templates are study-specific (class cohort, subject org, voice study room) vs Discord's gaming-centric templates. No setup friction; default voice channel included (study room pattern).
- **Discord strength:** Supports up to 500 channels / 50 categories per server (StudyHall MVP will have lower limits, e.g., 20 channels, 5 categories, but H2+ can expand). Nitro custom emotes + roles cover more advanced org (MVP limitation).

**vs Microsoft Teams (Tier-1 benchmark, academic dimension):**

- **Teams model:** Educators or IT provisioned "class teams" with pre-set structure (Assignments, Grades, Class Notebook tabs). Students **cannot** self-create.
- **StudyHall advantage:** Student self-provisioning is the primary differentiator. P2 (student organizer) creates without institutional gatekeeping. Templates encode academic structure (e.g., "Class cohort" with #questions for peer support, #announcements) without requiring an LMS integration.
- **StudyHall weakness:** MVP roles/permissions are basic (no role templates; no pre-configured "teacher/student" role distinction like Teams). H2+ will add facilitator role (feature 17).
- **Conclusion:** StudyHall directly contradicts Teams' institutional model — enabling the "study server by students, for students" pattern that formal LMS platforms can't offer.

**Offline differentiation:** If user is offline, form remains responsive; server creation is queued. Neither Discord nor Teams support offline queue; disconnection breaks the flow.

---

## Notes

- **Icon preset library** (flask, books, mortarboard, microscope, beaker, graduation cap, lightbulb, star, music note, game-controller, users, home) lives in design system (`design/DESIGN-SYSTEM.md`); use CSS sprites or SVG symbol for efficient rendering.
- **Template definitions** (channels, categories, descriptions) are static config in `command-center/product/tools-modules-map.md` § Server & membership module. H2 can add user-created templates (H2 expansion).
- **Server limits (MVP):** 20 channels, 5 categories, 100 members (may increase H2 based on infra). Display quota info in step 3 if near limit.
- **Permissions:** Creator is owner with all permissions (RBAC feature 10); assigned after server create completes.

---
**Approved design (v9):** `design/create-server.html`
