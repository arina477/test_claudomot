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

### Fixed

- The app now reports its true version on the health check, fixing a startup crash that could take the live API offline. (#13)
