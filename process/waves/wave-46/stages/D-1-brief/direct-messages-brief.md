# Design Brief — direct-messages (DM screen)

**Wave:** 46
**Parent stage invoking:** P-2 (design_gap_flag=true; spec-3 task 1ceffdc9)
**Blocking current wave:** yes
**Mode:** automatic

## 1. What we need
A member-facing Direct Messages screen: a conversation-list rail (the user's 1:1 + small-group DM threads) beside an open conversation (thread of messages + composer), plus a Start-DM modal (pick recipient(s), respecting who-can-DM), plus empty states. First slice of M8 DMs.

## 2. Where it lives
- **Route / file path:** new DM surface reached from the app shell; components `apps/web/src/shell/DmConversationList.tsx`, `DmThread.tsx`, `DmComposer.tsx`, `StartDmPicker.tsx`.
- **Navigation entry:** a "Direct Messages" entry on the server rail (Discord-familiar DM-home at the top/bottom of the server rail — a distinct non-server destination), opening the two-pane DM screen. Start-DM affordance (＋ / "New message") at the top of the conversation-list rail.

## 3. Audience + state
- **Who sees it:** any signed-in student/member.
- **States to design:** loading (skeleton conversation rows + skeleton message rows) / loaded (list + open thread) / empty-list ("No direct messages yet" + Start-DM CTA) / empty-thread (new conversation, no messages) / error (load failed + retry) / offline (composer stays enabled, pending messages, ConnectionStateIndicator) / picker: default, searching, who-can-DM-restricted target (not selectable + reason), selected-recipients chips.

## 4. DESIGN-SYSTEM.md references (REQUIRED)
- **Colors:** `--surface-950` (app frame), `--surface-900` (conversation-list rail — mirrors ChannelSidebar surface), `--surface-800` (thread canvas), `--border-hairline` (rail/thread divider), `--text-primary` (names, message body), `--text-secondary` (last-message preview, timestamps), `--text-muted` (placeholders), `--accent-emerald` (active conversation, primary "Start"/"Send", online presence dot, unread), `--accent-amber` (pending/Sending… + reconnecting), `--danger` (failed message + offline).
- **Typography:** `text-xl` (screen/"Direct Messages" title) · `text-sm` (message body, last-message preview, composer input — min body) · `text-xs` (timestamps, metadata) · weight 500 (participant names, active conversation) · 600 (buttons/headings). Family Geist.
- **Spacing / radius:** 4px base; conversation-row padding 8px×12px (ChannelSidebar item rhythm); message-row vertical rhythm 8px; panel padding 16px; `--radius-md` (rows, buttons, inputs, recipient chips), `--radius-lg` (Start-DM modal), `--radius-full` (avatars, presence dots, unread pills).
- **Shadows:** `--shadow-sm` (composer), `--shadow-pop` (Start-DM modal + any popover), `--glow-focus` (emerald focus ring on composer/inputs/picker).
- **Icons (Phosphor, 16–20px, regular; filled only for active):** chat/paper-plane (send), pencil-simple or plus (Start-DM / new message), magnifying-glass (picker search), users (group DM), x (remove recipient chip / close modal). No invented icons.
- **Components to reuse (from primitives + prior art):** **MessageRow** (thread messages, incl. pending/failed offline states), **MessageComposer** (DM composer — enabled offline, outbox pending), **ChannelHeader** pattern (thread header — participant avatars + name(s) instead of channel glyph), **ChannelSidebar item** pattern (conversation-list rows), **ConnectionStateIndicator** (offline/reconnecting), **Modal/Dialog** (Start-DM picker), **Avatar** (+ presence dot), **Input** (picker search), **Badge/Pill** (unread count; recipient chips), **Empty/Loading states** (skeleton rows).

## 5. Responsive contract
- **Desktop full (1440+):** server rail + conversation-list rail + thread (three columns); wider message column, center max ~1100px.
- **Desktop default (1280):** server rail + conversation-list rail + thread — all visible.
- **Compact (1024 min):** conversation-list rail stays; if a member-list-equivalent existed it would collapse — for DMs there is none, so list + thread both stay. Thread header compresses.
- **Narrow (<1024):** conversation-list becomes an overlay drawer over the thread (server rail persists), mirroring the channel-sidebar-as-drawer rule; Start-DM modal full-height. 6px dark scrollbars; independent pane scroll.

## 6. Interaction patterns
- Conversation row: hover (`--surface-800` highlight), active (`--surface-700` fill + emerald text/left-indicator, `aria-current`), unread (brighter text + emerald dot/count).
- Composer: Enter sends, Shift+Enter newline; offline → message renders pending (60% opacity + amber "Sending…") then resolves; failed → danger + "Retry".
- Start-DM modal: search filters users; who-can-DM-restricted target is disabled/greyed with a clear inline reason (e.g. "Only accepts messages from server members"); pick 1 (1:1) or several (group) → recipient chips (removable, x icon); "Start" creates + opens the thread; Esc closes, focus-trap, restore focus (Modal a11y).
- Real-time: inbound `dm:message` updates the open thread + reorders the conversation list (most-recent first) without refetch; 150ms transition-colors, 200ms presence fade. Respect `prefers-reduced-motion`.
- Keyboard: rail is a nav list (arrow-key nav, `aria-current` active); message actions keyboard-reachable; modal fully keyboard-operable.

## 7. Data shape
- `GET /dm/conversations` → `{conversations:[{id, isGroup, participants:[{userId,displayName,avatar,presence}], lastMessage:{content,createdAt,authorId}, unreadCount?}]}` (ordered recent-first).
- `GET /dm/conversations/:id/messages?cursor=` → `{messages:[{id,conversationId,authorId,content,createdAt}], nextCursor}`.
- `POST /dm/conversations` body `{participantIds:[...], isGroup?}` → conversation DTO (403 if a target's who-can-DM rejects).
- `POST /dm/conversations/:id/messages` body `{content, idempotencyKey}` → message DTO (optimistic + reconcile; outbox offline).
- Empty: `conversations:[]` → empty-list state. Loading: skeletons. Error: retry. Socket `dm:message` for real-time.

## 8. Prior art (match this visual language)
- Thread + composer + header + message rows → match `design/server-channel-view.html` (the canonical 3-pane messaging screen — the reference direction). DM thread mirrors its message column + composer exactly, swapping the channel-glyph header for a participant header.
- Conversation-list rail (rows with avatar + name + preview + unread) → match `design/server-rail-sidebar.html` + the ChannelSidebar item styling in `design/server-channel-view.html` (sidebar column).
- Start-DM modal + who-can-DM reason + empty states → match `design/settings-privacy.html` (who-can-DM control language) + the Modal/empty-state treatment in `design/create-server.html` / `design/app-home.html`.

## 9. Success criteria (APPROVE checklist)
- [ ] Uses exactly the DESIGN-SYSTEM.md tokens listed in §4 (no new hex, no invented tokens); dark-mode only.
- [ ] Renders ALL §3 states: loading, loaded, empty-list, empty-thread, error, offline/pending, and the picker's default/searching/restricted-target/selected states.
- [ ] Responsive per §5 (three-pane at 1280+, conversation-list drawer <1024).
- [ ] Matches prior-art visual language from §8 (thread ≈ server-channel-view; rail ≈ sidebar; modal ≈ create-server/settings-privacy).
- [ ] Reuses MessageRow, MessageComposer, ChannelHeader, ConnectionStateIndicator, Modal, Avatar primitives (no bespoke re-invention of messaging chrome).
- [ ] Offline wedge visible: composer enabled offline, pending (amber "Sending…") + failed (danger "Retry") message states, ConnectionStateIndicator present.
- [ ] Start-DM picker shows a clear, non-color-only reason when a target can't be DMed (who-can-DM restriction).
- [ ] All icon references are real Phosphor component names (§4).
- [ ] Group DM (3–10 participants) rendered: multi-avatar header + participant names; 1:1 shows the single participant.
- [ ] A11y: rail nav list w/ aria-current; modal focus-trap + Esc + restore; presence/state conveyed in text not color alone; composer labelled.

## 10. Non-goals
- Message search within DMs, read receipts, reactions, typing indicators, attachments in DMs, group-DM admin (add/remove/rename/leave after create) — all DEFERRED to later M8 slices.
- Per-user block/report UI — deferred (who-can-DM opt-out is the slice-1 safety floor).
- Light mode (dark-only MVP). Mobile-native (desktop app).

## 11. Reviewer briefing (D-3 review & adopt)
`/plan-design-review` should score: visual hierarchy (conversation-list vs open-thread balance; participant header clarity), spacing rhythm (row + message rhythm vs channel-view), brand coherence (calm academic dark, emerald accent, quieter-than-Discord), edge-case handling (empty-list, restricted-target picker, offline pending, group vs 1:1).
`/ui-ux-pro-max` should verify: all §9 criteria; the Start-DM → conversation → send flow is sensible and the entry point is discoverable; DESIGN-SYSTEM token fidelity; Phosphor icon names real; accessibility minimums (modal, nav list, offline text states).

```yaml
mask_mode_signoff: PASS
signoff_note: "All placeholders replaced; §4 cites 10+ primitives; §8 names 3 prior-art mockups (server-channel-view, server-rail-sidebar, settings-privacy/create-server); §9 has 10 checkboxes. DM screen composes existing primitives — no new design-system tokens expected."
```
