# Wave 46 — D-2 Variants — direct-messages
- Generator: /aidesigner (aidesigner.ai REST, Recipe 1 initial generation). HTTP 200, 33.7KB, 24.3k tokens.
- Staging file: design/staging/direct-messages.html (committed).
- Approach: full brief + DESIGN-SYSTEM.md inline; explicit output requirement for the two-pane DM screen + Start-DM picker modal (with a who-can-DM-restricted disabled target) + empty-list state, composing existing primitives (MessageRow/Composer/ChannelHeader/Modal/Avatar/ConnectionStateIndicator).
- Sanity checks: emerald/accent refs 19, dark-surface refs 35, doctype + inline style OK; renders "No direct messages" empty state, "Sending" pending, "Only accepts…" who-can-DM restriction, dialog/modal (23 refs), composer. Note: a few CDN `src=http` asset refs (avatars/fonts) — acceptable per output contract; D-3 reviewers to confirm token fidelity.
- /aidesigner warnings: none.
