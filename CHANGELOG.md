# Changelog

All notable changes to StudyHall are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Foundation release: the StudyHall app now installs, runs, and deploys end-to-end as a monorepo with a live dark study workspace shell. (#1)
- Dark three-column app shell — server rail, channel sidebar, and main column on layered zinc surfaces — with a reusable connection-state indicator (online / reconnecting / offline).
- Backend API with a `GET /health` endpoint reporting service status and version.
- Shared types package so the web app and API validate the same data shapes.
- Continuous integration on every pull request: lint, typecheck, test, build, and secret scan.
- Live hosted environment on Railway: web app and API health check both serving in production.
- Account screens — sign up, log in, verify your email, and reset a forgotten password — wired to the live backend, so people can now create an account and sign in through the app. (#5)
- An editable profile page where a signed-in user can set their display name. (#5)
- A reminder banner that prompts unverified users to confirm their email, with the app staying usable in the meantime. (#5)
- Profile customization: pick a unique @username and a personal accent color that carries across the app. (#10)
- Avatar upload on the profile page; image delivery turns on once storage is configured, and the page stays usable until then. (#10)
- Sign-in attempts are now rate-limited, so repeated rapid login tries are blocked to protect accounts from abuse. (#12, #14)
- Browser-based end-to-end testing and protected-branch rules now run on every change, so regressions are caught before release. (#12, #15)
- A pre-merge boot check now starts the built server and confirms its health endpoint responds before any change can merge, so a build that would crash on deploy is caught first. (#16)
- Create a study server: it starts with a General category and a #general channel and makes you its owner. Your servers appear in the server rail and their channels in the sidebar. (#17)
- Invite people to your study server with a shareable link, and join a server from an invite after a quick preview of where you're headed. (#18)
- Revoke a study server invite link so it stops working, with an honest "this link no longer works" message for anyone who opens a revoked one. (#19)
- The share dialog now defaults to your server's permanent invite link, with one-off limited invites moved to a secondary option. (#19)
- Server roles and permissions: assign roles to members, choose which roles can see which channels, and owner-protection that stops a server from being left without an owner. (#20, #21)
- Real-time messaging: send and receive messages in your study channels live. (#23)
- Edit and delete your own messages — edited messages show an "(edited)" mark and deleted ones leave a tombstone — with changes appearing live for everyone in the channel. (#24)
- React to messages with emoji: tap to add or remove a reaction, see counts and who reacted, all updating live for the channel. (#24)
- Reacting to a deleted message is now blocked, so reactions can't pile up on content that's no longer there. (#25)
- Live presence in your study servers: see who's online or offline at a glance, with presence updating instantly as people come and go across all their open tabs. (#26)
- A member list in the channel view, grouped into Online and Offline with live status dots, so you always know who's around. (#26)
- Typing indicators show when someone in the channel is typing, naming who it is, so a reply never catches you by surprise. (#26)
- Mention people in a message by typing @ and their username — only fellow server members can be mentioned, and the person you mention gets a live notification the moment you send. (#27)
- An @-autocomplete picker pops up as you type a name in the composer, so you can pick the right member with the keyboard and never misspell a handle. (#27)
- Mentions render as pills in the message — your own mentions stand out in green — and an unread-mention badge tells you when someone has pinged you, clearing once you've looked. (#27)
- A "my mentions" view collects every message that mentions you in one place, and it only ever shows your own — no one can peek at anyone else's. (#27)
- Voice study rooms — first slice: members can drop into a voice channel from an audio-first join surface, with the server minting a short-lived, single-room access pass only after it confirms you're signed in and a member of that channel. (#44)
- This is the foundation (the join surface plus the server-side access-pass service); turning on live audio still needs voice-service credentials, which are being set up, and later waves add screen-share and a who's-here indicator. (#44)
- Pre-join "who's studying" indicator on the voice study-room entry surface: before you join, see how many people are already in the room and who they are, so you know whether to drop in. (#45)
- The count and member identities are readable only by fellow channel members, refresh on a light poll, and fail quietly to an empty state if the read hiccups — so the entry surface never breaks. Live occupancy fills in once voice-service credentials are configured. (#45)
- Voice study rooms are now fully working end-to-end — talk, screen-share, and a graceful audio-only fallback are all live in production. (#47, #48)
- Share your screen in a voice study room, so you can walk the group through your notes, a problem set, or slides while you talk. (#47)
- When your connection struggles, the room automatically keeps the conversation going in audio-only instead of freezing or dropping the call. (#47)
- A one-tap toggle lets you switch a room to audio-only yourself, and switch video back on once your connection recovers. (#48)
- Thread replies: reply in a thread off any message, with a reply-count affordance on the original and a thread panel that shows the parent message and its replies. (#30)
- Replies appear and disappear live for everyone viewing the thread, and a reply you send while offline is queued and sent once you're back online. (#30)
- Attach files and images to a message: pick from the composer (up to 10MB each), with an image thumbnail or file chip preview and a progress-and-retry indicator while it uploads. (#31)
- Images render inline in the message and open full-size on click; other files show as a chip with name and size, so attachments are always there to grab. (#31)
- Offline-first messaging — read your cached channels even when you're offline, keep composing while disconnected, and on reconnect your queued messages send exactly once and in the order you wrote them. (#32)
- The connection dot now shows your real status — online, reconnecting, or offline — and reconnecting recovers every message you missed while away, however long you were gone. (#33)
- Assignments: organizers can post an assignment to a study server with a title, description, due date, and an optional attachment — only people allowed to manage channels can create them. (#34)
- Everyone sees the server's assignments sorted by due date, with an amber chip when one is due soon and a red chip once it's overdue, so nothing slips past. (#34)
- Each member gets a personal to-do / done toggle on every assignment that only changes their own status — your progress is yours and never visible to others. (#34)
- Organizers can edit an assignment's details or remove it; a removed assignment disappears from everyone's list. (#34)
- Rotate a study server's permanent invite link: the owner can regenerate the link so a leaked one stops working immediately, closing the gap where the default permanent link could never be revoked. Owner-only; no client button yet. (#41)
- Assignment due-date reminders — members are emailed about once, roughly 24 hours before an assignment is due, and anyone who has already marked it done is skipped. (#43)
- Reminders run automatically on an hourly schedule and remind each member only once per assignment; stronger delivery guarantees under heavy load are tracked as a separate follow-up. (#43)
- Privacy controls let you choose who can see your profile and who can message you — a student set to Hidden is removed from server member lists for everyone, including organizers, so the restriction is enforced server-side. (#49)
- Export your account data as JSON so you can review exactly what StudyHall holds about you and download it for your records. (#49)
- Production error tracking in the live app catches problems early so they can be fixed quickly, with all personal info scrubbed (no student emails, message contents, or tokens). (#49)
- New /privacy and /terms pages plus friendly empty, loading, and error states throughout the app so no surface ever looks broken. (#49)
- In-app notifications: a header bell with a panel that collects your @mentions and assignment-due reminders in one place, so a ping is never lost just because you missed the moment it happened. (#51)
- Notifications persist across devices and sessions — sign in anywhere and your unread mentions and reminders are waiting — with the bell counting only what's genuinely unread. (#51)
- Mark a single notification read, or clear them all at once; you only ever see your own, enforced server-side so no one can read or clear anyone else's. (#51)
- File storage is now live: message attachments upload, store, and render end-to-end in production, so images and files you attach in a channel are delivered reliably. (#52)
- Avatar image storage is now wired end-to-end on the backend — a profile picture is stored and served through short-lived private links — with the in-app upload entry point tracked as a follow-up before students can set an avatar from the app. (#52)
- Stored files live in a private bucket and are served through expiring signed links, and the upload endpoints are rate-limited, so attachments stay private and the storage layer is protected from abuse. (#52)
- A user menu opens from your profile button in the sidebar, giving you a single doorway to your profile and settings, avatar upload, and privacy controls — and, for the first time, a log out button right in the app. (#53)
- Setting a profile picture is now reachable end-to-end from the app: the avatar upload that shipped on the backend last release finally has an in-app entry point through the new user menu. (#53)
- Educator role: a server owner can grant a member a moderation permission that lets a teaching assistant or study-group lead keep a space on track — time out a disruptive member and delete any message — without handing over full ownership. (#55)
- Moderation is rank-guarded and enforced server-side: an educator can act only on members below them and never on the owner or a fellow educator, and the timeout and delete-any controls appear only for members who actually hold the permission. (#55)
- Turn in assignment work: a member can submit text and an optional single attachment on any assignment, edit their own submission in place, and see the organizer's returned status and comment once it comes back — there is no grade or score anywhere. (#56)
- Collect and return submissions: an organizer with the manage-assignments permission sees a roster of everyone's submissions (newest first) and can mark one returned with an optional comment, while a member only ever sees their own — enforced server-side, so no student can read another's work. (#56)
- Class scheduling: an organizer with the manage-assignments permission can schedule a session — title, optional details, start and end time, and an optional weekly repeat with an end date — then edit or remove it, all enforced server-side so only organizers can change the schedule. (#57)
- See the class schedule: every member gets a calendar and agenda of upcoming sessions (weekly repeats fill in automatically) and can open any session for its full details, with a calm empty state when nothing is scheduled. (#57)
- Direct messages are here: start a private 1:1 conversation with anyone you share a study server with — open your direct messages, pick a person, and start talking, with messages arriving in real time and sending reliably even when your connection drops. You can only reach people in your servers (no directory to browse), and each person's messaging preference is respected. (#60, #61)
- Shared study timer: every server gets one synchronized Pomodoro countdown that all members see tick in lockstep — start, pause, or reset it, and it auto-advances between Work and Break on its own. A live "N studying" roster shows who's in a focus session right now. (#63)
- Set your server's own study-timer lengths: any member can change the Work and Break minutes (Work 1–120, Break 1–60), and the new lengths apply the next time the timer starts and update live on everyone's screen. Lengths can only be changed while the timer is idle — reset it first to adjust. (#64)
- Study together in focus rooms: create or join a focus room to body-double with others, see who's studying alongside you in a live roster, and share one synchronized room timer that keeps everyone's Work and Break in step. (#66)

### Changed

- Assignment management can now be delegated: a server owner can grant a dedicated "Manage Assignments" permission to a non-owner member — such as a teaching assistant or study-group co-lead — so they can post, edit, and remove assignments without also handing over channel-management rights. (#35)
- Owners toggle the new permission per role in the role editor, and the "New Assignment" button now appears for owners or anyone who holds it, where it was owner-only before. (#35)
- Mentions now render consistently when a handle is followed by punctuation: a message with `@bob.dev` where `bob` is the member shows the mention pill plus `.dev` as plain text, instead of leaving the whole thing as plain text. The app and server now share one rule for what counts as a mention, so the two can't drift apart. (#37)
- Live presence dots on message author avatars: every message now shows a small green dot on the author's avatar when that person is online, so you can see at a glance who's around in a channel. (#38)
- Faster presence tracking: indexed the co-member lookup and consolidated the message-list online-status subscription into a single list-level subscription (no visible change). (#40)
- The browser end-to-end tests now run on the project's bundled browser regardless of how they're launched, removing a per-run manual workaround; typing-label internals were tidied to clear lint warnings with byte-identical output (no visible change). (#59)
- The privacy protections shipped last release — hiding a Hidden student from every member list, keeping data export scoped to your own account, and stripping personal info from error reports — are now covered by durable automated tests that run against a real database on every change, so the enforcement can't silently regress. (no visible change) (#50)
- Real-time study rooms, messaging, and presence now share one plain error reply for bad input and are covered by durable tests that confirm they never leak internal details while still refusing unauthorized requests, so the protection can't silently regress. (no visible change) (#69)
- The "who can message me" privacy setting is now fully covered by durable database-backed tests: when a member limits messages to people in their shared study servers, someone in a shared server can still reach them while someone with no shared server is reliably blocked, so this protection can't silently regress. (no visible change) (#70)
- The list of people you can start a direct message with is now safely capped, so an unusually large shared server can never make that lookup return an unbounded result. (no visible change) (#71)
- Aligned a few direct-message surface shades to the design system, so the server rail, the start-a-message picker, and the disabled send button now match the app's standard dark palette. (#75)

### Fixed

- The app now reports its true version on the health check, fixing a startup crash that could take the live API offline. (#13)
- Editing a message now updates its mentions all-or-nothing, so a mid-edit failure can no longer leave a message with stale or half-updated mentions. (#37)
- Presence dots now show for your own messages too, so you no longer appear offline on the very messages you just sent. (#39)
- A member whose email has an unusual format and who hasn't set a display name no longer shows as a blank name in the member list and presence — it now falls back to a stable identifier; also removed an unused internal response schema. (#42)
- A bad or mistyped link that used to trigger a server error now returns a clean "that's not a valid link" response instead — so a malformed id in the address bar or a stale bookmark no longer looks like the app is broken. (#46)
- This applies everywhere ids appear in a link across the app, and the friendlier response is now consistent instead of surfacing an internal error. (#46)
- The "Last updated" date on the /privacy and /terms pages now reads 2026, correcting a stale year on the published policy pages. (#50)
- Avatar image requests now return a clean error instead of a server error on odd input: an unusual control character in a user id returns a "bad request" and asking for a picture that was never uploaded returns a "not found". A hardening fix — nothing changes for normal use. (#54)
- On a narrower window the class-schedule session details now open as a proper full-screen overlay instead of getting squeezed, so the schedule is usable on smaller screens and tablets. (#58)
- Opening and closing a session's details is now smoother for keyboard and screen-reader users: focus returns to where you were when you close it, and the details always reflect the latest schedule. (#58)
- On narrower screens the compact study-timer bar now shows its phase-colored edge again — emerald while in Work, amber in Break — so the current phase reads at a glance where it was previously washed out. (#64)
- Direct messages now use the full three-panel layout: an empty leftover channel column that used to cram the conversation is gone, so the message thread gets the full width it should. (#65)
- Returning to a study server from your direct-messages view now takes a single click: picking a server, or tapping Home, exits the DM view right away instead of needing a second click. (#72)
- When an organizer or teaching assistant deletes someone else's message, it now disappears in real time for everyone viewing the channel — including the message's own author, who previously kept seeing their deleted message until a refresh. (#73)
- Opening your direct messages no longer trips a "too many requests" error during normal use, and if a request is briefly rate-limited it now recovers on its own instead of leaving a gap until you refresh. (#76)

### Security

- Closed an information-disclosure gap in study rooms: a malformed room address could make the server echo back an internal database error; it now returns a plain "invalid request" and never exposes internal details. (#68)
