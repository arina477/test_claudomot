# Product Description — Server Channel View (`/servers/:id/:channelId`)

**Stage:** Self-use-mvp  
**Last updated:** 2026-06-26  
**Criticality:** P0 — the primary surface; largest feature footprint; offline-first wedge concentrated here.

---

## Purpose

The server channel view is **the heart of StudyHall**—the 3-pane main workspace where users:
1. **Navigate** between servers and channels (rail + sidebar).
2. **Read and send** real-time messages, reactions, threads, file attachments.
3. **Collaborate** over text with presence, typing indicators, and @ mentions.
4. **Stay connected** to the app even when internet is flaky—the **offline-first wedge** (F5).
5. **See who's here** (member list, online status, voice room presence).

This surface bridges all three layers of the app architecture: **server > channel > message**. It's the daily driver. Its polish directly impacts retention and word-of-mouth. Offline-first behavior here is a hard differentiator vs. Discord/Teams/Slack (all online-only).

---

## Audience

**Primary Persona:** P1 Student Member (studying, messaging, working offline)  
**Secondary Persona:** P2 Server Organizer (managing + messaging)  
**Auth state:** Logged in; joined at least one server  
**Entry points:**
- Click a channel in the sidebar (from home, from another channel, from a voice room).
- Click a server in the rail, land in its default text channel.
- Follow an invite link (F2) → auto-land in the server's default channel.
- Deep link: `/servers/:id/:channelId` (shared in a message or externally).
- Return from voice room (F4) back to text.

---

## Page Anatomy

### Left Panel: Server Rail (vertical, ~70–90px wide, dark gray #1a1a1a background)
**Fixed sidebar housing the app's navigation spine.**

- **App logo / home icon** (top; click to go to `/app`)
- **Server buttons** (stacked vertically, one per joined server)
  - Each button is a circle or square avatar (server icon + first 2 initials fallback)
  - On hover: tooltip with server name
  - On click: switch to that server (load default channel)
  - **Active state** (bold underline or slight highlight on the current server)
  - **Separator line** between servers (visual grouping)
- **"+" button** (add/create server, opens F7 flow)
- **Settings / profile** icon (bottom; click to access app-level settings, not server-level)

**Collapse state (narrow window):** Rail remains visible but icons compress; tooltips on hover.

---

### Middle Panel: Channel Sidebar (vertical, ~200–250px wide, dark #121212 background)
**Per-server navigation: categories, channels, pinned content.**

- **Server header** (top)
  - Server name (bold, #ffffff)
  - Server settings icon (wrench) for P2 / owner (opens `/servers/:id/settings`)
  - Collapse/expand toggle (chevron, on narrow widths)

- **Channel list (hierarchical)**
  - Categories (e.g., "General", "Subjects", "Voice")
    - Collapsible sections; expand/collapse state persisted
    - Category settings icon (P2 only)
  - Text channels under each category (#general, #help, #study-group, etc.)
    - Channel icon (hashtag for text, speaker icon for voice)
    - Channel name
    - **Unread badge** (blue dot or `(3)` count if messages since last read)
    - On click: load channel into main pane (F3)
    - Right-click context menu: "Mute" / "Mark as read" / "Leave channel" (if guest)
  - Pinned messages / "Pinned" pseudo-channel (shows pinned messages from the server)
  - "Assignments" shortcut (if any assignments exist; F6)

- **Member list toggle** (icon; switches to member list view in this panel)
  - User avatar + username (online status dot: green/yellow/gray)
  - Roles displayed as badges (e.g., "Owner", "Member")
  - Right-click: "Profile" / "Message" (H2—DMs not in v0) / "Kick" (P2 only) / "Change role" (P2 only)

**Collapse state (narrow window):** Channel sidebar collapses behind a menu icon; main message pane expands. Clicking a channel reopens the sidebar briefly or pins it.

---

### Main Panel: Message List + Composer (center/right, 60–70% width)
**The core messaging surface.**

#### Message List (scrollable, dark #0a0a0a background)
- **Date separators** ("Today", "Yesterday", "June 20")
- **Message bubbles** (one per speaker per block; grouped vertically)
  - **Left side:** User avatar (small, ~32px)
  - **User info line:** 
    - Username (bold, @handle optional)
    - Role badge (e.g., "Member", "Organizer") in a small pill
    - Timestamp (relative: "2 min ago", "Jun 20, 3:45 PM")
  - **Message body** (left-aligned, white text, max-width ~600px)
    - Plain text, with markdown support (bold, italic, links, code blocks)
    - **Mentions** highlighted with @ (color accent, e.g., #6366f1)
    - **Links** as clickable URLs (no preview embeds in v0; click opens external)
    - **Soft word-wrap** at viewport width
  - **File/image attachments** (inline below text)
    - Thumbnail preview (images < 4MB display inline; > 4MB as download link)
    - File icon + name for non-image files
    - Click to download or open in new tab
  - **Message actions row** (appear on hover or always visible on mobile-width)
    - **React button** (emoji picker popover)
    - **Reply/thread button** (opens thread panel on the right; F3 action)
    - **More menu** (⋯)
      - Edit (if author)
      - Delete (if author or server admin)
      - Pin (P2 / admin only)
      - Copy link (generate shareable message link)
    - **Reactions display** (emoji + count, e.g., "👍 3")

- **Typing indicators** (under the message list)
  - "Alice, Bob are typing…" (in gray, italicized)
  - Max 3 names shown; "+2 more" if overflow

- **Presence** (subtle, in user bubbles or a separate presence line)
  - Online members' avatars light up (green dot)
  - Offline members' avatars gray out

#### Thread Panel (right side, when a thread is active; ~250–350px wide)
**Threaded replies keep channels clean.**

- **Thread header**
  - "Thread" label
  - X to close thread
- **Parent message** (read-only preview)
  - Original sender + avatar + timestamp
  - Message text (truncated if long)
- **Thread replies** (scrollable, same message format as main list)
  - Each reply shows avatar, name, timestamp, body
- **Thread composer** (at bottom, same as main composer)

#### Message Composer (bottom, sticky, dark #1a1a1a background)
**Where users author messages (F3, F5).**

- **Input field** (multi-line, expandable textarea)
  - Placeholder: "Send a message to #channel-name"
  - Supports markdown (user types `**bold**`, rendered in send preview)
  - **@mention autocomplete** (type `@alice` → dropdown of members)
  - **Emoji picker** (icon; click to open)
  - **File upload** (paperclip icon; drag-and-drop also supported)
  - **Send button** (arrow icon; disabled if empty message)
  - **Keyboard shortcut:** Shift+Enter for newline; Ctrl/Cmd+Enter to send

- **Draft persistence** (auto-save to localStorage every 500ms; F5 syncs draft on reconnect)
  - Saved indicator: "Draft saved" (fades after 2s)
  - Offline indicator: "Saved offline" if no connection

- **Attachment previews** (above composer)
  - Small thumbnails of selected files
  - X to remove each
  - File size validation (max 50MB per file; sum total < 200MB in queue)

- **Connection state indicator** (near composer or top-right of main panel)
  - **Online:** green dot + "Connected" (subtle)
  - **Reconnecting:** yellow dot + "Reconnecting…" (user-facing, may retry manually)
  - **Offline:** red dot + "Offline" + "Your messages are saved locally. You'll sync when you're back online."
  - Click to manually retry connection

---

### Right Panel: Member List (optional; can swap with channel sidebar)
**Who's here, online status, roles.**

- **Member count** ("12 members online")
- **Online section**
  - Avatar + username (green dot)
  - Role badges
  - Click for user profile card (deferred to H2)
- **Offline section** (collapsed by default; click to expand)
  - Similar layout, gray avatars

---

## Interactions

### Sending a message (F3, happy path—online)
1. User types in composer → sees typed text
2. Types `@alice` → autocomplete dropdown appears
3. Selects Alice from dropdown → `@alice` highlighted in text
4. Clicks send (or Ctrl+Enter)
5. **Send event fires:** `POST /api/channels/:id/messages`
   - Request: `{ content: string, parent_message_id?: string (for threads), attachments?: [...] }`
   - Response: `{ id, content, author_id, created_at, edited_at, reactions, attachments }`
6. Message appears instantly in the list (optimistic UI)
7. All connected members receive real-time update via `WS message.create` event
8. Typing indicator clears
9. Composer is emptied; draft is cleared
10. User continues typing / reading

### Sending a message (F5—offline, the wedge)
1. User types in composer while offline (connection indicator shows red/offline)
2. Clicks send
3. Message is **NOT discarded**; instead it's written to **local outbox** (IndexedDB)
4. Message appears in the list **immediately** with a **"pending" or ⏳ indicator** (gray text, lighter opacity, ⏳ icon)
5. On reconnect (user regains internet):
   - Connection state changes to "Reconnecting…" (yellow dot)
   - Outbox flushes: each queued message is sent to the server in order
   - Server processes, returns `message.id`, `created_at`
   - Client updates the pending message: removes ⏳, sets proper timestamp, marks as synced
   - If conflict (user edited locally + server has a newer version): show conflict UI (defer to V block; last-writer-wins resolution)
6. If user closes the app before reconnect:
   - Outbox is persisted in IndexedDB
   - On next launch, app restores draft + queued messages
   - User sees "You have 3 pending messages. Sync now?" option
7. Outbox size limit: max 100 pending messages per channel (prevent device storage bloat)

### Reacting to a message (F3)
1. Hover over message → "React" button appears
2. Click → emoji picker popover
3. User selects an emoji (e.g., 👍)
4. Reaction appears under the message: "👍 1" (the user's name is included if hovered)
5. All members see the reaction in real-time via `WS message.reaction.add`
6. Clicking the same reaction again removes it (de-duplicate via user ID + emoji)

### Replying / threading (F3)
1. Hover over message → "Reply" button
2. Click → thread panel opens on the right
3. Parent message is shown in the thread header
4. User types in the thread composer
5. Sends message → appears in thread, NOT in the main channel
6. All members see the thread count on the parent message: "👁 2 replies"
7. Click that count to open thread in panel or full view (future)
8. Offline: threads work the same as main messages; queued locally with `parent_message_id` set

### Editing a message (F3)
1. User clicks "Edit" in the message's more menu
2. Composer is replaced with edit mode: the message text is restored, "Edit" button replaces "Send"
3. User modifies text, clicks "Edit"
4. `PUT /api/messages/:id` → server updates; returns `{ updated_at, content }`
5. Message shows an "edited" indicator (small gray text, "(edited)" or small pencil icon)
6. All members see the update in real-time via `WS message.update`
7. **Offline conflict:** If user edited locally while offline, and the server version was edited by someone else, on reconnect show conflict UI (last-writer-wins; server version wins). Deferring detailed UI to V block.

### Deleting a message (F3)
1. User clicks "Delete" in the more menu
2. Confirmation dialog: "Delete message? This can't be undone."
3. User confirms → `DELETE /api/messages/:id`
4. Message disappears from the list; member sees real-time `WS message.delete` update
5. If message was offline-queued, it's removed from outbox; never sent to server

### Switching channels
1. User clicks a channel in the sidebar
2. Main pane transitions: old messages fade out, new channel loads
3. Message list scrolls to the top or "Jump to recent" button (if history is old)
4. Composer clears (or restores draft if user was composing in this channel before)
5. **Data fetch:** `GET /api/channels/:channelId/messages?limit=50&before=timestamp` (paginated history)
6. Member list updates (shows online members in the new channel)
7. Typing indicators reset
8. Thread panel closes (if open)

### Switching servers
1. User clicks a server in the rail
2. Sidebar updates: new server's channels load
3. Main pane switches to the server's default text channel (or last-visited channel in that server if local storage is available)
4. All presence/typing state resets

### Scrolling history / lazy-loading
1. User scrolls up in the message list
2. At the top, a "Load earlier messages" button appears (or auto-loads on scroll-within-100px of top)
3. `GET /api/channels/:channelId/messages?limit=50&before=timestamp` (older message timestamp)
4. New messages appear above the current view
5. User can scroll infinitely (or cap at, say, 30 days of history)
6. **Offline:** history is already cached (from previous sessions); no request needed. If cache is empty (new channel + never been online), show "No messages yet" or "Load when online"

### File attachment
1. User clicks paperclip icon in composer
2. File picker opens; user selects file(s) (multi-select allowed)
3. Previews appear below composer (thumbnail for images, generic file icon for others)
4. On send, files are uploaded to `POST /api/channels/:channelId/uploads` (pre-signed URL)
5. Upload progress bar (if file > 1MB)
6. On success, attachment metadata is attached to message in `attachments[]` array
7. Message is sent; attachment URLs are now part of the message

### Mentions and notifications (F3, F14)
1. User types `@alice` in a message → highlights mention
2. Send → `WS message.create` includes `mentions: ["alice_user_id"]`
3. Alice receives a notification (via `WS` or push if subscribed)
   - Notification text: "Bob mentioned you in #general"
   - Click notification → navigate to `/servers/:id/:channelId` + scroll to mention
4. @ mentions are clickable; click to view user profile (H2)

### Going offline (F5—the wedge)
1. **Manual:** User closes laptop, network drops, Airplane Mode on (any interruption)
2. **Detection:** Client attempts to ping server; no response after 3s → connection state changes to "Offline" (red dot + message)
3. UI updates:
   - Composer is still active; user can type
   - Send button is clickable (NOT disabled)
   - On send, message goes to outbox (locally saved)
   - Message appears with ⏳ indicator
4. **Cached history:** Message list shows previously-loaded messages; scrolling through old history works (all from IndexedDB)
5. User continues working (offline mode is transparent; the app degrades gracefully, not breaking)

### Coming back online (F5)
1. **Detection:** Client re-establishes connection; `PING` succeeds → connection state changes to "Reconnecting…" (yellow dot)
2. **Outbox flush:**
   - Client iterates through queued messages in order
   - Sends each via `POST /api/channels/:id/messages`
   - Receives `{ id, created_at, ... }` for each
   - Updates local message: removes ⏳, sets real server ID + timestamp
3. **History sync:**
   - Client checks if any new messages arrived while offline
   - `GET /api/channels/:id/messages?since=timestamp` (fetch messages created since last sync point)
   - Merges new messages into the local cache
4. **State finalization:**
   - Connection state changes to "Connected" (green dot)
   - All UI interactions re-enable (typing indicators, real-time updates, etc.)
5. **Conflict resolution:**
   - If a message was edited locally (offline) and also edited on the server, apply last-writer-wins (server timestamp wins; local edit is overwritten; user sees toast "Your local edit was superseded by a newer version")
   - Non-destructive for the outbox itself (no data loss; older drafts just don't ship)

---

## Data Requirements

### REST API endpoints

| Method | Endpoint | Purpose | Request | Response | Notes |
|--------|----------|---------|---------|----------|-------|
| GET | `/api/servers/:id` | Fetch server metadata | — | `{ id, name, icon, owner_id, channels[], roles[], member_count }` | Called on server switch |
| GET | `/api/channels/:id` | Fetch channel metadata + topic | — | `{ id, name, category_id, topic, is_nsfw, permissions }` | Called on channel switch |
| GET | `/api/channels/:id/members` | List members in channel + presence | — | `{ members: [{ user_id, username, avatar, role, status: "online"\|"away"\|"offline" }] }` | Presence updates via WS |
| GET | `/api/channels/:id/messages?limit=50&before=:timestamp` | Paginated message history | limit, before, after | `{ messages: [...], has_more }` | Lazy-load on scroll; cache locally |
| POST | `/api/channels/:id/messages` | Send a message | `{ content, parent_message_id?, attachments? }` | `{ id, content, author_id, created_at, reactions }` | Optimistic UI; outbox on offline |
| PUT | `/api/messages/:id` | Edit a message | `{ content }` | `{ id, content, edited_at }` | Author-only; sync via WS |
| DELETE | `/api/messages/:id` | Delete a message | — | `{ success: true }` | Author-only; soft-delete on server |
| POST | `/api/messages/:id/reactions` | Add a reaction | `{ emoji }` | `{ emoji, count, reactor_ids: [] }` | Idempotent; duplicate emoji = remove |
| POST | `/api/channels/:id/uploads` | Pre-signed upload URL | `{ filename, size, content_type }` | `{ upload_url, expires_in }` | Client uploads to S3 directly; callback when done |
| POST | `/api/channels/:id/typing` | Signal user is typing | — | `{ success: true }` | Short-lived; re-ping every 3s; timeout after 5s |

### WebSocket events

| Event | Payload | Audience | Triggers |
|-------|---------|----------|----------|
| `WS message.create` | `{ id, channel_id, author_id, content, created_at, attachments?, mentions? }` | All channel members | User sends a message |
| `WS message.update` | `{ id, content, edited_at, channel_id }` | All channel members | User edits a message |
| `WS message.delete` | `{ id, channel_id }` | All channel members | User deletes a message |
| `WS message.reaction.add` | `{ message_id, emoji, reactor_id, count }` | All channel members | User adds a reaction |
| `WS message.reaction.remove` | `{ message_id, emoji, reactor_id, count }` | All channel members | User removes a reaction |
| `WS channel.typing` | `{ user_id, username, channel_id }` | All channel members | User sends `POST /typing`; clears after 5s |
| `WS presence.update` | `{ user_id, status: "online"\|"away"\|"offline", channel_id? }` | Whole server | User logs in/out or switches channels |
| `WS channel.member.join` | `{ user_id, username, channel_id }` | All channel members (non-private channels) | User joins the channel (or server) |
| `WS channel.member.leave` | `{ user_id, username, channel_id }` | All channel members (non-private channels) | User leaves the channel or app |

### Local storage (IndexedDB, F5 — offline-first)

**Database schema (client-side only):**

```
IndexedDB: studyhall-v0

Object Stores:
- messages { key: messageId, indices: [channelId, createdAt, isSynced] }
  Fields: { id, channelId, authorId, content, createdAt, editedAt, reactions, attachments, isSynced: bool }

- outbox { key: autoIncrement, indices: [channelId, createdAt, status] }
  Fields: { tempId (UUID), channelId, content, attachments[], parentMessageId?, status: "pending"|"synced"|"failed", createdAt, retryCount }

- drafts { key: channelId }
  Fields: { channelId, content, lastModified }

- channels { key: channelId, indices: [serverId, lastSyncAt] }
  Fields: { id, serverId, name, categoryId, topic, lastSyncAt, members[] }

- servers { key: serverId }
  Fields: { id, name, icon, roles[], channels[], lastSyncAt }

- syncCheckpoints { key: "last_sync", one record }
  Fields: { lastSyncTimestamp, lastSyncedChannelId }
```

**Sync algorithm on reconnect (F5):**
1. Fetch `syncCheckpoints.lastSyncTimestamp`
2. For each channel with pending outbox messages:
   - Flush outbox messages in order (retry up to 3x each)
   - On success, mark as synced; remove from outbox
   - On failure, keep in outbox; user sees toast "Failed to send X messages. Retry?"
3. Fetch `GET /api/channels/:id/messages?since=lastSyncTimestamp` for each channel
4. Merge new messages into local cache (dedup by message ID)
5. Update `syncCheckpoints.lastSyncTimestamp` to now
6. Emit `app:synced` event (UI listens and updates presence, typing state, etc.)

---

## Empty / Error / Loading States

### Empty channel (no messages yet)
- Center-aligned placeholder: "No messages yet. Start a conversation!"
- Composer is active; user can send the first message
- Member list shows online members (even if no messages)

### Loading channel (first load, or slow network)
- Spinner in main pane
- Skeleton loaders for message list (3–5 gray placeholder blocks)
- Sidebar remains interactive (can switch channels)
- Timeout after 10s: show error ("Couldn't load channel. Retry?")

### Offline mode (F5)
1. **Connection indicator goes red** + "Offline"
2. **Message list:** Shows cached history (all messages loaded before going offline)
3. **Composer:** Still active; user can type and send (goes to outbox)
4. **Sending a message:** Message appears with ⏳ indicator; no network error
5. **Typing indicators, presence:** All frozen (no real-time updates until reconnect)
6. **Member list:** Shows last-known presence (possibly stale)
7. **History fetch:** If user scrolls to old messages (not yet loaded), show "Cached messages end here" with "Sync to load earlier messages" button

### Offline + no cached history (new channel visited while offline)
- "No messages loaded yet. When you're online, we'll load the history."
- Composer is active (user can draft offline)

### Reconnecting (F5)
1. **Connection indicator is yellow** + "Reconnecting…"
2. **Outbox messages:** Show ⏳ indicator; no state change yet
3. **Message list:** Freezes (no new real-time updates)
4. **Manual retry button:** User can click to retry connection immediately
5. After reconnect succeeds:
   - Outbox messages' ⏳ changes to normal state
   - New messages from server appear
   - Typing indicators resume
   - Presence updates flow in

### Failed to send (network error, validation)
1. Message in composer; user clicks send
2. Network error occurs (e.g., timeout, 5xx)
3. If offline, message queued (outbox, ⏳ indicator)
4. If online but failed:
   - Toast: "Failed to send message. Retry?" + Retry button
   - Message stays in composer; user can edit + retry
   - If user tries to leave without sending: "You have unsent messages. Leave anyway?"

### Failed file upload
1. User selects a file > 50MB
2. Validation error: "File is too large (max 50MB)"
3. File is removed from queue
4. If file upload fails mid-transfer (network cut):
   - Toast: "Upload interrupted. Retry?"
   - File remains in queue; user can retry or clear

### Message edit conflict (F5, rare but critical)
1. User edits a message while offline
2. Before offline, someone else on the server edited the same message
3. On reconnect:
   - Client attempts `PUT /api/messages/:id` with local version
   - Server rejects (edit_timestamp mismatch) or overwrites
   - Conflict detected (local edit_timestamp < server edit_timestamp)
4. **UI:** Toast to user: "This message was edited while you were offline. Server version was kept. Your local edit was: [diff]. [Undo]?"
5. Clicking [Undo] restores local version in composer; user can re-edit + send as a new message or discard

### Permissions denied (user loses channel access while in it)
1. User is in a channel; P2 removes them from the channel via role change
2. On next real-time update, server sends `WS channel.member.leave { user_id }`
3. If it's the current user, show alert: "You no longer have access to this channel. [Go to home]"
4. Redirect to `/app` or the server's default channel

### Rate limiting (too many messages sent)
1. User sends 5 messages in 2 seconds
2. Server returns `429 Too Many Requests`
3. Toast: "Slow down! You're sending messages too fast. Wait 30s before trying again."
4. Composer is disabled for 30s; countdown shown
5. If offline, outbox continues to queue (rate limit only on send attempt)

---

## Responsive Breakpoints

### Desktop (≥1200px)
- **Rail:** Fixed left, ~70px wide, always visible
- **Sidebar:** Fixed next to rail, ~250px wide, always visible
- **Main pane:** Center-right, ~1000px wide
- **Member list:** Right panel, ~280px (or integrated in sidebar via toggle)
- **Thread panel:** Slides in from right, ~350px (pushes main pane left if needed)

### Laptop (800–1200px)
- **Rail:** Fixed left, ~70px, always visible
- **Sidebar:** Collapsible (hamburger menu); default collapsed
- **Main pane:** Expands to fill width when sidebar collapsed
- **Member list:** Integrated into sidebar (tab toggle)
- **Thread panel:** Overlay or full-width

### Narrow window (< 800px)
- **Rail:** Fixed left, ~60px (icons only, no labels)
- **Sidebar:** Full-screen overlay (swipe or hamburger to close)
- **Main pane:** Full-width
- **Member list:** Overlay or sidebar tab
- **Thread panel:** Full-screen overlay

**Note:** Mobile out of scope (brief specifies desktop app), but graceful degradation for narrow windows is a goal.

---

## Success Metrics

### Messaging engagement
1. **Daily Active Users (DAU)** / **Weekly Active Users (WAU):** % of joined members who send ≥1 message per day/week. Target: > 60% DAU, > 80% WAU.
2. **Message throughput:** Median messages sent per user per session. Target: > 5 messages / session.
3. **Time-to-first-message:** Seconds from landing in a channel to sending first message. Target: < 60s.
4. **Reaction engagement:** % of messages that receive ≥1 reaction. Target: > 15%.

### Offline-first behavior (F5—the wedge)
1. **Offline detection latency:** Time from actual connection loss to "Offline" indicator. Target: < 5s.
2. **Outbox sync success rate:** % of offline-queued messages that sync on reconnect without errors. Target: > 98%.
3. **Sync latency:** Time from reconnect to all queued messages appearing as synced. Target: < 3s (per 50 pending messages).
4. **Offline message send rate:** % of users who compose & send messages while offline. Target: > 5% of DAU (students on spotty internet).
5. **Offline recovery NPS:** "How likely are you to use StudyHall when you know you'll be offline?" Target: > 7/10.

### Reliability & UX
1. **Send success rate:** % of messages delivered on first attempt (online, no errors). Target: > 99%.
2. **Edit/delete success rate:** % of edit/delete operations that sync to all users within 2s. Target: > 99%.
3. **Typing indicator accuracy:** % of typing indicators that match reality (no stale "typing…" after user stops). Target: > 95%.
4. **Member list freshness:** Presence status updates within 5s of actual login/logout. Target: > 98%.

### Retention / stickiness
1. **Churn rate (7-day):** % of users who join a server but don't return within 7d. Target: < 20%.
2. **Session length:** Median time in a channel per session. Target: > 10min.
3. **Return frequency:** % of users who use StudyHall 5+ days a week. Target: > 40%.

### Performance (SLO)
1. **Message list load time:** < 1s (first 50 messages + metadata).
2. **Send latency:** < 500ms (from click to message appearing in list).
3. **Real-time update latency:** < 2s (from message sent to appearing in peer's list).
4. **Offline cache read:** < 100ms (IndexedDB reads for already-loaded history).

---

## Competitor Comparison: Discord parity + StudyHall differentiation

### Discord's 3-pane layout (the benchmark)
**How Discord does it:**
- Left rail: servers (large icons, active highlight)
- Middle sidebar: channels (text/voice mixed), collapsible categories, member list toggle
- Right pane: message list + composer, member list on far right
- Voice rooms overlay with tile UI on top of message list

**What Discord does well:**
- Proven, intuitive 3-pane design; students already know it.
- Persistent voice rooms (drop-in model we're matching in F4).
- Rich message features (reactions, threads, rich embeds, pinned messages).
- Solid dark theme with density modes.
- Excellent real-time performance on good networks.

**Where StudyHall differs:**
1. **Offline-first is the wedge:** Discord has zero offline capability. Flaky internet = broken app. Our offline message queue + local cache is a hard differentiation. We'll emphasize connection-state UI (the indicator in F5) as a teaching moment.
2. **Academic positioning:** Discord's channel structure is generic. We add:
   - "Assignments" shortcut in sidebar (F6) — native academic tooling Discord lacks.
   - Assignment tracking panel (due dates, student-side status) alongside messaging.
   - Subtle UX cues: "study smarter" framing in help text, light academic role badges ("TA", "Facilitator" vs Discord's generic "Owner/Member").
3. **Privacy:** We don't show ads, don't collect behavioral data for ad personalization. Connection state indicator is transparent (no hidden telemetry). This is deferred to H2, but positioning starts in this surface: clean, private UX.
4. **Mobile out of scope (theirs too, sort of):** Discord mobile is a full app. We're desktop-only, so we optimize for desktop-sized windows first (no compromise). Narrow-window UX is a polish pass, not a primary target.

### Message / thread parity
**Discord:** Threads, reactions, reactions, edits, deletes, pin, reply. Rich embeds (YouTube previews, OG meta).

**StudyHall v0:**
- Threads ✓ (parent message preview, reply chain)
- Reactions ✓ (emoji picker, count)
- Edit ✓ (with conflict resolution on offline edits)
- Delete ✓ (soft-delete)
- Pin ✓ (P2/admin only)
- Reply/thread ✓ (threaded conversations)
- Mention ✓ (@ autocomplete, notification)
- File attachments ✓ (images inline, files as links)
- Rich embeds: deferred to H2 (not essential for MVP)

### Offline-first: the main differentiator
**Discord:** No offline mode. Attempts to access while offline show an error banner; users can't send messages. Restart required.

**StudyHall:**
- Transparent degradation: messages queue locally (IndexedDB outbox).
- UI shows clear connection state (online/reconnecting/offline).
- Sync is automatic and non-intrusive.
- Conflict resolution (edit conflicts) is explicit, not silent.
- This is the **core product differentiator** for students with flaky internet (dorms, mobile hotspots, traveling).

### Presence & member list
**Discord:** Online/idle/DND/offline status. Presence is real-time; member list shows current status.

**StudyHall v0:**
- Online/offline status (idle/DND deferred to H2).
- Member list shows online-ness + roles.
- Presence updates in real-time (or cached if offline).
- Parity with Discord on essentials; simplified for MVP scope.

### Access to academic tools (the brief's "gap")
**Discord:** Zero native academic tooling. Users rely on third-party bots (Trunked, DAS, etc.) for:
- Assignments
- Scheduling
- Grades (explicitly out of scope for both us and Discord)
- Attendance tracking

These bots are fragile, require admin permission, have no data portability.

**StudyHall:**
- Native "Assignments" surface (F6, Feature 15) showing due dates + student-side status.
- Pinned schedule (P2 posts + pins a class calendar message).
- Light academic role support (deferred to H2, but groundwork here).
- All data is portable (export via privacy controls, H2 Feature 24).
- This is a **defensible moat** vs Discord: we own the academic layer, not third-party bot developers.

---

## Technical Notes

### State management
- React Context or Redux for channel/message state.
- Real-time state updates via WebSocket (Reconnecting.js or similar for resilience).
- Local state (drafts, UI state) in component state or Context.

### Offline-first architecture
- IndexedDB for local message cache + outbox.
- Sync engine runs on-reconnect and periodically (every 30s if online, to catch server-side updates).
- Conflict resolution: last-writer-wins (server timestamp is authoritative on edit conflicts).
- Outbox retry: exponential backoff (1s, 2s, 4s, 8s) up to 3 attempts per message; fail gracefully with user toast.

### Performance considerations
- Lazy-load message history (50 messages per page; load more on scroll-up).
- Virtualize long message lists (windowing library like `react-window` to render only visible messages).
- Debounce typing indicators (re-ping every 3s, not on every keystroke).
- Cache channel metadata (server-side ETag; client-side SWR cache).
- Compress message payloads (gzip WS frames).

### Accessibility
- ARIA labels on buttons (send, react, reply, etc.).
- Keyboard navigation: Tab to focus, Enter to send, Shift+Tab to previous element, Escape to close modals.
- High contrast dark theme (WCAG AAA for text).
- Screen reader support for typing indicators, presence updates.

### Security (v0 baseline, H2 refinement)
- XSS prevention: sanitize message content on render (DOMPurify or similar).
- CSRF protection: server-side token validation on state-changing requests.
- Rate limiting: server-side (429 responses); client-side backoff.
- Attachment validation: size, type (whitelist MIME types), malware scan (deferred to paid/H2).
- Rate-limited typing events (max 1 per 3s per user per channel; server-side check).

### Browser support
- Chrome/Edge (desktop, latest 2 versions) — primary target.
- Firefox (latest 2 versions).
- Safari 15+ (Electron apps use Chromium; web app via Safari is secondary).

### Monitoring
- Error tracking: Sentry or similar (capture message send failures, sync errors, offline cache issues).
- Analytics: event tracking for messaging engagement, offline behavior, feature usage.
- Performance monitoring: message send latency, load time, offline cache size.
