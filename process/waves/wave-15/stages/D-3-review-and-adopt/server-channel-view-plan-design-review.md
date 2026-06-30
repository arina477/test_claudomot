# D-3 Plan Design Review — wave-15 @mention surfaces
**Reviewer:** plan-design-review (ui-designer agent, reviewer A)
**Artefact:** `design/staging/server-channel-view.html`
**Surfaces reviewed:** (1) mention-autocomplete popover · (2) inline mention-pills (self + other) · (3) unread-mention badge on channel sidebar
**Reference docs:** `design/DESIGN-SYSTEM.md` · `command-center/principles/DESIGN-PRINCIPLES.md` (rule 1) · D-1 briefs for all three surfaces

---

## 0. Structural integrity check — 9 article rows

The brief pre-condition flags that the first D-2 pass dropped 3 rows. Count of `<article` elements in current staging file:

| # | Row identity | Present |
|---|---|---|
| 1 | Mia Wong / other-mention pill | YES (L187) |
| 2 | David C. / self-mention pill | YES (L219) |
| 3 | Elias (You) / standard + (edited) tag | YES (L235) |
| 4 | Elias / inline editing state | YES (L255) |
| 5 | Elias / delete confirmation | YES (L278) |
| 6 | Tombstone ("This message was deleted") | YES (L295, `role="article"`) |
| 7 | David C. / react-menu open | YES (L305) |
| 8 | Elias / pending (amber Sending...) | YES (L329) |
| 9 | Elias / failed-to-send (role="alert") | YES (L341) |

**All 9 rows confirmed present. v2 fully restored structural integrity.**

---

## 1. Visual hierarchy — 9/10

The popover sits at a clearly elevated z-layer above the composer with `--shadow-pop` (`0 8px 24px rgba(0,0,0,0.5)`), matching DESIGN-SYSTEM §5. The header stripe (`study-900` vs popover body `study-800`) creates a legible label zone, following the elevation-order contract (popover > composer). Active-row (`study-700` fill + emerald ring) reads unmistakably as "selected". Self-mention pills draw the eye correctly with emerald emphasis while other-mention chips recede as expected secondary information. The unread badge is visually dominant on the channel row via the emerald pill count at the row's right edge, consistent with DESIGN-SYSTEM §8 ChannelSidebar item spec ("Unread = brighter text + dot / mention: emerald badge").

**What would make it a 10:** The popover header uses a faint uppercase `Members matching "@dav"` label (zinc-400, 11px). Adding a minor divider refinement or giving the query token distinct weight (`@dav` in zinc-100, rest in zinc-400) would sharpen the hierarchy scent. Minor.

---

## 2. Spacing rhythm — 9/10

Alignment to the 4px base unit (DESIGN-SYSTEM §3) is consistent throughout:
- Popover item rows: `px-2 py-1.5` = 8px×6px, within the sidebar-item budget.
- Pill vertical offsets: `-my-[1px]` inline anchor avoids cap-height shifts (well-handled).
- Badge: `h-[18px] min-w-[18px] px-1` — 18px height aligns with the 4px grid (not exactly on grid, but 18px is a standard tight-badge size; acceptable).
- Channel row: `px-2 py-1.5` consistent with all other channel items.

**What would make it a 10:** The popover `p-1.5 space-y-0.5` inner list padding (6px + 2px gap) is slightly sub-grid. `p-1` (4px) + `space-y-1` (4px) would align more precisely, though the current choice is not perceptually broken.

---

## 3. Brand coherence — 10/10

All three surfaces are brand-coherent with the dark/academic/emerald identity:
- No neon; `#10b981` emerald is used exclusively as the "attention / yours" accent (self-mention pill bg-tint, self-mention ring, autocomplete active-row ring, unread badge fill), consistent with DESIGN-SYSTEM §1 semantic mapping (`--accent-emerald` = primary accent / focus / success).
- Typography stays in Geist throughout; no font drift.
- Surfaces use the zinc-based near-black ladder exactly as documented (`study-950 / 900 / 800 / 700`).
- The academic quiet tone is maintained: the self-mention pill is a tinted chip with a hairline ring, not a glowing block; the unread badge is a compact 18px pill, not a Discord-scale notification dot.
- No invented hex values detected. All fills trace to design-system tokens.

---

## 4. Edge-case handling — 7/10

**Covered:**
- Autocomplete open-with-results state (two rows, one active, one default): correctly shown.
- Active-row keyboard state: `aria-selected="true"` + `ring-2 ring-emerald-500/50` + `bg-study-700`.
- Online presence dot on default row (Davis Lee shows emerald dot): optional per brief, implemented cleanly.
- Self vs other pill distinction: clearly different treatments (see §6 for detail).
- Tombstone row: no pill, correct (brief §3: in-tombstone state = no pill; row 6 has no pill).

**Missing / incomplete:**
- Autocomplete empty state: the brief (§3, §9.3) requires an "open-empty" state with "No members match @xyz". The empty-state markup is present but commented out (L390-394). A commented-out state is not a delivered state — it fails success criterion §9.3.
- Autocomplete loading state: the brief (§3) lists a `loading` state. No loading shimmer or spinner is shown in the popover. Not delivered.
- Unread badge "clears on view" state: the brief (§9.4) requires showing a before/after state (badge present vs cleared). Only the "badge present" state is shown; "cleared" is not demonstrated anywhere in the single-page composition.
- Unread count "9+" truncation (brief §5): not demonstrated; only a static `2` shown. Acceptable for a static mockup but technically incomplete per brief success criterion.

**What would make it a 10:** Uncomment the empty state, add a loading shimmer row to the popover, and add a cleared-badge variant on one of the sidebar rows (even a second channel entry with text-dimmed and no badge).

---

## 5. Accessibility — 8/10

### Contrast calculations (all computed per DESIGN-PRINCIPLES rule 1, WCAG 2.1 relative-luminance formula)

| Surface | Foreground | Background | Ratio | Result |
|---|---|---|---|---|
| Unread badge count | `study-950` (#0a0a0b) | `emerald-500` (#10b981) | **7.80:1** | PASS |
| Self-mention pill text | `emerald-300` (#6ee7b7) | `emerald-500/10` composited on `study-800` (#1c1c1f) → effective #1b2c29 | **9.57:1** | PASS |
| Other-mention pill text | `zinc-100` (#f4f4f5) | `study-700` (#27272a) | **13.55:1** | PASS |
| Autocomplete active row name | `zinc-100` | `study-700` | **13.55:1** | PASS |
| Autocomplete default row name | `zinc-200` (#e4e4e7) | `study-800` | **13.40:1** | PASS |
| Autocomplete handle text (@username) | `zinc-400` (#a1a1aa) | `study-800` | **6.63:1** | PASS |
| Autocomplete handle text on active row | `zinc-400` | `study-700` | **5.81:1** | PASS |
| Autocomplete header label | `zinc-400` | `study-900` (#121214) | **7.30:1** | PASS |
| Message body text | `zinc-200` | `study-800` | **13.40:1** | PASS |
| Unread channel name (on study-900) | `zinc-100` | `study-900` | **17.02:1** | PASS |
| Active channel name (on study-700/50 @ study-900) | `zinc-100` | effective #1d1d20 | **15.31:1** | PASS |

**All tested foreground/background pairs pass WCAG 2.1 AA (4.5:1 minimum). No contrast failures.**

### ARIA + semantic

- Autocomplete: `role="listbox"` on `<ul>`, `role="option"` + `aria-selected` on each row — correct ARIA listbox pattern. Active-row `aria-selected="true"` is present.
- Unread-mention: channel anchor has `aria-label="general channel, 2 unread mentions"` — count is exposed to screen readers and not conveyed by color alone. DESIGN-SYSTEM §8 MemberListItem spec mandates "presence conveyed by text too (not color alone)"; this pattern mirrors that correctly.
- Tombstone: `role="article"` + `aria-label="Deleted message"` — correct.
- `prefers-reduced-motion` block at L56-60 disables `pending-pulse`, `spin`, and `typing-dot` animations.
- `msg-row` class required for `.row-actions` hover logic: row 2 (David C., self-mention) is missing the `msg-row` class (L219 reads `class="group px-4 py-2..."`). This means the row-actions toolbar never becomes visible on hover for that row. Low severity for a static mockup but should be corrected before handoff.

**What would make it a 10:** Add `msg-row` to row 2; expose popover empty/loading states so screen-reader users can hear "No results" feedback.

---

## 6. Token discipline / drift audit — 9/10

| Check | Finding |
|---|---|
| Autocomplete uses `--shadow-pop` equivalent | YES: `shadow-[0_8px_24px_rgba(0,0,0,0.5)]` matches `--shadow-pop` exactly |
| Autocomplete uses `--surface-700` active fill | YES: `bg-study-700` on active row |
| Autocomplete uses emerald ring on active row | YES: `ring-2 ring-emerald-500/50` |
| Self-mention pill: emerald-tinted bg + emerald text + ring | YES: `bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30` |
| Other-mention pill: `--surface-700` chip | YES: `bg-study-700 text-zinc-100` |
| Unread badge: `--accent-emerald` fill + `--radius-full` | YES: `bg-emerald-500 rounded-full` |
| No invented hex | PASS — spot-checked all inline styles and class values; all trace to the design-system token set |
| Mention-pill distinct from reaction-pill | PASS — reaction-pills are `h-7 pl-2 pr-2.5 rounded-full` with emoji+count; mention-pills are `px-1.5 py-0.5 rounded-md align-baseline` inline. Different shape token (`--radius-full` vs `--radius-md`), different size, different context (pill=block vs inline). Clearly distinct. |
| `--border-hover` on popover | PARTIAL: popover uses `border-white/10`. DESIGN-SYSTEM defines `--border-hover` as `rgba(255,255,255,0.10)`. These are numerically identical — no drift, but the brief (§4) named `--border-hover` as the reference token. Acceptable. |

**What would make it a 10:** The popover border could use a Tailwind arbitrary value `border-[rgba(255,255,255,0.10)]` or a named token class for semantic traceability, but `border-white/10` is functionally identical.

---

## 7. Responsive behavior — 8/10

**Verified:**
- Popover: `w-[280px] max-h-[240px]` hard-coded width per brief §5 contract. Anchored to composer-left at L362 (`left-5`). On very narrow viewports the popover could overflow right, but the brief says "anchors to caret / clamps to viewport" — static mockup cannot fully demonstrate JS clamping; the intent is present.
- Pills: `inline-flex align-baseline` within prose text — wrap naturally at all text widths.
- Unread badge: sits at `ml-auto` on the channel row, pushing to right edge. Channel sidebar uses `min-w-0` cascade so the channel name truncates before the badge gets squeezed.
- At 768px breakpoint, channel sidebar becomes a fixed drawer (`position: fixed`, `transform: translateX(-110%)`); the badge persists because it is inside the sidebar HTML, not a separate DOM node.

**What would make it a 10:** Add a narrow-breakpoint badge visibility note or a comment in the sidebar drawer CSS to confirm the badge is not clipped during the drawer animation (the `overflow-hidden` on the sidebar means during drawer-open the badge might clip if the sidebar `width: 260px` is tight and the name is long — worth a developer note at handoff).

---

## 8. Summary score table

| Dimension | Score | Primary concern |
|---|---|---|
| Visual hierarchy | 9/10 | Popover header query emphasis minor |
| Spacing rhythm | 9/10 | Sub-grid inner popover list padding minor |
| Brand coherence | 10/10 | No issues |
| Edge-case handling | 7/10 | Empty state commented out; loading state absent; badge cleared-state not shown |
| Accessibility | 8/10 | `msg-row` missing on row 2; empty/loading states not reachable by screen readers |
| Token discipline | 9/10 | All correct; popover border semantically equivalent |
| Responsive | 8/10 | Narrow badge-clip risk worth developer note |

**Aggregate (unweighted mean): 8.57 / 10**

---

## 9. Concerns summary (priority order)

**P1 — Functional gap (brief success criterion failure):**
- Autocomplete empty state is commented out (L390-394). Brief §9 criterion 3 explicitly requires it delivered. Uncomment and verify it renders.
- Autocomplete loading state is entirely absent. Brief §3 lists it as a required state.

**P2 — Missing demo state (brief success criterion failure):**
- Unread badge "clears on view" is not shown anywhere. Brief §9 criterion 4 requires before/after. A single additional sidebar row with no badge (representing the same channel after viewing) satisfies this.

**P3 — Markup correctness:**
- Row 2 (David C., the self-mention row) is missing the `msg-row` class; row-actions toolbar never reveals on hover for this row.

**P4 — Informational / no blocking:**
- Narrow-breakpoint badge clip risk under drawer animation — developer note at handoff.
- Popover inner-list padding is 1.5px off the 4px grid — cosmetic.

---

## VERDICT

**REVISE**

Two brief success criteria are unmet by missing delivery (autocomplete empty state commented out; loading state absent) and one is unmet by omission (badge cleared-state). These are functional gaps against the signed-off D-1 briefs, not style preferences. P3 markup fix (missing `msg-row`) is low-effort and should accompany the revision.

All contrast ratios pass WCAG 2.1 AA by calculation. Token discipline is clean — no invented hex. All 9 message rows are present. The design quality of what is delivered is high (8.57 aggregate); the revision is narrow in scope and should not require a full D-2 re-pass — a targeted patch addressing the four P1/P2/P3 items above, re-submitted for D-3 fast-track review.
