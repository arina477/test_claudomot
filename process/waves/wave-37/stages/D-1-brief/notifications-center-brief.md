# Design Brief — notifications center (header bell + panel)  [reconstructed post restart-loss]
**Wave:** 37 · **Blocking:** yes · **Mode:** automatic
## 1. What we need
A notifications center: a header BELL with an unread-count indicator that opens a PANEL/popover listing the viewer's notifications (mentions + assignment reminders) newest-first, unread styling, click-through, mark-one-read, mark-all-read.
## 2. Where it lives
Bell in the channel-view header right-actions (MainColumn.tsx:233, beside Search/Pin). Panel = popover under the bell (desktop) / full-width bottom sheet (mobile). No new route (app-shell overlay).
## 3. Audience + states
Authed student. Panel states: loading (skeleton rows, NOT spinner), loaded, empty (icon+headline+one-line+CTA), error (danger icon+cause+retry). Bell states: 0 unread (no badge), N unread (emerald count badge, "9+" cap ≥10).
## 4. DESIGN-SYSTEM references
Colors: surface-900 (panel), surface-800/700 (rows/hover/borders), accent-emerald #10b981 (unread dot + count badge + focus ring), amber (assignment due metadata only), danger-text #f87171 (error). Typography: text-base (title), text-sm (body/actor), text-xs (timestamp/source), text-2xl (empty headline §113). Spacing: panel 16px (p-4), rows 8×12, section gaps 24 (base-4). Radius: radius-lg (panel), radius-md (rows/buttons), radius-full (dot/badge). Shadow: shadow-pop (popover), glow-focus (emerald ring). Icons (Phosphor): Bell, At, CalendarCheck, Clock, Check, BellZ (empty). Reuse §113 states + AssignmentCard row rhythm + header-action button style.
## 5. Responsive
Desktop/compact: popover ~360-380px under bell, shadow-pop. Tablet+mobile <1024px (lg: boundary): full-width bottom sheet, backdrop tap-close.
## 6. Interaction
Bell toggles panel (aria-expanded); Escape/backdrop closes. Row click → navigate to source + mark-read (optimistic). Mark-all-read control clears + zeroes bell. Unread = emerald left-dot + brighter bg; read = muted. Live: 'mention' socket increments bell (aria-live). Focus-trap in open panel; Escape returns focus to bell. aria-label="Notifications, N unread".
## 7. Data
GET /me/notifications?cursor=→{items[{id,type,messageId?,channelId?,serverId?,assignmentId?,createdAt,readAt|null}],unreadCount,nextCursor?}; PATCH /:id/read→{unreadCount}; POST /read-all→{unreadCount}.
## 8. Prior art
server-channel-view.html (header actions), assignments-panel.html (right panel + card rows + empty), app-home.html (empty headline).
## 9. Success criteria
- [ ] Only §4 tokens (no new hex). - [ ] All 4 panel states + both bell states (incl 9+ cap). - [ ] Responsive per §5 (popover desktop, bottom-sheet <1024px). - [ ] Prior-art visual language. - [ ] mention vs reminder type-distinguishable (icon+source+time). - [ ] unread vs read distinct (emerald dot) + mark-all-read. - [ ] Real Phosphor icon names. - [ ] a11y: aria-label w/ count, aria-live increments, focus-trap+Escape.
## 10. Non-goals
No notification-preferences UI, no toast/sound, reminders NOT live-pushed, per-channel useMentionBadge UNCHANGED (drift NON-GOAL), no grouping.
## 11. Reviewer briefing
Dark calm/academic, emerald-only accent (no neon), §113 states complete (skeleton not spinner), popover via border+shadow-pop, type-distinguishability, a11y (aria-label+count, focus-trap). Reject invented tokens or spinner-loading.
```yaml
mask_mode_signoff: PASS
```
