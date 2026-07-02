# Design Brief — Screen-share prominent tile

**Wave:** 34 · **Parent stage:** P-1 (design_gap_flag: true) · **Blocking:** yes · **Mode:** automatic

## 1. What we need
When a member shares their screen in a voice study room, render that screen-share track as a DISTINCT, PROMINENT tile (emphasized vs. the small participant avatar tiles) so the shared content (notes, a problem set, slides) is the focus of the room.

## 2. Where it lives
- **File:** `apps/web/src/shell/VoiceStudyRoom.tsx` — the IN-ROOM populated state (the participant-tile grid). New: a prominent screen-share region above/around the avatar cluster.
- **Nav:** appears automatically when any member publishes a screen-share track; disappears on stop.

## 3. Audience + states
- **Who:** authenticated members in the voice room.
- **States:** no-share (normal avatar grid, unchanged) · sharing-active (prominent screen-share tile + avatars demoted to a strip/row) · share-loading (track subscribing) · own-share (the sharer sees a "You're sharing" indicator + stop control).

## 4. DESIGN-SYSTEM.md references
- **Colors:** `--surface-800` (in-room canvas), `--surface-900` (tile fill), `--border-hairline` + `--border-hover` (tile borders), `--text-primary` (labels), `--text-secondary` (metadata), `--accent-emerald` (active/sharing indicator).
- **Typography:** `text-sm` (sharer name label), `text-xs` (metadata / "sharing" tag).
- **Spacing/radius:** 4px scale, panel padding 16px, gap; `--radius-lg` (prominent tile), `--radius-full` (avatars in the demoted strip).
- **Shadows:** `--shadow-sm` (tile), `--glow-subtle` (active-share emphasis).
- **Icons:** Phosphor `ph-monitor` / `ph-screencast` (screen-share), `ph-x` (stop share).
- **Components reused:** VoiceRoomTile/participant-tile language (§8), Avatar (demoted strip), the in-room control cluster (add share/stop-share button).

## 5. Responsive contract
- **1440+:** large screen-share tile centered (max ~1000px), avatar strip below.
- **1280:** screen-share tile fills the canvas width, avatars a compact row.
- **1024:** screen-share tile full-width, avatars collapse to a thin strip / overflow "+N".
- **<1024:** screen-share tile priority; avatars minimal.

## 6. Interaction patterns
- Share button in the control cluster → browser-native picker → prominent tile appears for subscribers. Stop → tile reverts, avatar grid returns.
- Hover the screen-share tile → subtle border-hover; the sharer's name label always visible.
- Motion: tile appears/reverts with a calm 200ms fade (no bounce); respect prefers-reduced-motion.
- a11y: the screen-share region has an accessible label ("Screen shared by <name>"); the share/stop button is a real `<button>` with aria-pressed; live-region announces "Alice started/stopped sharing".

## 7. Data shape
- LiveKit screen-share track (Track.Source.ScreenShare) from a remote participant → VideoTrack render. Sharer identity → display name. No API shape (client track).

## 8. Prior art
- In-room participant tiles + layout → match `design/voice-study-room.html:271-350` (STATE 3 in-room populated: the tile grid + header + control cluster).
- Control cluster (add the share button) → `design/voice-study-room.html:333-348`.
- Tile fill / border / avatar language → `design/voice-study-room.html:289-296`.

## 9. Success criteria
- [ ] Uses only DESIGN-SYSTEM tokens from §4 (no invented hex).
- [ ] Renders all §3 states (no-share unchanged, sharing-active prominent, loading, own-share).
- [ ] The screen-share tile is VISUALLY DOMINANT vs. avatar tiles (size/position emphasis).
- [ ] Avatars demote to a strip/row when a share is active (don't compete).
- [ ] Clean revert to the normal grid on stop (no orphan tile).
- [ ] Responsive per §5.
- [ ] Real Phosphor icon names (ph-monitor/ph-screencast/ph-x).
- [ ] a11y: labeled region + real button + live-region announce.

## 10. Non-goals
- NO annotation/drawing on the share; NO multi-share grid (one prominent at a time per the AC); NO quality/resolution selector; NO custom window-picker UI (browser-native); NO recording.

## 11. Reviewer briefing
`/plan-design-review`: visual hierarchy (share dominant vs avatars), spacing rhythm, brand coherence (calm academic dark), edge-cases (loading/own-share/revert). `/ui-ux-pro-max`: §9 checklist, share→see→stop flow, a11y (label/button/live-region), Phosphor + token audit.

```yaml
mask_mode_signoff: PASS
signoff_note: "All placeholders replaced; §4 cites 7 primitives; §8 names 3 prior-art regions in the adopted voice-study-room.html; §9 has 8 checkboxes."
```
