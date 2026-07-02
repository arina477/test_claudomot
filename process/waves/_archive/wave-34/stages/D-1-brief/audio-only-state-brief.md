# Design Brief — Audio-only-state banner + restore control

**Wave:** 34 · **Parent stage:** P-1 (design_gap_flag: true) · **Blocking:** yes · **Mode:** automatic

## 1. What we need
When the room degrades to audio-only (poor bandwidth → ConnectionQuality drop, or the member opts in), surface a calm, clear "Audio-only" state — a banner/pill telling the member video is paused to protect the call — plus a restore-video affordance to bring video back when conditions recover.

## 2. Where it lives
- **File:** `apps/web/src/shell/VoiceStudyRoom.tsx` — the IN-ROOM state. A slim banner/pill near the room header (or over the tile area) + a restore control.
- **Nav:** appears automatically on ConnectionQuality→Poor (debounced) or when the member toggles audio-only on.

## 3. Audience + states
- **Who:** the affected member (the state is per-member/client-side).
- **States:** normal (hidden) · audio-only-auto (bandwidth-triggered banner: "Audio-only — saving bandwidth" + restore) · audio-only-manual (member opted in: "Audio-only" + a toggle to restore) · restoring (re-subscribing video).

## 4. DESIGN-SYSTEM.md references
- **Colors:** `--surface-900` (banner fill), `--border-hairline` (border), `--text-primary` (message), `--text-secondary` (sub-text), `--accent-amber` (the bandwidth/degraded state — reuse the connection-reconnecting amber semantic), `--accent-emerald` (restore CTA / recovered).
- **Typography:** `text-sm` (banner message), `text-xs` (sub-text / "restore" affordance).
- **Spacing/radius:** panel padding, `--radius-md` (banner/pill), `--radius-full` (a status dot).
- **Shadows:** `--shadow-sm`.
- **Icons:** Phosphor `ph-wifi-low` / `ph-wifi-slash` (poor bandwidth), `ph-video` / `ph-video-camera` (restore video), `ph-microphone` (audio still on).
- **Components reused:** the ConnectionStateIndicator language (§8, the wedge-made-visible — amber reconnecting pattern) + Toast/banner primitive + Button (restore CTA).

## 5. Responsive contract
- **All breakpoints:** slim full-width banner OR a compact pill near the header; degrades to an icon+short-text pill on narrow. Restore control always reachable.

## 6. Interaction patterns
- Auto: on ConnectionQuality→Poor (debounced) → banner slides in (calm 200ms). Restore button → re-subscribe video. On recovery → banner can auto-dismiss or offer restore (per the design).
- Manual: a toggle (in the control cluster) → audio-only on/off.
- a11y: `role="status"` `aria-live="polite"` (announce "Switched to audio-only to save bandwidth"); restore is a real `<button>`; state conveyed in text + icon, not color alone.

## 7. Data shape
- Client-only: LiveKit ConnectionQuality (Excellent/Good/Poor/Lost) + the member's manual toggle state. No API. Audio stays active throughout (the invariant).

## 8. Prior art
- ConnectionStateIndicator (amber reconnecting/degraded language) → DESIGN-SYSTEM.md §8 "ConnectionStateIndicator" + the connection states in `design/voice-study-room.html` (STATE 2 connecting / error states, header region).
- Calm status/empty language → `design/voice-study-room.html:380-384` (the calm "No one else here" text pattern).
- Header region placement → `design/voice-study-room.html:275-282` (in-room header + chip).

## 9. Success criteria
- [ ] Uses only DESIGN-SYSTEM tokens from §4 (amber for degraded, emerald for restore/recovered; no invented hex).
- [ ] Renders all §3 states (normal-hidden, auto, manual, restoring).
- [ ] The message is CALM + explains WHY (protecting the call), not alarming.
- [ ] Restore-video affordance always present + reachable.
- [ ] Audio-still-on is communicated (mic icon) — reassures the member they can still talk.
- [ ] Responsive per §5 (degrades to icon+text pill).
- [ ] Real Phosphor icon names.
- [ ] a11y: role=status aria-live=polite; real restore button; state in text+icon not color-alone.

## 10. Non-goals
- NO per-track granular controls; NO custom bandwidth-heuristic UI; NO graduated quality-tier selector; NO persisted cross-session preference UI.

## 11. Reviewer briefing
`/plan-design-review`: hierarchy (unobtrusive but clear), brand coherence (calm academic, reuse amber connection-state semantic), edge-cases (auto vs manual vs restoring). `/ui-ux-pro-max`: §9 checklist, degrade→understand→restore flow, a11y (role=status/aria-live, text+icon), Phosphor + token audit.

```yaml
mask_mode_signoff: PASS
signoff_note: "All placeholders replaced; §4 cites 6 primitives; §8 names 3 prior-art regions; §9 has 8 checkboxes. Reuses the amber ConnectionStateIndicator semantic."
```
