# D-3 Design Review — Focus Room Panel
**Reviewer role:** /plan-design-review  
**Artifact:** `design/staging/focus-room-panel.html`  
**Brief:** `process/waves/wave-52/stages/D-1-brief/focus-room-panel-brief.md`  
**Reference surface:** `design/study-timer.html` + `design/DESIGN-SYSTEM.md`

---

## VERDICT: APPROVE

All six brief §9 success criteria pass. No invented tokens. No scope-fenced UI present. One minor annotation below (dimension 2) that does not block shipping but should be noted before canonicalisation.

---

## Dimension scores

### 1. Visual hierarchy — 9/10

The panel reads as a natural extension of the study-timer surface, not a separate product. The section-01 contextual integration frame is the strongest evidence: the focus-room panel sits underneath the timer placeholder at the same surface level (`--surface-800` card on `--surface-950` canvas), using the same hairline borders and `--radius-lg` rounding. The panel header carries an emerald presence ring icon and a subdued `--surface-900` background that echoes the study-timer's phase-pill treatment. Room name (`font-semibold text-base`) and "N focusing now" (`text-xs`) are correctly weighted per brief §4.

The "Open Focus Rooms" section heading (`text-lg font-semibold`) paired with the `.btn-primary` "Create Room" button is cleanly primary. The three-column grid of state panels (section 2) lands as informational documentation rather than visual noise — appropriate for a staging mockup.

What would make it a 10: the pulse-ring animation on the joined-state header icon (`animate-presence-ring`) is expressive but slightly more active than the study-timer's presence treatment, which uses static emerald borders on avatars in focus mode. Toning it to the same 0.5×opacity pulse used in the timer widget would tighten the family feel further.

### 2. Spacing rhythm — 8/10

Internal spacing is largely consistent with `design/study-timer.html`. Panel padding is `p-4` to `p-6`, matching the timer widget's `p-4`/`p-6` range. Gap between room cards (`gap-3`) aligns with the 12px step in the DESIGN-SYSTEM §3 spacing scale. The roster grid uses `gap-4` (16px) between avatar columns, which matches the timer's `gap-4` cluster spacing.

Minor gap: the "Open Focus Rooms" heading row has `mt-8` above it (section divider), but inside the staging document this is a document-layout choice, not a component spacing choice — it would not carry into the real server view. This is not a reject trigger, but the implementer should use the panel's own internal rhythm (gap at panel stack level, likely `gap-6` between the timer widget and focus-room panel in `shell/`) rather than the staging `mt-8` value.

What would make it a 10: explicit comment or token annotation on the expected panel-to-panel gap in the actual server view layout so the implementer doesn't guess.

### 3. Brand coherence — 10/10

Token fidelity is complete. Every hex value in the `:root` block matches the DESIGN-SYSTEM §1 table exactly: `--surface-950: #0a0a0b`, `--surface-900: #121214`, `--surface-800: #1c1c1f`, `--surface-700: #27272a`, `--surface-600: #3f3f46`, `--surface-500: #52525b`, `--accent-emerald: #10b981`, `--accent-amber: #f59e0b`, `--danger: #ef4444`, `--danger-text: #f87171`. No invented hex values appear anywhere in the file.

Button classes (`.btn`, `.btn-primary`, `.btn-ghost`, `.btn-secondary`, `.btn-sm`, `.btn-md`) are character-for-character copies of the study-timer primitives, including the transition syntax quirk (`transition: transition-colors 150ms ease` — technically malformed but matches the study-timer reference exactly). Input class `.input-base` is identical. Scroll styles match. The emerald focus chrome (`--glow-focus: 0 0 0 2px rgba(16,185,129,0.4)`) is reused on `.input-base:focus`. No gaming-neon. No secondary palette.

The only new class beyond `.room-card` is `.roster-grid` — which is a layout utility, not a new component class, and it does not appear to conflict with brief §9's "NO new component class beyond a room-card" constraint.

### 4. State completeness — 10/10

All six brief §3 states are present and visually distinct:

| State | Panel section | Verdict |
|---|---|---|
| Empty (no open rooms) | 04 / State: Empty Lobby | Pass — `ph-books` icon, headline "No active rooms", `.btn-primary` Create Room CTA |
| Open-rooms list (not joined) | 02 / Open Rooms List | Pass — two room cards with name, count, avatar preview cluster, hover "Click to join" reveal |
| Creating (inline input) | 03 / State: Creating Inline | Pass — inline input with emerald border focus ring, Cancel + Start Room, dimmed underlying list |
| Joined (roster + leave) | 01 / Contextual Integration | Pass — full avatar roster, "N focusing now" live count (`aria-live="polite"`), Leave Room ghost button |
| Loading | 06 / Loading Skeleton | Pass — shimmer skeletons for room card name + count + avatar cluster |
| Error / room-vanished | 07 / Error Recovery | Pass — `role="alert"`, "Room disbanded" with danger tint border, "Return to List" action |

Empty and joined states are visually unambiguous. The creating state's emerald border focus ring clearly signals active input without introducing a new pattern.

### 5. Body-doubling clarity — 9/10

The explicit-join character of the focus rooms is legibly distinct from the study-timer's ambient roster in three concrete ways:

1. **Roster scale.** The joined roster uses 48px avatars with names underneath — significantly larger than the study-timer's 32px overlapping cluster. The explicit-join signal is "I chose to be here with these specific people."
2. **Count label.** "N focusing now" (with a live emerald dot) versus the timer widget's "N studying / Live sync" — different verb and supporting copy.
3. **Join/leave affordance.** The presence of a named "Leave Room" control makes explicit that membership was opted-into. The timer roster has no such control because it is ambient (page-presence, not room-presence).

The `animate-presence-ring` on the joined-state header icon is a mild overlap with the timer's emerald accent language, but it is gated behind a different container structure (named room header vs. timer phase pill) and does not confuse the surfaces.

What would make it a 10: a brief label in the joined panel header — e.g., "Focus Room" as a secondary label above the room name — would make the panel identity explicit for first-time users who haven't yet internalised the two-surface model. Currently the distinction is carried structurally, not by copy.

### 6. Responsive — 9/10

Section 05 / Compact Active demonstrates the `<1024px` collapsed form: a single slim bar showing an emerald dot, truncated room name, "4 peers" count, and a ghost Leave icon. This pattern mirrors the study-timer's own section 05 / Compact Layout exactly — same bar height, same `.glass-panel` container, same `btn-sm btn-ghost p-1` Leave/Play button. The two surfaces will stack as a pair of identical-height compact bars at narrow widths, which is correct brief §5 behaviour.

The `prefers-reduced-motion` override in the `<style>` block is comprehensive: it covers `skeleton-layer`, `animate-presence-ring`, all stagger classes, and sets global duration to `0.01ms` — matching the study-timer's implementation exactly.

What would make it a 10: the compact bar shows "4 peers" but not the room name truncation behaviour at very tight widths (e.g. 320px). A `min-width: 0` on the name element (already present as `overflow-hidden pr-2`) handles it, but the staging mockup does not demonstrate the ~260px failure mode where both name and count compete. Not a reject trigger given the `truncate` class is present.

---

## Reject/revise trigger check

| Trigger | Status |
|---|---|
| Invented hex outside DESIGN-SYSTEM | Clear — all hex values match §1 table exactly |
| Voice/video UI (brief §10) | Clear — no mic, camera, LiveKit, or screen-share controls present |
| Persisted-history / scheduling / moderation UI (§10) | Clear — no attendance history, no schedule grid, no moderation controls |
| Panel crowding the study-timer/channel | Clear — section 01 demonstrates clean co-existence; timer sits above the panel at the same surface depth |
| New component class beyond room-card | Clear — `.roster-grid` is a layout primitive, not a component |
| AI-slop hierarchy (everything equally prominent) | Clear — hierarchy is deliberate: timer > joined room header > roster > room list |
| States missing or illegible | Clear — all six states present and distinct |

---

## Implementation notes for B-block

1. The `.btn` base class has `transition: transition-colors 150ms ease` — this is a verbatim copy of the study-timer quirk. The correct CSS value is `transition-property: color, background-color, border-color; transition-duration: 150ms; transition-timing-function: ease;` (or the Tailwind shorthand `transition-colors`). This is a pre-existing bug in the design system reference; carry it forward as-is until the design system is corrected, to keep visual parity with the study-timer widget.
2. The `aria-live="polite"` on the "N focusing now" span (joined state, line 310) is correctly placed. The B-block implementation should ensure this element is updated in-place (not re-mounted) so the live region fires on count change.
3. The `role="button" tabindex="0"` on room cards requires Enter and Space key handlers — the vanilla JS stub (line 575) demonstrates the pattern; the React/real implementation must replicate it.
4. External Unsplash image URLs are placeholder-only; replace with avatar component using the DESIGN-SYSTEM `Avatar` primitive (initials fallback on `--surface-600`) for production.
