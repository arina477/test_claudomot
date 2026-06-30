# Design Brief — thread-view side panel

## 1. What we need
A side panel that opens when a thread affordance is clicked: the parent message pinned at the top, its replies below (oldest-first), and a reply composer at the foot. The surface to read + write thread replies.

## 2. Where it lives
`design/server-channel-view.html` — a right-side panel/overlay over (or beside) the main message canvas. Composes onto the canonical channel view; opens on affordance click, closes back to the channel.

## 3. Audience + states
Member reading/writing a thread. States: **closed** (no panel), **open-loading** (replies fetching — skeleton), **open-with-replies** (parent pinned + replies + composer), **open-empty** (parent + composer, no replies yet — rare since affordance only shows at reply_count>0, but reachable after deleting the last reply), **reply pending/failed** (optimistic outbox row), **tombstoned reply** (deleted reply renders as tombstone per wave-13).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--surface-900` — panel background (sidebar family, like the member-list panel L463+); `--border-hairline` left divider.
- `--surface-800` — the pinned-parent block background (slightly raised from the panel).
- `--shadow-pop` — panel elevation if it overlays at narrow widths (§5).
- `--text-primary` reply body; `--text-secondary` metadata/timestamps.
- `--radius-md` — composer input + reply-row hover (§4); `--radius-full` avatars.
- `--accent-emerald` — composer send / focus ring (§5 glow-focus); the "thread" header accent.
- Header type: `text-[11px] font-bold uppercase tracking-widest text-zinc-500` (matches the member-list / channel-sidebar section headers).

## 5. Responsive contract
- ≥1280px: panel ~360px fixed on the right (may share space with / replace the member-list panel — document the layout choice).
- ≤1024px: panel becomes an overlay/drawer (full-height) over the channel, per §9; dismissible.
- Replies scroll; the pinned parent + composer stay fixed (parent top, composer foot).

## 6. Interaction patterns
- Opens on affordance click; close button (X) + Esc returns to channel.
- Parent message pinned at top (visually distinct — a subtle "thread on:" header + the parent row).
- Replies oldest-first (chronological, unlike the main list's newest-at-bottom — document; a thread reads top-to-bottom). Reuse the message-row treatment (avatar/name/body/timestamp; reactions/edit/delete per wave-13 row-actions).
- Composer at foot (reuse the channel composer's recessed-input + emerald-focus language); sending posts a reply, shows optimistic pending → reconciles, retryable failed.
- Live-append on the thread realtime event.

## 7. Data shape
Parent = MessageResponse; replies = ThreadRepliesResponse.items (MessageResponse[] with threadParentId).

## 8. Prior art (match)
- server-channel-view.html member-list panel (Pane 4, L463+) — right-sidebar panel family (bg, header, width, ≤1024 collapse).
- server-channel-view.html MESSAGE LIST rows (L194+) — reuse the reply-row treatment (avatar/name/body/timestamp/row-actions/tombstone).
- server-channel-view.html COMPOSER (L427+) — the panel's reply composer mirrors it (recessed input, emerald focus, pending/failed states).

## 9. Success criteria (≥5)
- [ ] Panel: parent pinned at top + replies (oldest-first) + composer at foot; same sidebar family as the member-list panel.
- [ ] Loading (skeleton) + empty ("No replies yet" / parent+composer) states.
- [ ] Reply rows reuse the message-row treatment (incl tombstone for deleted replies); pending/failed optimistic states shown.
- [ ] Responsive: ~360px panel ≥1280; overlay/drawer ≤1024; close (X + Esc).
- [ ] Tokens only; all text ≥4.5:1 (rule 1, calculated); emerald accents restrained.
- [ ] Composer mirrors the channel composer language; emerald send/focus.

## 10. Non-goals
Nested replies; per-user unread; participant list in the panel header; thread search; reactions ON the thread header.

## 11. Reviewer briefing
Verify the panel reads as the same sidebar family as the member-list panel; parent clearly pinned/distinct; replies oldest-first (chronological); composer mirrors the channel composer; loading/empty/tombstone/pending/failed states present; ≤1024 overlay; all text ≥4.5:1. Don't reinvent the message-row.

mask_mode_signoff: PASS
signoff_note: ""
