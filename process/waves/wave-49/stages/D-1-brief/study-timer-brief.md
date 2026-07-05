# Design Brief — study-timer (shared study timer widget)

**Wave:** 49
**Parent stage invoking:** P-2 (design_gap_flag=true; spec c3daf6d3)
**Blocking current wave:** yes
**Mode:** automatic

## 1. What we need
A shared study-timer widget in the server view: a synchronized Pomodoro (Work/Break) countdown everyone in the study server sees, with Start/Pause/Reset controls and a small ephemeral "who's studying with me right now" roster.

## 2. Where it lives
- **Route / file path:** the server view (channel view). Component `apps/web/src/shell/StudyTimerWidget.tsx`. Placement: a compact panel/bar at the top of the channel column (below the ChannelHeader) OR a right-rail card — a persistent, glanceable "focus session" surface within the active study server. (D-2 may explore both placements.)
- **Navigation entry:** always visible in the server view (not a separate route); collapses to a compact running-countdown when scrolled.

## 3. Audience + state
- **Who sees it:** any signed-in member of the study server.
- **States to design:** idle ("Start a focus session" CTA) / running-Work (emerald focus) / running-Break (amber) / paused (frozen remaining) / loading (skeleton) / error (couldn't load + retry). Plus the presence roster: empty (just you / "1 studying"), few (avatars + count), many ("+N" overflow).

## 4. DESIGN-SYSTEM.md references (REQUIRED)
- **Colors:** `--surface-800` (widget panel), `--surface-900` (controls area / roster), `--border-hairline` (panel border), `--text-primary` (countdown mm:ss), `--text-secondary` (phase label, "N studying"), `--accent-emerald` (Work phase, primary Start, running ring, presence), `--accent-amber` (Break phase, paused/reconnecting), `--danger` (error), `--text-muted` (idle placeholder).
- **Typography:** the countdown is the hero — `text-2xl`/large tabular numerals (mm:ss); `text-sm` phase label + controls; `text-xs` "N studying" + timestamps; weight 600 countdown/buttons, 500 phase. Geist (+ Geist Mono / tabular-nums for the countdown so digits don't jitter).
- **Spacing / radius:** 4px base; panel padding 16px; control gap 8px; `--radius-md` (buttons), `--radius-lg` (panel/card), `--radius-full` (avatars, presence dots, phase pill).
- **Shadows:** `--shadow-sm` (panel/card), `--glow-focus` (emerald focus ring on controls), `--glow-subtle` (gentle highlight on the running timer).
- **Icons (Phosphor, 16–20px):** play (Start), pause (Pause), arrow-counter-clockwise (Reset), timer/hourglass (idle/phase), users (roster). Real names only.
- **Components to reuse:** **Button** (primary emerald Start / ghost Pause,Reset / disabled states), **Badge/Pill** (Work/Break phase pill, "N studying" count), **Avatar** (roster avatars + presence — reuse the Avatar primitive + the voice-room participant-tile roster pattern), **ConnectionStateIndicator** pattern (reconnecting/offline hint on the timer), **Empty/Loading/Error states**, **Card** (widget container).

## 5. Responsive contract
- **Desktop full (1440+):** full widget — large countdown, phase pill, 3 controls, roster avatars inline.
- **Desktop default (1280):** same, slightly condensed.
- **Compact (1024 min):** countdown + phase + controls stay; roster collapses to "N studying" count + a couple avatars.
- **Narrow (<1024):** the widget compresses to a slim running-countdown bar (mm:ss + phase + pause) with controls behind a tap; roster → count only. Independent-scroll panes unaffected.

## 6. Interaction patterns
- Controls: Start (idle→running-Work), Pause (freeze remaining, amber), Reset (→idle). Optimistic feedback then reconcile with the `study-timer:update` broadcast (everyone converges to the authoritative state). Buttons: hover/active/focus-visible ring/disabled per Button primitive.
- Countdown: counts down to the authoritative endsAt (mm:ss, tabular-nums, 1s tick client-side — NOT a client-authored timer). Phase auto-advances Work→Break→Work (visual transition, emerald↔amber, 200ms color fade; respect prefers-reduced-motion).
- Presence roster: updates live from `study-timer:presence` (who's viewing the running timer). Distinct from the online-presence dots — label it clearly ("studying now" / focus context), avatars show current viewers.
- Keyboard: controls are real buttons (Tab, Enter/Space, focus-visible ring); the widget is an aria-labelled region; countdown announced politely on phase change (aria-live).

## 7. Data shape
- `GET /servers/:serverId/study-timer` → `{serverId, phase:'work'|'break', runState:'idle'|'running'|'paused', endsAt: string|null, remainingMs, running}`. Controls: POST /servers/:serverId/study-timer/{start,pause,resume,reset}. Sockets: `study-timer:update` {serverId, timer}; `study-timer:presence` {serverId, viewers:[{userId,displayName}], count}.
- idle/no-row → calm idle DTO. Loading → skeleton. Error → retry.

## 8. Prior art (match this visual language)
- Server-view placement + header/panel chrome → match `design/server-channel-view.html` (the channel column + ChannelHeader area where the widget lands).
- Presence roster (avatars + count of co-present members) → match `design/voice-study-room.html` (participant tiles / occupancy roster) — the timer roster is the same "who's here together" visual language, scoped to the live timer.
- Real-time surface + dark tokens + state treatments → match `design/direct-messages.html` (offline/pending state chrome, token usage).

## 9. Success criteria (APPROVE checklist)
- [ ] Uses exactly the DESIGN-SYSTEM.md tokens in §4 (no new hex, no invented tokens); dark-only.
- [ ] Renders ALL §3 states: idle / running-Work / running-Break / paused / loading / error + roster empty/few/many.
- [ ] Countdown is a large tabular-nums hero (mm:ss) that won't digit-jitter; Work=emerald, Break=amber phase distinction is clear.
- [ ] Responsive per §5 (full at 1280+, slim running-bar <1024).
- [ ] Reuses Button / Badge / Avatar / Card / Empty-Loading-Error primitives (no bespoke re-invention).
- [ ] The ephemeral "studying now" roster is VISUALLY DISTINCT from the online-presence dots — a user can tell "who's focusing on this timer" apart from "who's online" (P-4 jenny note C).
- [ ] All icon references are real Phosphor names (§4).
- [ ] A11y: controls are real buttons w/ focus-visible ring; widget is an aria-labelled region; phase changes announced aria-live polite; reduced-motion respected on the emerald↔amber transition.
- [ ] Calm/academic/quieter-than-Discord: a focus tool, not a flashy gamified timer (no neon, no big animations).

## 10. Non-goals
- Custom work/break durations (deferred to seed f4b3659e — hardcoded 25/5 this wave).
- Educator-only control gate (any member controls — MVP).
- Persisted attendance/history/stats (ephemeral presence only; later study-sessions slice).
- Study sessions (joinable rooms), collaborative whiteboard (later slices).
- Per-user private timers (this is ONE shared server timer).

## 11. Reviewer briefing (D-3)
`/plan-design-review` should score: visual hierarchy (countdown-as-hero vs controls vs roster), spacing rhythm, brand coherence (calm academic focus tool), edge-case handling (idle/paused/break/error/roster-overflow).
`/ui-ux-pro-max` should verify: all §9 criteria; the Start→focus→auto-advance→everyone-sees-same-timer flow reads clearly; the "studying now" roster is distinguishable from online-presence; DESIGN-SYSTEM token fidelity; Phosphor names real; a11y (buttons, aria-live phase, reduced-motion).

```yaml
mask_mode_signoff: PASS
signoff_note: "Placeholders replaced; §4 cites 12+ primitives; §8 names 3 prior-art mockups (server-channel-view, voice-study-room, direct-messages); §9 has 9 checkboxes. Widget composes existing primitives — no new design-system tokens expected."
```
