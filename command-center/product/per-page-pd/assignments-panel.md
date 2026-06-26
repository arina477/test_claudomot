# Assignments Panel — StudyHall

**Route:** `/servers/:id/assignments`  
**Related features:** 15 (assignment post + student-side track), 14 (notifications), 12 (offline-first), 5 (server), 8 (message actions)  
**Related flows:** F6 (view & track assignments, P1), F9 (post assignment, P2)

---

## Purpose

The Assignments panel is StudyHall's answer to the Notion+Discord seam: a centralized surface where organizers post coursework (title, description, due date, attachments) and students track their personal status (to-do / done) without leaving the study server. It bridges academic task management (Notion's strength) with real-time team communication (Discord's strength), allowing students to stay focused in one tool instead of alt-tabbing.

This surface is a primary differentiator vs. Discord (which has zero native academic tooling and forces bot dependencies) and vs. Notion (which has no real-time comms or presence). The Assignments panel proves StudyHall owns the "student productivity hub" positioning.

---

## Audience

### Primary personas
- **P1 (Student Member):** Authenticated member of a study server. Reads assignments, marks personal to-do/done status. Entry: server nav. Use case: staying on top of coursework while collaborating with peers.
- **P2 (Server Organizer):** Authenticated member with organizer/owner role. Creates and posts assignments. Entry: server settings or "+Create assignment" button. Use case: broadcasting coursework to the cohort in a single place.

### Secondary audience
- **Mentions/notifications:** Non-organizer members receive assignment-due reminders (feature 14 integration).

### Auth state
- **Requirement:** Must be a member of the server (`role: Member | Organizer | Owner`). Non-members see a "Join to view assignments" prompt.

---

## Entry Points

1. **Server navigation sidebar** — "Assignments" link/icon pinned in the server's left sidebar (always visible after F2 join). Click → route to `/servers/:id/assignments`.
2. **Create assignment (organizer only)** — "+" button or "New assignment" menu item in the Assignments panel header. Click → opens assignment composer modal / inline form.
3. **Assignment due-date notification** — Member receives a desktop notification "Assignment due tomorrow: [Title]" → click → route to `/servers/:id/assignments` with the assignment card highlighted.
4. **Deep link from message** — An organizer pins a message to the Assignments channel or includes a `/assignments` link in the channel description. Click → direct route.
5. **Invite link with assignments preview** — Invite link preview (landing.md) may show "3 upcoming assignments" as a social proof card; click → user signs up (F1) → routes to `/servers/:id/assignments` post-join (F2).

---

## Content Sections (Page Anatomy)

### Header
- **Server name + icon** (top-left, breadcrumb style): "[Server Name] › Assignments"
- **Right-side header actions:**
  - (P2 only) **"+ New assignment"** button (primary, accent color)
  - (All members) **Filter/sort toggle** (optional; MVP may hardcode sort by due date ascending)

### Main content area — Two layout variants

#### Variant A: List view (default; single-column scroll)
**List header:** "Upcoming & recent assignments (sorted by due date)"

**Assignment card (repeating, one per assignment):**
- **Left column (metadata):**
  - Assignment title (bold, H4)
  - Due date (e.g., "Due Jun 28, 2026" or "Overdue" if past)
  - Posted by [Organizer name] (small, gray text)
- **Middle column (student status, P1 only):**
  - Two-state toggle: ☐ To-do | ☑ Done (radio buttons or single checkbox depending on UX review)
  - Status persists locally and syncs on reconnect (offline-first; see empty/offline states below)
- **Right column (preview + actions):**
  - **Description preview** (first 100 chars, truncated; full description in modal on click)
  - **Attachment indicator** (small clip icon if files exist)
  - (P2 only) **Action menu** (⋮): Edit, Delete, Post reminder notification
  - (All) **Card click → expands detail modal** (see detail modal section)

**Card styling:**
- Light border on dark background (token: `--border-subtle`)
- Due date color-coded: Green (7+ days out), Yellow (1–7 days), Red (overdue)
- Student status toggle changes card accent color when marked Done (✓ checked = faint accent highlight, suggesting progress)

#### Variant B: Week/calendar view (optional H2; MVP uses list only)
- Not included in MVP; roadmap for later if user feedback requests calendar visualization.

### Assignment detail modal (on card click or "+" button for creation)

**Modal title:** "[Assignment title]" or "New assignment" (edit mode) / read mode

**Content sections (read mode):**
1. **Due date & metadata**
   - "Due: Jun 28, 2026, 11:59 PM" (format configurable per school; default ISO 8601)
   - "Posted by [Organizer] on Jun 20, 2026"
   - (P2 only) "Posted in #[channel]" (optional; link to pin the assignment there)

2. **Description** (full text, markdown-rendered if applicable)
   - May include instructions, rubric outline, learning objectives, etc.
   - Students can scroll within modal if text is long

3. **Attachments** (if any)
   - List of files: "[Filename.pdf]" (download link)
   - Each attachment shows size + upload date
   - (P2 only on edit) Can add/remove attachments

4. **Student status section (P1 only)**
   - Visible checkbox: "☑ Mark as done"
   - Personal note (optional; future feature — not MVP): text field "Your notes:" (for student scratchpad; not shared)
   - Status sync indicator: "✓ Saved" or "↻ Syncing..." or "⚠ Offline (will sync on reconnect)" (see offline behavior)

5. **Engagement footer (read mode only)**
   - Member avatar tiles (compact) of others who've marked done: "5 people marked this done"
   - (Optional) Count: "5 of 28 class members marked done" (social pressure / progress signal)
   - *Note: This data is not private (status is visible across cohort for engagement); design system should consider anonymity options in H2.*

**Modal actions (P1 read mode):**
- "Back" / "Close" (X button, top-right)
- "Mark as done" / "Mark as to-do" toggle (prominent, in modal footer)

**Modal actions (P2 edit mode):**
- "Save" (primary button)
- "Delete" (destructive, secondary)
- "Post reminder to #[channel]" (optional; sends a message mention in a designated assignments channel)
- "Cancel" / "Close"

**Modal styling:**
- Dark background, light text (consistent with app shell)
- 80–90% of window width on desktop; full width on narrow windows
- Content scrollable if description or attachments exceed viewport height

### Empty state

**When no assignments exist (new server):**
- Central icon: large assignment/checklist icon (gray, soft)
- Headline: "No assignments yet"
- Subtext: "Create the first assignment to help your cohort stay on track."
- (P2 only) **"+ Create assignment"** button (primary, large)
- (P1 only) "Your organizer hasn't posted any assignments yet. Check back soon, or ask them to post one."

### Offline state

**When user is offline (connection lost during view):**
- **Connection indicator** (persistent, in-page): "You're offline. Assignments will sync when you reconnect." (yellow/info color)
- **Student status toggles** remain functional: clicking "Mark as done" queues the change locally.
- **Assignment list** shows cached data (all assignments fetched during last online session are readable).
- **Post new assignment (P2)** disabled with tooltip: "Go online to create an assignment."
- **Attachment downloads** disabled with tooltip: "Go online to download attachments."
- **Full sync on reconnect:** Status changes queued offline are flushed to server; list refreshes with any new assignments added while offline.

### Loading state

**Initial page load (no cached data, first visit):**
- Skeleton loaders for 3–4 assignment cards (placeholder gray boxes, 400ms pulse animation)
- No content visible until fetch completes or cache hit

**Refresh in progress (e.g., pull-to-refresh or background sync):**
- Subtle spinner in the header near the filter toggle
- "Refreshing..." text (optional)
- Data remains readable; new data merged in without jarring re-layout

---

## Interactions (Elements → Side-effects)

### "Mark as done" toggle (student status, P1)
- **Click (online):** 
  - Local state updates immediately (optimistic UI: checkbox shows checked)
  - `PATCH /api/servers/:id/assignments/:assignmentId/student-status` sent in background
  - Response syncs status indicator: "✓ Saved"
  - Avatar count updates (e.g., 4 → 5 people marked done)
- **Click (offline):**
  - Local state updates
  - Queued in outbox (feature 12 offline sync engine)
  - Status indicator shows: "↻ Offline (will sync)"
  - On reconnect, flush queue; remote status updates

### "Mark as to-do" toggle (undo previous done status)
- Same flow as above; server-side status reverts

### Assignment card click (expand modal)
- Modal slides up (or fades in, per design system animation token)
- Browser history updated: URL changes to `/servers/:id/assignments/:assignmentId` (optional; aids bookmarking)
- If modal is open and user navigates to a different assignment, old modal closes and new one opens in-frame
- Close (X button): modal slides down / fades out; URL reverts to `/servers/:id/assignments`

### "New assignment" button click (P2 only)
- Modal opens with empty form:
  - Title input (required; focus set here)
  - Description textarea (optional, markdown editor)
  - Due date picker (required; calendar widget or ISO 8601 text input)
  - Attachment uploader (optional; drag-drop or file picker; size limit 25MB per assignment)
- **"Save" button:**
  - Validates: title + due date required
  - Disables if offline (shows tooltip: "Go online to create assignments")
  - On click: `POST /api/servers/:id/assignments` sent
  - Loading state: button spinner + disabled
  - Success: modal closes, new card appears at top of list (sorted by due date), toast: "Assignment posted"
  - Error (e.g., title too long): inline validation message + focus returned to field
- **"Cancel" button:** modal closes, no data saved

### Edit assignment (P2 action menu ⋮ → Edit)
- Modal opens with form pre-filled with current values
- Same validation + save flow as "New assignment"
- Delete option in footer: `DELETE /api/servers/:id/assignments/:assignmentId` → confirmation modal ("Delete this assignment? This can't be undone.") → on confirm, card removed from list

### "Post reminder to #[channel]" (P2 action menu, optional MVP)
- Sends a message in a designated assignments channel (e.g., #📋-assignments): "@here Assignment '[Title]' is due [date]. Check it out in Assignments."
- Confirmation toast: "Reminder posted to #[channel]"
- This is a convenience feature (avoids manual pinning/messaging) and may be H2

### Filter/sort toggle (optional MVP feature)
- Dropdown menu options:
  - "By due date (ascending)" [default]
  - "By due date (descending)"
  - "By posted date (newest first)"
  - "Show only to-do" [filters out Done items; P1 only]
  - "Show only overdue" [shows only past-due items]
- Selection persists in localStorage or server profile (feature 2 preference)
- List re-renders immediately with new sort order

### Assignment due-date reminder notification (feature 14 integration)
- System notification fires 24 hours before due date (configurable in H2)
- Notification text: "Assignment due tomorrow: [Title]"
- Click → routes to `/servers/:id/assignments` with that assignment card highlighted (yellow/info background, 3 seconds)
- Dismiss → notification disappears; no action taken

### Attachment download (read mode modal)
- Click file link: browser download initiated (or preview modal if file is image/PDF)
- File hosting: `GET /api/servers/:id/assignments/:assignmentId/attachments/:fileId` (pre-signed URL or direct download)

---

## Data Requirements

### Main API endpoints (placeholder names)

#### Read (GET)
- **`GET /api/servers/:id/assignments`**
  - Query params: `?sort=due_date_asc` | `?filter=to_do` | `?filter=overdue`
  - Response: `{ assignments: [ { id, title, description, due_date, created_by, created_at, attachments: [], student_status: "to_do" | "done" | null (if user is organizer) } ] }`
  - Caching: Store in local DB (IndexedDB or SQLite if Electron) with timestamp; serve from cache if online but stale; refresh in background

- **`GET /api/servers/:id/assignments/:assignmentId`**
  - Response: `{ id, title, description, due_date, created_by, created_at, attachments: [ { id, filename, size, mime_type, url } ], student_count_done: 5, student_count_total: 28 }`

- **`GET /api/servers/:id/assignments/:assignmentId/student-status`**
  - Response: `{ user_id, assignment_id, status: "to_do" | "done", updated_at }`
  - Used to fetch user's current status if not included in card list

#### Write (POST, PATCH, DELETE)
- **`POST /api/servers/:id/assignments`** (P2 only, org role check)
  - Body: `{ title, description?, due_date, attachments?: [ file_ids ] }`
  - Response: `{ id, title, ... }` (new assignment object)
  - Error: 403 if user lacks organizer role, 400 if validation fails (missing title/due_date, due_date is past, title >255 chars)

- **`PATCH /api/servers/:id/assignments/:assignmentId`** (P2 only)
  - Body: `{ title?, description?, due_date?, attachments?: [ file_ids ] }`
  - Response: Updated assignment object
  - Offline queuing: if user is offline when editing, enqueue this request + send on reconnect

- **`DELETE /api/servers/:id/assignments/:assignmentId`** (P2 only)
  - Response: 204 No Content
  - Offline: queue the delete; on reconnect, send + remove from local cache

- **`PATCH /api/servers/:id/assignments/:assignmentId/student-status`** (P1, any member)
  - Body: `{ status: "to_do" | "done" }`
  - Response: `{ status, updated_at }`
  - **Offline behavior (feature 12):** If offline, queue this mutation. On reconnect, flush all pending status changes in order (last-write-wins if conflicts). Sync engine reconciles with server state.

#### File upload (for attachments)
- **`POST /api/servers/:id/assignments/upload`** (multipart/form-data)
  - Form field: `file` (binary), `assignment_id` (optional, for direct attach during creation)
  - Response: `{ id, filename, size, mime_type, url }`
  - Size limit: 25MB per file, 100MB per assignment (MVP limits; may be feature 22 paywall in H2)
  - Offline upload: Queue file + retry on reconnect (or reject with "Go online to upload files")

#### Notifications (feature 14 integration)
- **`POST /api/notifications/schedule`** (background job trigger, internal use)
  - Used to schedule 24-hour-before-due reminder notifications
  - Runs hourly cron; selects all assignments with `due_date = now + 24h`; sends push notification to all members

### Local storage / cache requirements (feature 12)
- **Assignment list:** Store in local IndexedDB/SQLite with fetch timestamp + TTL (e.g., 1 hour). Serve from cache on offline load.
- **Student status:** Store user's personal status (to-do/done) for each assignment locally. Prioritize this for offline UX (student can toggle status offline; it's the core interaction).
- **Outbox queue:** When offline, store pending mutations (status changes, new assignments, edits, deletes) in a queue table. Flush on reconnect in FIFO order.
- **Attachment cache:** Do NOT cache files by default (too much disk); instead, cache metadata (filename, size). On-demand download with offline fallback ("Go online to download").

### Data model schema (reference for backend design)
```
assignments table:
  id: UUID
  server_id: UUID (FK)
  title: String (max 255)
  description: Text (nullable)
  due_date: DateTime
  created_by: UUID (FK users)
  created_at: DateTime
  updated_at: DateTime

assignment_attachments table:
  id: UUID
  assignment_id: UUID (FK)
  filename: String
  size: Int (bytes)
  mime_type: String
  storage_url: String (S3 or CDN URL)
  uploaded_at: DateTime

assignment_student_status table:
  id: UUID
  assignment_id: UUID (FK)
  user_id: UUID (FK)
  status: Enum("to_do", "done")
  updated_at: DateTime
  UNIQUE(assignment_id, user_id)
```

---

## Empty / Error / Loading States

### Empty list (new server, no assignments posted)
- **Visual:** Central placeholder (assignment icon, gray)
- **Headline:** "No assignments yet"
- **Subtext (P1):** "Your organizer hasn't posted any assignments. Check back soon."
- **Subtext (P2):** "Create the first assignment to help your cohort stay on track. [+ New assignment button]"
- **Behavior:** Placeholder persists until first assignment created (real-time update via WebSocket if possible, or refresh on nav)

### Loading (initial fetch, no cache)
- **Visual:** Skeleton loaders (3–4 placeholder cards, gray pulses, 400ms animation)
- **Duration:** Typical load <2s on modern connection; show spinner if >3s (fallback to error state if >10s)
- **Abort:** If user navigates away before load completes, cancel in-flight request

### Offline (no internet, cached data available)
- **Connection indicator banner (top of list, yellow/info):** "You're offline. Assignments will sync when you reconnect."
- **List content:** Shows cached assignments (last fetch)
- **Student status toggles:** Functional (queue changes locally)
- **New assignment, attachments, edits:** Disabled with tooltip "Go online to [action]"
- **Behavior on reconnect:** Auto-refresh list + flush queued changes (no UI intervention needed)

### Offline, no cached data
- **Connection indicator:** "You're offline and we don't have any cached assignments."
- **Placeholder:** "Go online to load assignments."
- **Fallback:** If user has worked in the app before (cache should exist), this state is rare — log as error for debugging

### Server error (fetch fails, e.g., 500 error)
- **Error message (toast or inline banner):** "Couldn't load assignments. Please try again."
- **Retry button:** "Retry" (visible in banner or footer)
- **Fallback:** Show cached data (if available) with a note: "Showing cached assignments (may be stale)"
- **Behavior:** Retry is one-tap; if retry fails, persist message + offer manual refresh

### Permission error (user joins mid-stream, role changes)
- **Error message:** "You don't have permission to view this. Contact your organizer."
- **Trigger:** User's role revoked (e.g., banned from server) or invite expired between F2 join and Assignments page load
- **Behavior:** Route back to server list / prompt rejoin

### Attachment too large
- **Error message (during upload):** "File is too large (max 25MB). Please upload a smaller file."
- **User action:** User cancels upload or selects a different file

### Conflict on reconnect (offline edit + concurrent server edit)
- **Scenario:** User marks assignment as "done" while offline. While offline, organizer edits the assignment title. On reconnect, both changes try to sync.
- **Conflict resolution:** Use last-writer-wins for the assignment metadata (title, description) — server change overwrites; for student status, client change overwrites (student's personal choice is prioritized). No UI surfacing (keep it simple for MVP).
- **Behavior:** List refreshes silently; if user was viewing the detail modal, it reflects the merged state.

### Overdue assignment styling
- **Visual:** Card background or border tinted red (token: `--color-error`)
- **Text:** "Overdue" label (red, bold) replacing "Due [date]"
- **Interaction:** User can still mark overdue assignment as done (late submissions may be allowed; this is organizer policy, not enforced by StudyHall)

---

## Responsive Breakpoints

### Desktop (≥960px window width)
- **Layout:** Two-column: Sidebar (always visible) + main content area.
- **Assignment list:** Single-column scroll, cards full width (minus padding).
- **Detail modal:** 80% viewport width, centered, scrollable content inside.
- **Typography:** Headings at full scale; ample whitespace.

### Tablet / Narrow desktop (600–960px)
- **Layout:** Single-column. Sidebar toggleable (hamburger menu, slides from left).
- **Assignment list:** Single-column, same as desktop.
- **Detail modal:** 95% viewport width, full-height scrollable.
- **Typography:** Slightly smaller; optimized for touch.

### Mobile (if supported in future; <600px)
- **Out of scope for MVP.** Landing page copy indicates "desktop app" to discourage mobile traffic.
- **Fallback behavior (if user opens on mobile):** Serve responsive landing page / redirect to download page ("StudyHall is optimized for desktop. Download for macOS or Windows.").

---

## Success Metrics

### Adoption & engagement
1. **Assignment panel reach:** % of server members who visit Assignments within 7 days of join. Target: ≥60%.
2. **Status tracking:** % of members who mark ≥1 assignment as done. Target: ≥40% (not all students actively track; this is adoption signal).
3. **Organizer posting rate:** % of organizers who create ≥1 assignment per server within 30 days. Target: ≥70% (key indicator of feature utility).
4. **Repeat assignment creation:** # of assignments per organizer per 30-day window. Target: ≥2 (suggests ongoing use, not one-off).

### Feature usage (per-user cohort)
- **Offline status changes:** % of status toggles queued while offline. Target: ≥5% (signals that the offline-first wedge is being exercised; students with flaky internet are the primary persona).
- **Sync conflict rate:** # of conflicts observed during outbox flush. Target: <1% (should be rare; indicates clean conflict resolution).

### Usability metrics
- **Time to mark assignment done:** Median clicks from modal view to toggle. Target: 1 click (should be immediate).
- **Time to create assignment (organizer):** Seconds from "New assignment" button to "Save" click. Target: <90 seconds (quick enough for in-class use).
- **Attachment success rate:** % of upload attempts that complete. Target: ≥95% (files are non-critical but failures erode trust).

### Product satisfaction (post-MVP via survey)
- **"This replaces my need for Notion assignment tracking"** — Net Promoter Score (NPS) or 5-point Likert scale. Target: ≥4/5.
- **"I use this instead of checking Discord + a spreadsheet"** — Binary. Target: ≥50% of student respondents agree.
- **"The offline feature saved me"** — Qualitative feedback target; capture in support/feedback channels. Expect ≥10 mentions of offline utility per 1000 MAU.

### Business metrics (H2 onwards)
- **Activation funnel:** % of new signups who create a study server + post ≥1 assignment (cohort creation motion). Target: ≥30% (indicates bottom-up institutional adoption).
- **Retention:** % of students who interact with Assignments ≥1x per 7-day cohort. Target: ≥50% (academic tool should have recurring touch).

---

## Competitor Comparison

### vs. Discord (Tier 1 primary benchmark)
| Dimension | Discord | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Native assignment posting** | ✗ Zero; third-party bots only (Carl-bot, DAS) | ✓ Native, first-class feature | StudyHall owns the wedge. Discord's bot ecosystem is fragile (bot downtime, data loss, no standardization). |
| **Due-date tracking & sorting** | ✗ Bots don't track consistently; manual sorting | ✓ Canonical due-date field, auto-sort | No guesswork; assignments are a primitive, not a hack. |
| **Offline access** | ✗ Zero offline support | ✓ Assignments readable + status toggles functional offline | Flaky internet = Discord breaks; StudyHall degrades gracefully. |
| **Student-side status (to-do/done)** | ✗ Not a feature; students track via reactions/pins (hacky) | ✓ One-click toggle, syncs across cohort | Transparent progress tracking without Discord channel spam. |
| **Attachment integration** | ✓ File uploads in messages, but no assignment-scoped grouping | ✓ Assignment-scoped file list, assignment-level size limits | Files are organized by coursework, not lost in chat history. |
| **Privacy / data export** | ✗ No student-side privacy controls; no assignment data export | ✓ Student data download includes assignments (feature 16) | FERPA-forward: students can audit what data is stored. Discord doesn't offer this for academics. |
| **Notification strategy** | ✓ Mention-based (mentions only), role pings | ✓ Due-date reminder notifications (24h before) + mentions | Proactive nudges for coursework (Discord requires organizer to manually ping). |

**Key positioning:** "Discord has community, but no coursework. We have community *and* assignments in one place."

### vs. Notion (Tier 2 secondary benchmark)
| Dimension | Notion | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Assignment tracking structure** | ✓ Database templates (assignment databases with status/due-date fields); mature feature | ✓ Lightweight, built-in assignment surface | Notion wins on flexibility/depth; StudyHall wins on simplicity (no setup). Notion requires 10+ minutes to configure a database; StudyHall is instant. |
| **Real-time communication** | ✗ Async only (comments, @mentions); no chat layer | ✓ Real-time messaging + voice/video | StudyHall owns the comms gap. Notion students context-switch to Discord anyway. |
| **Offline support (assignment view)** | ✓ Partial (pinned pages, core blocks, auto-download on Plus). Not assignment-specific. | ✓ Full assignment list + status toggle offline | Notion's offline was added 2025; StudyHall is offline-first by design. |
| **Voice study rooms** | ✗ Zero | ✓ Drop-in persistent voice rooms | Unique to StudyHall. Notion is documents; StudyHall is presence. |
| **Privacy/data ownership** | ~ Partially strong (no ads, but compliance docs are complex) | ✓ Student-focused privacy controls + data download UI (feature 16) | StudyHall's privacy is transparent and student-empowering; Notion's is buried in enterprise compliance. |
| **Pricing** | Free Plus for students (generous); paid tiers above | Free MVP; H2 freemium (free indefinitely, paid tiers for schools) | Both free for students; StudyHall's persistence + comms may justify paid tier for institutions later. |

**Key positioning:** "Notion is our assignment tracker, StudyHall is our homework + team in one place. No app-switching."

### vs. Microsoft Teams (Tier 1 secondary benchmark)
| Dimension | Teams | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Assignment management** | ✓ Integrated with Canvas/Blackboard; native Assignments feature (requires IT provisioning) | ✓ Native, lightweight (no grade integration; M2/H2) | Teams' grading is enterprise-only; StudyHall's is student-scoped (no grading = simpler, no institutional lock-in). |
| **Offline** | ✗ None; requires constant connectivity | ✓ Full offline read + status toggle | StudyHall for unreliable internet; Teams for corporate networks. |
| **Accessibility (deployment)** | Requires school IT provisioning + institutional account | ✓ Sign up on any email; one-click server create | StudyHall is day-1 usable; Teams requires IT approval (weeks/months). |
| **Student privacy controls** | ~ FERPA-compliant (strong) but controlled by IT, not student | ✓ Student-controlled privacy (feature 16) + data export | Teams owns privacy for institutions; StudyHall empowers individual students. |
| **Voice/video** | ✓ Native, robust (Teams = enterprise video standard) | ✓ Native, WebRTC (lighter, no enterprise features) | Both good; StudyHall's is simpler (drop-in, no scheduling); Teams' is more reliable. H2 may need to harden media quality. |
| **Community / discovery** | ✗ Institution-scoped; no cross-school discovery | ✓ (H2: Server discovery, public communities) | Teams is walled off; StudyHall enables study-group discovery. |

**Key positioning:** "Teams is for IT-managed institutions. StudyHall is for students who want to own their tools."

### vs. Telegram (Tier 2 secondary benchmark — fast-growing among international students)
| Dimension | Telegram | StudyHall | StudyHall advantage |
|---|---|---|---|
| **Offline messaging** | ✓ Queues messages offline; syncs on reconnect | ✓ Same; feature 12 | Both strong; StudyHall adds status persistence (assignments). |
| **Assignment tracking** | ✗ None; forwarded via pinned messages (lossy) | ✓ Native assignment surface | Telegram for chat; StudyHall for coursework + chat. |
| **Voice/video** | ✓ VoIP calls but no group video on free tier; 1-on-1 only in web client | ✓ Group voice/video (drop-in, persistent) | StudyHall's group video is simpler (no call scheduling). Telegram is stronger for peer calls. |
| **Privacy** | ~ No group E2E (only 1-on-1), but no ads | ✓ Group messaging encrypted (future; H2), plus student data controls (feature 16) | Telegram is strong on transport privacy; StudyHall adds student autonomy (data download, profile visibility). |
| **Data ownership** | ✓ Telegram's GDPR stance is strong; no tracking | ✓ StudyHall's privacy controls are student-facing + transparent | Both strong; StudyHall is more educational (compliance opt-in). |

**Key positioning:** "Telegram works offline, but doesn't track homework. StudyHall is Telegram + Notion for students."

---

## Offline-first deep dive (feature 12 integration)

The Assignments panel is a prime showcase for offline-first reliability (the core wedge). Design & implementation must emphasize this:

### Scenario: Student in a dorm with flaky WiFi
1. **Before disconnect:** Student views Assignments, sees 3 upcoming assignments, marks one as Done.
2. **Connection drops:** Still viewing the page. Header icon changes from green (online) to yellow (reconnecting).
3. **Student continues:** Marks another assignment as to-do (offline). Status toggle is instant (optimistic UI); "↻ Offline (will sync)" indicator shows under each toggle.
4. **Recovery:** WiFi returns. Header icon → green (online). Status changes automatically flush to server. "✓ Saved" indicators replace the offline markers.
5. **Data integrity:** Both status changes persisted locally, synced to server, reflected in the avatar count ("5 of 28 marked done" updates).

### Edge cases to handle
- **Long offline gap (>1 hour):** Outbox may grow large. Flush in batches to avoid overwhelming the server. Show progress: "Syncing 3 of 5 changes..."
- **Organizer edits while student offline:** If student was viewing a modal and the organizer changed the due date, on reconnect the modal updates (or closes with toast: "This assignment was updated by an organizer").
- **Cache eviction:** If local cache fills up, older assignments are removed (FIFO). On reconnect, full list refetches; no data loss, just potential gap in view.

### Testing & validation
- **Test on low-bandwidth connection:** Use Chrome DevTools throttle (slow 3G) to simulate real-world conditions.
- **Test with intermittent drops:** Toggle WiFi off/on rapidly; ensure no duplicate syncs or missed updates.
- **QA checklist:** Feature 12 Offline sync engine should have a dedicated test case matrix in `command-center/testing/test-writing-principles.md` at T-2 (Integration).

---

## Ownership & Review Checklist

- **Product review (P-2 Spec):** Feature spec embedded in task description (YAML block); this PD is reference + guidance.
- **Design review (D-3 Review & Adopt):** Variant A (list view) approved. Variant B (calendar view) deferred to H2. Dark-theme tokens verified. Skeleton loaders and empty states designed.
- **Engineering review (B-4 Specification):** API contract reviewed; offline sync engine scope clarified (part of feature 12, not this task). Attachment size limits confirmed (25MB per file, 100MB per assignment; may be paywall in feature 22).
- **QA review (T-2 Integration):** Test case matrix authored (offline scenarios, permission checks, conflict resolution). Accessibility audit: color contrast, focus states, ARIA labels for status toggles.
- **Launch checklist (V-1 Review):** Success metrics instrumented (analytics events defined). Notification reminders wired to background job. Help docs prepared (assignment management guide for organizers; student quick-start for members).

---

## Future enhancements (H2 / roadmap)

1. **Deeper assignment management (feature 18):** Submission collection (students upload responses), submission grading (organizer leaves feedback, no grade-book lock-in).
2. **Calendar view (feature 19 adjacent):** Week/month view of assignments; iCal export for calendar integration.
3. **Rubric builder:** Organizers define grading rubrics (display-only for students; no auto-grading).
4. **Class scheduling (feature 19):** Class meeting times pinned alongside assignments (sync with Apple Calendar / Google Calendar).
5. **Submission notifications:** When a student marks done, optional notification to organizer ("5 students submitted; 23 haven't yet").
6. **Peer review:** Light peer-grading (students review each other's submissions; organizer aggregates feedback).
7. **Personal assignment notes:** Students' private notes on each assignment (not shared; helps study planning).
8. **Recurring assignments:** Organizers set up weekly/bi-weekly recurring assignments (avoid duplicate entry).
9. **Assignment templates:** Organizer saves an assignment as a template (reuse structure; TBD: public template share).
10. **Compliance audit log:** Append-only log of all assignment changes (who, when, what changed) — required for institutional adoption (feature 24 adjacent).

---

## Implementation notes

### Tech stack guidance (for B-block)
- **Frontend:** Modals rendered inline (no new window/tab; uses app shell + backdrop blur).
- **State management:** Assignment list state lives in React context or store (Redux/Zustand). Student status is optimistic (update UI before server ack).
- **Real-time updates:** Use WebSocket subscription (same as messaging real-time) to push new/updated assignments to all members in a server (feature 7 transport reuse).
- **Offline sync engine:** Reuse feature 12 outbox + reconciliation logic (don't build per-feature sync). Assignments mutations flow through the generic sync engine.
- **Notification dispatch:** Reuse feature 14 notification module; add assignment-due-reminder job (cron-triggered 24h before due date).
- **File upload:** Reuse feature 9 file attachment infrastructure (object storage, pre-signed URLs). Add assignment-scoped size limits (enforce 25MB per file at browser; server validates).

### Design system tokens
- Assignment card border: `--border-subtle` (light gray on dark background)
- Due-date color coding: Use `--color-success` (green, ≥7 days), `--color-warning` (yellow, 1–7 days), `--color-error` (red, overdue)
- Status toggle (done state): Faint highlight using `--color-accent` at 10% opacity (subtle, not jarring)
- Modal backdrop: `--color-overlay` (semi-transparent dark, 60% opacity)

### Accessibility considerations
- Status toggle must have ARIA labels: "Mark as done" / "Mark as to-do"
- Focus states on all buttons + toggles (outline: 2px solid `--color-accent`)
- Heading hierarchy: Page title = H1, "Assignment" modal title = H2, assignment metadata (due date) = body (not heading; it's descriptive, not structural)
- Color contrast: All text ≥4.5:1 on dark background (WCAG AA); status indicators (green/yellow/red) should pair with text labels, not color alone
- Keyboard navigation: Tab through list cards, Enter to expand modal, Escape to close, Enter/Space on toggle to change status
- Screen reader: Assignments announced with due date and current status; "3 of 28 people marked done" announced in full

---

## Cross-reference

- **Feature list:** Feature 15 (assignment post + track); 14 (notifications); 12 (offline); 5 (server); 8 (message actions)
- **User flows:** F6 (P1 view & track), F9 (P2 post assignment)
- **Tools/modules:** Assignment module, Notification module, Offline sync engine, File upload
- **Competitive benchmarks:** Discord (no academics), Notion (no comms), Teams (enterprise-locked), Telegram (no structure)
- **Related pages:** Landing (assignments mentioned as feature highlight), server settings (assignment retention/export), settings-privacy (data download includes assignment status)


---
**Approved design (v9):** `design/assignments-panel.html`
