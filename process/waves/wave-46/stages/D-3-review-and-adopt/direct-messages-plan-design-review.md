# D-3 Design Review — direct-messages.html
**Reviewer:** Reviewer A — /plan-design-review lens
**Wave:** 46
**Verdict:** APPROVE (with minor nits)

---

## Scoring Matrix

### 1. Visual Hierarchy — 8 / 10

The three-panel structure (server rail / conversation-list rail / thread canvas) reads cleanly. The active conversation row drives sufficient visual weight: `bg-surface-700` fill + emerald left-pip + emerald participant name (Row 1) is unambiguous and mirrors the ChannelSidebar active pattern correctly. The thread header holds the participant avatar, name, and role subtitle at a comfortable 56px — consistent with the ChannelHeader height established in prior art.

The composer is anchored to the absolute bottom with a gradient fade from `surface-800`, which provides the correct visual separation without a heavy border. Hierarchy reads top-to-bottom as expected: header > date dividers > message rows > composer.

Minor gaps:
- The "Direct Messages" heading in the rail uses `text-base` (16px, weight 600) rather than `text-xl` (20px) called for in brief §4 for screen/section titles. This is the panel label and the brief explicitly lists `text-xl` for this role. Not a blocking error but it should be corrected at implementation.
- The unread timestamp in Row 2 of the conversation list uses `text-accent-emerald` for the time label. Brief §4 assigns emerald to "active conversation, primary actions, online presence, unread" — color-coding a timestamp as emerald is an overloaded reuse. The unread badge dot (emerald dot) already signals unread; the timestamp color adds noise rather than clarity. Preferred: keep timestamp at `text-text-secondary` and let the dot carry unread signal alone.

**What would make it a 10:** Promote "Direct Messages" heading to `text-xl`; revert unread-row timestamp to `text-secondary`.

---

### 2. Spacing Rhythm — 8 / 10

Conversation rows use `p-2` (8px all sides), which maps cleanly to the brief's "8px×12px sidebar item padding (ChannelSidebar rhythm)" on the vertical axis. Horizontal is 8px not 12px — this is slightly tighter than the spec but consistent within the mockup and not disqualifying; it is a nit to align with the ChannelSidebar item pattern at implementation.

Message rows use `py-1` (4px vertical) for grouped messages and `py-1` for first-in-group — the DESIGN-SYSTEM.md §3 calls for "message-row vertical rhythm 8px." The first-in-group rows technically have additional gap from the name/timestamp line, so effective spacing reads adequately. Grouped rows (the pending message at --index 5) use `py-0.5` (2px), which is tighter than the 8px spec target. This is a minor drift, not a misdesign.

Panel padding on the thread canvas is `px-4 lg:px-8` (16px / 32px) — 16px is the correct panel-padding value from §3. The composer uses `px-4 lg:px-6 pb-6` — the bottom 24px clear is appropriate to avoid clipping the send button.

The ghost padding-bottom spacer at `pb-[120px]` on the message area is pragmatically justified (keeps last message from hiding under composer) but could be tightened to match the actual composer height; this is a detail for implementation to tune.

**What would make it a 10:** Tighten conversation-row `px-2` to `px-3` (12px) to match the brief §4 "8px×12px" spec; ensure message row `py-1` resolves consistently to 8px effective rhythm at implementation.

---

### 3. Brand Coherence — 9 / 10

The palette is disciplined. Every hex used in the Tailwind config maps exactly to DESIGN-SYSTEM.md §1 tokens:

| Config value | DS token | Match |
|---|---|---|
| `#0a0a0b` | `--surface-950` | PASS |
| `#121214` | `--surface-900` | PASS |
| `#1c1c1f` | `--surface-800` | PASS |
| `#27272a` | `--surface-700` | PASS |
| `#3f3f46` | `--surface-600` | PASS |
| `#52525b` | `--surface-500` | PASS |
| `rgba(255,255,255,0.06)` | `--border-hairline` | PASS |
| `rgba(255,255,255,0.10)` | `--border-hover` | PASS |
| `rgba(255,255,255,0.92)` | `--text-primary` | PASS |
| `rgba(255,255,255,0.60)` | `--text-secondary` | PASS |
| `rgba(255,255,255,0.40)` | `--text-muted` | PASS |
| `#10b981` | `--accent-emerald` | PASS |
| `#f59e0b` | `--accent-amber` | PASS |
| `#ef4444` | `--danger` | PASS |
| `#f87171` | `--danger-text` | PASS |

No invented hues. No gaming-neon. Shadow values match §5 (`shadow-sm`, `shadow-pop`, `glow-focus`/`emerald-glow`). The calm academic tone is well-held: the server-rail icon morph (rounded-[24px] → rounded-[16px] on hover) matches §4's server-rail squircle/radius convention.

One small color note: `hover:bg-emerald-400` on primary buttons (`Start a Conversation`, modal footer "Start Group DM") uses a Tailwind utility that resolves to `#34d399`, which is not an explicit DS token — it is a hover-lighten of emerald that is semantically correct per the Button primitive spec ("hover: lighten 8%"), but ideally the design system would name this `--accent-emerald-hover`. Flagging as a token-naming gap for the design system, not a blocking color violation.

**What would make it a 10:** Formalize `--accent-emerald-hover` in DESIGN-SYSTEM.md §1 and use it explicitly rather than bare Tailwind `emerald-400`.

---

### 4. Edge-Case Handling — 9 / 10

All required states are present or togglable:

**Empty-list state:** rendered in `#state-empty-list` with centered icon (`ph-chat-circle-text`), headline "No direct messages yet", descriptive subtext, and a primary "Start a Conversation" CTA button. Matches brief §3 and §9 empty-list requirement. The icon is 4xl / text-muted, appropriately quiet. PASS.

**Offline / pending state:** The `connection-wedge` pill in the thread header (`bg-danger/10 border border-danger/20`, danger text "Offline — 1 pending") and the pending message row (60% opacity body + amber clock icon + "Sending…" label) correctly implement the ConnectionStateIndicator + MessageRow pending pattern from DESIGN-SYSTEM.md §8. Amber is the correct semantic for "pending/reconnecting" per §1. The pending row uses `text-accent-amber` for the indicator — correct. PASS.

The `connection-wedge` is currently `hidden` by default (class `hidden md:flex`). A reviewer must open the browser inspector to un-hide it, since the debug toggle only covers the empty list, not the connection wedge. The wedge should be visible by default in the staging mockup or made togglable via the debug bar. This is a mockup-completeness nit, not a design correctness issue.

**Restricted-target picker row (who-can-DM):** Alex Mercer's row is `opacity-50 grayscale` with `cursor-not-allowed`, a lock-icon overlay on the avatar, strikethrough name, and inline `ph-shield-warning` + "Only accepts messages from server members" reason text in `text-danger-text`. The reason is both color-coded AND present as text — satisfies the non-color-only accessibility requirement from brief §6 and §9. No checkbox is rendered, making non-selectability unambiguous. PASS.

**Group vs 1:1 header:** The thread header shows a single participant (Dr. Aris Thorne, 1:1 mode) with the single-avatar + role subtitle pattern. The conversation list shows Row 2 ("Capstone Project Alpha") with a multi-avatar overlap pattern — satisfying the group DM visual in the rail. However, the thread canvas itself does not show a rendered group-DM header state (multi-avatar + participant names in the header). The brief §9 requires "Group DM rendered: multi-avatar header + participant names." This is missing from the thread header — only the rail-row satisfies it. The modal does show two selected recipients (chips for Dr. Aris Thorne and Elena Rossi), which partially demonstrates group logic, but the open-thread group header state is absent. Flagging as a concrete fixable gap.

**Empty-thread state (new conversation, no messages):** Not rendered. Brief §3 explicitly names this state. The thread canvas always shows messages. This is a gap.

**Error state (load failed + retry):** Not rendered. Brief §3 includes this. Not present.

**Loading / skeleton state:** Not rendered. Brief §3 names "loading (skeleton conversation rows + skeleton message rows)" as a required state.

The three missing states (empty-thread, error, skeleton/loading) are design gaps against brief §3 and §9. They are concrete and fixable rather than fundamental — the mockup demonstrates the design language correctly; the states simply need to be authored as togglable sections using the same debug-toggle pattern already in place.

**What would make it a 10:** Add togglable skeleton-loading, empty-thread, and error states to the debug controls; add a group-DM thread header variant with multi-avatar + participant name list.

---

## Additional Token / Primitive Fidelity Checks

**Phosphor icon names** — all referenced icon names are valid Phosphor identifiers:
- `ph-fill ph-chat-teardrop` — PASS (filled chat-teardrop icon)
- `ph-plus` — PASS
- `ph-magnifying-glass` — PASS
- `ph-list` (mobile drawer toggle) — PASS
- `ph-plus-circle` (composer attach) — PASS
- `ph-smiley` (emoji) — PASS
- `ph-fill ph-paper-plane-right` (send) — PASS
- `ph ph-x` (close) — PASS
- `ph-bold ph-check` (selected checkmark) — PASS
- `ph-fill ph-lock` (restricted row) — PASS
- `ph ph-shield-warning` (restriction reason) — PASS
- `ph ph-clock` (pending "Sending…") — PASS
- `ph ph-chat-circle-text` (empty state) — PASS
- `ph-bold ph-arrow-right` (modal footer CTA) — PASS

No invented icon names found. PASS.

**Radius tokens** — rows use `rounded-md` (6px, correct for §4 `--radius-md`); modal uses `rounded-lg` (correct for §4 `--radius-lg`); avatars use `rounded-full` (correct for §4 `--radius-full`); server-rail icons use `rounded-[16px]` / `rounded-[24px]` for the morph (acceptable Discord-familiar squircle approximation matching §4 note). PASS.

**Shadow tokens** — composer uses `shadow-sm` (correct §5); modal uses `shadow-pop` (correct §5); focus ring uses `ring-accent-emerald/40` (matches `--glow-focus` = `0 0 0 2px rgba(16,185,129,0.4)` in §5). PASS.

**Primitive reuse** — the mockup correctly reuses:
- MessageRow pattern (avatar + name + timestamp + body, grouped messages, pending state)
- MessageComposer pattern (auto-grow textarea, attach/emoji/send bar, surface-900 bg, emerald focus ring)
- ChannelHeader pattern (56px header, participant info left, actions right)
- ChannelSidebar item pattern (conversation list rows with avatar, name, preview, unread)
- ConnectionStateIndicator pattern (wedge pill, danger / amber states)
- Modal/Dialog pattern (scrim, shadow-pop, focus trap via Esc, role=dialog aria-modal, labelled title)
- Avatar with presence dot (bottom-right, correct border color matches parent surface)
- Empty state (icon + headline + CTA)

No bespoke re-invention of messaging chrome observed. PASS.

---

## Accessibility Signals

**Rail nav list:** `<aside>` contains `<nav>` with `<a>` elements; active row has `aria-current="page"`. PASS.

**Modal semantics:** `role="dialog" aria-modal="true" aria-labelledby="modal-title"` — correct. Esc key closes via JS event listener. Focus trap is not explicitly coded (no JS focus-trap loop), but `autofocus` on the search input brings focus into the modal on open. A full focus-trap implementation is a build-time concern, not a staging gap; the intent is correctly established. PASS.

**Presence conveyed beyond color:** Offline presence dot uses `bg-surface-500` (grey) with no text label in the rail row — this is color-only for offline presence in the conversation list. Brief §9 and DESIGN-SYSTEM.md §8 (MemberListItem) require "presence conveyed by text too." The thread header does better (the danger pill "Offline — 1 pending" is text + color). The rail rows should include a visually-hidden or tooltip-level text label for the presence dot state (e.g. `sr-only` "Offline"). Flagging as a fixable accessibility gap.

**Composer labelled:** `textarea` has `placeholder="Message @Dr. Aris Thorne"` but no explicit `<label>` or `aria-label`. Brief §9 requires "composer labelled." This is a build-time fix; placeholder alone is not sufficient for screen reader labelling. Flag for implementation.

**Picker listbox:** `role="listbox" aria-multiselectable="true"` is present on the picker list. `role="option"` on rows with `aria-selected="true"` for selected, `aria-disabled="true"` for restricted. PASS.

**Send button disabled state:** The send button uses `opacity-50 cursor-not-allowed` visually but is not `disabled` or `aria-disabled`. At implementation, add `disabled` or `aria-disabled="true"` when the composer is empty.

---

## Consolidated Concerns

1. **[Brief §4 / DS §2] "Direct Messages" heading uses `text-base` (16px) — brief §4 specifies `text-xl` for the screen title.** Fixable at implementation.

2. **[Brief §3 / §9] Missing states: empty-thread, error (load failed + retry), skeleton/loading rows** — three of the nine §3 states are absent from the mockup. These should be added as togglable debug sections.

3. **[Brief §9] Group-DM thread header not shown** — the thread canvas only shows the 1:1 header. A multi-avatar group header state is required by §9.

4. **[Brief §3 / DS §8] Offline / connection-wedge is `hidden` by default** — not visible without inspector intervention. Should be shown by default or exposed via the debug toggle.

5. **[Brief §4] Unread-row timestamp rendered in `text-accent-emerald`** — overloads the emerald token; timestamp should stay `text-text-secondary`, with the unread dot carrying the signal.

6. **[DS §8 / Brief §9 / WCAG] Rail presence dot for offline contacts is color-only** — no text or `sr-only` label. Add `aria-label` or `title` on the dot, or a visually-hidden text node per brief §9 a11y requirement.

7. **[Brief §9] Composer textarea lacks explicit `aria-label`** — placeholder alone is insufficient. Add `aria-label="Message @[Participant Name]"` at implementation.

8. **[Brief §3 spacing] Conversation row `px-2` (8px horizontal) is tighter than brief §4's "8px×12px" spec** — minor rhythm drift; prefer `px-3` (12px) to align with the ChannelSidebar item pattern.

---

## Verdict

**APPROVE**

The mockup faithfully applies all DESIGN-SYSTEM.md tokens (zero invented hex values, correct shadow/radius/glow usage), correctly reuses all required primitives (MessageRow, MessageComposer, ChannelHeader, Modal, Avatar, ConnectionStateIndicator, ChannelSidebar item pattern), and establishes the calm academic dark aesthetic with restraint. The structural composition is sound and provides sufficient signal for implementation.

Concerns 1, 5, 6, 7, and 8 are minor nits correctible at build time without design rework. Concerns 2, 3, and 4 are concrete missing states that should be filed as follow-up tasks on the M8 DM slice (not blocking the current wave's implementation start, given the design language is established and the missing states follow directly from the patterns already shown). No fundamental design miss, no re-invention, no token violations.
