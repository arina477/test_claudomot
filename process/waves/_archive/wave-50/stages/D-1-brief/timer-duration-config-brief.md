# Design Brief — Study-timer duration-config affordance

## 1. What we need
A minimal, in-widget affordance letting a server member set the shared study timer's **work** and **break** lengths (in whole minutes) to custom values — extending the shipped `design/study-timer.html` widget, which currently shows a fixed 25/5 Pomodoro. Two validated number inputs + an Apply action. Per-server (all members share the config), editable only while the timer is idle.

## 2. Where it lives
The existing StudyTimerWidget (`apps/web/src/shell/StudyTimerWidget.tsx`), mounted in the server view main column above the message list. The affordance is part of the same widget card — NOT a separate route or modal. Canonical design extends `design/study-timer.html`.

## 3. Audience + states
Audience: any server member viewing the timer. States to design:
- **Idle-editable:** timer idle → the work/break minute inputs are editable + Apply enabled. Shows current configured values (default 25 / 5).
- **Locked (running or paused):** inputs disabled/read-only with a short hint ("Reset the timer to change lengths"); the current values still display.
- **Validation-error:** an out-of-range/invalid entry (work not 1–120, break not 1–60) shows an inline error state on the offending input; Apply blocked.
- **Applying (pending):** Apply in-flight — optimistic/disabled state.
- **Applied/synced:** new values persist + reflect for all members (the widget re-renders from the authoritative broadcast).
- (Loading + error states inherit the widget's existing skeleton/error patterns — no new design.)

## 4. DESIGN-SYSTEM.md references (REQUIRED)
1. `--surface-800` (#1c1c1f) widget canvas / input fill; `--surface-700` (#27272a) input border/hover.
2. `--border-hairline` (rgba(255,255,255,0.06)) default input border; `--border-hover` for focus/hover.
3. `--accent-emerald` (#10b981) primary Apply button + focus ring (matches `.btn-primary` in study-timer.html); `--accent-amber` (#f59e0b) reserved for the Break association (mirrors the phase pill).
4. `--danger` (#ef4444) validation-error border/text (fill/border use only).
5. Typography: `text-sm` 14px input text (min body size), `text-xs` 12px field labels/hint (metadata), weight 500 medium labels / 600 semibold Apply.
6. `--radius-md` (6px) inputs + buttons (matches existing `.btn`/inputs).
7. Reuse existing `.btn`, `.btn-sm`/`.btn-md`, `.btn-primary`, `.btn-ghost` classes from `design/study-timer.html`; disabled state via existing `.btn:disabled` (opacity + not-allowed).

## 5. Responsive contract
- **≥1024px (full widget):** inputs + Apply inline in the widget body, comfortably sized (28–34px control height per `.btn-sm`/`.btn-md`).
- **<1024px (slim bar):** the config affordance collapses behind a compact control (e.g. a small "gear"/edit affordance) OR stacks minimally — MUST NOT crowd the hero countdown or the phase slim-bar (which the F-1 fix restores this wave). Prefer a compact/collapsed entry at slim width.
- Reduced-motion: no new animation; any expand/collapse respects `prefers-reduced-motion` (instant).

## 6. Interaction patterns
- Two number inputs: Work (min), Break (min), each with min/max + step 1; keyboard-editable; Enter or Apply commits.
- Apply is disabled until a value changed AND both valid AND timer idle.
- When locked (running/paused), inputs are visibly disabled with the reset hint; no silent no-op.
- Invalid entry → inline error + Apply blocked; clearing/correcting restores.
- On apply success, the affordance returns to a settled display of the new values (no toast required; the countdown/config reflect it).

## 7. Data shape
`workMinutes: int (1–120)`, `breakMinutes: int (1–60)`; server DTO carries `workDurationMs`/`breakDurationMs` (ms) → widget renders minutes. Config PATCH returns the updated timer DTO; broadcast updates all members.

## 8. Prior art (match this visual language)
1. `design/study-timer.html` — the widget being extended (hero countdown, `.btn` control row, phase pill, roster). MATCH its control chrome + emerald/amber phase language exactly.
2. `design/DESIGN-SYSTEM.md` — input/button primitives, surface layering, accent restraint.
3. Existing channel/DM composer inputs (dark input on `--surface-800`, hairline border, emerald focus) — match input styling.

## 9. Success criteria (APPROVE checklist)
- [ ] Idle-editable, locked (running/paused w/ reset hint), validation-error, applying, and applied states are all shown and visually distinct.
- [ ] Work/break inputs use `--surface-800` fill + hairline border + emerald focus ring + `--radius-md`, `text-sm` — consistent with existing dark inputs.
- [ ] Apply uses the existing `.btn-primary` emerald; disabled state uses existing `.btn:disabled`.
- [ ] The affordance does NOT crowd or overlap the hero countdown, phase pill, or the <1024 slim-bar; slim-width shows a compact/collapsed entry.
- [ ] Validation-error state uses `--danger` on border/text only (no red fill blocks), with an accessible inline message.
- [ ] Reduced-motion honored; controls are real buttons/inputs (keyboard-accessible, aria-labels on the minute inputs).
- [ ] No new component class or invented token — all chrome reuses study-timer.html + DESIGN-SYSTEM primitives.

## 10. Non-goals
- NO per-user duration preferences (per-server only).
- NO presets/templates library, NO long-break-every-N-cycles, NO duration history/analytics.
- NO heavy settings panel / modal / separate settings route.
- NO change-while-running behavior (locked to idle by spec; 409 server-side).

## 11. Reviewer briefing (D-3)
Judge whether the affordance reads as a natural, restrained extension of the shipped study-timer widget (not a bolted-on settings panel), whether all 5 states are legible + token-compliant, whether it stays out of the way of the countdown/phase-bar at every breakpoint, and whether the locked (running/paused) state clearly communicates "reset to change." Reject any per-user/presets/heavy-UI drift (scope-fenced).

```yaml
mask_mode_signoff: PASS
signoff_note: "1 gap; extends adopted design/study-timer.html; reuses existing btn/input/surface/accent primitives; no new component class or token; scope-fenced to minimal 2-input+apply affordance."
```
