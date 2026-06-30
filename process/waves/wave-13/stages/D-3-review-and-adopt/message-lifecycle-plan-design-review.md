# D-3 Plan-Design Review — Message Lifecycle
**Reviewer:** Reviewer A (plan-design-review)
**Surface:** `design/staging/server-channel-view.html`
**Brief:** `process/waves/wave-13/stages/D-1-brief/message-lifecycle-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Date:** 2026-06-30

---

## Per-dimension scores

### 1. Visual hierarchy — 9 / 10

Row-actions are absolutely positioned at `-top-3 right-3`, which correctly floats them above the row chrome without competing with body text. At rest they are fully invisible (`opacity: 0; pointer-events: none`), so every message opens with the avatar → name → timestamp → body reading order intact. Reaction pills occupy a secondary zone (below body, `mt-2`) and are visually lighter than body text — the counts use `text-xs font-semibold` and muted or emerald colors rather than the primary zinc-100 body weight. The `(edited)` tag is `text-xs text-zinc-400 font-normal`, which is correctly subordinate.

Minor deduction: the add-reaction popover (David C.'s row) renders in-flow inline beneath the message body rather than as a true floating overlay. Inline placement pushes adjacent rows down during the open state, which disturbs the reading rhythm and partially obscures the row-action bar at the same vertical position. This is a static-mockup limitation, but the placement itself should be clarified as an `absolute/fixed` float in the real implementation note.

**What would make it a 10:** Add an inline implementation note on the popover (`position: absolute; z-index: 50`) so reviewers do not mistake the static in-flow placement for the shipped behavior. The popover `role="menu"` element is correct but the positioning class is absent.

---

### 2. Spacing rhythm — 8 / 10

The 8px message-row vertical rhythm (brief §4, DESIGN-SYSTEM §3) is upheld. All article rows use `py-2` (8px vertical padding), matching the existing sent/pending/failed rows. Gap between rows is `gap-1` (4px), which is consistent with the wave-12 baseline. Pills add `mt-2` (8px) below the body, which is a clean 8px beat. The inline-edit textarea block adds `mt-1.5` (6px) before the textarea and `mt-2` (8px) before Save/Cancel — the 6px before the textarea is the only step that deviates from the 4px/8px scale (a 6px value is not in the canonical scale defined in DESIGN-SYSTEM §3: `0/4/8/12/16/24/32/48px`). It is small but technically off-token.

**What would make it a 10:** Replace `mt-1.5` (6px) on the edit textarea container with `mt-2` (8px) to stay on the 4px base scale per DESIGN-SYSTEM §3.

---

### 3. Brand coherence — 10 / 10

The design is distinctly calm and academic. No neon gradients, no Discord-loud multi-color accent bars. The emerald is used only where the system specifies it (reactedByMe ring, Save primary, Editing label, focus rings, active presence). Amber appears only on the Sending state. Danger red is limited to the delete confirm border/tint and the delete button. The reaction pills use a surface-700 background with a restrained emerald tint (`rgba(16,185,129,0.14)`) for the reactedByMe state — subdued enough to stay academic, distinct enough to communicate state. The tombstone strips color entirely and uses a prohibit icon in zinc-600, which matches the quiet, low-noise aesthetic. No invented hex values: all colors trace back to the Tailwind config block (`study.*` / `accent.*`) in the file's own `<script>`. Geist font, Phosphor icons, scrollbar treatment — all consistent.

---

### 4. Edge-case handling — 9 / 10

All required edge states from brief §3 and §7 are present:

- **Tombstone:** Clearly distinct. No body text, no reaction pills, no row-action bar, no hover highlight, no avatar photo (replaced with a prohibit glyph on a stripped-down surface-800 circle). The `aria-label="Deleted message"` ensures screen readers convey deletion. Text reads "This message was deleted" — satisfies brief §6 "conveyed in text, not color alone."
- **Zero-reaction case:** Shown correctly on the David C. (10:50 AM) and tombstone rows — no pill row rendered when no reactions exist. The design handles absence by omission with no layout artifact.
- **reactedByMe vs default pill:** The distinction is unambiguous. The reactedByMe pill has the `.reacted-by-me` class applying a green-tinted background (`rgba(16,185,129,0.14)`), an emerald border (`rgba(16,185,129,0.55)`), an inset emerald glow ring, and the count rendered in `text-emerald-300` rather than `text-zinc-400`. Three separate visual cues (tint + border + count color), which exceeds the "color alone" threshold for accessibility.
- **Moderator delete on others' messages:** Correctly implemented on the David C. (10:58 AM) row — the row-action bar shows react + delete but no edit icon. The edit icon is absent, matching brief §8 ("edit affordance shown only on own messages").

Minor deduction: the delete-confirm row (10:55 AM) retains the full row-action bar (it is part of a separate `msg-row` class in the DOM). In the real implementation the row-action bar should be suppressed while the confirm state is active — hovering over the confirm row and re-triggering the action bar would be confusing. This is not modeled in the static design.

**What would make it a 10:** Show the delete-confirm row without the `.row-actions` overlay (or document that the bar is hidden in that state). Suppression during the confirm state should be an explicit note in the design or a CSS gate (e.g., `&.confirm-active .row-actions { display: none }`).

---

### 5. Accessibility — 8 / 10

Strengths:
- Row-actions use `focus-within` trigger alongside hover, satisfying brief §6 "never hover-only." The CSS rule `.msg-row:focus-within .row-actions` is present.
- Every action button has a descriptive `aria-label` ("Add reaction to Mia Wong's message", "Edit your message", "Delete your message", "Delete message (moderator)").
- Focus rings are `focus-visible:ring-2 focus-visible:ring-emerald-400/70` on every interactive element, consistent with `--glow-focus` (DESIGN-SYSTEM §5).
- The delete action on own messages uses `focus-visible:ring-red-500/60` — the danger analogue per `--glow-danger`.
- `(edited)` is text, not icon-only. The tombstone is text-conveyed.
- Reaction pills use `aria-pressed` (`true`/`false`) and descriptive labels ("👍 reaction, 4, you reacted — click to remove" / "🤔 reaction, 1 — click to react").
- The emoji popover uses `role="menu"` + `role="menuitem"` and `aria-label="Add a reaction"`.
- The inline-edit textarea has `<label for="editArea">` (sr-only) and visible Save/Cancel buttons with keyboard hints.
- `prefers-reduced-motion` disables both the row-action transition and the pending-pulse animation.

Concerns:

1. **Contrast of `(edited)` tag:** The tag is `text-zinc-400` on `bg-study-800` (#1c1c1f). zinc-400 is approximately #a1a1aa. Contrast ratio ≈ 4.6:1 — just over the WCAG AA 4.5:1 threshold for small text. This is borderline and passes, but barely. A one-step bump to `text-zinc-300` (~6.5:1) would provide comfortable headroom (brief §9 checklist requires ≥4.5:1 explicitly).

2. **Popover focus management not modeled:** The add-reaction popover has correct ARIA roles but no `tabindex`, no `autoFocus` hook, and no Esc-key handler in the static file. The JS comment mentions "Esc + outside-click close" but no handler exists in the `<script>` block. This is a static mockup gap, but the handoff note should explicitly call out that focus must move into the menu on open and return to the trigger on close (brief §6: "focus management + Esc").

3. **Tombstone row `msg-row` class absent:** The tombstone `<article>` does not carry the `msg-row` class, which means it correctly has no hover highlight and no row-action bar. However, it also means there is no `focus-within` trigger if any interactive child is ever added. The current tombstone has no interactive children, so this is safe today, but worth noting for future states.

**What would make it a 10:** (a) Bump `(edited)` tag to `text-zinc-300` for comfortable AA margin per brief §9. (b) Add a handoff note explicitly specifying focus-trap entry, arrow-key navigation, and Esc-return behavior for the emoji popover menu per DESIGN-SYSTEM §8 Tooltip/Popover.

---

### 6. Responsive behavior — 9 / 10

The breakpoint implementation correctly follows DESIGN-SYSTEM §9:

- **1280+ (full):** Four-column grid (`72px 260px 1fr 280px`). All panes visible. Row-actions, pills, and edit state work in the main chat column with no overflow or clipping.
- **1024 (compact):** `three-pane-grid` collapses to `72px 240px 1fr` and `.right-sidebar` is hidden. The main chat canvas gets the freed space — row-actions floating at `right-3` remain well within the column.
- **768 and below (narrow):** Channel sidebar becomes a fixed overlay drawer; the grid collapses to `72px 1fr`. The narrow-drawer-toggle button is hidden at wider sizes (`hidden`, shown only via `narrow-drawer-toggle` media rule). Row-actions are still reachable by focus (touch-tap on mobile reveals them via focus-within, as stated in brief §5).

Minor deduction: at the 768 breakpoint the four-column grid becomes `72px 1fr`, which means the main chat canvas stretches to the full remaining width (minus rail). The row-action bar positioned at `right-3` (12px from the right edge) is correct and accessible. However, the add-reaction popover — currently rendered inline without explicit positioning — could extend beyond the right viewport edge on very narrow windows if the inline rendering is kept. No breakpoint-specific popover constraint is documented.

**What would make it a 10:** Add a note that the emoji popover must use `position: absolute` with a rightward clip guard (e.g., `right: 0` on narrow viewports) to prevent it overflowing the message column on the 768 drawer layout.

---

## Overall verdict

**APPROVE**

---

## Change list (recommended, not blocking)

These are improvements that would elevate individual dimensions from 8–9 to 10 but do not constitute defects against the brief's §9 success checklist. None block adoption.

1. **(DESIGN-SYSTEM §3 spacing)** Replace `mt-1.5` (6px) on the inline-edit textarea container with `mt-2` (8px) to stay on the 4px-base spacing scale. Affects the inline-edit row only.

2. **(brief §9 / DESIGN-SYSTEM §1 contrast)** Change `(edited)` tag from `text-zinc-400` to `text-zinc-300` for comfortable WCAG AA headroom above the 4.5:1 floor. Currently at ~4.6:1, which passes but leaves no margin.

3. **(brief §6 / DESIGN-SYSTEM §8 popover positioning)** Add implementation note (or CSS class) specifying that the add-reaction popover uses `position: absolute; z-index: 50; right: 0` (not in-flow) and clips to viewport at narrow breakpoints. The static in-flow placement in the mockup is acceptable for review but must not be interpreted as the shipped behavior.

4. **(brief §6 / DESIGN-SYSTEM §8 focus management)** Add handoff annotation specifying: on emoji popover open, focus moves to the first `role="menuitem"`; arrow keys navigate within the menu; Esc returns focus to the trigger button. The `<script>` block has no handler for this today.

5. **(edge-case / brief §3 delete-confirm state)** Document or CSS-gate that `.row-actions` is suppressed (hidden) while the delete-confirm state is active on a row, to prevent re-triggering the action bar while the user is mid-confirm.
