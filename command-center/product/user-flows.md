# User Flows — StudyHall

Persona-anchored end-to-end flows. Source: v0 brief + v2 competitive scan. Personas confirmed at v3 (founder away in automatic mode — extracted from the brief's explicit target-user + must-have set; revisable at v10 / first refresh).

## Personas

| ID | Persona | One-line | Horizon |
|----|---------|----------|---------|
| P1 | **Student Member** | Remote learner who joins study servers to message, study over voice/video, track assignments, and stay connected — living with unreliable internet. | H1 (primary) |
| P2 | **Server Organizer** | A student (or course rep) who creates a study server, sets up subject channels, invites the cohort, manages roles, and pins the schedule/assignments. A student wearing an admin hat. | H1 |
| P3 | **Educator / Facilitator** | Instructor or TA running a class server with lightweight admin + scheduling + facilitation tools. | H2 (deferred — self-use-mvp; LMS grade integration is out of scope) |

---

## P1 — Student Member flows

### F1 — Sign up & create profile
- **Persona:** P1
- **Trigger:** Opens the desktop app → "Create account" / "Sign up".
- **Steps:** 1) Enter email + password (or accept invite link that pre-fills server). 2) Verify email. 3) Pick username + display name. 4) Upload avatar / pick color. 5) Land in dark-themed home with empty server rail + "Join or create a server" prompt.
- **Success:** Account exists, profile set, dark theme applied, session persisted.
- **Failure modes:** email taken, weak password, verification email lost (resend), offline during signup (queue + retry).
- **Handoffs:** none.

### F2 — Join a study server (invite link)
- **Persona:** P1
- **Trigger:** Clicks an invite link / pastes an invite code.
- **Steps:** 1) Preview server (name, member count, channels visible to role). 2) Confirm join. 3) Default member role assigned. 4) Land in the server's default text channel. 5) See channel list (categories), member list, pinned schedule/assignments.
- **Success:** Member of the server; can read/post in permitted channels.
- **Failure modes:** expired/invalid invite, banned, server full, offline (queue join, complete on reconnect).
- **Handoffs:** from P2's invite (F8).

### F3 — Real-time messaging in a text channel
- **Persona:** P1
- **Trigger:** Selects a text channel; types a message.
- **Steps:** 1) Read recent history (cached). 2) Type in composer; see typing indicators / presence. 3) Send → message appears instantly for all online members. 4) React, reply/thread, edit, delete. 5) Mentions notify the target. 6) Attach a file/image.
- **Success:** Message delivered + visible to all members in real time; persisted.
- **Failure modes:** send fails (flaky net) → message held in outbox with retry (see F5); attachment too large; rate-limited.
- **Handoffs:** none.

### F4 — Join a voice/video study room (drop-in)
- **Persona:** P1
- **Trigger:** Clicks a voice channel ("Study Room") — no scheduling.
- **Steps:** 1) Join instantly; mic/camera off by default. 2) See who's already in the room. 3) Toggle mic/camera; optional screen share. 4) Talk/study together; people drop in/out freely. 5) Leave by clicking out.
- **Success:** Real-time audio/video with co-present members; the "study room door left open" model (the Discord pattern students expect).
- **Failure modes:** mic/camera permission denied, bandwidth too low (audio-only fallback), room at capacity.
- **Handoffs:** none.
- **Note:** Heaviest MVP piece (WebRTC SFU). Sequenced after core messaging at v10; still H1 per the brief's must-have list.

### F5 — Work over flaky / no internet (offline-first) — **the wedge**
- **Persona:** P1
- **Trigger:** Internet drops or is intermittent while using the app.
- **Steps:** 1) Already-loaded channels/messages remain readable from local cache. 2) Compose messages offline → queued in an outbox with a "pending" marker. 3) On reconnect, outbox flushes in order; cache reconciles with server; conflicts resolved last-writer-wins on edits. 4) A clear connection-state indicator shows online / reconnecting / offline.
- **Success:** No data loss; a degraded-but-usable experience instead of a broken one. Directly proves the founder bet's offline-first leg.
- **Failure modes:** long offline gap → large outbox flush; cache eviction of old channels; irreconcilable edit conflict (surfaced, not silently dropped).
- **Handoffs:** none. **This flow is the primary differentiator vs Discord/Slack/Teams (all online-only).**

### F6 — View & track assignments (academic tooling, light)
- **Persona:** P1
- **Trigger:** Opens the server's "Assignments" surface (pinned panel or channel).
- **Steps:** 1) See assignments posted by the organizer/educator: title, description, due date. 2) Mark personal status (to-do / done) — student-side, no grading. 3) See upcoming due dates sorted by date. 4) Get a reminder notification as a due date approaches.
- **Success:** Student sees coursework in the same place they collaborate — the gap Discord leaves and Teams locks behind institutional provisioning.
- **Failure modes:** no assignments yet (empty state), offline (read cached).
- **Handoffs:** from P2/P3 posting (F9). Deeper assignment management (submission/grading) is H2.

---

## P2 — Server Organizer flows

### F7 — Create a study server + channels
- **Persona:** P2
- **Trigger:** "Create a server" from the server rail.
- **Steps:** 1) Name the server, pick an icon. 2) Choose a template (e.g., "Class cohort": # general, # questions, voice "Study Room") or start blank. 3) Create text channels + categories (e.g., per subject). 4) Add a voice channel. 5) Get an invite link.
- **Success:** Server exists with channel structure; organizer is owner with full permissions.
- **Failure modes:** name conflict (allowed; servers aren't globally unique), offline (queue create).
- **Handoffs:** to F8 (invite).

### F8 — Invite members + manage roles/permissions
- **Persona:** P2
- **Trigger:** "Invite people" / "Server settings → Roles".
- **Steps:** 1) Generate/copy an invite link (optional expiry/max-uses). 2) Create roles (e.g., Organizer, Member, Guest) with channel-level permissions. 3) Assign roles to members. 4) Remove/ban a member if needed.
- **Success:** Cohort can join; permissions enforce who reads/posts where.
- **Failure modes:** invite abuse (expiry/limits), permission misconfig (organizer locked out — guard against).
- **Handoffs:** invite → P1's F2.

### F9 — Post an assignment / pin a class schedule
- **Persona:** P2 (and P3 in H2)
- **Trigger:** "New assignment" / pin a schedule message.
- **Steps:** 1) Create an assignment: title, description, due date, optional attachment. 2) It appears in the server's Assignments surface for all members. 3) Pin a recurring class schedule to the server.
- **Success:** Members see coursework + schedule alongside chat.
- **Failure modes:** missing due date, offline (queue).
- **Handoffs:** → P1's F6 (view/track). Cross-persona core of the academic wedge.

---

## P3 — Educator / Facilitator flows (H2 — deferred)

- **F10 (H2)** — Run a class server with facilitator tools (light moderation, attendance-style presence, announcement broadcast).
- **F11 (H2)** — Deeper assignment management (collect/return, not grading — grading/LMS integration is out of scope).
- **F12 (H2)** — Class scheduling integration (calendar import/sync).

Deferred because the founder stage is `self-use-mvp` (founder is the first user; one class cohort), and LMS grade integration is explicitly out of scope.

---

## Cross-reference audit (v3 step 4)
- Every persona has ≥1 flow: P1 (F1–F6), P2 (F7–F9), P3 (F10–F12, H2). ✓
- No orphan flows; handoffs resolve: F8→F2, F9→F6. ✓
- Every MVP feature maps to a flow (see feature-list.md). ✓
