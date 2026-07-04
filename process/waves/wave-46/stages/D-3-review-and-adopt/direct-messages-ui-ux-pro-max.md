# D-3 Review — Direct Messages Mockup
**Reviewer:** ui-ux-pro-max (Reviewer B — requirement + UX + token audit lens)
**Mockup:** `design/staging/direct-messages.html`
**Brief:** `process/waves/wave-46/stages/D-1-brief/direct-messages-brief.md`
**Design System:** `design/DESIGN-SYSTEM.md`
**Verdict:** REVISE

---

## Verdict rationale

The mockup is well-crafted and covers a large proportion of the §9 criteria. Token fidelity is strong overall, the three-pane layout reads correctly, the DM flow is intuitive, and the restricted-picker row with its text reason is excellent UX. The REVISE verdict is driven by three concrete gaps: (1) four §3 required states are absent from the file (loading skeleton, empty-thread, error, failed-message / "Retry"), (2) the ConnectionStateIndicator is marked `hidden` and never shown on the visible default render — it exists in the DOM but a reviewer cannot see the offline wedge without JS interaction, and (3) two accessibility minimums are missing (no `role="status"` + `aria-live` on the ConnectionStateIndicator; composer textarea is missing a programmatic `<label>` or `aria-label`; chip remove buttons have no accessible name). Each gap is citable against a specific §9 criterion and has a concrete recommended fix. There are also a set of lower-severity token and UX nits that should be resolved alongside the blocking gaps.

---

## §9 Success-Criteria Checkbox Audit

### 1. Token fidelity (§9 criterion 1: "Uses exactly the DESIGN-SYSTEM.md tokens listed in §4; no new hex, no invented tokens; dark-mode only")
**Result: PARTIAL**

Passes:
- All surface and border colors are mapped to tokens (`surface-950/900/800/700/600/500`, `border-hairline`, `border-hover`). Hex values in the Tailwind config block at lines 29–52 precisely mirror DESIGN-SYSTEM.md §1 primitives — this is the correct approach for a static mockup.
- Text token usage (`text-primary`, `text-secondary`, `text-muted`, `danger-text`) is correct throughout.
- Shadow tokens `shadow-sm` and `shadow-pop` match DESIGN-SYSTEM.md §5 values exactly. `shadow-emerald-glow` (the `--glow-focus` analogue) is correctly defined.
- Dark-mode only: confirmed — no light-mode switch, `class="dark"` on `<html>`.

Fails / nits:
- **F1.1** (minor) `hover:bg-emerald-400` appears on the Send button (line 435) and two other primary buttons (lines 290, 565). This is a raw Tailwind color reference, not a token — DESIGN-SYSTEM.md §1 defines only `--accent-emerald: #10b981` as the hover target with "lighten 8%". The correct token-faithful form is `hover:bg-accent-emerald/90` or a declared hover-token. `emerald-400` is `#34d399`, a visible hue jump beyond the 8% specified. Affects three buttons.
- **F1.2** (minor) `body { background-color: #0a0a0b; }` at line 99 is a raw hex rather than `bg-surface-950`. In a static mockup this is technically harmless (same value), but it breaks the token discipline contract. The Tailwind config defines `surface.950` correctly; the body class should use `bg-surface-950`.
- **F1.3** (minor) Arbitrary text sizes (`text-[10px]`, `text-[11px]`) appear on timestamps and the ConnectionStateIndicator label (lines 169, 218, 237, 257, 274, 326, 343, 366, 388, 397, 413). DESIGN-SYSTEM.md §2 defines `text-xs` as 12px as the floor. `text-[11px]` and `text-[10px]` are sub-scale values that diverge from the defined type scale. Recommend collapsing `text-[12px]` references to `text-xs` and either accepting `text-xs` for 11px metadata or defining a named token if the scale genuinely needs sub-12px metadata text.
- **F1.4** (minor) `pb-[120px]` ghost spacer div (line 405) is an arbitrary spacing value; DESIGN-SYSTEM.md §3 defines the scale up to 48px base units. This should be a named utility or at minimum justified in a comment as composer-dock offset.

### 2. All §3 states rendered (§9 criterion 2: "Renders ALL §3 states")
**Result: FAIL (BLOCKING)**

§3 requires: loading / loaded / empty-list / empty-thread / error / offline-pending / picker default / picker searching / picker restricted-target / picker selected.

| State | Present? | Notes |
|---|---|---|
| Loading (skeleton rows) | MISSING | No skeleton markup anywhere in the file. DESIGN-SYSTEM.md §8 specifies skeleton rows for content lists, not spinners. Brief §3 explicitly requires skeleton conversation rows + skeleton message rows. |
| Loaded (list + open thread) | PASS | Default render is fully loaded with 4 conversation rows and an open thread. |
| Empty-list | PASS | `#state-empty-list` div is present, togglable via JS debug button. |
| Empty-thread | MISSING | No empty-thread state rendered. Brief §3 requires it ("new conversation, no messages"). This is a distinct canvas state from empty-list. |
| Error (load failed + retry) | MISSING | No error state in either the list rail or thread canvas. DESIGN-SYSTEM.md §8 mandates: "Error: danger icon + cause + retry." |
| Offline/pending (ConnectionStateIndicator + pending message) | PARTIAL | The `#connection-wedge` is present in the DOM (line 324) but initializes with `class="hidden"` — it is invisible on the default render without a JS toggle. The pending amber "Sending…" message row (lines 386–402) IS visible in the default render. The ConnectionStateIndicator must be visible by default in the mockup (or alongside a rendered pending state) to satisfy "offline wedge visible" per §9 criterion 6. |
| Picker default (empty search, suggestion list) | PASS | Modal initializes open with the suggestion list visible. |
| Picker searching | PARTIAL | The search input is present with `autofocus` but no filtered/searching state is mocked — no "searching…" or filtered results shown. Brief §6 says "search filters users." A static mockup should show a second picker state with search results, not only the default suggestion list. |
| Picker restricted-target | PASS | Alex Mercer row (lines 527–545) is well-executed: lock overlay, opacity/grayscale, `aria-disabled="true"`, explicit text reason ("Only accepts messages from server members"), no checkbox. Excellent. |
| Picker selected (chips) | PASS | Two chips rendered (Dr. Aris Thorne + Elena Rossi), corresponding selected row (Elena Rossi, aria-selected="true"), checkmark state visible. |

Missing count: 3 fully absent states (loading skeleton, empty-thread, error) + 1 partially broken (ConnectionStateIndicator hidden by default) + 1 incomplete (picker searching not mocked).

### 3. Responsive per §5 (§9 criterion 3)
**Result: PASS (with nit)**

- Three-column layout at default render: server rail (72px) + conversation rail (320px) + thread canvas (flex-1). Correct.
- `<1024` drawer behavior: `dm-drawer-hidden` CSS class applies `translateX(-100%)` on the rail at `max-width:1024px` (line 121–128); `dm-drawer-visible` class returns it. The toggle is wired to `ph-list` hamburger button in the thread header (line 305–307) — the button is `lg:hidden` which is correct.
- Server rail is `hidden sm:flex` (line 145), meaning it hides below 640px. Brief §5 says server rail persists at `<1024`. The rail should be `hidden lg:hidden` or some form visible at 1024 but already the brief says "server rail persists" on narrow, so `sm:flex` is too permissive in both directions. At 640px–1023px, the rail shows but the drawer mechanism only activates at `<1024`. That combination is actually fine — the rail shows from sm upward and the drawer activates at <lg. The nit is that below 640px the rail vanishes entirely, which §5 does not explicitly allow. For the MVP scope (desktop-only per §10), this is acceptable but worth noting.
- **Nit R3.1**: The drawer JS toggle (`dm-drawer-visible` / `dm-drawer-hidden`) is not wired to the hamburger button in the JS block. The hamburger button has no `onclick` handler. The CSS classes exist but toggling them requires manual DOM manipulation. In a static mockup this is acceptable as a reviewer-override, but the button should have `onclick="toggleDrawer()"` to be consistent with the other interactive states.

### 4. Prior-art visual language match (§9 criterion 4: thread ≈ server-channel-view; rail ≈ sidebar; modal ≈ create-server/settings-privacy)
**Result: PASS**

- Thread header (participant avatar + name + role subtitle + right actions) correctly mirrors the ChannelHeader pattern from server-channel-view.
- Message rows (avatar left, name+timestamp inline, body, grouped messages with hidden avatar on continuation) match the MessageRow primitive exactly.
- Conversation rail rows (32px avatar + name + preview + timestamp + unread dot) match ChannelSidebar item density and emerald active state.
- Modal (surface-900, rounded-lg, shadow-pop, header+body+footer, Esc close) correctly matches the Modal/Dialog primitive. The scrim is `bg-black/60 backdrop-blur-[2px]` which matches the design system spec.
- Group DM multi-avatar approach (two overlapping 22px circles) is a reasonable prior-art-aligned convention.

### 5. Primitive reuse (§9 criterion 5)
**Result: PASS (with annotation)**

Primitives observed as reused vs. invented:
- MessageRow: reused (avatar, name, time, body, grouped continuation row with hidden avatar). PASS.
- MessageComposer: reused (surface-900 textarea, hairline border, emerald focus ring, attach + emoji + send). PASS.
- ChannelHeader pattern: reused (h-[56px] header, participant info left, actions right, hairline border-b, shadow-sm). PASS.
- ConnectionStateIndicator: present (danger pill with amber-ish label "Offline — 1 pending"). Minor semantic note: indicator uses `bg-danger/10` border and `text-danger-text` but DESIGN-SYSTEM.md §8 ConnectionStateIndicator lists "Offline" state as danger. This is correct. The "Reconnecting" (amber) state is not shown but is not required to be in one render.
- Modal/Dialog: reused per §8 spec. PASS.
- Avatar + presence dot: reused for all rows and header. PASS.
- Badge/Pill (unread count): used for the server-rail mention badge (line 169) and as an emerald dot for unread (line 244). PASS.
- Empty/Loading states: empty-list present. Loading skeleton MISSING (see §9 criterion 2).
- ChannelSidebar item (conversation list rows): structurally reused. PASS.

The one genuine re-invention is the stagger-list animation class (line 106–109). DESIGN-SYSTEM.md §6 does not mention staggered list paint animations — this is outside spec. For a calm academic aesthetic ("No bouncy/playful easing") a staggered reveal is borderline; it is acceptable only if the durations remain sub-100ms per item and it respects `prefers-reduced-motion` (see §9 criterion 10 / accessibility gap below).

### 6. Offline wedge visible (§9 criterion 6: "composer enabled offline, pending amber, failed danger Retry, ConnectionStateIndicator present")
**Result: PARTIAL (BLOCKING)**

- Composer is not disabled offline — correct.
- Pending amber "Sending…" message at lines 386–402 is visible in the default render. Clock icon (`ph-clock`) + amber text. PASS for pending state.
- Failed state / "Retry": ABSENT. No failed message row with danger styling and Retry affordance. DESIGN-SYSTEM.md §8 MessageRow explicitly specifies "failed: danger + 'Retry'." Brief §6 specifies "failed → danger + 'Retry'." This is a missing state.
- ConnectionStateIndicator: DOM present but `hidden` class means it is not visible on default load. The brief states "offline wedge visible" — this requires the wedge to be rendered visible in at least one static view. Having it togglable-only means reviewers and engineers see no visual reference for the "Offline — 1 pending" pill in the canonical render. **Fix:** remove `hidden` from `#connection-wedge` as the default state (or provide a separate section/panel showing the offline render), since the thread is already demonstrating the pending message state. The two belong together.

### 7. Non-color-only restriction reason (§9 criterion 7)
**Result: PASS**

Alex Mercer row includes:
- Lock icon overlay on avatar (`ph-fill ph-lock`)
- `aria-disabled="true"` on the option
- Explicit text reason: "Only accepts messages from server members"
- `ph-shield-warning` icon preceding the text
- No checkbox rendered (correct — no false affordance)
- The row is grayscaled and 50% opacity for additional visual signal beyond color

This is one of the strongest parts of the mockup.

### 8. All icon references are real Phosphor names (§9 criterion 8)
**Result: PASS with one flag**

Icons used and verified against Phosphor catalog:
- `ph-chat-teardrop` — valid
- `ph-plus` — valid
- `ph-magnifying-glass` — valid
- `ph-chat-circle-text` — valid
- `ph-list` — valid
- `ph-clock` — valid
- `ph-plus-circle` — valid
- `ph-smiley` — valid
- `ph-paper-plane-right` — valid
- `ph-x` — valid
- `ph-check` (ph-bold variant) — valid
- `ph-lock` (ph-fill variant) — valid
- `ph-shield-warning` — valid
- `ph-arrow-right` (ph-bold variant) — valid

**Nit I8.1**: Brief §4 specifies the send icon should be "chat/paper-plane". `ph-paper-plane-right` is valid and a reasonable choice. However the brief also lists "pencil-simple or plus (Start-DM / new message)" — the rail header uses `ph-plus` (not `ph-pencil-simple`), which is within spec ("or plus").

**Nit I8.2**: `ph-smiley` is used for the emoji button. This is a valid Phosphor icon. The brief §4 does not list emoji as a required icon, but neither does it prohibit it. Acceptable as the composer toolbar extends minimally beyond spec.

One icon concern: `ph-chat-teardrop` (line 152) is used as the DM Home button icon in the server rail. Brief §2 describes "a 'Direct Messages' entry on the server rail" — `ph-chat-teardrop` is a valid Phosphor icon. However, DESIGN-SYSTEM.md §7 and brief §4 specify the send icon as "chat/paper-plane" and the Start-DM icon as "pencil-simple or plus." The rail home icon is unspecified in the brief — this is a judgment call and is fine.

### 9. Group DM rendered; 1:1 shown (§9 criterion 9)
**Result: PASS**

- Row 2 in the conversation list ("Capstone Project Alpha") uses the multi-avatar stack (two overlapping 22px circles, Elena + Sarah). Correctly represents a group DM in the list.
- Thread header is 1:1 (Dr. Aris Thorne, single avatar + presence dot). Correct.
- Modal footer shows "Start Group DM" (line 566) with two chips selected, correctly reflecting the multi-recipient state.
- **Gap G9.1**: The thread canvas only shows a 1:1 view. A group DM thread header (showing multiple participant names / a group name + "X members" subtitle instead of a role title) is not rendered. Brief §9 requires "Group DM (3–10 participants) rendered: multi-avatar header + participant names." The list row shows the group, but the open thread does not show what a group DM thread header looks like. This is a missing render, not a blocking fail on its own, but it is a gap against the criterion.

### 10. Accessibility minimums (§9 criterion 10)
**Result: PARTIAL (BLOCKING)**

Passes:
- `<nav>` for server rail. PASS.
- `<nav id="state-populated-list">` for conversation list. PASS.
- `aria-current="page"` on active conversation row (line 206). PASS.
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby="modal-title"` on modal (line 452). PASS.
- Esc closes modal via JS event listener (lines 626–630). PASS.
- `autofocus` on modal search input (line 485). PASS (partial focus-trap).
- `aria-label` on Start-DM button (line 189), Search button (line 331), Close modal (line 457), Add Attachment (line 427), Add Emoji (line 431). PASS.
- `role="listbox"` + `aria-multiselectable="true"` on picker (line 493). PASS.
- `role="option"` on picker rows (lines 501, 513, 527, 548). PASS.
- `aria-selected="true"` on selected Elena row (line 513). PASS.
- `aria-disabled="true"` on restricted row (line 527). PASS.
- Message rows use `<article>` semantic element. PASS (consistent with `role="article"` per DESIGN-SYSTEM.md §8 MessageRow spec).
- `<time>` element used for timestamps. PASS.
- `alt` attributes on avatar images: most have descriptive alt text. PASS.

Fails:
- **A10.1 (BLOCKING)**: The `MessageComposer` textarea (line 422) has no `<label>`, no `aria-label`, and no `aria-labelledby`. The placeholder `"Message @Dr. Aris Thorne"` is not a label. DESIGN-SYSTEM.md §8 MessageComposer states "A11y: labelled." Brief §9 criterion 10 says "composer labelled." Fix: add `aria-label="Message Dr. Aris Thorne"` to the textarea (or a visually hidden `<label>`).
- **A10.2 (BLOCKING)**: `ConnectionStateIndicator` pill (`#connection-wedge`) has no `role="status"` and no `aria-live` attribute. DESIGN-SYSTEM.md §8 ConnectionStateIndicator specifies `role="status"` aria-live=polite. Without this, screen readers do not announce connection state changes. Fix: add `role="status" aria-live="polite"` to the `#connection-wedge` div.
- **A10.3**: Chip remove buttons (lines 470–471 and 477–478) have `focus:outline-none` and no accessible name — the `<i class="ph ph-x">` provides no text for AT. Fix: add `aria-label="Remove Dr. Aris Thorne"` / `aria-label="Remove Elena Rossi"` to each remove button. The `focus:outline-none` also kills the focus ring; this should be `focus-visible:ring-2 focus-visible:ring-accent-emerald/50`.
- **A10.4**: The stagger-list animation (lines 106–109) does not respect `prefers-reduced-motion`. DESIGN-SYSTEM.md §6 requires: "Respect `prefers-reduced-motion` — disable non-essential transitions." The CSS `.stagger-list > *` applies `animation: fadeIn` unconditionally. Fix: wrap in `@media (prefers-reduced-motion: no-preference) { .stagger-list > * { ... } }`.
- **A10.5**: The rail's inner `<nav>` list (conversation rows) uses `<a href="#">` anchors which is correct, but there is no `aria-label` on the outer `<nav>` (line 203) to distinguish it from the server-rail `<nav>` (line 145). Two unlabeled `<nav>` landmarks are ambiguous for screen reader landmark navigation. Fix: `aria-label="Conversations"` on the conversation list nav and `aria-label="Servers"` on the server rail nav.
- **A10.6**: No focus-trap implementation beyond `autofocus` on the search input inside the modal. A real focus-trap cycles focus within the modal boundary and prevents Tab from escaping to background content. The static mockup cannot fully implement this in JS, but the JS block (lines 573–631) should at minimum comment the implementation requirement or add a rudimentary tab-cycle guard. This is a guidance gap for engineers.

---

## UX Flow Evaluation

**Start-DM → pick recipient(s) → conversation → send:** PASS overall.

The "+" button in the rail header is the primary entry point for Start-DM. It is visible, has an aria-label, and opens the modal. The modal's chip pattern for recipients is clear. The "Start Group DM" CTA in the footer is explicit. The flow from modal close to open thread is not animated in a static mockup but is logically coherent. The send button in the composer is correctly shown as disabled (opacity-50, cursor-not-allowed) when the textarea is empty — this is correct zero-state behavior.

**Who-can-DM restriction comprehensibility to a student:** PASS. The Alex Mercer row is the best-executed piece in the mockup. The plain-language reason ("Only accepts messages from server members") is unambiguous and student-appropriate. The lock icon reinforces it visually. No student would be confused about why they cannot DM this person.

**One UX gap**: The "Direct Messages" title in the rail header (line 188) uses `text-base` (16px) rather than `text-xl` (20px) as specified in DESIGN-SYSTEM.md §2 ("text-xl — server/page titles") and brief §4 ("text-xl (screen/'Direct Messages' title)"). This makes the rail header look undersized and less authoritative compared to the brief's intent. The thread header similarly uses `text-base` for the participant name — brief §4 does not explicitly dictate the thread header size, but consistency with the channel-view would suggest `text-base` there is fine. The rail title at `text-base` is the divergence.

---

## Consolidated Defect List

| ID | Severity | Category | Description | Fix |
|----|----------|----------|-------------|-----|
| D-01 | BLOCKING | Missing state | Loading skeleton state absent from file — no skeleton conversation rows or skeleton message rows | Add a `#state-loading-list` section (togglable via debug button) with shimmer surface-700 skeleton rows, and a thread skeleton render matching the thread canvas layout |
| D-02 | BLOCKING | Missing state | Empty-thread state absent — no render for a newly opened conversation with no messages | Add a `#state-empty-thread` section in the thread canvas: centered icon + "No messages yet" + "Send the first message" prompt |
| D-03 | BLOCKING | Missing state | Error state absent — no "load failed + retry" render for either the list rail or thread canvas | Add an error variant to both the list and thread using the DESIGN-SYSTEM.md §8 pattern: danger icon + cause text + retry button |
| D-04 | BLOCKING | Missing state | Failed message "Retry" state absent — brief §6 and DESIGN-SYSTEM.md §8 both require "failed: danger + Retry" | Add a second pending-message row variant with `text-danger-text`, `ph-warning-circle` icon, and a "Retry" link/button |
| D-05 | BLOCKING | Offline wedge | `#connection-wedge` initializes with `hidden` class; pending message is visible but the indicator is not | Remove `hidden` from `#connection-wedge` for the default render (the offline state is already demonstrated by the pending message row — show both together) |
| D-06 | BLOCKING | Accessibility | Composer textarea has no `<label>` or `aria-label` | Add `aria-label="Message Dr. Aris Thorne"` to the textarea at line 422 |
| D-07 | BLOCKING | Accessibility | `#connection-wedge` missing `role="status"` and `aria-live="polite"` | Add both attributes to the wedge div per DESIGN-SYSTEM.md §8 ConnectionStateIndicator spec |
| D-08 | Medium | Accessibility | Chip remove buttons have no accessible name and `focus:outline-none` kills focus ring | Add `aria-label="Remove [name]"` to each chip remove button; replace `focus:outline-none` with `focus-visible:ring-2 focus-visible:ring-accent-emerald/50` |
| D-09 | Medium | Accessibility | Two unlabeled `<nav>` landmarks are ambiguous for AT | Add `aria-label="Servers"` to server rail nav (line 145); `aria-label="Conversations"` to conversation list nav (line 203) |
| D-10 | Medium | Accessibility | `prefers-reduced-motion` not respected for stagger-list animation | Wrap `.stagger-list > *` animation rule in `@media (prefers-reduced-motion: no-preference)` |
| D-11 | Medium | Missing render | Group DM thread header not shown — brief §9 requires "multi-avatar header + participant names" for a group thread | Add a second thread-header state (or a commented variant) showing the group DM header: multi-avatar stack + group name + "3 members" subtitle |
| D-12 | Medium | Token | `hover:bg-emerald-400` is a raw Tailwind color, not a token (3 buttons: lines 290, 435, 565) | Replace with `hover:bg-accent-emerald/90` or define a hover variant token |
| D-13 | Minor | Token | `body { background-color: #0a0a0b }` is a raw hex; should use the Tailwind token | Replace with `<body class="bg-surface-950 ...">` and remove the CSS rule at line 99 |
| D-14 | Minor | Token | `text-[11px]` and `text-[10px]` values fall below the 12px floor in DESIGN-SYSTEM.md §2 | Collapse to `text-xs` (12px) for metadata, or if sub-12 is genuinely needed for the timestamp/badge density, define a named scale entry |
| D-15 | Minor | Typography | Rail title "Direct Messages" uses `text-base` (line 188) vs brief §4 spec of `text-xl` | Change to `text-xl font-semibold` per brief §4 |
| D-16 | Minor | UX | Picker searching state not mocked — brief §6 says "search filters users"; static mockup should show at least one filtered-results frame | Add a commented-out or JS-togglable second picker body showing a filtered list (e.g., "Searching for 'el'…" with 1 result) |
| D-17 | Minor | Interaction | Hamburger drawer button (line 305) has no `onclick` handler — cannot test drawer toggle | Add `onclick="toggleDrawer()"` and a corresponding JS function mirroring the `toggleModal` pattern |
| D-18 | Minor | Spacing | `pb-[120px]` ghost spacer (line 405) is outside the 4px spacing scale | Replace with a design-system comment explaining the composer-dock offset calculation; or use CSS `padding-bottom: calc(var(--composer-height, 96px) + 24px)` |

---

## Summary Metrics

- Blocking defects (required for re-review): 7 (D-01 through D-07)
- Medium defects (should resolve alongside blocking fixes): 5 (D-08 through D-12)
- Minor/nit defects: 6 (D-13 through D-18)
- §9 criteria fully passing: 5/10
- §9 criteria partial: 3/10
- §9 criteria failing: 2/10

The underlying design quality is high. The token discipline, visual hierarchy, and restricted-picker UX are all exemplary. The blocking gaps are all omissions (absent state renders and missing ARIA attributes) rather than fundamental direction failures — they can be resolved in a single revision pass without redrawing the layout.
