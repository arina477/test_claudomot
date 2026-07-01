# Design Brief — voice-study-room (audio-first first slice)

**Wave:** 31
**Parent stage invoking:** P-1 Decompose (design_gap_flag: TRUE) — client sibling 1dd1f2ca
**Blocking current wave:** yes (B-3 must build to an ADOPTED design)
**Mode:** automatic (inherited from `process/session/.autonomous-session`)

> **Provenance note.** A file `design/voice-study-room.html` already exists, authored in bulk during v9 onboarding (commit 13c5fd6) — NEVER vetted through a D-block gate. It renders a full video-conferencing room (camera grid, screen-share, speaking rings, bandwidth-diagnostics, occupancy sub-list) that contradicts this wave's tightened audio-first first-slice scope on nearly every KEEP-OUT axis, and omits the core job (connect-on-demand Join surface + error state). Per D-1 Action 1 "referenced but present-yet-unvetted → must be verified/authored", it is treated as a stale artifact to be regenerated to this brief, not a canonical to preserve.

## 1. What we need

A minimal, audio-first voice-study-room client surface for a per-voice-channel drop-in study space: a clear **pre-join** state (connect on demand via a Join click), a minimal **in-room** state (audio-only participant tiles, mic toggle, Leave, own presence), and an **error/edge** state when joining fails. This is the "leave the study-room door open" drop-in voice space — calm, quiet, academic; not a video-conferencing UI.

## 2. Where it lives

- **Route / file path:** `apps/web/src/features/voice/VoiceStudyRoom.tsx` (new client component, `@livekit/components-react`). Rendered inside the central canvas pane (PANEL 3) of the existing server-channel shell when a voice channel is selected.
- **Navigation entry:** user selects a voice channel in the ChannelSidebar (`#`/voice/clipboard glyph list); the central canvas swaps from the message view to this voice-study-room surface. Join is connect-on-demand (user clicks Join — NOT auto-connect on channel select).

## 3. Audience + state

- **Who sees it:** authenticated StudyHall student who is a member of the server and can view the voice channel (session + membership gated; token minted server-side).
- **States to design (all in-scope, each must render in the staging mockup):**
  - **Pre-join (loading-idle):** the room before connecting — channel identity + primary **Join voice** CTA. Connect-on-demand.
  - **Connecting (loading-transient):** brief in-flight state after Join click while token is fetched + room connects (spinner/aria-busy on the Join button).
  - **In-room (populated):** audio-first participant tiles (avatar/name, NOT camera), the user's own tile shown, a **mic mute/unmute toggle**, a **Leave** button. Camera OFF by default (no camera UI at all this slice).
  - **In-room minimal (own-presence-only):** the user has joined but is alone — empty-ish room ("No one else here yet — the door's open."), user's own tile still present.
  - **Error/edge:** join failed (can't connect / not allowed / creds unavailable) — a clear danger message + a retry affordance back to pre-join.

## 4. DESIGN-SYSTEM.md references (REQUIRED)

Cite every primitive the generated design must consume:

- **Colors:**
  - `--surface-950` (#0a0a0b) canvas frame · `--surface-900` (#121214) tiles / pre-join card fill · `--surface-800` (#1c1c1f) central canvas · `--surface-700` (#27272a) control-bar fill / hover · `--surface-600` (#3f3f46) borders
  - `--border-hairline` (rgba 255,255,255,0.06) default tile/card border · `--border-hover` (0.10) hover
  - `--text-primary` (0.92) names/headings · `--text-secondary` (0.60) metadata/status · `--text-muted` (0.40) placeholder/empty copy
  - `--accent-emerald` (#10b981) → `--primary`: Join CTA fill, own-presence dot, mic-ON, focus ring. `--success`/`--presence-online` also map here.
  - `--danger` (#ef4444) → `--error`/`--destructive`: Leave button fill, mic-muted state, error-state icon/border. `--danger-text` (#f87171) for any danger text on a danger/10 tint (WCAG AA — DESIGN-SYSTEM §1).
  - NO `--accent-amber` this slice (amber = reconnecting/bandwidth-downgrade → KEEP-OUT).
- **Typography (DESIGN-SYSTEM §2):** `text-2xl` 24px pre-join / empty-state headline · `text-lg` 18px section title · `text-sm` 14px body/participant name (min body) · `text-xs` 12px status/metadata. Geist family, weights 400 body / 500 name / 600 heading+button.
- **Spacing / radius (§3, §4):** 4px base; panel padding 16px, section gaps 24px, tile padding 8–12px. `--radius-md` 6px buttons/controls · `--radius-lg` 8–10px tiles/cards/pre-join panel · `--radius-full` 9999px avatars, presence dots, mic pill.
- **Shadows (§5):** `--shadow-sm` (0 1px 2px rgba0,0,0,.4) control bar/card · `--glow-focus` (0 0 0 2px rgba16,185,129,.4) emerald focus ring on every interactive control. NO glassmorphism/backdrop-blur (not a system token).
- **Motion (§6):** `transition-colors 150ms ease` on hover/focus; presence/state changes 200ms color fade; respect `prefers-reduced-motion`. No bouncy/spring easing; no speaking-pulse animation (that is a KEEP-OUT presence ring).
- **Icons (§7 — Phosphor, regular; filled only for active/selected):** `ph-microphone` / `ph-microphone-slash` (mic toggle), `ph-phone-x` or `ph-sign-out` (Leave), `ph-speaker-high` (voice-channel/room glyph), `ph-spinner` (connecting), `ph-warning-circle` (error state), `ph-users` (participant count). Mic/leave line weight matches `--text-secondary`; filled variant only when mic is active.
- **Components to reuse:**
  - **Button** (§8 primary emerald / destructive danger / secondary surface-700; focus-visible ring; loading state = spinner + aria-busy) — Join = primary, Leave = destructive, mic toggle = secondary/ghost with pressed state.
  - **Avatar** (§8 — radius-full, initials fallback on surface-600, presence dot with surface-900 ring; `alt` = display name). Reuse as audio-first participant tile face. Own tile shows emerald online dot. Do NOT add the emerald voice-presence RING (that is a KEEP-OUT speaking indicator).
  - **Empty / Error / Loading states** (§8) — pre-join = idle affordance; connecting = button spinner (never a full-screen spinner); alone-in-room = empty pattern; join-failed = danger icon + cause + retry.
  - **VoiceRoomTile / panel** (§8 StudyHall primitive) — consume its audio-only tile + mic/leave control definition, but SCOPE DOWN: mic + leave controls only (no cam / no screen-share / no speaking ring / no audio-only-fallback tile this slice).
  - **ChannelHeader** (§8) — voice channel glyph + name + participant count, hairline bottom border, matching the existing shell chrome.

## 5. Responsive contract

Desktop app; mobile out of scope (DESIGN-SYSTEM §9). This surface lives in the central canvas pane (PANEL 3) of the existing 3-pane shell.
- **Desktop comfortable (1440+):** central canvas with participant tiles laid out in a calm centered cluster (max content width ~1100px); mic + Leave control cluster anchored bottom-center or in the channel header region. Server rail + channel sidebar persist.
- **Desktop default (1280):** all 3 panes visible; tiles wrap in a responsive grid within the canvas.
- **Desktop compact (1024 min):** member list collapses per shell rule; channel sidebar + server rail persist; tiles reflow to fewer columns; controls remain reachable.
- **Narrow (<1024):** channel sidebar becomes an overlay drawer per shell; server rail persists; the room canvas fills; controls stay visible and ≥44px hit target.

## 6. Interaction patterns

- **Join (pre-join → connecting → in-room):** click Join voice → button enters loading (spinner, label hidden, `aria-busy`) → on success renders in-room; on failure renders error state. Connect-on-demand only.
- **Mic toggle:** click toggles mute/unmute; real `<button>` with `aria-pressed`; icon swaps `ph-microphone` ↔ `ph-microphone-slash`; muted uses danger tint (not amber). Keyboard: focusable, Space/Enter toggles. Suggested shortcut `M` (documented, non-essential).
- **Leave:** click leaves the room → returns to pre-join state. Destructive-styled but low-drama (calm, not a red-alert phone-slam).
- **Keyboard / ARIA:** Tab order = Join (pre-join) OR mic → Leave (in-room); every control focus-visible with `--glow-focus` emerald ring (never bare browser default). Participant list is a semantic list; presence conveyed by text + icon, not color alone. Join/leave announced via a polite live region (`role="status"` aria-live=polite). No keyboard trap — focus reachable and escapable.
- **Error UX:** join failure shows danger icon + plain cause ("Couldn't connect to the study room" / "You don't have access to this room") + a **Try again** button returning to pre-join. `role="alert"` on the error.

## 7. Data shape

- **Endpoint consumed:** `POST /channels/:channelId/voice/token` (built by seed d8a85de0 this wave). Success → `200 { token, url }`. Client then connects via `@livekit/components-react` `<LiveKitRoom serverUrl={url} token={token} connect audio={true} video={false} />`.
- **Error payloads the design handles:** `403` (not a member / not allowed) → "You don't have access to this room." · `404` (channel missing) → generic can't-connect · `400` (not a voice channel) → generic can't-connect · `503` (LiveKit creds unset at runtime) → "Voice is temporarily unavailable." · any connect-time failure → "Couldn't connect to the study room."
- **In-room data:** participant list from LiveKit room state (identity = userId, name = display name); each participant → avatar/name tile + mic on/off. Own participant flagged "(You)". Camera track ignored (video={false}).
- **Empty payload:** in-room with only the local participant → alone-in-room empty pattern.

## 8. Prior art (match this visual language)

- **Shell chrome (server rail + channel sidebar + central canvas + channel header):** match `design/server-channel-view.html` (canonical 3-pane shell) — the voice room lives inside PANEL 3; reuse its rail, sidebar, and header structure so this surface is coherent with adjacent screens.
- **Primary Join CTA + multi-state staging layout + focus-ring discipline:** match `design/invite-join.html:158-164` (emerald `bg-accent-emerald` primary button, `focus-ring` class, danger error rows) and its "all N states shown in one staging file" layout convention.
- **Empty / join / error affordances + Geist type + zinc surfaces:** match `design/app-home.html:322-367` (Join form with inline error + subtext, calm bento layout, `--surface` fills).

## 9. Success criteria (APPROVE checklist)

The design is approved only when ALL of these hold:
- [ ] Uses exactly the DESIGN-SYSTEM.md tokens listed in §4 — no new hex values, no invented tokens, no glassmorphism/backdrop-blur, no spring easing.
- [ ] Renders ALL five states from §3 (pre-join, connecting, in-room populated, in-room alone/empty, error) — each visibly present in the staging file.
- [ ] In-room shows audio-first tiles (avatar/name), the user's OWN presence, a mic mute/unmute toggle, and a Leave button — and NOTHING from the KEEP-OUT list.
- [ ] Camera is OFF by default with no camera/video UI, no camera grid, no screen-share, no speaking/voice-presence ring, no bandwidth-downgrade UI, no reconnection UI, no who's-in-room occupancy sidebar sub-list.
- [ ] Every interactive control (Join, mic, Leave, retry) has a visibly designed emerald `--glow-focus` focus state and is keyboard-operable (no browser-default focus, no keyboard trap).
- [ ] Text/background and interactive-element contrast meets WCAG AA in the dark theme (incl. muted-text-on-near-black per DESIGN-PRINCIPLE 1; danger-on-tint uses `--danger-text`).
- [ ] Mic-muted uses danger tint (NOT amber); no amber anywhere (amber is reserved for reconnecting/bandwidth → out of scope).
- [ ] Coheres with `design/server-channel-view.html` shell chrome (rail, sidebar, channel header) — the room sits in PANEL 3 without clashing.
- [ ] All icon references are real Phosphor component names (§4 list), no invented glyphs.
- [ ] Visual hierarchy reads at a glance: pre-join → Join dominates; in-room → participants + mic/Leave dominate; calm/academic, not a busy conferencing dashboard.

## 10. Non-goals (KEEP-OUT — defer to later M6 waves; do NOT design)

- Screen-share control or UI.
- Camera / video tracks, camera grid, camera toggle, speaker-vs-grid layout switcher.
- Speaking / voice-presence rings or audio-level animations (`is-speaking`, audio bars, speak-pulse).
- Low-bandwidth / audio-only-fallback UI, network-health diagnostics, latency/bitrate readouts.
- Reconnection UI, multi-room switching, "region/LiveKit" metadata block.
- Who's-in-room occupancy indicator in the channel sidebar (separate future surface — split to task 78f51968; do NOT design it here).
- Copy-room-link, invite-to-room, pin-to-screen, chat-toggle, host badges, room-details right panel.
- Any glassmorphism material, spring/bouncy easing (not in DESIGN-SYSTEM tokens).

## 11. Reviewer briefing (D-3 review & adopt)

`/plan-design-review` should score: visual hierarchy (does Join dominate pre-join; do mic/Leave + tiles dominate in-room), spacing rhythm (4px system per §3), brand coherence (calm academic zinc+emerald, coheres with server-channel-view shell), edge-case handling (all five §3 states present, error state clear).

`/ui-ux-pro-max` should verify: every §9 success-criterion checkbox, connect-on-demand flow sensibility, DESIGN-SYSTEM token audit (no off-system hex, no amber, no glass), Phosphor icon-name audit (§4 list are real), accessibility minimums (focus rings, keyboard operability, aria-pressed on mic, aria-live on join/leave, no keyboard trap, WCAG AA dark contrast), and strict KEEP-OUT compliance (§10 — flag any camera/screen-share/speaking-ring/bandwidth/occupancy leakage).

---

```yaml
mask_mode_signoff: PASS
signoff_note: "All placeholders replaced; §4 cites 6+ DESIGN-SYSTEM primitives (Button, Avatar, Empty/Error/Loading, VoiceRoomTile, ChannelHeader + full color/type/radius/shadow/motion/icon token sets); §8 names 3 prior-art mockups (server-channel-view, invite-join, app-home); §9 has 10 checkboxes. Scope matches P-2 keep-OUT exactly."
```
