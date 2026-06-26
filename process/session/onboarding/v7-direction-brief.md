# Direction Brief — StudyHall

## Product one-liner
A dark-themed desktop study app for remote students — group servers, real-time chat, and drop-in voice/video study rooms with offline-first reliability — built to displace Discord for coursework.

## Audience tone
Remote students living with unreliable internet who want a calm, focused, school-aware place to collaborate. They know Discord's social energy but find it noisy and un-academic. When they land in StudyHall it should feel like a quiet, well-lit study hall: familiar enough to be instantly usable (Discord-shaped), but calmer, more focused, and visibly built for coursework.

## Emotional anchors
Calm · focused · friendly · credible · low-noise (the anti-"gaming-loud")

## Visual references
- **Discord** (Tier 1, `command-center/artifacts/competitive-benchmarks/discord.md`): match the instantly-familiar server-rail → channel-sidebar → message-view → member-list 3-pane layout and dark theme, but **beat** it on calmness — less neon/gaming energy, more academic warmth; surface academics (assignments) as a first-class element Discord lacks.
- **Microsoft Teams** (Tier 1): instructive for taking academics seriously, but **avoid** its enterprise heaviness and density.
- External reference: **Linear** for crisp, restrained dark UI and typographic hierarchy; **Notion** for calm, content-first warmth.

## Hard constraints
- Responsive across desktop window sizes: 1024 / 1280 / 1440 minimum (collapsible side panels at narrow widths). Mobile is out of scope.
- **Dark mode is the default and only theme for MVP** (explicit brief must-have).
- Render with real-looking content (real channel names, messages, a member list, a connection-state indicator) — not lorem.

## The page to design
The **server channel view** (`/servers/:id/:channelId`) — the 3-pane core users live on. Pull anatomy from `command-center/product/per-page-pd/server-channel-view.md`:
- Left: server rail (icons) + channel sidebar (categories: # general, # questions, # assignments; voice "Study Room").
- Center: channel header + message list (avatars, names, timestamps, a threaded reply, a reaction) + composer. Show a subtle **connection-state indicator** (online/reconnecting/offline) — the offline-first wedge made visible, with one "pending" message in the outbox.
- Right: member list with presence (online / in voice).
- Surface an **Assignments** affordance (pinned panel or channel) so academics read as first-class.

## Out of scope for this direction pass
- Multi-page consistency (v9)
- Component variants (v8)
- Edge states (v9)
