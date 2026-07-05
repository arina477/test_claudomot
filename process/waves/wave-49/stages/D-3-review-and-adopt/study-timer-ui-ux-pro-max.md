# D-3 Review — Shared Study Timer (ui-ux-pro-max lens)
**Reviewer:** Reviewer B (ui-ux-pro-max / UX + requirement + token audit)
**Mockup:** `design/staging/study-timer.html`
**Brief:** `process/waves/wave-49/stages/D-1-brief/study-timer-brief.md`
**Design system ref:** `design/DESIGN-SYSTEM.md`

---

## VERDICT: REVISE

Two criteria are binary failures (aria-live absent; prefers-reduced-motion absent). The jenny-flagged load-bearing roster-distinction criterion (§9 item 6) is only partially addressed. Token drift is concrete and documented. All other §9 criteria range from solid to acceptable. The design is not far from APPROVE — these are targeted, fixable gaps, not a fundamental rethink.

---

## §9 Success-Criteria Audit

### Criterion 1 — Tokens: only DESIGN-SYSTEM.md tokens, no new hex, dark-only
**PARTIAL**

Surface, text, accent, danger, radius, and shadow tokens are correctly defined and referenced throughout. Dark-only is maintained.

Concrete violations:

| Location | DS value | Mockup value | Severity |
|---|---|---|---|
| `--border-hairline` `:root` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.08)` | Moderate — comment even admits "slightly bumped for pure visibility," making the drift explicit. Downstream code consuming the token will differ from DS. |
| `--border-hover` `:root` | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.15)` | Moderate — undocumented 50% bump. |
| `--shadow-sm` definition | `0 1px 2px rgba(0,0,0,0.4)` | adds `inset 0 1px 0 rgba(255,255,255,0.04)` | Minor — extended with an off-system inset highlight. |
| `--shadow-pop` definition | `0 8px 24px rgba(0,0,0,0.5)` | adds `inset 0 1px 0 rgba(255,255,255,0.04)` | Minor — same inset addition. |
| Hero countdown `drop-shadow-[0_2px_10px_rgba(16,185,129,0.15)]` | No equivalent token | Raw inline value | Minor — emerald drop-shadow; no DS token for this. |
| Avatar ring `shadow-[0_0_6px_rgba(16,185,129,0.4)]` | No equivalent token | Raw inline value | Minor — off-system emerald glow. |
| Phase-dot indicator `shadow-[0_0_8px_rgba(16,185,129,0.8)]` | No equivalent token | Raw inline value — 0.8 opacity pushes toward neon | Moderate — 0.8 strength on a glow contradicts "no gaming-neon" (brief §9 criterion 9). |
| Error panel `shadow-[0_0_20px_rgba(239,68,68,0.05)]` | No equivalent token | Raw inline value | Minor. |

Fix: Restore `--border-hairline` to `rgba(255,255,255,0.06)` and `--border-hover` to `rgba(255,255,255,0.10)`. Remove the `inset` additions from shadow definitions or document them as intentional extensions in DESIGN-SYSTEM.md. Replace inline raw rgba shadow/glow values with a DS token (`--glow-focus` already covers `rgba(16,185,129,0.4)` at 2px ring; the countdown drop-shadow should be dropped or mapped to `--glow-subtle`). Reduce the phase-dot glow opacity from `0.8` to `0.4` or less.

---

### Criterion 2 — ALL §3 states rendered: idle / running-Work / running-Break / paused / loading / error + roster empty/few/many
**MET**

| State | Panel | Present |
|---|---|---|
| Idle | 02 / State: Idle | Yes — 25:00 muted, "Start a focus session," emerald Start, dashed-avatar empty roster |
| running-Work | 01 / Contextual Integration (hero) | Yes — emerald Focus pill, 24:59, 8 studying, avatar cluster |
| running-Break | 03 / State: Break (Amber) | Yes — amber Break pill with `ph-coffee`, 04:59, amber border on pill |
| Paused | 04 / State: Paused | Yes — 12:34 at opacity-70, neutral "Paused" badge, Resume + Reset |
| Loading | 06 / State: Loading Sync | Yes — skeleton shimmer on countdown and controls |
| Error | 07 / Error & Disconnect Recovery | Yes — danger banner, warning-circle icon, "Retry Connection," reconnecting/offline indicators |
| Roster empty | 02 (idle) | Yes — dashed outline avatar + "Empty" label |
| Roster few | 03 (break, 2 avatars); 01 hero (3 named avatars) | Yes |
| Roster many (overflow) | 01 hero ("+5" overflow chip) | Yes |

Minor: The brief mentions "1 studying (just you)" as a distinct near-empty state. This sits between Empty and Few and is not explicitly depicted. For a static mockup this gap is acceptable — the empty-roster render in section 02 covers the spirit of it.

---

### Criterion 3 — Countdown: large tabular-nums hero, no digit jitter; Work=emerald / Break=amber distinction clear
**MET**

- `.tabular-countdown` correctly applies `font-variant-numeric: tabular-nums` using Geist Mono. No jitter.
- Hero: `font-mono text-[32px] md:text-[40px] font-semibold` — well above the brief's `text-2xl` minimum. Appropriate hero weight.
- Meso panels: `text-3xl` (idle/break), `text-2xl` (paused), `text-sm` (compact bar) — scale appropriate to each panel's purpose.
- Work=emerald: hero widget is emerald throughout (Focus pill, avatar rings, glow, "Live sync" label). Clear.
- Break=amber: amber pill with `ph-coffee`, amber border on pill, amber coloring. Clear.
- Paused: neutral palette (surface-700 badge) — distinct from both active states. Good.

---

### Criterion 4 — Responsive per §5 (full at 1280+, slim running-bar under 1024)
**PARTIAL**

The mockup demonstrates two responsive tiers:
- Hero widget (section 01): `flex-col md:flex-row` layout adapts at the `md` breakpoint (768px).
- Compact Layout (section 05): w-64 slim bar — play/pause icon + countdown + user count.

Concern: The widget responsive flip uses `md` (768px) rather than the DS's 1024px minimum. Brief §5 says the slim-bar kicks in "under 1024" — the implementation breakpoint in the mockup would trigger at 768px, shrinking the widget too early. This will need correction at B-block, but the mockup's intent is legible. Slim bar is shown; the breakpoint value is a fixable implementation detail.

The 1280px "condensed" and 1440px "comfortable" variants are not separately depicted. For a static mockup this is an acceptable gap; the hero covers the full-layout intent.

---

### Criterion 5 — Reuses Button / Badge / Avatar / Card / Empty-Loading-Error primitives
**MET**

- Button: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, sizes `.btn-md` / `.btn-sm`, focus-visible ring via `--glow-focus`. Matches DS §8 Button spec.
- Badge/Pill: Phase pill uses `rounded-[var(--radius-full)]`, semantic color fills, `text-xs font-medium uppercase tracking-wide`. Matches DS §8 Badge/Pill.
- Avatar: w-8 (32px) and w-6 (24px) rounded-full, `ring-2` background separation, initials fallback ("AJ" on `--surface-700`), `alt` = display name. Matches DS §8 Avatar. Voice-presence emerald ring pattern reused correctly.
- Card: `glass-panel` = `--surface-800` fill, `--border-hairline` border, `--radius-lg`, `--shadow-sm`. Matches DS §8 Card. The added hover transform (see nit below) is the only extension.
- Empty: Dashed placeholder avatar + "Empty" label in idle (section 02). Matches DS §8 Empty pattern.
- Loading: Shimmer skeleton with `skeleton-layer` class using `--surface-700/600` gradient. Matches DS §8 Loading. Correctly avoids spinners for content areas.
- Error: Danger icon + cause text + retry CTA (section 07). Matches DS §8 Error pattern.
- ConnectionStateIndicator: Reconnecting (amber dot + spinner) and Offline (grey dot + "Sync halted") variants are shown. Matches DS §8 ConnectionStateIndicator states.

No bespoke re-invention found.

---

### Criterion 6 — "Studying now" roster VISUALLY DISTINCT from online-presence dots (load-bearing, jenny P-4 note C)
**PARTIAL — highest-risk open item**

What the mockup provides:
- Geometric distinction: the timer roster uses a full emerald ring *border* encircling the avatar; the DS's online-presence is a small bottom-right *dot* (per DS §8 MemberListItem "presence dot (bottom-right ring)"). Ring vs. dot is geometrically different.
- Verbal label: "8 studying" + "Live sync" text in the roster area clearly contextualizes the group.

What is insufficient:
1. Color semantic overlap: `--presence-online → --accent-emerald` per DS §1 semantic mappings. The timer roster ring is also `--accent-emerald`. A user seeing an emerald ring on an avatar in the timer roster and an emerald dot on an avatar in the member list will encounter the same hue carrying two distinct meanings ("focusing together on this timer" vs. "online in the server"). The geometry differs, but the color signal is identical.
2. Break-state roster inconsistency: Section 03 (Break) strips the emerald ring entirely, rendering avatars in `opacity-70 grayscale`. This is inconsistent — the "focusing together" visual identity changes between Work and Break states. If the emerald ring is the marker for "in this timer," it should persist in Break (perhaps amber-ringed to match the Break phase), not disappear.
3. No in-context proof: The mockup places the timer roster in isolation (section 01's background content is skeleton messages with no MemberListItem). There is no side-by-side showing the timer roster avatars next to member-list presence dots to validate that the distinction holds when both are visible simultaneously.

Fix required: Either (a) change the timer roster ring to a non-emerald color (amber is already used for Break — consider a distinct white or surface-400 ring with an emerald "timer" badge overlay to distinguish it from presence-online dots while keeping the Work palette), or (b) add a small, visually distinct "in session" indicator that is not the same hue as the presence dot. The verbal label "studying now" is helpful but cannot be the sole differentiator. Also: make the Break-state avatars use amber rings rather than dropping the ring entirely.

---

### Criterion 7 — All icon references are real Phosphor names
**MET**

All icons verified against Phosphor Icons catalog:

| Usage | Class | Valid |
|---|---|---|
| App header | `ph-books` | Yes |
| Channel header | `ph-hash` | Yes |
| Connection | `ph-plugs-connected` | Yes |
| Members | `ph-users`, `ph-user` | Yes |
| Pause | `ph-fill ph-pause` | Yes |
| Reset | `ph-arrow-counter-clockwise` | Yes |
| Break phase | `ph-coffee` | Yes |
| Skip break | `ph-fill ph-fast-forward` | Yes |
| Start | `ph-fill ph-play` | Yes |
| Error | `ph-warning-circle` | Yes |
| Loading | `ph-spinner` | Yes |

Brief §4 mentions timer/hourglass for idle/phase. The idle state renders 25:00 muted text as the phase indicator without an icon, and the running states use phase pills. The absence of the hourglass in idle is a minor deviation from the brief's suggestion, not a requirement. No blocking issue.

---

### Criterion 8 — A11y: real buttons + focus ring; aria-labelled region; aria-live on phase change; reduced-motion on emerald-amber transition
**FAIL on two sub-criteria**

| Sub-criterion | Status | Evidence |
|---|---|---|
| Controls are real `<button>` elements | PASS | Start, Pause, Reset, Resume, Skip, Retry Connection — all `<button>` |
| Focus-visible ring | PASS | `.btn:focus-visible { box-shadow: var(--glow-focus); }` applied globally to all buttons |
| Widget is aria-labelled region | PASS | Hero widget: `role="region" aria-label="Shared Study Timer"` |
| **aria-live on phase change** | **FAIL** | No `aria-live` attribute exists anywhere in the HTML. The phase pill, countdown, and the entire widget region lack live-region annotation. A screen reader user will not be notified when Work transitions to Break or vice versa. Brief §6 explicitly requires "phase changes announced aria-live polite." DS §8 ConnectionStateIndicator also requires `role="status"` aria-live=polite on the connection state chip — also absent from section 07. |
| **prefers-reduced-motion** | **FAIL** | Zero `@media (prefers-reduced-motion: reduce)` blocks exist in the CSS. Animations affected: colon blink (`animate-colon`), skeleton shimmer (`shimmer`), stagger slide-up (`slideUp` — 4 instances), glass-panel hover transform, JS-driven button scale-pulse. Brief §6 explicitly states "respect prefers-reduced-motion." DS §6 states the same. |
| Icon-only buttons have aria-label | PARTIAL FAIL | Hero reset button: `aria-label="Reset timer"` (pass). Break "Skip Break" button: uses only `title="Skip Break"` — `title` is not reliably exposed to screen readers and does not serve as an accessible name for interactive elements. Break pause icon button: uses only `title="Pause"` — same issue. |

Fix for aria-live: Add `aria-live="polite"` and `aria-atomic="true"` to the phase pill container (or to a visually-hidden sibling element that is updated on phase change). Add `role="status"` to the ConnectionStateIndicator in section 07.

Fix for reduced-motion:
```css
@media (prefers-reduced-motion: reduce) {
  .skeleton-layer { animation: none; }
  .animate-colon { animation: none; }
  .stagger-1, .stagger-2, .stagger-3, .stagger-4 { animation: none; opacity: 1; transform: none; }
  .glass-panel { transition: none; }
  .btn { transition: none; }
}
```

Fix for icon-only buttons: Replace `title` with `aria-label` on Skip Break and icon-only Pause buttons in the Break state.

---

### Criterion 9 — Calm/academic/quieter-than-Discord: no neon, no big animations
**MET with nit**

The overall palette is calm — restrained zinc + single emerald + amber accent. No bright neon colors. Generally passes.

One nit: The phase-dot pulse indicator uses `shadow-[0_0_8px_rgba(16,185,129,0.8)]`. At 0.8 opacity the emerald glow is noticeably bright and neon-adjacent. Reducing to `0.4` or removing the outer glow entirely would better serve the academic-focus aesthetic. This is a minor concern, not a blocking issue.

A secondary nit: `glass-panel:hover` uses `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — an overshoot/spring easing. DS §6 states "No bouncy/playful easing — keep it calm and quick." The stagger animations also use `cubic-bezier(0.16, 1, 0.3, 1)`. Neither is egregiously bouncy but both deviate from the DS guidance. Swap to `ease-out` or `cubic-bezier(0.2, 0, 0, 1)` (calm deceleration).

---

## UX Flow Assessment

**Start → focus → auto-advance Work → Break → everyone-sees-same-timer:**
- The shared-timer semantic ("8 studying" / "Live sync") is clear in the running-Work hero. A user understands this is collaborative.
- The Work-to-Break transition is depicted via separate panels (acceptable for static). The amber/coffee visual change is clear.
- No explicit "transition in progress" state is shown — acceptable for MVP.

**Idle CTA discoverable:** The primary emerald Start button in section 02 is visually prominent and unambiguous. The "Start a focus session" label is clear.

**Paused shows frozen remaining:** Section 04 shows "12:34" at `opacity-70` with a neutral "Paused" badge. The dimming communicates frozen state effectively. Resume/Reset are both surfaced. Good.

**Error recovery path:** Section 07 shows "Retry Connection" clearly. The distinction between "Reconnecting" (amber, spinner) and "Offline" (grey, "Sync halted") sub-states is appropriate and matches DS ConnectionStateIndicator spec.

---

## Spacing / White Space Notes

- Panel padding `p-4` (16px) matches brief §4 spec. ✓
- Gap rhythm across sections (`gap-4`, `gap-2`, `gap-3`) is consistent with DS §3 spacing scale. ✓
- Section 05 (Compact Layout): The showcase card uses `p-6` (24px) wrapping around a `w-64` 32px-tall slim bar, creating disproportionate dead space within the showcase panel. This is acceptable in the mockup context (it's a demonstration card, not the rendered widget) but should not be misread as an intended internal padding at implementation.
- `pb-32` (128px) bottom padding on the main grid is excessive for a documentation page. Nit only.

---

## Additional Issues

**A. Break-state roster missing count label.**
Section 03 (Break) shows 2 grayscale avatars but no "N studying" count text. All other roster states include a text count. This is a minor omission.

**B. `glass-panel:hover` apply `transform: translateY(-1px)` on the persistent hero widget.**
In the real channel view, a persistent widget that lifts 1px on hover would cause minor vertical layout jitter on every mouse pass. This hover lift is appropriate on interactive cards (assignment cards, server rail items) but should be removed from a fixed ambient widget that users hover past constantly. Nit for implementation.

**C. Paused state uses `mix-blend-luminosity` on the section wrapper.**
`opacity-80 mix-blend-luminosity` on section 04's outer div desaturates the paused widget against the background. This is a creative touch but `mix-blend-luminosity` has documented rendering differences between Chromium and WebKit and could cause unexpected color bleed. The paused widget itself already communicates state via opacity and "Paused" badge. The blend-mode is redundant and adds fragility.

**D. `role="status"` missing on ConnectionStateIndicator (section 07).**
DS §8 specifies `role="status"` and `aria-live="polite"` on ConnectionStateIndicator. Neither is present in section 07's indicator pills.

---

## Required Fixes Before APPROVE

1. Add `aria-live="polite" aria-atomic="true"` to the phase indicator region (phase pill or a visually-hidden live-region sibling). Add `role="status"` to the ConnectionStateIndicator in section 07. (Brief §6, §9 criterion 8 — BINARY FAIL)

2. Add `@media (prefers-reduced-motion: reduce)` block disabling or suppressing: `shimmer`, `fade-tick` (colon blink), `slideUp` (stagger), `glass-panel` transition, `btn` transition. (Brief §6, §9 criterion 8 — BINARY FAIL)

3. Resolve the roster/presence color conflict. Either change the "in timer" ring to a hue that does not overlap with `--presence-online` emerald, OR add a non-color differentiator (e.g., a text badge reading "studying" that persists regardless of color). Ensure Break-state roster uses amber rings (not grayscale drop) to maintain the "in this timer" ring identity across phases. (Brief §9 criterion 6 — PARTIAL, load-bearing jenny flag)

4. Replace `title="Skip Break"` and `title="Pause"` on icon-only buttons in the Break state with `aria-label`. (Brief §9 criterion 8 a11y — PARTIAL FAIL)

5. Restore `--border-hairline` to `rgba(255,255,255,0.06)` and `--border-hover` to `rgba(255,255,255,0.10)` per DS §1. Remove the `inset` additions from `--shadow-sm` / `--shadow-pop` definitions or document them as intentional DS extensions. (Brief §9 criterion 1 — PARTIAL)

## Optional (Non-blocking) Improvements

- Reduce phase-dot glow from `rgba(16,185,129,0.8)` to `0.4` to stay clearly below neon threshold.
- Replace bouncy easing (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`, `cubic-bezier(0.16, 1, 0.3, 1)`) with calm deceleration per DS §6.
- Remove `glass-panel:hover` lift transform on the persistent ambient widget.
- Remove `mix-blend-luminosity` from the paused state wrapper.
- Add a "N studying" count text to the Break state roster.
- Add timer/hourglass icon to the idle state (brief §4 suggestion).
