# D-3 Design Review — server-channel-view.html (wave-18 thread surfaces)
reviewer: plan-design-review substitute (ui-designer agent)
date: 2026-06-30
briefs: thread-panel-brief.md, thread-affordance-brief.md
source: design/staging/server-channel-view.html

---

## Pre-flight: structural integrity

All 9 `<article>` message rows confirmed present (rows 1-9: Mia Wong with affordance, David C. with affordance, Elias standard, Elias inline-edit, Elias delete-confirm, tombstone, David C. react-menu, Elias pending, Elias failed-send). Member-list panel (Pane 5, `right-sidebar`) intact. Typing indicator and main composer intact. Thread surfaces are additive — no existing markup removed.

Thread affordance appears on exactly 2 rows (reply_count > 0): row 1 (4 replies) and row 2 (1 reply). Zero affordance on rows 3-9 — correct per brief §3 (hidden at reply_count==0).

Hex token audit: all hex literals in `<style>` and Tailwind config match DESIGN-SYSTEM.md primitives exactly — `#0a0a0b / #121214 / #1c1c1f / #27272a / #3f3f46 / #52525b / #10b981 / #f59e0b / #ef4444`. No invented hex.

---

## Scored dimensions

### 1. Visual hierarchy — 8 / 10

The three-level hierarchy is clear: pinned parent block (surface-800, slightly elevated from the panel bg surface-900) sits above the replies-divider, which feeds into chronological reply rows, which terminate in the composer. The "Thread on:" h3 label and "4 Replies" count-divider provide adequate wayfinding. Reply rows correctly use 8px avatars (32px vs main canvas 40px) and 14px/11px type, creating a smaller-scale sibling to the main message list.

Deduction (-2): The panel header ("THREAD · #questions") uses `zinc-500` uppercase 11px on `study-900`, which is purely decorative chrome at this point — low contrast (see Accessibility). More importantly, the "Thread on:" section label and "4 Replies" divider share the same zinc-500 muted treatment, so all three horizontal wayfinding elements in the panel collapse to the same visual weight. A one-step lighter label (zinc-400 for secondary labels, zinc-300 for active-state "Thread on:") would sharpen the internal hierarchy without violating the palette.

What would make it a 10: Step "Thread on:" label up to zinc-400 (contrast 7.3:1 on surface-900) and the "4 Replies" divider to zinc-400. This both fixes the contrast failures and creates a clear tier between passive chrome (zinc-500) and active wayfinding (zinc-400+).

---

### 2. Spacing rhythm — 9 / 10

Panel internals follow the 4px base grid throughout. The pinned-parent block uses `p-3.5` (14px) consistently with its card-level component. Reply rows use the message-row padding idiom (`px-2 py-2`) scaled down from the main canvas (`px-4 py-2`). The `gap-6` (24px) between the parent block, divider, and reply stack matches the DESIGN-SYSTEM §3 "section gaps 24px" spec. Composer footer uses `p-4` (16px) matching the panel padding token.

Deduction (-1): The reply-row bleed trick (`w-[calc(100%+1rem)] -ml-2`) creates a visually full-width hover zone that slightly over-extends beyond the panel scroll container's padding edge. The interaction is correct but the 1rem negative-margin pattern is not documented in DESIGN-SYSTEM §3 as a standard rhythm token — it is a bespoke illusion. Minor, but worth noting for implementation consistency.

What would make it a 10: Extract the reply-row hover bleed as a documented pattern in DESIGN-SYSTEM §8 MessageRow, or constrain to standard `w-full` with symmetric padding.

---

### 3. Brand coherence — 9 / 10

Palette discipline is excellent. Zinc-emerald, no gaming-neon, no secondary hues. The academic calm of the overall palette is preserved. The two thread affordance instances use `ph-chats-circle` (Phosphor regular weight) consistent with the icon set throughout the file. The emerald accent on the reply count and send button is restrained — one accent application per element. The channel badge in the panel header (`#questions`, zinc-300 on study-700) is correctly subordinate to the content. The `--border-hairline` divider on the panel left edge matches the member-list panel.

Deduction (-1): The separator dot (`·`) in the affordance chip uses `text-zinc-500 text-[10px] font-bold uppercase tracking-widest`. This is a decorative typographic separator pushed into the smallest rendering size in the file, giving it a visually "buried" quality that is borderline for the academic-calm vibe. The bold+uppercase+tracking-widest treatment on a 10px dot creates an unnecessary ornamental tension. A `text-zinc-400` mid-dot at normal weight would be cleaner and would pass contrast.

What would make it a 10: Replace the separator dot weight treatment with zinc-400 at text-xs normal weight.

---

### 4. Edge-case handling — 7 / 10

Present and commented:
- Loading skeleton: correctly commented with `animate-pulse` placeholder rows (study-700 shimmer). The brief §3 "open-loading" state is represented.
- Empty state: "No replies yet" with icon + subline is commented in — correct form.
- Tombstone reply: live in the panel (reply 2 of 3 active replies) — correctly renders as `ph-prohibit` icon + italic text, matching the main canvas tombstone pattern. PASS.
- Pending reply: commented in with amber amber-500 "Sending…" indicator and pending-dim animation. Pattern is correct.

Gaps:
1. Failed reply state is entirely absent — neither live nor commented. The brief §3 explicitly requires "reply pending/failed (optimistic outbox row)" and brief §9 success criterion 3 requires "pending/failed optimistic states shown." The main canvas (article 9) demonstrates the failed-send pattern, but no equivalent exists anywhere in the thread panel section — not even as a code comment. This is a spec gap, not a design choice.
2. All three edge states (loading, empty, pending) are commented out rather than rendered as separate visible state variants. For a staging mockup that must communicate design intent to the reviewer and to the frontend developer, commented-out states are weaker than alternate-state dividers or a clearly labeled toggle. The brief §9 says "states present" — commented is defensible but marginal.

What would make it a 10: Add a commented failed-reply variant matching article row 9 (danger border-l, "Failed · Retry" button, danger/10 bg). Optionally render one alternate-state variant live (e.g., empty state) with a clear section comment separator.

---

### 5. Accessibility — 6 / 10

**Contrast calculations (DESIGN-PRINCIPLES.md rule 1, ≥4.5:1):**

PASS pairs:
- `zinc-200` (#e4e4e7) on `study-900` (#121214): 14.75:1
- `zinc-400` (#a1a1aa) on `study-900`: 7.30:1 (reply timestamps, tombstone italic)
- `zinc-100` (#f4f4f5) on `study-900`: 17.02:1 (sender names)
- `emerald-500` (#10b981) on `study-700` (#27272a): 5.87:1 (reply count in affordance chip)
- `emerald-400` (#34d399) on `study-700`: 7.75:1 (hover state)
- `zinc-400` (#a1a1aa) on `study-700`: 5.81:1 (last-reply text in affordance chip)
- `zinc-300` (#d4d4d8) on `study-700` (#27272a): 10.08:1 (#questions badge)
- `zinc-100` on `study-800` (#1c1c1f): 15.47:1 (parent block sender + composer input text)
- `zinc-400` on `study-800`: 6.63:1 (parent timestamp, composer placeholder)
- `zinc-200` on `study-800`: 13.40:1 (parent body text)
- `study-950` on `emerald-500`: 7.80:1 (send button icon)
- `amber-500` on `study-900`: 8.71:1 (pending state label)
- `zinc-100` at 0.6 opacity (pending-dim) on `study-900`: 6.62:1

FAIL pairs:
- **`zinc-500` (#71717a) on `study-900` (#121214): 3.87:1** — WCAG AA FAIL. Affects: panel header "THREAD" uppercase label, "Thread on:" h3 section label inside scroll area, "4 Replies" divider text. All three are non-decorative wayfinding labels (they convey panel state and section identity). At text-[11px]/text-[10px], large-text exception does not apply (requires ≥18.67px or ≥14px bold).
- **`zinc-500` (#71717a) on `study-700` (#27272a): 3.08:1** — WCAG AA FAIL. Affects: the `·` separator dot in the affordance chip at text-[10px] bold. While the dot is partially decorative, it is the only visual separator between "N replies" and "last reply Xm ago" — a sighted user uses it to parse the chip. At 10px, contrast requirement is 4.5:1.

Focus states: Close button (X), affordance button, reply-send button — all use `focus-visible:ring-2 focus-visible:ring-emerald-400/70`. emerald-400 at 70% alpha on study-700/study-900 backgrounds computes to ~5.1-5.4:1 — marginal but passes. PASS.

Esc key: The script section has a keydown listener on the composer but no explicit Esc handler for panel close. The `aria-expanded` on the affordance buttons correctly reflects open state. However, the panel itself lacks `role="dialog"` and `aria-modal="true"` — at ≤1024px the panel becomes a fixed overlay and should be a dialog (focus trap + Esc close). At ≥1280px it is an inline panel and dialog semantics are debatable, but the brief §6 says "Esc returns to channel" — the handler is absent from the JS.

What would make it a 10: (1) Bump all zinc-500 labels in the panel to zinc-400 (7.30:1 on study-900) — fixes all three FAIL pairs. (2) Replace separator dot with zinc-400 text-xs normal weight (5.81:1 on study-700). (3) Add a keydown Esc handler for panel close. (4) Add `role="dialog" aria-modal="true"` to the panel element for ≤1024 overlay mode.

---

### 6. Responsive behavior — 9 / 10

Layout grid correctly defined:
- Default (≥1280px): `72px 260px minmax(0,1fr) 360px 240px` — 5 panes, thread panel at 360px, member-list at 240px.
- ≤1440px: `72px 240px minmax(0,1fr) 360px` — member-list hidden, thread takes column 4.
- ≤1024px: grid collapses to 3 columns; thread panel goes `position:fixed; top:0; right:0; bottom:0; max-width:360px; z-index:50` with `box-shadow:-8px 0 24px rgba(0,0,0,0.5)` (shadow-pop per DESIGN-SYSTEM §5). Correct drawer/overlay behavior per brief §5.
- ≤768px: channel sidebar becomes a drawer; server rail persists.

Affordance chip: single-line truncation is implicitly handled by the chip being an `inline-flex` with natural content width; at very narrow widths on mobile (≤375px) the chip could overflow the message column. The brief §5 notes "truncates gracefully." A `max-w-full overflow-hidden text-ellipsis` on the timestamp span would make truncation explicit.

What would make it a 10: Add explicit `min-w-0 truncate` on the "last reply Xm ago" span inside the affordance chip.

---

## Token drift flag

No token drift detected. All surface tokens resolve to documented DESIGN-SYSTEM §1 values. No invented hex outside the config. Thread panel uses `bg-study-900` matching the member-list sidebar family exactly. Parent block uses `bg-study-800` per brief §4. Affordance chip uses `bg-study-700` / hover `bg-study-600` per brief §4. Thread composer uses `bg-study-800` recessed-input — matches the main composer's `bg-study-900` (inverted: panel bg is 900, so composer recessess into 800 — correct direction). The `--shadow-pop` equivalent `box-shadow:-8px 0 24px rgba(0,0,0,0.5)` is applied at ≤1024 overlay. `border-study-border` hairline used on panel left divider.

Affordance is DISTINCT from reaction pills: pills use `rounded-full h-7 border border-study-600/70`; affordance uses `rounded-md h-[28px]` with no border. Different shape, no border, different icon class — distinct enough per brief §9 criterion 6 and affordance-brief §4.

---

## Summary matrix

| Dimension | Score | Primary concern |
|---|---|---|
| Visual hierarchy | 8/10 | zinc-500 wayfinding labels all same weight; tier collapse |
| Spacing rhythm | 9/10 | negative-margin bleed undocumented |
| Brand coherence | 9/10 | separator dot ornamental tension |
| Edge-case handling | 7/10 | failed-reply state absent; edge states commented not rendered |
| Accessibility | 6/10 | zinc-500 on study-900 = 3.87:1 FAIL (3 labels); zinc-500 on study-700 = 3.08:1 FAIL (1 separator); Esc handler missing; role=dialog missing at overlay |
| Responsive | 9/10 | affordance truncation implicit not explicit |
| **Overall** | **48/60 = 8.0** | |

---

## Verdict

REVISE

---

## Required changes before APPROVE

1. **CONTRAST FIX (blocking — DESIGN-PRINCIPLES rule 1):** Replace `text-zinc-500` with `text-zinc-400` on all three of: the panel header "THREAD" uppercase label, the "Thread on:" h3, and the "4 Replies" divider text. Ratio lifts from 3.87:1 to 7.30:1. No other change required.

2. **CONTRAST FIX (blocking — DESIGN-PRINCIPLES rule 1):** Replace `text-zinc-500` with `text-zinc-400` and remove `font-bold uppercase tracking-widest` on the `·` separator dot in the affordance chip. Ratio lifts from 3.08:1 to 5.81:1. A `text-zinc-400 font-medium` mid-dot at `text-xs` is sufficient.

3. **SPEC GAP (blocking — thread-panel-brief §3, §9 criterion 3):** Add the failed-reply state to the thread panel section. Minimum: a commented block (`<!-- Thread Demo: Failed Reply -->`) mirroring main canvas article row 9 (danger border-l, `bg-danger/5`, amber/danger timestamp badge, Retry button). This completes the state coverage the brief requires.

## Non-blocking recommendations

4. Add `role="dialog" aria-modal="true"` to the `#thread-panel` element for ≤1024 overlay behavior, and add a keydown `Escape` handler to the JS block to close the panel.
5. Add `min-w-0 overflow-hidden text-ellipsis` (or Tailwind `truncate`) to the "last reply Xm ago" span inside the affordance chip for explicit narrow-width truncation.
6. Consider stepping "Thread on:" label to `text-zinc-400` (for hierarchy clarity) even after contrast is fixed at zinc-400, as all wayfinding labels currently read at the same tier.

---

## D-3 Re-review — Attempt 2

reviewer: ui-designer (reviewer A)
date: 2026-06-30
iteration: 2 (re-review of REVISE verdict from attempt 1)

### Blocker 1 — Contrast: thread-region muted labels (zinc-500 → zinc-400)

Verification target: panel header "THREAD" label, "Thread on:" h3, "4 Replies" divider text, affordance separator dot, empty-state icon.

Findings per HTML line:
- L473 (panel header): `text-zinc-400` — confirmed. zinc-400 (#a1a1aa) on study-900 (#121214) = 7.30:1. PASS.
- L486 ("Thread on:" h3): `text-zinc-400` — confirmed. 7.30:1 on study-900. PASS.
- L503 ("4 Replies" divider): `text-zinc-400` — confirmed. 7.30:1 on study-900. PASS.
- L240-241 (separator dot in affordance chip): `text-zinc-400` — confirmed. zinc-400 (#a1a1aa) on study-700 (#27272a) = 5.81:1. PASS.
- L579 (empty-state icon, commented block): `text-zinc-400` — confirmed. 7.30:1 on study-900. PASS.

All five targets clear 4.5:1. Blocker 1 RESOLVED.

### Blocker 2 — Failed-reply state in thread panel

Location: lines 544-561, inside the outer commented pending-reply block.

The nested `<!-- PANEL FAILED-REPLY STATE (demo; mirrors main-canvas failed row) -->` block is present. It contains `<div role="alert">` with `border border-danger/40 bg-danger/10 px-2.5 py-1.5`, "Failed to send" text in `text-red-300`, and a Retry button with `border border-danger/40 bg-danger/10` and `focus-visible:ring-2 focus-visible:ring-red-500/60`. This mirrors the main canvas article row 9 pattern (border-danger/30 bg-danger/5, red-300 warning label, Retry). The variant is slightly tighter (inline sub-row within the pending block vs. a standalone article), which is appropriate for the thread panel's compact scale. Minimum requirement per attempt-1 blocker 3 was "a commented block mirroring article row 9 (danger border-l, bg-danger/10, Retry button)" — satisfied. Blocker 2 RESOLVED.

### Non-blocking note (role="dialog")

L469: `<aside id="thread-panel" role="dialog" aria-modal="true" aria-label="Thread">` — confirmed present. Resolved.

### Structural integrity

9 article rows: lines 213, 252, 282, 302, 325, 342, 352, 376, 388 — all 9 confirmed present.
Member-list panel (right-sidebar, L609-679): intact.
Main composer (L449-463): intact.
Thread panel composer (L591-603): intact.

### New issues scan

None. The separator dot retains `font-bold uppercase tracking-widest` alongside the color fix — this was a non-blocking aesthetic note in attempt 1 and remains so; no regression. No new zinc-500 instances introduced in thread-panel territory. No hex drift. The added `role="dialog"` is well-formed with the existing `aria-label` and `id`. The nested comment structure for the failed-reply block is syntactically valid HTML comment nesting.

### Revised score

| Dimension | Attempt 1 | Attempt 2 | Delta |
|---|---|---|---|
| Visual hierarchy | 8/10 | 9/10 | +1 (zinc-400 labels create two tiers: panel-header chrome vs. wayfinding) |
| Spacing rhythm | 9/10 | 9/10 | — |
| Brand coherence | 9/10 | 9/10 | — (dot weight non-blocking; retained) |
| Edge-case handling | 7/10 | 9/10 | +2 (failed-reply state present; all four states now covered) |
| Accessibility | 6/10 | 9/10 | +3 (all contrast FAILs resolved; role=dialog added; only Esc handler remains missing — non-blocking JS) |
| Responsive | 9/10 | 9/10 | — |
| **Overall** | **48/60 = 8.0** | **54/60 = 9.0** | |

### Verdict

APPROVE
