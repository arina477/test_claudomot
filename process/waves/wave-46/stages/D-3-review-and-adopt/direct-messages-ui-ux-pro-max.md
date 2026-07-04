# D-3 Review — Direct Messages Mockup (Iteration 1 post-refine)
**Reviewer:** ui-ux-pro-max (Reviewer B — requirement + UX + token audit lens)
**Mockup:** `design/staging/direct-messages.html`
**Brief:** `process/waves/wave-46/stages/D-1-brief/direct-messages-brief.md`
**Design System:** `design/DESIGN-SYSTEM.md`
**Verdict:** APPROVE

---

## Verdict rationale

Every blocking gap from the prior iteration has been addressed. The seven §3 states that were absent or partially broken are all present and correct in this revision: loading skeleton, empty-thread, error (both panes), failed-message "Retry", ConnectionStateIndicator now carries `role="status"` and `aria-live="polite"` and is visible in the default render, the composer textarea has `aria-label`, and chip remove buttons are labelled. The remaining items are all low-severity nits suitable for B-block handoff notes. The APPROVE verdict reflects a mockup that substantially meets all ten §9 criteria with only minor implementation-layer clarifications needed.

---

## §9 Success-Criteria Checkbox Audit

### 1. Token fidelity (§9 criterion 1: "Uses exactly the DESIGN-SYSTEM.md tokens listed in §4; no new hex; dark-mode only")
**Result: PASS (minor nits only)**

- All surface and border colors use the Tailwind-extended token names: `bg-surface-950/900/800/700/600/500`, `border-border-hairline`, `border-border-hover`. The Tailwind config block (lines 27–52) precisely mirrors DESIGN-SYSTEM.md §1 primitives. No invented hex in production areas.
- Text tokens (`text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-danger-text`) are used correctly. `danger-text` (#f87171) is correctly applied on tinted backgrounds per DS §1 WCAG note.
- Shadows: `shadow-sm` and `shadow-pop` match DS §5 exactly. `shadow-emerald-glow` is defined as `0 0 0 2px rgba(16,185,129,0.4)` — equivalent to `--glow-focus`.
- Dark-mode only: `class="dark"` on `<html>`. PASS.
- Accent amber on pending state: `text-accent-amber`. PASS.
- Hover on primary buttons: `hover:bg-accent-emerald/90` throughout (lines 292, 458, 698, 1002). PASS — prior F1.1 (`hover:bg-emerald-400`) is resolved.
- Body background: `body { background-color: #0a0a0b; }` with comment "surface-950 token applied via Tailwind bg-surface-950 on body element" (line 99). The raw hex is the same value as the token. Nit: `<body class="bg-surface-950">` would be cleaner but this is inert at identical value.
- Demo shimmer keyframe uses literal `#27272a` / `#3f3f46` (surface-700/600 values) — demo-section CSS only, acceptable at mockup fidelity.
- No sub-12px text sizes found. Smallest type is `text-xs` (12px). Prior F1.3 resolved.
- Ghost spacer is `pb-32` (128px ≈ 4px × 32 = Tailwind scale-32, not arbitrary). Within Tailwind extended scale. Prior F1.4 effectively resolved.

**Nit T1:** Body still uses an inline raw hex in the `<style>` block rather than the Tailwind class. Low severity — same value.

### 2. All §3 states rendered (§9 criterion 2)
**Result: PASS**

All eleven sub-states verified present:

| State | Present? | Location / Evidence |
|---|---|---|
| Loading skeleton | MET | Demo section A (`#demo-loading`, line 472). Full three-column skeleton: shimmer server rail, shimmer conversation rows (4 rows with staggered opacity), shimmer thread header, shimmer message rows (incoming/outgoing/grouped/incoming), shimmer composer. Shimmer uses `surface-700`→`surface-600` gradient, matching DS §8 "skeleton rows using surface-700 shimmer." |
| Loaded (list + open thread) | MET | Primary viewport. 4 conversation rows (1:1 active, group unread, 1:1 offline, 1:1 idle) + open Dr. Aris Thorne thread with date dividers and message rows. |
| Empty-list | MET | `#state-empty-list` (line 286): toggle via JS debug button. `ph-chat-circle-text` icon + headline + description + "Start a Conversation" CTA wired to `toggleModal()`. |
| Empty-thread | MET | Demo section B (`#demo-empty-thread`, line 612). Participant avatar shown large (72px), display name, handle + role, "beginning of your direct message history" copy, composer enabled. Distinct from empty-list. |
| Error + Retry | MET | Demo section C (`#demo-error`, line 713). Both panes: list rail shows danger icon + "Couldn't load conversations" + cause + Retry button (`aria-label="Retry loading conversations"`); thread canvas shows "Failed to load messages" + cause + Retry (`aria-label="Retry loading messages"`). Both Retry buttons have `focus-visible:ring-2`. |
| Offline/pending (amber "Sending…") | MET | Line 389–404: message row at `--index:5`, 60% opacity body + amber clock icon (`ph-clock`) + "Sending…" label. Matches DS §8 MessageRow pending spec. |
| FAILED-message "Retry" | MET | Line 406–425: message row at `--index:6`, 60% opacity body + `ph-warning` danger icon + "Failed to send" + underlined Retry button with `aria-label="Retry sending failed message"` and `focus-visible:ring-1 focus-visible:ring-danger`. |
| Picker default | MET | Modal (`#start-dm-overlay`) opens by default with "Suggested" list and four rows. |
| Picker searching | MET | Demo section D (`#demo-group-dm-and-search`, line 816). Standalone frame: input shows value "aris", results header "Results for 'aris'", match row with `<mark class="bg-accent-emerald/20 text-accent-emerald">Aris</mark>` highlight, "No other results" section. |
| Picker restricted/disabled | MET | Main modal, "Alex Mercer" row (line 963): `aria-disabled="true"`, `cursor-not-allowed`, `opacity-50 grayscale`, lock icon overlay, danger-text reason with `ph-shield-warning` icon. Non-color-only. Checkbox omitted. |
| Picker selected (chips) | MET | Two chips present: "Dr. Aris Thorne" and "Elena Rossi" with avatar, name, `×` remove button with `aria-label="Remove [Name]"` and `focus-visible:ring-2`. Elena row has `aria-selected="true"` and filled emerald checkbox. |

All states present. FULL PASS.

### 3. Responsive per §5 (§9 criterion 3)
**Result: PASS**

- Three-column layout at default: server rail (72px) + conversation list (320px at `lg:w-[320px]`) + thread canvas (`flex-1`). Correct.
- Narrow (<1024) drawer: `aside#dm-list-rail` is `absolute lg:relative`, defaults to `dm-drawer-hidden` (`translateX(-100%)`), `lg:translate-x-0` pins it open above the breakpoint. Thread header hamburger (`lg:hidden`) has `onclick="toggleDrawer()"`. JS `toggleDrawer()` function wired at line 1063. Prior nit R3.1 resolved.
- Start-DM modal: `w-full max-w-[480px]` with `p-4` overlay padding. Compresses on narrow. PASS.
- Server rail: `hidden sm:flex`. Below 640px the rail hides, which is the out-of-scope mobile range (brief §10: "Desktop app"). PASS for desktop scope.

### 4. Prior-art visual language match (§9 criterion 4)
**Result: PASS**

- Thread canvas: 56px header (`h-[56px]`), `surface-800` canvas, `surface-900` composer wrapper, `glass-panel` inset-top-highlight, `shadow-sm` on header — identical to `server-channel-view.html` pattern. MessageRow structure (avatar + name + timestamp inline + body, grouped continuation with hidden avatar, `<article>` semantic, `stagger-list` entry) matches. PASS.
- Conversation-list rail: `surface-900` sidebar, `surface-700` active fill + emerald left pip (`absolute left-[-8px]`, `w-1 h-8`, `rounded-r-md`), `aria-current="page"`, row `p-2` padding — mirrors ChannelSidebar item. PASS.
- Modal: `surface-900`, `rounded-lg`, `shadow-pop`, `surface-950/50` header tint, hairline border, header + body + footer, right-aligned primary + secondary — matches `create-server.html` / `settings-privacy.html`. Scrim `bg-black/60 backdrop-blur-[2px]`. PASS.

### 5. Primitive reuse (§9 criterion 5)
**Result: PASS**

| Primitive | Reused? |
|---|---|
| MessageRow | Yes — avatar, name, timestamp, body, grouped continuation (hidden avatar replaced by time gutter), pending/failed states |
| MessageComposer | Yes — surface-900 textarea, hairline border, emerald focus ring, attach + emoji + send, auto-grow JS |
| ChannelHeader | Yes — 56px header, participant info left, actions right, hairline border-b, glass-panel |
| ConnectionStateIndicator | Yes — danger pill, `role="status"`, `aria-live="polite"`, text state, visible in default render |
| Modal/Dialog | Yes — focus trap intent, Esc handler, aria attributes |
| Avatar + presence dot | Yes — all rows and headers |
| Badge/Pill | Yes — server-rail mention badge (danger, 20px), emerald unread dot |
| Empty / Loading / Error states | Yes — all three variants now present |
| ChannelSidebar item | Yes — conversation row structure |

Stagger-list animation: outside DS §6 spec but correctly scoped to `@media (prefers-reduced-motion: no-preference)` — only runs when user has NOT requested reduced motion. PASS on motion spec compliance.

### 6. Offline wedge visible (§9 criterion 6)
**Result: PASS**

- ConnectionStateIndicator (`#connection-wedge`, line 326): visible in the default render (no `hidden` class). Displays danger pill "Offline — 1 pending" with pulsing dot.
- `role="status"` + `aria-live="polite"` present on the wedge div. PASS.
- Pending state (amber "Sending…"): visible in main thread at `--index:5`. PASS.
- FAILED + "Retry": visible in main thread at `--index:6`. PASS.
- Composer enabled in all states — not disabled anywhere. PASS.

### 7. Non-color-only restriction reason (§9 criterion 7)
**Result: PASS**

"Alex Mercer" row in the main modal picker (line 963):
- Lock icon overlay on avatar (`ph-fill ph-lock`)
- `aria-disabled="true"` on the listbox option
- Text reason "Only accepts messages from server members" in `text-danger-text`
- `ph-shield-warning` icon preceding the reason text
- `opacity-50 grayscale` visual treatment
- Checkbox omitted entirely (correct — no false affordance)
- Line-through on name (`line-through decoration-text-muted`)

Non-color-only: icon + text + strikethrough. PASS.

### 8. All icon references are real Phosphor names (§9 criterion 8)
**Result: PASS**

Full catalog cross-check:

| Icon class | Valid? |
|---|---|
| `ph-fill ph-chat-teardrop` | YES |
| `ph ph-plus` | YES |
| `ph ph-magnifying-glass` | YES |
| `ph ph-list` | YES |
| `ph ph-clock` | YES |
| `ph ph-warning` | YES |
| `ph ph-warning-circle` | YES |
| `ph-fill ph-paper-plane-right` | YES |
| `ph ph-smiley` | YES |
| `ph ph-plus-circle` | YES |
| `ph ph-arrow-clockwise` | YES |
| `ph ph-chat-circle-text` | YES |
| `ph ph-chat-circle-dots` | YES |
| `ph ph-users` | YES |
| `ph ph-x` | YES |
| `ph ph-circle-notch` | YES |
| `ph-bold ph-check` | YES |
| `ph ph-shield-warning` | YES |
| `ph-fill ph-lock` | YES |
| `ph-bold ph-arrow-right` | YES |

All twenty icon references are valid Phosphor names. PASS.

### 9. Group DM rendered; 1:1 shown (§9 criterion 9)
**Result: PASS**

- Conversation list row 2 ("Capstone Project Alpha"): two 22px overlapping avatars with `border-surface-900`/`border-surface-800` hover transition. Group name vs participant name correctly distinct. Unread dot. PASS.
- Thread canvas (primary view): 1:1 with Dr. Aris Thorne — single avatar, name, role subtitle. PASS.
- Group DM thread header: Demo section D (`#demo-group-dm-and-search`, line 786). Two-avatar diagonal stack (bottom-left + top-right, `z-0`/`z-10`), title "Elena Rossi, Sarah Kim", subtitle "Group DM · 3 members". Overflow annotation: "+N badge for groups >3." PASS.
- Prior G9.1 gap resolved.

### 10. Accessibility minimums (§9 criterion 10)
**Result: PASS (minor nits only)**

**Passes:**

| Check | Status |
|---|---|
| Modal `role="dialog"` + `aria-modal="true"` + `aria-labelledby="modal-title"` | PASS (line 889) |
| Esc closes modal via `keydown` listener | PASS (line 1076) |
| Modal close button `aria-label="Close modal"` | PASS (line 894) |
| Composer `aria-label="Message Dr. Aris Thorne"` | PASS (line 445) — prior A10.1 resolved |
| Empty-thread composer `aria-label="Message James O'Connor"` | PASS (line 691) |
| ConnectionStateIndicator `role="status"` + `aria-live="polite"` | PASS (line 326) — prior A10.2 resolved |
| Chip remove buttons `aria-label="Remove [Name]"` + `focus-visible:ring-2` | PASS (lines 907, 914) — prior A10.3 resolved |
| Stagger-list animation in `@media (prefers-reduced-motion: no-preference)` | PASS (line 106) — prior A10.4 resolved |
| Server rail `<nav aria-label="Servers">` | PASS (line 147) — prior A10.5 resolved |
| Conversation list `<nav aria-label="Conversations">` | PASS (line 205) — prior A10.5 resolved |
| Rail `aria-current="page"` on active row | PASS (line 208) |
| Picker `role="listbox"` + `aria-multiselectable="true"` | PASS (line 930) |
| Picker rows `role="option"` | PASS |
| `aria-selected="true"` on selected row | PASS (line 950) |
| `aria-disabled="true"` on restricted row | PASS (line 964) |
| Message rows as `<article>` | PASS |
| `<time>` for timestamps | PASS |
| Avatar `alt` attributes | PASS (descriptive names on all user images; `alt=""` on decorative modal chip thumbnail at line 905 — correct) |
| Error Retry buttons with `aria-label` + focus ring | PASS (lines 741, 763) |

**Remaining nits (non-blocking):**

- **N-1 (Low):** Modal focus-trap is not implemented in JS beyond initial `autofocus` on the search input. Tab can escape to background content in a static HTML mockup — expected at this fidelity. B-block must implement a proper focus-trap in `StartDmPicker.tsx`.
- **N-2 (Low):** `animate-modal-in` entry keyframe has no `@media (prefers-reduced-motion: reduce)` guard. The stagger-list correctly uses the `no-preference` wrapper, but the modal entry and `animate-pulse-slow` on the connection wedge dot do not. Both should be suppressed under `reduce`. Low severity — modal animation is 300ms, non-looping; pulse is cosmetic.
- **N-3 (Low):** Main modal search input (line 922) has no `aria-label` (placeholder only). The parallel search input in Demo D (line 832) correctly has `aria-label="Search users"`. Main modal input should match.

---

## UX Flow Evaluation

**Start-DM → pick → send coherence:**

Entry point: "+" button (`aria-label="Start Direct Message"`) in rail header — visible, labelled, opens modal. Modal shows chips + search + suggestion list. Selection adds chips, updates "Start Group DM" CTA contextually. Cancel and Esc both close. Restricted target has clear inline reason. Flow is coherent and discoverable. PASS.

**Send flow:**

Composer labelled, auto-grows, Enter-to-send implied by layout. Send button disabled when empty (`opacity-50 cursor-not-allowed`, no `aria-disabled` — minor: should add `aria-disabled="true"` + `disabled` attribute to the main view Send button for AT). Pending → amber → failed → Retry complete lifecycle visible. PASS.

**Who-can-DM restriction student comprehensibility:**

"Only accepts messages from server members" is plain, unambiguous, and student-appropriate. Icon reinforces. Strongest UX execution in the file. PASS.

**Visual hierarchy:**

Rail title "Direct Messages" at `text-xl font-semibold tracking-tight` — prior nit resolved. Thread header participant name at `text-base font-semibold` — correct at this level (not the screen title). Active conversation name at `text-accent-emerald` vs secondary rows at `text-text-secondary` → `hover:text-text-primary` creates clear active/inactive hierarchy. Unread indicator (emerald dot) supplements the text weight change. PASS.

**Spacing rhythm:**

Conversation rows: `p-2` (8px uniform). DS §3 specifies "8px×12px" sidebar item rhythm. `px-3 py-2` would more precisely honor the asymmetric spec but `p-2` is visually acceptable. Low-priority implementation correction.

Message rows: `py-1` (4px) for new group heads, `py-0.5` (2px) for grouped continuations — correct tighter rhythm for grouped messages. `gap-0` on scroll container means rhythm is purely row-internal. PASS.

Ghost spacer: `pb-32` (128px) — generous but serves the composer dock clearance. Within Tailwind scale. PASS.

---

## Consolidated Nit List (all non-blocking)

| # | Severity | Location | Issue | Fix |
|---|---|---|---|---|
| N-1 | Low | Modal JS | Focus-trap not implemented — Tab escapes modal in static HTML | B-block: implement focus-trap hook in `StartDmPicker.tsx` |
| N-2 | Low | `animate-modal-in`, `animate-pulse-slow` | No `prefers-reduced-motion: reduce` guard on modal entry animation or pulsing dot | Add `@media (prefers-reduced-motion: reduce) { .animate-modal-in, .animate-pulse-slow { animation: none; } }` |
| N-3 | Low | Main modal input (line 922) | Missing `aria-label` — placeholder text only | Add `aria-label="Search users"` matching Demo D |
| N-4 | Low | Send button (main view, line 458) | Disabled state uses `opacity-50 cursor-not-allowed` but no `disabled` attribute or `aria-disabled="true"` | Add `disabled aria-disabled="true"` when composer is empty |
| N-5 | Low | Conversation row padding | `p-2` (8px all sides) vs DS §3 "8px×12px" sidebar item rhythm | Use `px-3 py-2` at build time for spec fidelity |
| N-6 | Low | Avatar presence dots in rows | Online/offline/idle state conveyed by color dot only in list rows | Add visually-hidden `<span class="sr-only">Online</span>` etc. per DS §8 MemberListItem a11y note |
| N-7 | Info | Demo shimmer (line 485) | Raw hex `#27272a`/`#3f3f46` in gradient — demo CSS only | Normalize to CSS custom properties in production component |
| N-8 | Info | Body background (line 99) | `background-color: #0a0a0b` inline style rather than Tailwind class | Use `<body class="bg-surface-950">` and remove the inline rule |

---

## Summary

- §9 criteria fully passing: 10/10
- Blocking defects: 0
- Medium defects: 0
- Low-severity nits: 8 (all implementation-layer; none require design revision)

All seven blocking gaps from the prior REVISE verdict are confirmed resolved: loading skeleton, empty-thread, error (both panes), failed-message "Retry", ConnectionStateIndicator visible + ARIA-labelled, composer aria-label, chip remove aria-labels. Token discipline is clean throughout the production component areas. Phosphor icon names are all valid. Group DM header is rendered. Reduced-motion is correctly scoped. The eight remaining nits are B-block handoff notes, not design blockers.
