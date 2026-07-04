# D-3 Design Review — Direct Messages (Reviewer A / /plan-design-review lens)
**File reviewed:** `design/staging/direct-messages.html` (iteration 1, post-refine)
**Brief:** `process/waves/wave-46/stages/D-1-brief/direct-messages-brief.md`
**Design System:** `design/DESIGN-SYSTEM.md`
**Reviewer role:** Independent (no awareness of other reviewers or prior review rounds)

---

## Verdict

**APPROVE** (with minor nits — none blocking)

---

## Score card (0–10 per lens axis)

| Axis | Score | Notes |
|------|-------|-------|
| Visual hierarchy | 9 | Three-pane structure reads cleanly; active row is unambiguous; thread header holds context well |
| Spacing rhythm | 8 | Row rhythm and panel padding broadly match §4; one stagger animation implementation nit; grouped-message py tighter than spec |
| Brand coherence | 9 | Full token fidelity; calm academic aesthetic held; no out-of-system hex |
| Edge-case handling | 9 | All seven §3 states present in this iteration; restricted picker row and offline wedge correctly differentiated |

---

## Detailed findings

### Visual hierarchy

The three-column layout correctly maps `--surface-950` app frame to `--surface-900` server rail and conversation-list rail to `--surface-800` thread canvas (DESIGN-SYSTEM §1). The active conversation row uses `--surface-700` fill with an emerald left-indicator pip and emerald-colored participant name — this is unambiguous and mirrors the ChannelSidebar active pattern exactly. The thread header is 56px, consistent with brief §4, with an avatar, participant name at `text-base font-semibold`, and a role subtitle in `text-xs text-secondary` — clean two-line hierarchy.

The composer anchors to the absolute bottom behind a gradient fade from `surface-800`, providing natural visual separation without a harsh border cut. Hierarchy top-to-bottom reads correctly: thread header > date dividers > message rows > composer dock.

One minor note on the rail title: "Direct Messages" is styled `text-xl font-semibold` (20px weight 600). Brief §4 explicitly calls for `text-xl` for the screen/page title role. This is correctly applied.

Unread-row timestamp in conversation row 2 uses `text-accent-emerald`. Brief §4 assigns emerald to "active conversation, primary actions, online presence, unread" — applying emerald to the timestamp overloads the signal. The unread badge dot already carries the unread indicator; the timestamp color adds noise. Preferred at implementation: revert unread timestamp to `text-text-secondary` and let the dot alone carry unread state. Minor nit.

### Spacing rhythm

Conversation rows use `p-2` (8px all sides) with `gap-3` for avatar-to-copy spacing. Brief §4 specifies "conversation-row padding 8px×12px (ChannelSidebar item rhythm)." The horizontal is 8px rather than 12px — slightly tighter than spec, consistent within the mockup. Nit for implementation alignment: prefer `px-3` (12px) horizontal to match the brief.

Message rows use `py-1` (4px vertical) for first-in-group messages and `py-0.5` (2px) for grouped follow-ons. DESIGN-SYSTEM §3 calls for "message-row vertical rhythm 8px." With the name/timestamp line above, the effective spacing for first-in-group reads adequately; grouped rows at 2px are tight. Minor drift, not a misdesign — implementation note to revisit.

Thread canvas panel padding is `px-4 lg:px-8` (16px/32px) — 16px is the correct panel-padding value from §3. Composer uses `px-4 lg:px-6 pb-6`. The `pb-[32px]` ghost spacer at message area bottom is appropriate to keep last message clear of the composer.

The stagger-list animation uses `animation: fadeIn calc(var(--index, 0) * 80ms)` which sets the animation **duration** as the index multiple rather than using `animation-delay`. This causes higher-indexed items to animate more slowly rather than starting later. The visual result at low indices is acceptable but the intent is a staggered delay, not an expanding duration. Developer handoff note: replace with `animation-delay: calc(var(--index, 0) * 80ms)` and a fixed duration.

### Brand coherence

All hex values in the Tailwind config map exactly to DESIGN-SYSTEM §1 tokens. Full audit:

| Config value | DS token | Result |
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

Zero out-of-system hex values. Shadow tokens: `shadow-sm` on composer and thread header, `shadow-pop` on modal — correct per DESIGN-SYSTEM §5. Focus ring uses `ring-2 ring-accent-emerald/40` — matches `--glow-focus: 0 0 0 2px rgba(16,185,129,0.4)`. Radius tokens: `rounded-md` on rows/buttons/inputs/chips (§4 `--radius-md`), `rounded-lg` on modal and composer box (§4 `--radius-lg`), `rounded-full` on avatars and presence dots — all correct.

The `animate-pulse-slow` on the offline connection dot is a 3s cubic-bezier pulse — calm and non-distracting. The `prefers-reduced-motion: no-preference` guard on stagger-list entries correctly disables non-essential entry animations (DESIGN-SYSTEM §6). Server-rail icon morph (`rounded-[24px]` default → `rounded-[16px]` active) matches §4's squircle/radius convention.

Aesthetic tone is held throughout: no color cycling, no neon gradients, no playful bouncy easing. The hover interaction on server icons (300ms `transition-all` rounded morph) is the only elevated motion — correct per §6 "Elevated/active morphs: 300ms ease."

### Edge-case handling

All seven states required by brief §3 are present in this iteration:

**Loading skeleton (Demo Section A):** Skeleton rows use `skeleton-shimmer` (`linear-gradient surface-700 → surface-600 → surface-700`, 1.6s infinite shimmer at 800px background-size). The skeleton covers server rail, conversation list header and rows, thread header, message rows, and composer dock — full-fidelity loading state. Matches DESIGN-SYSTEM §8 ("skeleton rows using surface-700 shimmer; never spinners for content lists"). The section is a labeled demo block visible to reviewers without interaction. PASS.

**Loaded state (main view):** Four-row conversation list with 1:1 and group rows, open thread with date dividers, grouped message blocks, pending message, and failed message. PASS.

**Empty list (toggleable via debug button):** "No direct messages yet" with `ph-chat-circle-text` icon (size text-4xl, text-muted — appropriately quiet), one-line sub-copy, and an emerald primary "Start a Conversation" CTA. Matches the Empty state primitive from DESIGN-SYSTEM §8 ("icon + headline + one-line + primary CTA"). PASS.

**Empty thread (Demo Section B):** Distinct from empty list — the thread canvas shows the other participant's avatar (large 80px), display name as `text-lg font-semibold`, username and role as `text-xs text-muted`, and "This is the beginning of your direct message history…" prose. The composer is fully enabled with a non-disabled Send button, correctly inviting the first message. The conversation list row for this state shows "No messages yet" in `text-xs text-muted italic` as the preview. Correctly differentiates empty-thread from empty-list per brief §3. PASS.

**Error state (Demo Section C):** Two-level error — conversation list error ("Couldn't load conversations") and thread canvas error ("Failed to load messages"). Both show `ph-warning-circle` (danger color), prose cause text, and a Retry button with `aria-label` and `focus-visible:ring-2 focus-visible:ring-accent-emerald/50`. Matches DESIGN-SYSTEM §8 "Error: danger icon + cause + retry." PASS.

**Offline / pending (main thread):** ConnectionStateIndicator wedge in thread header: `role="status"` `aria-live="polite"`, red danger dot + "Offline — 1 pending" text. Pending message row: 60% opacity body + amber `ph-clock` + "Sending..." text. Failed message row: 60% opacity body + danger `ph-warning` + "Failed to send" text + inline Retry button with `aria-label="Retry sending failed message"`. All three components of the offline wedge pattern are present. PASS.

**Picker states (modal + Demo Section D):**
- Default/suggested list: section header "Suggested," selectable rows with avatar/name/role, empty checkbox state.
- Selected state: row 2 (Elena Rossi) has `aria-selected="true"`, emerald filled checkmark with `shadow-emerald-glow`, and recipient chip in the input area.
- Recipient chips: removable with `ph-x`, `aria-label="Remove [Name]"`, focus ring on remove button.
- Restricted target (Alex Mercer): `opacity-50 grayscale cursor-not-allowed`, lock icon overlay on avatar, strikethrough name, `ph-shield-warning` + "Only accepts messages from server members" in `text-danger-text`. Non-selectable, non-color-only reason text. Satisfies brief §6 and §9 a11y requirement.
- Searching state (Demo Section D picker): active emerald border + focus ring on search input, `<mark>` tag with `bg-accent-emerald/20 text-accent-emerald` highlighting matched substring ("Aris"), "Results for 'aris'" section header, "No other results" trailing section. PASS for all picker states.

**Group vs 1:1 thread header:**
- 1:1 (main view): single avatar (28px) + name + role subtitle. PASS.
- Group (Demo Section D): two-avatar overlap stack (bottom-left `z-0` + top-right `z-10`, `border-2 border-surface-800` separation) + "Elena Rossi, Sarah Kim" + "Group DM · 3 members" subtitle. Overflow annotation notes "+N badge for groups >3." PASS per brief §9.

### Token fidelity (DESIGN-SYSTEM §1/§4/§5)

Verified above. No issues. Danger-text usage on restricted-row tinted background uses `#f87171` (`--danger-text`) on `bg-danger/5` — this follows the DESIGN-SYSTEM §1 note exactly: `--danger-text` computes 6.30:1 on danger/10 tint (WCAG AA PASS). Correct.

### Phosphor icon names (DESIGN-SYSTEM §7)

All icon class names verified:

| Icon class | Valid | Use |
|---|---|---|
| `ph-fill ph-chat-teardrop` | PASS | DM home active |
| `ph-plus` | PASS | New DM, add server |
| `ph-magnifying-glass` | PASS | Search |
| `ph-list` | PASS | Mobile drawer toggle |
| `ph-clock` | PASS | Pending/Sending indicator |
| `ph-warning` | PASS | Failed message |
| `ph-plus-circle` | PASS | Attach |
| `ph-smiley` | PASS | Emoji |
| `ph-fill ph-paper-plane-right` | PASS | Send (filled active) |
| `ph-chat-circle-text` | PASS | Empty list |
| `ph-circle-notch` | PASS | Loading demo label spinner |
| `ph-chat-circle-dots` | PASS | Empty thread demo label |
| `ph-warning-circle` | PASS | Error state |
| `ph-arrow-clockwise` | PASS | Retry |
| `ph-users` | PASS | Group DM header, members |
| `ph-x` | PASS | Close modal, remove chip |
| `ph-bold ph-check` | PASS | Selected checkmark |
| `ph-fill ph-lock` | PASS | Restricted target overlay |
| `ph-shield-warning` | PASS | Restriction reason |
| `ph-bold ph-arrow-right` | PASS | Modal CTA |

Zero invented or invalid icon names.

### Accessibility (brief §9, DESIGN-SYSTEM §8)

**Rail nav list:** `<nav aria-label="Conversations">` with `<a>` elements; active row has `aria-current="page"`. Server rail is `<nav aria-label="Servers">`. PASS.

**Modal:** `role="dialog"` `aria-modal="true"` `aria-labelledby="modal-title"`. Esc closes via `keydown` listener. Close button has `aria-label="Close modal"`. `autofocus` on the search input brings focus into the modal on open. Full programmatic focus-trap (tab cycle) is a build-time implementation detail; the semantics and Esc behavior are correctly established at mockup stage. PASS.

**Presence in text not color alone:**
- ConnectionStateIndicator wedge: "Offline — 1 pending" text + color. PASS.
- Pending message: "Sending..." text + amber color. PASS.
- Failed message: "Failed to send" text + danger color. PASS.
- Conversation list presence dots (online/idle/offline): color-only — no `aria-label` or `sr-only` text on the dot elements. This is a gap against brief §9 and DESIGN-SYSTEM §8 MemberListItem ("presence conveyed by text too"). Minor implementation note: add `aria-label="Online"` / `"Idle"` / `"Offline"` on each presence dot `<div>` or a `<span class="sr-only">` child. Not a design failure at mockup stage.

**Composer label:** `<textarea aria-label="Message Dr. Aris Thorne">` — explicitly labelled per brief §9 requirement. PASS.

**Listbox:** Main modal picker `role="listbox"` with `aria-multiselectable="true"`. Individual rows use `role="option"`. Selected row has `aria-selected="true"`. Restricted row has `aria-disabled="true"`. The main modal listbox div lacks an `aria-label` (Demo D version has `aria-label="Search results"` — main modal should follow). Minor nit.

**Disabled Send button:** Main Send button uses `opacity-50 cursor-not-allowed` visually but no `aria-disabled="true"` or `disabled` attribute. Demo D "Open DM" button correctly uses `disabled aria-disabled="true"`. Main Send should be consistent. Minor nit.

**Error retry buttons:** Both retry buttons have `aria-label` ("Retry loading conversations" / "Retry loading messages") and `focus-visible:ring-2 focus-visible:ring-accent-emerald/50`. PASS.

---

## Minor nits (non-blocking — all implementation notes)

1. **Unread timestamp uses `text-accent-emerald`** — overloads the emerald signal; prefer `text-text-secondary` for the timestamp, letting the dot carry unread alone. DS §1 semantic mapping.

2. **Stagger animation sets duration not delay** — `calc(var(--index,0)*80ms)` expands duration by index. Implementation should use `animation-delay` with a fixed duration.

3. **Conversation-row `px-2` (8px horizontal) is tighter than brief §4 "8px×12px"** — prefer `px-3` to match ChannelSidebar item rhythm.

4. **Presence dots in conversation list are color-only** — add `aria-label` or `sr-only` text per brief §9. Brief §9 a11y.

5. **Main modal picker listbox missing `aria-label`** — add `aria-label="Select recipients"`. Brief §9 a11y.

6. **Main Send button missing `aria-disabled`** — add `aria-disabled="true"` (or `disabled`) when composer is empty. Brief §9 a11y.

7. **`skeleton-shimmer` class in Demo C references a class defined inside Demo A's scoped `<style>` block** — works in browser (not shadow DOM), but fragile dependency order. Extract to a shared `<style>` block. Developer note.

---

## What would make this a 10

- Apply `aria-label` to presence dots in conversation list rows.
- Add `aria-label="Select recipients"` to the main modal listbox and `aria-disabled="true"` to the blank-state Send button.
- Correct stagger animation to use `animation-delay`.
- Revert unread-row timestamp from emerald to secondary.

---

## §9 checklist assessment (brief)

| Criterion | Status |
|-----------|--------|
| DESIGN-SYSTEM tokens only, no new hex, dark-mode only | PASS — full token fidelity, zero out-of-system hex |
| All §3 states rendered | PASS — loading, loaded, empty-list, empty-thread, error, offline/pending, picker default/searching/restricted/selected all present |
| Responsive per §5 | PASS — three-pane at 1280+, drawer <1024 |
| Matches prior-art visual language §8 | PASS — zinc surface stack, message-row layout, rail item pattern, modal card all align with channel-view / sidebar prior art |
| Reuses MessageRow, MessageComposer, ChannelHeader, ConnectionStateIndicator, Modal, Avatar primitives | PASS — composed from system primitives; no bespoke chrome reinvention |
| Offline wedge + pending amber + failed danger/Retry | PASS — ConnectionStateIndicator, pending opacity+amber, failed danger+Retry all present |
| Non-color-only who-can-DM restriction reason | PASS — text reason + shield-warning icon in danger-text color |
| All icon names real Phosphor names | PASS — all 20 icon references verified valid |
| Group DM multi-avatar + participant names; 1:1 single participant | PASS — both variants rendered (1:1 in main thread, group in Demo D) |
| A11y: nav list aria-current, modal focus-trap+Esc, presence text not color-only, composer labelled | PARTIAL PASS — aria-current present, Esc works, composer labelled; presence dots in rail are color-only (minor nit); modal listbox aria-label and Send aria-disabled missing. All minor implementation notes, not design failures. |

All ten criteria pass or carry only minor developer-handoff notes. The design is production-ready from a visual and structural standpoint.
