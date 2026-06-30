# Design Brief — Message UI (composer + message list, 3 row states)

**Wave:** 12 (M3 messaging, first bundle)
**Parent stage invoking:** P-1 (design_gap_flag: true) → component-level message UI
**Blocking current wave:** yes (B-3 task d999d29c consumes the canonical mockup)
**Mode:** automatic

## 1. What we need

The in-scope messaging primitives inside the loaded channel view: a **message-row** with three confirmation states (pending / sent / failed+retry), a **composer** (textarea + send) with empty/typing/sending states and Enter-to-send, and a **message-list** (newest-at-bottom, scrollable, load-older-on-scroll-up affordance, empty-channel state). `design/server-channel-view.html` exists but (a) renders ONLY the offline edge state, (b) is missing the failed-row + retry, load-older, and empty states, and (c) pollutes scope with deferred features (reactions, threads/replies, attachments). This brief scopes a clean canonical mockup of just the M3-first primitives.

## 2. Where it lives

- **Route / file path:** `design/server-channel-view.html` (canonical) — PANE 3 (main chat canvas): the message-history scroll region + the composer at its bottom.
- **Navigation entry:** user selects a channel in the channel sidebar (PANE 2) → the channel view loads → message list + composer render.

## 3. Audience + state

- **Who sees it:** authenticated student / TA / instructor with channel read+post access (RBAC-gated server-side; UI is access-blind, server enforces).
- **States to design (ALL in-scope, must all render):**
  - **Message-row — sent** (confirmed, normal)
  - **Message-row — pending** (optimistic just-sent: ~60% opacity + amber clock "Sending…")
  - **Message-row — failed** (danger tint + "Failed to send" + a **Retry** affordance, keyboard-reachable)
  - **Composer — empty** (placeholder "Message #<channel>", send disabled/dimmed)
  - **Composer — typing** (text present, send enabled emerald)
  - **Composer — sending** (send shows in-flight, briefly)
  - **List — populated** (multiple rows, newest at bottom)
  - **List — loading older** (subtle top affordance on scroll-up)
  - **List — empty channel** ("No messages yet — start the conversation")

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:** `--surface-800` (canvas, §1), `--surface-900` (composer fill, §1), `--surface-700`/`--surface-600` (borders, hover, §1), `--border-hairline` (§1), `--text-primary`/`--text-secondary`/`--text-muted` (§1), `--accent-emerald` (active send, §1 / `--primary`), `--accent-amber` (pending clock, §1 / `--warning`), `--danger` (failed row + retry, §1 / `--error`).
- **Typography:** Geist (§2); `text-sm` 14px message body (min body size) · `text-xs` 12px timestamps/metadata · `text-base` for composer input · `text-2xl` 24px for empty-state headline (§2 scale). Weights: 400 body / 500 author name / 600 headings (§2).
- **Spacing / radius:** 4px base; message-row vertical rhythm 8px; panel padding 16px (§3). `--radius-md` 6px (composer, retry button), `--radius-lg` 8–10px (none needed beyond composer), `--radius-full` (avatars, presence) (§4).
- **Shadows:** `--shadow-sm` composer (§5); `--glow-focus` emerald composer focus ring (§5); `--glow-danger` is available for failed (§5) but border tint preferred.
- **Icons (Phosphor, §7):** `ph-clock` (pending), `ph-warning-circle` (failed), `ph-arrow-clockwise` (retry), `ph-paper-plane-right` (send), `ph-hash` (channel glyph), `ph-chats-circle` (empty-state icon), `ph-circle-notch` (loading-older spinner). Regular weight, 16–20px.
- **Components to reuse (DESIGN-SYSTEM.md §8):** **MessageRow** primitive (avatar + name(medium) + timestamp(xs muted) + body(sm); pending = 60% opacity + amber clock; failed = danger + Retry), **MessageComposer** primitive (auto-grow textarea, surface-900, hairline→emerald focus, send on Enter, Shift+Enter newline), **Avatar** (radius-full, initials fallback on surface-600), **Empty/Error/Loading states** (§8: empty = centered icon + headline + one-line; loading = skeleton/subtle, never a spinner for the content list itself). Reuse the **ChannelHeader** + 3-pane shell already in `server-channel-view.html`.

## 5. Responsive contract

Per §9 (desktop app; mobile out of scope):
- **Desktop full (1440+):** message column comfortable, max content ~1100px; member list visible.
- **Desktop default (1280):** all 3 panes; message list + composer full width of pane 3.
- **Compact (1024):** member list collapses to toggle; channel sidebar + composer persist.
- **Narrow (<1024):** sidebars become drawers; server rail persists; composer stays pinned bottom.

## 6. Interaction patterns

- **Composer:** focus → emerald ring (`--glow-focus`). Type → send button transitions muted→emerald (enabled). **Enter** sends; **Shift+Enter** inserts newline (visible affordance/hint). Auto-grows with content, capped. Empty → send disabled (no pointer, dimmed).
- **Send flow:** type → Enter → optimistic **pending** row appears at bottom (60% opacity + amber clock) → on success becomes **sent** → on error becomes **failed** with Retry. Retry is a real `<button>`, focus-visible.
- **Failed row Retry:** click/Enter re-attempts; keyboard-reachable in tab order.
- **List:** newest at bottom, auto-scrolls to bottom on send/new message; scroll-up reveals a subtle "loading older" affordance at the top.
- **Keyboard:** Tab order = message list (rows reachable, retry buttons focusable) → composer textarea → send. ARIA: list `role="log"`/messages `role="article"`; composer labelled; failed row `role="alert"` or status; live region for incoming messages (`aria-live="polite"`).
- **Motion:** calm 150ms color fades; respect `prefers-reduced-motion`; no bouncy easing.

## 7. Data shape

- `GET /channels/:channelId/messages?cursor=&limit=` → `{ messages: [{id, authorId, authorName, content, createdAt}], nextCursor }` (newest N, older via cursor).
- `POST /channels/:channelId/messages {content, idempotencyKey}` → `201 {id, authorId, content, createdAt}`; on non-2xx → row enters failed state.
- Socket `/messaging` `message:new` → append row at bottom (real-time, <1s) — renders via the normal sent message-row.
- **Empty payload** (`messages: []`) → empty-channel state. **Error payload** → row failed state / list-level retry.

## 8. Prior art (match this visual language)

- 3-pane shell + channel header + scrollbar → `design/server-channel-view.html:157-331` (server rail, channel sidebar, channel header, offline banner pattern reused as the Reconnecting connection cue).
- Sent message-row layout (avatar + name + timestamp + body) → `design/server-channel-view.html:343-370`.
- Pending/optimistic row (opacity + amber clock) → `design/server-channel-view.html:408-422`.
- Composer shell (recessed input, send button, format hint) → `design/server-channel-view.html:428-464` — but de-scope offline-lock/attachment/emoji to in-scope send-only.

## 9. Success criteria (APPROVE checklist)

- [ ] Uses exactly the DESIGN-SYSTEM.md tokens in §4 — no new hex, no invented tokens.
- [ ] Renders ALL §3 states: row sent / row pending / row failed+retry; composer empty / typing / sending; list populated / loading-older / empty-channel.
- [ ] The 3 message-row states are visually distinct at a glance (opacity+amber vs normal vs danger+retry).
- [ ] Failed-row **Retry** is a real keyboard-reachable `<button>` with a focus-visible ring.
- [ ] Composer: emerald focus ring, Enter-to-send + Shift+Enter-newline hint visible, send disabled when empty / emerald when typing.
- [ ] Empty-channel state present (centered icon + "No messages yet — start the conversation").
- [ ] Loading-older affordance present at list top.
- [ ] WCAG AA dark contrast: body text, timestamps, amber pending text, danger failed text, send/retry buttons all ≥4.5:1 (≥3:1 for large/UI).
- [ ] Phosphor icon names are real (`ph-clock`, `ph-warning-circle`, `ph-arrow-clockwise`, `ph-paper-plane-right`, `ph-chats-circle`, `ph-circle-notch`, `ph-hash`).
- [ ] Reuses the existing 3-pane shell + ChannelHeader; consistent with adjacent server-channel-view chrome.

## 10. Non-goals (DEFERRED to later M3 — MUST NOT appear)

- Reactions / reaction pills
- Threads / replies / reply-indicator / thread connection lines
- @mentions
- Attachments / file upload / attach button
- Presence / typing-indicator UI (beyond the existing member-list presence already in the shell)
- Message edit/delete affordances (hover action bar) — out of this first bundle

## 11. Reviewer briefing (D-3 review & adopt)

`/plan-design-review` (→ design-review skill): score visual hierarchy, spacing rhythm, brand coherence, edge-case handling (all 9 states), accessibility (dark contrast + focus), responsive.
`/ui-ux-pro-max` (→ accessibility-tester + token audit): verify §9 checklist, the send→pending→sent/failed→retry flow makes sense, WCAG AA dark contrast on every text/control, DESIGN-SYSTEM token audit (flag any invented hex), Phosphor icon-name audit, and confirm zero deferred features (§10) leaked in.

---

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: D-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Brief names the user job (a student posts to a study channel and sees it
    confirm in real time), lives on a concrete surface (server-channel-view.html
    pane 3), enumerates all nine in-scope states (3 row + 3 composer + 3 list)
    with explicit empty/loading/error coverage, cites ≥6 DESIGN-SYSTEM tokens and
    the MessageRow/MessageComposer/Avatar/EmptyState primitives to reuse, states
    the dark-theme-only desktop-first density constraints, and explicitly lists
    the deferred features (reactions/threads/mentions/attachments/presence) as
    non-goals so the variant cannot fragment scope. STABLE check (what is NOT
    being designed) satisfied via §10.
  next_action: PROCEED_TO_D-2
```
