# Product Description — Voice/Video Study Room (`/servers/:id/voice/:channelId`)

**Stage:** Self-use-mvp  
**Last updated:** 2026-06-26  
**Criticality:** P0 — heavy-lift feature (WebRTC SFU); late-H1 (after text messaging MVP proves out).

---

## Purpose

The voice/video study room enables real-time audio and video collaboration for remote study groups—the synchronous layer of the app. Its job is to:
1. **Drop-in voice/video** without scheduling (students arrive, see who's in the room, join instantly).
2. **Toggle control:** Mic/camera on/off, screen share, audio-only fallback for low bandwidth.
3. **Presence:** Show who's in the room, their connection quality (signal bars for video quality).
4. **Persistence:** Leave-the-door-open model (rooms exist 24/7; people drop in/out freely, no time limits).

This is the **synchronous study core**—where late-night homework help, group project discussions, and live tutoring happen. Unlike Discord's scheduled meetings or Zoom's video-conference model, StudyHall's study rooms are always-on, low-friction, and integrated into the same server space as text channels. Students are already messaging in #general; clicking "Study Room" voice channel drops them into real-time audio.

---

## Audience

**Primary Persona:** P1 Student Member (studying together, real-time collaboration)  
**Secondary Persona:** P2 Server Organizer (hosting the room, monitoring participation)  
**Auth state:** Logged in; member of server  
**Entry points:**
- Click a voice channel in the sidebar (labeled 📞 "Study Room" or 🎙️ "Lounge")
- Deep link: `/servers/:id/voice/:channelId` (shared in a message, external invite)
- Return from text channel (switch context)
- Accept an in-app notification ("Alice invited you to the study room")

---

## Page Anatomy

### Header / Title Bar
- **Voice channel name** ("Study Room", "Office Hours", "Group Project", etc.)
- **Member count** ("4 members on call" or "1 member waiting")
- **Duration** (if recording, shown in red: "Recording • 5:23"; optional H2 feature)
- **Settings icon** (host/organizer only) → opens room settings modal
- **Leave/End button** (host sees "End call"; members see "Leave")

### Main Area: Participant Tiles (grid or speaker view)
**Central workspace showing active participants.**

#### Speaker View (default)
- **Large tile** for the current speaker (whoever has most recent audio or was last to speak)
  - Video feed (if camera on); if no video, show avatar + username
  - Microphone status icon (🔊 if speaking / 🔇 if muted)
  - Connection quality indicator (bars: 5 for perfect, 1 for poor; red = low bandwidth)
- **Small tiles** for other participants (stacked on the left or bottom)
  - Minimal info: avatar or video, username, mic status, connection quality
  - Click to pin (speaker follows this person regardless of who's speaking)
- **Empty state** (if no one else is in the room)
  - "You're alone in the Study Room. Invite others from #general!"
  - Button to copy room link or ping the server

#### Grid View (alternate, for ≥3 people)
- All participant tiles in a 2x2 / 2x3 / 3x3 grid (responsive)
- Each tile shows video (or avatar if camera off), username, mic/speaker status
- Option to toggle back to speaker view

### Controls Bar (bottom, sticky)
**Horizontal toolbar with media controls and actions.**

From left to right:
1. **Microphone toggle** (🎙️)
   - Default: OFF (comes into room muted for privacy)
   - Click to toggle on/off
   - Indicator: 🔊 (on, highlight color) / 🔇 (off, gray)
   - Right-click or dropdown: select input device (if multiple mics available)
   - Keyboard shortcut: M

2. **Camera toggle** (📹)
   - Default: OFF
   - Click to toggle on/off
   - Indicator: 📹 (on, highlight) / ❌ (off, gray)
   - Right-click or dropdown: select camera device
   - Keyboard shortcut: V

3. **Screen share** (🖥️ / ⌘Shift+S)
   - Click to start screen share
   - Selector: "Entire screen" / "Application window" / "Browser tab"
   - Once active: shows "Screen sharing • [Stop]" in header; replaces main tile with screen
   - Only one person can screen-share at a time (audio continues from all)
   - Click again to stop

4. **Audio fallback / quality settings** (⚙️ or 📊)
   - Dropdown menu:
     - "Video quality: Auto / 720p / 480p / 360p / Audio-only"
     - "Connection: [signal bars] [latency ms]"
     - "Bandwidth usage: [MB/s estimate]"
   - **Audio-only mode:** If bandwidth < 1 Mbps or user selects it, disable video; continue audio
   - Useful for mobile hotspots or flaky connectivity

5. **Participants / member list toggle** (👥)
   - Click to show/hide member list panel (right side or overlay)
   - Shows:
     - In-room participants (with mic/camera status)
     - Waiting in lobby (H2—if reception/approval model added)
     - Invited but not joined (H2)

6. **Hand raise** (✋, deferred to H2)
   - Toggle to raise hand (appears as 🙋 next to name for others)
   - Useful for large rooms (host can see who wants to speak next)
   - Organizer can lower hand or acknowledge

7. **Chat** (💬, H2 enhancement)
   - Opens a side panel for text chat in the room (separate from main channel messages)
   - Ephemeral (not persisted; study-room-session-specific)

8. **Leave / End call** (🚪 / ⏹️)
   - **Members:** "Leave" button; click to exit the room, return to channel view
   - **Host:** "End call" button; shows confirmation ("End call for everyone?"), then closes the room for all
   - On leave/end, users are returned to the text channel; room remains empty but usable

### Member List Panel (right side, toggleable)
**Shows participants and room metadata (if panel is open).**

- **In-room (X members)**
  - Avatar + username
  - Mic icon (🔊 / 🔇 status)
  - Camera icon (📹 / ❌ status)
  - Connection bars (signal quality)
  - Right-click: "Remove from room" (host only), "Mute audio" (host only)

- **Connection info** (collapsible)
  - Your connection: "Good" / "Fair" / "Poor"
  - Participants with poor connection: highlighted (allow host to suggest audio-only mode)

- **Room info** (collapsible)
  - Channel name + server name
  - Participants: "4 members, 2 with cameras, 1 screen sharing"
  - Duration on call
  - Copy room link (for sharing)

---

## Interactions

### Joining a voice channel (F4, happy path—good bandwidth)
1. User clicks voice channel in sidebar (or opens via deep link)
2. Browser/app requests microphone + camera permissions (OS dialog)
3. User grants (or denies) → transitions to voice room
4. Page loads: participant tiles, controls bar, own mic/camera are OFF by default
5. User sees others already in the room (tiles appear as they load)
6. Notification sent to all in-room members via `WS voice.member.join`: "Alice joined the study room"
7. User clicks mic 🎙️ → toggles on; audio starts flowing
8. If camera on, user sees their own camera feed (small PiP in corner or main tile with others)
9. Continues studying; can screen-share, toggle video, etc.

### Speaker view behavior (F4)
1. Room has 4 participants: Alice (speaking), Bob (listening), Carol (listening), Dave (listening).
2. **Speaker view** shows Alice's video large; Bob/Carol/Dave as small tiles
3. Alice stops speaking; Bob starts talking → Bob's tile grows to main view within 500ms
4. No manual switching needed (automatic based on voice activity)
5. User can **pin a person** (click their small tile) → that person stays in main view regardless of who's speaking (good for seeing slides or a specific person's face)
6. Click main tile again to un-pin (return to auto-follow)

### Toggling mic (F4)
1. **Audio ON:**
   - Click 🎙️ mic icon → toggles to 🔇 (muted)
   - Own audio stream stops; browser stops sending audio to SFU
   - Others see 🔇 badge under user's name
   - User's own audio continues to play (they hear others)
   - Keyboard shortcut M works

2. **Audio OFF:**
   - Click 🔇 → toggles to 🎙️ (unmuted)
   - Mic input is requested; user grants or denies (browser permission)
   - If granted, audio streams to SFU; others hear the user
   - If denied, mic stays off (user sees 🔇)

### Toggling camera (F4)
1. **Video ON:**
   - Click 📹 camera icon → toggles to ❌ (camera off)
   - Video stream stops; user's tile shows avatar instead of video feed
   - Others see user has no camera feed (but can still hear them)
   - Resource savings (lower CPU/bandwidth)

2. **Video OFF:**
   - Click ❌ → toggles to 📹 (camera on)
   - Camera permission requested (OS dialog, browser)
   - If granted, video feed activates; user's tile shows live camera
   - If denied, camera stays off

### Screen sharing (F4)
1. **Start screen share:**
   - Click 🖥️ screen share icon
   - Selector pops up: "Share your entire screen" / "Share a window" / "Share a browser tab"
   - User selects (e.g., "Entire screen")
   - Browser prompts for permission (OS dialog)
   - User grants → screen appears in main tile; audio continues
   - Header shows "Screen sharing • [Stop]"
   - Only one person can share at a time (others' shares are queued; they see "Waiting to share…")

2. **Stop screen share:**
   - Click "Stop" in header or click 🖥️ icon again
   - Screen disappears; camera feed (or avatar) returns to main tile
   - Next person in queue can start

### Audio-only fallback (F4, on low bandwidth)
1. **Automatic fallback:**
   - SFU detects user's bandwidth < 1 Mbps or connection is poor
   - Toast: "Your connection is slow. Switching to audio-only mode for better stability."
   - Video streams are disabled automatically; only audio continues
   - User can manually re-enable video if bandwidth improves (click 📹)

2. **Manual audio-only:**
   - User clicks ⚙️ quality settings dropdown
   - Selects "Audio-only" mode
   - Video toggles OFF; icon indicates audio-only state
   - User can switch back to video anytime

### Viewing room connection quality (F4)
1. Click ⚙️ settings icon → quality/connection panel opens
2. Shows:
   - "Your connection: Good (↓ 5.2 Mbps, ↑ 2.1 Mbps, latency 28ms)"
   - Per-participant: "Alice: Good | Bob: Fair (latency 85ms) | Carol: Poor (↓ 0.8 Mbps)"
3. If anyone's connection is poor, option to suggest audio-only mode (host can send them a notification)
4. Close panel to continue

### Handling a participant with poor connection (F4, host UX)
1. Host sees Carol's connection is poor (signal bar is red)
2. Host clicks on Carol's tile → see details ("0.8 Mbps, latency 120ms")
3. Host right-clicks Carol's tile → "Suggest audio-only" / "Remove from room"
4. If host clicks "Suggest audio-only", Carol gets a toast: "Host suggests audio-only mode for better stability. [Switch]?"
5. Carol clicks [Switch] → video turns off; audio continues smoothly

### Leaving the study room (F4, happy path)
1. User clicks "Leave" button (bottom right)
2. Confirmation dialog (optional, or just confirm with toast): "Leave the study room?"
3. User confirms → exits room; WebRTC streams are closed
4. Browser redirects back to the text channel (e.g., `/servers/:id/:channelId`)
5. Others in the room see notification: "Alice left the study room"
6. If user was screen-sharing, screen stops; next person in queue auto-starts (if any)

### Handling disconnection (F4, poor network)
1. **Temporary disconnection (< 5s):**
   - User's tile is dimmed/grayed out for others (briefly)
   - Connection indicator shows "Reconnecting…"
   - Audio/video pauses momentarily
   - Reconnect auto-attempts; usually succeeds within 2–3s

2. **Prolonged disconnection (5–10s):**
   - User's tile shows a warning "Connection unstable"
   - Notification: "Reconnecting to study room…"
   - Auto-retry continues

3. **Disconnection (10s+):**
   - User's tile disappears from others' views (they're booted from the call)
   - User sees: "Lost connection to study room. [Rejoin]?"
   - Can click rejoin or navigate back to text channel
   - Others see: "Alice disconnected from the study room"

### Adding participants post-hoc (H1 quality-of-life, or H2)
1. User in the study room wants to invite a friend still in #general
2. **Option A (H2 in-app):** Click "Invite" in room header → select users from member list → send notification
3. **Option B (H1 scope):** Copy room link (button in member list panel) → paste in #general text chat
4. Friend clicks link → joins room automatically

---

## Data Requirements

### WebRTC signaling

| Event / Endpoint | Purpose | Payload | Notes |
|------------------|---------|---------|-------|
| **WS voice.join** | User joins a voice channel | `{ user_id, username, channel_id, server_id }` | Broadcast to all in room |
| **WS voice.leave** | User leaves a voice channel | `{ user_id, channel_id }` | Broadcast to all in room |
| **WS voice.media.update** | Mic/camera status changed | `{ user_id, channel_id, audio_enabled, video_enabled, screen_sharing }` | Broadcast to all in room |
| **WS voice.participant.quality** | Connection quality update | `{ user_id, bandwidth_up, bandwidth_down, latency, packet_loss }` | Broadcast to all in room (every 5s) |
| **POST /api/voice/token** | Request WebRTC token (LiveKit / mediasoup auth) | `{ channel_id, server_id }` | Request before joining SFU |
| **GET /api/voice/rooms/:channelId** | Fetch room metadata + participant list | — | Returns `{ participants: [...], duration, host_id }` |

### WebSocket events (real-time, voice-specific)

| Event | Payload | Audience | Triggers |
|-------|---------|----------|----------|
| `WS voice.member.join` | `{ user_id, username, avatar, channel_id }` | All in-room members | User clicks voice channel, browser connects to SFU |
| `WS voice.member.leave` | `{ user_id, channel_id }` | All in-room members | User clicks Leave, connection drops > 10s |
| `WS voice.media.update` | `{ user_id, audio_enabled, video_enabled, screen_sharing, channel_id }` | All in-room members | Mic/camera/screen toggle |
| `WS voice.screen.start` | `{ user_id, username, channel_id }` | All in-room members | User clicks "Start screen share" |
| `WS voice.screen.stop` | `{ user_id, channel_id }` | All in-room members | User stops screen sharing |
| `WS voice.participant.quality` | `{ user_id, bandwidth_up/down, latency, packet_loss, channel_id }` | All in-room members (host sees all details, others see own only) | Sampled every 5s on SFU, sent every 30s |

### WebRTC SFU (LiveKit or mediasoup backend)

**External service requirements:**
- SFU server (managed or self-hosted)
- TURN servers (for NAT traversal)
- Recording backend (H2: optional recording/transcription)
- Bandwidth management: quality adaptation based on available bandwidth

**Client-side:**
- LiveKit JS SDK or `peerconnection` API calls (mediasoup)
- Codec negotiation (VP8 video, Opus audio)
- Quality tiers: 1080p60 (good) / 720p30 (fair) / 480p24 (poor)
- Automatic fallback to audio-only if video fails

### Local storage (optional, client-side)
- **Voice preferences** (mic/camera state on app close, remember quality setting)
  - `localStorage.voice_prefs = { mic_enabled: false, camera_enabled: false, quality: "auto" }`
  - On load, apply these defaults

---

## Empty / Error / Loading States

### Empty room (no one in yet)
- Main tile shows **"Study Room is waiting for you"** or **empty illustration** (students studying together)
- Copy room link prompt: "Invite classmates from #general or share this link:"
- Copy button + link (auto-select on click)
- Participants panel shows "Empty" or "Just you"
- User can:
  - Wait for others (room persists)
  - Go back to text channel
  - Invite others (H2 or external link)

### Loading voice room (join in progress)
- Spinner + "Connecting to Study Room…"
- Browser is requesting mic/camera permissions (if needed)
- SFU is authenticating token
- Timeout after 15s: "Couldn't connect. [Retry]?" (likely network or permission denied)

### Permission denied (mic/camera)
1. **Mic denied:**
   - Toast: "Microphone permission denied. You can still see and hear others, but they can't hear you. [Settings]?"
   - Mic icon stays 🔇 (grayed out); click doesn't work until permission granted (OS Settings)
2. **Camera denied:**
   - Toast: "Camera permission denied. [Settings]?"
   - Camera icon stays ❌ (grayed out)
3. **Both denied:**
   - User is audio-only (can hear, see others' video, screen, but can't share audio/video)
   - Prompts to fix permissions via OS Settings

### Low bandwidth / network degradation (F4, the wedge—offline isn't fully applicable to voice, but poor connection is)
1. **Bandwidth drops below 1 Mbps:**
   - Toast: "Your connection is slow. Switching to audio-only mode. [Stay video]?"
   - Video auto-disables; audio continues
   - Connection quality indicator shows "Poor" (red bars)

2. **User experiences packet loss > 5%:**
   - Toast: "Network is unstable. Audio/video may glitch."
   - User can click to see detailed stats
   - Can click "Use audio-only mode" or wait for recovery

3. **Latency spikes > 300ms:**
   - Toast: "High latency. Consider switching to audio-only for better experience."

### Disconnection (< 10s, auto-reconnect)
- Participant's tile dims/grays
- Notification: "[Reconnecting…]"
- Audio/video briefly pauses
- Auto-reconnect fires; usually succeeds within 2–3s
- Tile returns to normal; audio/video resumes

### Connection lost (> 10s, hard failure)
- Participant's tile disappears from view
- User sees: "Lost connection to Study Room. [Rejoin]?" or auto-redirect after 5s (UX choice)
- Others see: "[Name] disconnected from the study room"

### Screen share queue (multiple users trying to share)
1. Alice is screen-sharing
2. Bob clicks "Start screen share" → selector opens, Bob chooses window
3. Instead of his screen appearing immediately, Bob sees: "Waiting to share… Alice is currently sharing. [Cancel]"
4. When Alice stops, Bob's screen auto-starts; Bob sees: "You're now screen-sharing"
5. Works FIFO (first-come, first-served; or host can prioritize)

### Room ended by host
- All participants see: "[Host] ended the study room"
- Browser auto-redirect after 2s to text channel (or modal confirmation)
- Study room remains available; clicking voice channel again starts a new session

### Browser closes / tab closes (F4, worst-case)
- User's session on SFU is terminated
- Others see: "[Name] left the study room" (indistinguishable from graceful leave)
- Local connection is cleaned up (browser close kills WebRTC streams)

---

## Responsive Breakpoints

### Desktop / laptop (1200px+)
- **Main tile area:** Large speaker view + grid option
- **Member list:** Right side panel, 250px wide, always visible (toggle to hide)
- **Controls bar:** Bottom horizontal, all icons visible + labels
- **Participant tiles:** Speaker + 3–4 small tiles visible; scroll if more participants

### Laptop / smaller desktop (800–1200px)
- **Main tile area:** Smaller, optimized grid layout
- **Member list:** Right panel, narrower (~200px) or overlay (toggle)
- **Controls bar:** Compact, icons only (tooltips on hover)
- **Participant tiles:** 2x2 or 1x4 layout; scroll to see more

### Narrow window (< 800px)
- **Main tile:** Full-width, small video feed
- **Controls bar:** Vertical or wrapped, all buttons accessible
- **Member list:** Overlay / slide-in panel (toggleable)
- **Participant tiles:** Stacked vertically (1 column)

**Note:** Desktop app (Electron or web) is primary; mobile is out of scope per brief.

---

## Success Metrics

### Participation & engagement
1. **Voice room session frequency:** % of server members who join a voice room in a week. Target: > 30% (weekly participants).
2. **Session duration:** Median time per voice session. Target: > 10min.
3. **Camera-on rate:** % of participants with cameras enabled during a session. Target: > 50% (many students shy, but targets realistic).
4. **Screen-share frequency:** % of voice sessions that include ≥1 screen share. Target: > 20%.

### Reliability & connection quality
1. **Connection success rate:** % of join attempts that successfully connect to SFU. Target: > 98%.
2. **Disconnection rate:** % of voice sessions with 0 mid-session disconnections. Target: > 90%.
3. **Audio quality:** % of sessions with packet loss < 1%. Target: > 95%.
4. **Audio-only fallback rate:** % of sessions that fall back to audio-only (vs. video fails hard). Target: < 5% (indicates good network or user choice).
5. **Reconnect latency:** Time from disconnect to auto-reconnect completion. Target: < 3s.

### UX / usability
1. **Setup friction:** Time from clicking voice channel to audio working. Target: < 5s (including permission dialogs).
2. **Permission denial rate:** % of join attempts blocked by mic/camera denial. Target: < 10% (educate on privacy, but don't over-prompt).
3. **Ease of invite (if implemented):** % of users who copy/share room link vs. type invites manually. Target: > 80% (measure copy-button usage).

### Feature adoption
1. **Screen-share adoption:** % of join events that include ≥1 screen share (cross-session aggregate). Target: > 15%.
2. **Manual quality setting:** % of users who manually change quality settings (auto-fallback is invisible). Target: < 2% (most users won't dig into settings; good UX is transparent).

### Retention impact
1. **Session-to-session return rate:** % of users who join voice room in week N and return in week N+1. Target: > 60%.
2. **Combined text+voice engagement:** DAU who use both text and voice in same week. Target: > 40% (indication of collaboration depth).

---

## Competitor Comparison: Discord parity + StudyHall differentiation

### Discord's voice rooms (the benchmark)
**How Discord does it:**
- Persistent voice channels (students click, join, audio/video flows).
- Grid view + speaker view (auto-switch on voice activity).
- Mic/camera/screen share controls (industry-standard UX).
- Temporary rooms or persistent channels (both models supported).
- Rich integration: message-history view while on call, pinned resources.

**What Discord does well:**
- Proven, rock-solid voice infrastructure (built on gaming performance requirements).
- Drop-in model matches student expectations (no scheduling).
- 25-person free tier cap (good for study groups).
- Screen share 720p free, 1080p on boost.
- Voice chat is persistent (room never closes; always available).

**Where StudyHall differs:**
1. **Offline-first reliability (tangential to voice):** Voice itself requires connectivity (real-time constraint), so offline mode doesn't apply here. But the broader offline-first philosophy—reliability, no surprise data loss—means our voice session logs and participant history are persisted locally (for study group continuity). Discord doesn't cache voice history; we can offer "who studied together last week?" analytics (H2).

2. **Academic integration:** Voice rooms are positioned as **study spaces**, not just chat rooms. We can add:
   - Assignment context (if room is pinned to an assignment, show the assignment in the room header).
   - Attendance tracking (H2: "5 students studied together for 43 minutes on this assignment").
   - Study session metadata (duration, participants, topic tag — "Physics Problem Set 3").

3. **Accessibility for low-bandwidth:** Discord's voice is solid on good networks; we emphasize **audio-only fallback** as a first-class UX (not hidden in settings). Students on mobile hotspots get clear messaging: "Audio-only mode" is a feature, not a failure state. Positioning: "Study anywhere, anytime—even on spotty internet."

4. **Privacy:** No ads, no behavioral tracking. Study sessions aren't used for ad targeting. Small but real differentiator vs. Discord's mid-2025 behavioral data acquisition.

### Voice quality parity
**Discord:** 
- Opus codec (industry-standard for voice).
- DTLS-SRTP encryption.
- Jitter buffer, echo cancellation, noise gate (built-in, mostly transparent).
- Fallback: Discord mobile switches to audio-only seamlessly.

**StudyHall:**
- Opus codec (matching Discord).
- DTLS-SRTP (matching Discord).
- Echo cancellation, noise gate (matching Discord).
- Audio-only fallback is **explicit and user-triggered** (Discord does it silently). Our wedge: students on bad networks see "Audio-only mode" and feel confident, not broken.

### Screen sharing parity
**Discord:**
- Free: 720p 30fps
- Nitro: 1080p 60fps
- Platform-native (Windows, Mac, Linux APIs)

**StudyHall v0:**
- Screen share is included (no tier distinction in MVP).
- Quality scales with bandwidth (auto-fallback to 480p if needed).
- Parity with Discord free tier; simplify for early release.

### Capacity & Tier limits
**Discord:**
- Free: 25 people, unlimited server count, no time limits, 1080p video (1 camera free, others downscaled), 720p screen share
- Nitro: 4K, boost perks

**StudyHall v0:**
- No artificial cap (study rooms support up to 50 participants; SFU capacity is the limit, not policy)
- No freemium tiers in H1 (feature 22 is H2)
- Screen share: quality adapts to bandwidth; no tier restrictions

### Advantages over Discord
1. **Offline-aware app design:** Text messaging has offline queue; voice sessions are logged locally. Broader reliability story.
2. **Academic positioning:** Voice room can display assignment context, attendance, study-group metadata. Discord doesn't know what you're studying.
3. **Bandwidth transparency:** Explicit audio-only mode + quality indicators make it clear what's happening (vs. Discord's magical fallback, which can confuse users on bad networks).
4. **Privacy:** No behavioral data, no ads, no third-party data acquisition. Study sessions stay private to the cohort.

---

## Technical Notes

### WebRTC SFU choice
- **LiveKit (managed):** Easier operations, scalable, includes transcription/recording (H2). Cost ~$0.01–0.05 per participant-minute.
- **mediasoup (self-hosted):** More control, lower cost, but ops overhead (deployment, scaling, monitoring).
- Recommendation for v0: LiveKit (reduced ops burden; focus on product). Migrate to mediasoup if costs exceed $1k/month (H2+ growth stage).

### Codec & bandwidth tiers
- **VP8 video codec** (efficient, hardware support)
- **Opus audio codec** (perceptual quality at low bitrate; Discord standard)
- **Bandwidth tiers:**
  - 1080p60: 3–4 Mbps
  - 720p30: 1.5–2 Mbps
  - 480p24: 0.8–1 Mbps
  - 360p24: 0.4–0.6 Mbps
  - Audio-only: ~50 kbps

### Quality adaptation
- SFU monitors bandwidth in real-time (REMB—Receiver Estimated Max Bandwidth)
- Client scales video bitrate/resolution automatically
- If user manually selects audio-only, video stays off until re-enabled

### Reconnection & reliability
- Automatic TURN server fallback (if direct connection fails)
- Client-side exponential backoff on SFU disconnect (1s, 2s, 4s, max 10s)
- Max 3 reconnect attempts; if all fail, show "Lost connection. [Rejoin]?"
- Session state is ephemeral (no persistence; rejoin is a fresh connection)

### Screen share queue
- When user clicks "Share screen", check if anyone is already sharing
- If yes, queue the user (FIFO)
- When current share stops, dequeue and auto-start next (notify user: "You're now screen-sharing")
- Limit: max 1 active screen share per room

### Participant presence
- Each participant generates a heartbeat every 5s to SFU (proving they're still present)
- If no heartbeat > 10s, SFU removes participant (hard disconnect)
- Others see "Alice left the study room"

### Browser support
- Chrome/Edge (primary): Full WebRTC support
- Firefox: Full WebRTC support
- Safari: Limited (WebRTC support exists but older browsers may have issues)
- Electron (Chromium): Full support

### Monitoring
- Error tracking: Sentry (SFU connection failures, permission denials, codec negotiation failures)
- Analytics: Join/leave events, session duration, quality metrics, feature usage (screen share, audio-only)
- Performance: P99 latency, packet loss, disconnection rate

### Security
- WebRTC connection is encrypted (DTLS-SRTP)
- SFU auth token is short-lived (5min expiry)
- No recording without explicit user consent (H2 feature)
- SRTP key agreement is negotiated at call start (not shared externally)
