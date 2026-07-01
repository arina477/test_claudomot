# D-3 Design Review (attempt 2) — voice-study-room

**Reviewer:** D-3 Reviewer A (re-review after bounded refine iteration)
**Artifact:** `design/staging/voice-study-room.html`
**Brief:** `process/waves/wave-31/stages/D-1-brief/voice-study-room-brief.md`
**Token source:** `design/DESIGN-SYSTEM.md`
**Coherence shells:** `design/server-channel-view.html`, `design/invite-join.html`
**Method:** static read (no browser); gstack `/plan-design-review` critique method — 0-10 per dimension, name the change to reach 10 for any dimension <8.

---

## VERDICT: APPROVE

The refine iteration landed all seven mandated fixes with no regressions, KEEP-OUT is clean, and every scored dimension clears the 8/10 bar. No blocking issues. Minor non-blocking polish notes recorded below for the adopting builder; none gate the gate.

---

## Refine-fix verification (7/7 landed, 0 regressions)

| # | Required fix | Status | Evidence |
|---|---|---|---|
| 1 | Names/headings/CTA/labels on §2 named type scale (no arbitrary `text-[Npx]`) | LANDED | Names `text-sm` (L295, L307, L316, L327, L377); headings `text-2xl`/`text-xl`/`text-lg`/`text-base`; CTA `text-base`+`text-sm`; labels/status `text-xs`. Zero `text-[Npx]` on these elements. Cleaner than the shell prior-art, which still uses `text-[14px]`. |
| 2 | Font fallback = Geist, system-ui, -apple-system, Segoe UI, sans-serif | LANDED | L29 `sans: ['Geist', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif']` — exact. |
| 3 | Empty-state copy uses `text-secondary` (not `text-muted`) | LANDED | L381 wrapper `text-text-secondary`; L383 `<p class="text-sm">` inherits secondary. No `text-muted` on empty copy. |
| 4 | `aria-current` on the button element | LANDED | L128 `aria-current="page"` on the active-server `<button>` (was previously on the wrapper). Channel item also carries `aria-current="page"` (L173). |
| 5 | Participant-count `aria-label` | LANDED | L278 `aria-label="4 participants"`; L362 `aria-label="1 participant"` (correct singular). Inner glyph+digit `aria-hidden` so the count is announced once, cleanly. |
| 6 | Channel-header solid `bg-study-800` | LANDED | L219/L247/L275/L359/L412 all `bg-study-800` solid — no translucency, no blur. |
| 7 | Leave button `transition-colors` | LANDED | L344 and L398 both include `transition-colors`. |

No regression introduced by any fix: type-scale snap did not break hierarchy; solid header bg did not flatten the panel stack (z-index layering intact L217/L246/L274 etc.); aria changes did not duplicate announcements.

---

## KEEP-OUT audit (brief §10) — CLEAN

- Camera/video tracks, camera grid, camera toggle, speaker-vs-grid switcher: **absent**. Tiles are avatar/initials only (L290, L304, L313, L324, L373).
- Screen-share control/UI: **absent**.
- Speaking/voice-presence rings, audio-level animations: **absent**. The emerald dot is a static presence dot, explicitly commented "Not a speaking ring" (L292); active-mic tile carries no ring/icon by design (L312 comment). No `is-speaking`, no audio bars, no pulse keyframes.
- Bandwidth/network diagnostics, latency/bitrate readouts, audio-only-fallback: **absent**.
- Reconnection UI, multi-room switching, region/LiveKit metadata: **absent**.
- Who's-in-room occupancy sub-list in the channel sidebar: **absent** — sidebar shows only the active channel item, no expanded occupant roster.
- Glassmorphism / backdrop-blur: **absent** (none in `<style>` or classes).
- Spring/bouncy easing: **absent** — only `spin` (linear) + `transition-colors`; timing fn is a standard ease curve (L64).
- Amber: **absent** — palette omits amber entirely (L39-46), matching §4 "NO --accent-amber this slice."

Note confirmed per instruction: `danger-text` (#f87171) on `danger-tint` (rgba(239,68,68,0.10), 10% translucent) composites to ~6.2:1 and PASSES WCAG AA — not flagged.

---

## Dimension scores

### Visual hierarchy — 9/10
Pre-join reads Join-first: 88px emerald speaker medallion → 24px room title → secondary subline → single emerald CTA with `min-w-[160px]`. Nothing competes. In-room: participant tiles own the canvas, the mic/Leave control cluster is anchored bottom-center on `shadow-pop` so it floats clearly above the tile field (L334), and the header participant-count sits quiet top-right. Error state gives one danger medallion, one headline, one cause line, one retry. The staging-matrix chrome (numbered section headers, "P-1 Decompose · wave-31" eyebrow) is scaffolding for reviewers, not shipped UI, and reads as such. Clears the bar.

### Spacing rhythm (4px §3) — 9/10
Consistent 4px multiples throughout: tile `px-4 py-8`, `gap-4`; panel gaps `gap-16` between states, `gap-3` within; header `h-14 px-4 gap-3`; CTA `px-8 py-3`. Control cluster `gap-1.5 p-1.5` and `h-[40px]`/`w-[42px]` control sizing is deliberate and even. The `88px` medallion and `72px` avatar are off the strict 4px scale but are intentional named sizes consistent across states, not drift. Clears the bar.

### Brand coherence (vs server-channel-view shell) — 9/10
Same 3-pane grid (`72px 240px minmax(0,1fr)`), same `bg-study-950` rail / `bg-study-900` sidebar / `study` zinc ramp, same `h-14` hairline-bottom channel header, same emerald active-server left-edge bar and rounded-square morph, same footer user chip with emerald presence dot. Phosphor icon set matches. The voice room sits inside PANEL 3 without clashing. The refined mockup's token discipline (named `text-secondary`/`border-hairline` vs the shell's raw `text-[14px]`/`zinc-400`) is actually tighter than the shell — a coherence improvement, not a divergence. Clears the bar.

### Edge-case handling (all 5 states + clear) — 9/10
All five mandated states present and unambiguous: (1) Pre-join L214, (2) Connecting L243 with `aria-busy` spinner + `sr-only` "Connecting…" + label hidden + `pointer-events-none`, (3) In-room populated L271 with own tile "(You)", muted-peer danger-tint mic-slash badges, active-mic no-icon, (4) In-room alone L355 with own tile + `aria-live=polite` "No one else here yet — the door's open." empty pattern, (5) Error L408 with `role="alert"`, danger medallion, plain cause, Try-again. Muted vs unmuted mic control shown across states 3 (unmuted base) and 4 (muted, `aria-pressed="true"`), covering the toggle's both faces. Clears the bar.

### Accessibility (dark contrast, focus, keyboard) — 9/10
Focus discipline: `.focus-ring:focus-visible` emerald `glow-focus` and `.focus-ring-danger:focus-visible` on every interactive control (rail, channel items, CTA, mic, Leave, retry). Mic is a real `<button>` with `aria-pressed` toggling true/false; participant list is a semantic `<ul role="list">` with per-tile `aria-label` muted state conveyed by icon+label not color alone; count has `aria-label`; error `role="alert"`, join/alone `aria-live=polite`; connecting spinner labelled via `sr-only`. `prefers-reduced-motion` disables spin + transitions (L100-103). Dark contrast: `text-primary` .92 / `text-secondary` .60 on near-black surfaces pass AA; danger-on-tint uses `#f87171` per §1. Clears the bar. (Non-blocking: the `<ul>` in state 4 wraps the empty-copy `<div>` as a non-`<li>` child — minor list-semantics wart; see notes.)

### Responsive behavior (§9 desktop breakpoints) — 8/10
`layout-grid` collapses the channel sidebar at `max-width: 1024px` per shell rule (L80-83), server rail persists, canvas fills. Tile grid is responsive: `grid-cols-2 md:grid-cols-3 xl:grid-cols-4` (L286) reflows columns across widths. Control cluster stays anchored and reachable; controls are `h-[40px]`/`h-[44px]`/`h-[48px]` — the CTA and retry meet the 44px target, the mic/Leave sit at 40px which is fine for a desktop-app pointer surface (§9 notes 44px "where the desktop app runs on a touchscreen"). Clears the bar. (Non-blocking: the brief's §5 "narrow <1024 → sidebar becomes overlay drawer" is only partially modeled — this mockup hard-hides the sidebar rather than showing a drawer affordance; the shell owns the drawer, so acceptable for this in-canvas surface, but the builder should wire the shell drawer, not a dead hide.)

---

## Non-blocking polish notes (for the adopting builder — none gate APPROVE)

1. **State-4 list semantics.** The alone-state `<ul role="list">` (L370) contains the own-tile `<li>` plus a sibling `<div>` empty-copy block that is not an `<li>`. Move the empty-copy `<div>` outside the `<ul>`, or the `<ul>` will contain a non-list-item child. Cosmetic a11y tidy, not a failure.
2. **Mic hit-target on touch.** Mic/Leave are 40px tall. If the desktop app ever ships to a touchscreen, bump to ≥44px per §9. Pointer-only desktop is fine as-is.
3. **Narrow drawer.** §5 narrow-viewport behavior is delegated to the shell's overlay drawer; ensure the built component relies on the shell drawer rather than the mockup's `display:none` hide, so the sidebar stays reachable below 1024px.
4. **Muted-badge border token.** Tile muted badge uses `border border-danger/10` (L301) — an inline opacity utility rather than a named border token. Harmless; consistent with the danger-tint treatment. No change required.

---

## GSTACK REVIEW REPORT

| Run | Status | Findings |
|---|---|---|
| D-3 Reviewer A (attempt 2) — static critique | clean | 7/7 refine fixes landed, 0 regressions; KEEP-OUT clean; all 6 dimensions ≥8/10 (5 at 9/10, responsive at 8/10); 4 non-blocking polish notes |

Scores: visual hierarchy 9 · spacing rhythm 9 · brand coherence 9 · edge-case handling 9 · accessibility 9 · responsive 8.

VERDICT: **APPROVE** — refine cleared the bar with no regression; adopt this variant.

NO UNRESOLVED DECISIONS
