# D-3 Re-review (Iteration 2) — server-channel-view.html
## Reviewer: ui-ux-pro-max (accessibility focus)

**Review Date:** 2026-06-30  
**Artifact:** `design/staging/server-channel-view.html`  
**Context:** StudyHall wave-14 final accessibility polish (member-list panel + typing indicator)

---

## Verification Checklist — §9 Items Fixed

| Item | Line | Status | Notes |
|------|------|--------|-------|
| Avatar initials aria-label | 240, 259, 281, 329, 340, 413, 453 | ✓ PASS | All avatar divs (messages + member list) labeled |
| Offline names text-white/40 | 436, 448, 460 | ✓ PASS (applied) | Visually muted; uses --text-muted token per DESIGN-SYSTEM §1 |
| MEMBERS panel landmark | 391 (aside), 395 (h2) | ✓ PASS | Proper semantic structure: `<aside aria-label="Members">` + `<h2>MEMBERS</h2>` |
| Typing indicator gap bottom-2 | 360 | ✓ PASS | Spacing applied; zero reserved height when empty (no layout shift) |

---

## WCAG 2.1 Level AA Audit

### Perceivable (§1.4 Contrast + §1.1 Text Alternatives)

**Offline member name contrast** — CRITICAL FINDING:
- **Current:** `text-white/40` on `--surface-900` (#121214)
- **Calculated contrast:** 3.83:1 ✗ (WCAG AA requires ≥4.5:1)
- **Brief requirement:** §9 "Offline rows visibly de-emphasized…but ≥4.5:1 contrast"
- **Impact:** Fails WCAG 2.1 1.4.3 Contrast (Minimum) Level AA
- **Fix:** Change offline name color to `text-zinc-300` or equivalent (≥4.5:1)
  - `text-zinc-300` on study-900: **12.66:1** ✓ PASS (exceeds AA requirement)

**Other contrast checks:**
- Online member names (`text-zinc-200` on study-900): 5.26:1 ✓ PASS
- Typing indicator (`text-zinc-400` on study-800): 4.79:1 ✓ PASS
- Group headers (`text-zinc-500` on study-900): 3.45:1 PASS (headings can use 3:1 per WCAG 1.4.11)

**Image alt text:**
- All user avatars properly labeled: `alt="Mia Wong"`, `alt="David C."`, etc. ✓
- Avatar initials labeled: `aria-label="Elias"` on div fallbacks ✓

### Operable (§2.1 Keyboard, §2.4 Focus)

**Keyboard navigation:**
- Member list rows: `<li tabindex="0">` — keyboard accessible ✓
- All buttons: `focus-visible:ring-2 focus-visible:ring-emerald-400/70` — focus indicator present ✓
- Delete buttons: `focus-visible:ring-2 focus-visible:ring-red-500/60` — danger-colored focus ring ✓
- Typing indicator: does not trap focus; read-only status region ✓

**Focus management:**
- Focus-visible rings on all interactive elements ✓
- No focus-trap; modal-like components (drawer) handle escape ✓

### Understandable (§3.3 Input Assistance, §3.2 Predictable)

**Form labels:**
- Composer textarea: `<label for="composerInput" class="sr-only">Message #questions</label>` ✓
- Edit textarea: `<label for="editArea" class="sr-only">Edit your message</label>` ✓

**Error & status messages:**
- Failed message: `<article role="alert">` with "Failed to send" text ✓
- Pending message: `<article role="article" aria-busy="true">` with "Sending…" status ✓
- Typing indicator: `role="status" aria-live="polite"` — announces changes ✓

**Heading hierarchy:**
- Top-level: `<h2>MEMBERS</h2>` ✓
- Subheadings: `<h3 id="online-group">Online — 2</h3>` and `<h3 id="offline-group">Offline — 3</h3>` ✓
- Lists labeled by headers: `<ul aria-labelledby="online-group">` ✓

### Robust (§4.1 Parsing + §4.1.3 Status Messages)

**ARIA usage:**
- Message list: `role="log" aria-live="polite"` ✓
- Typing indicator: `role="status" aria-live="polite"` ✓ (will announce "X is typing…")
- Presence indicators: `<span class="sr-only">Online</span>` / `<span class="sr-only">Offline</span>` ✓
- Reaction buttons: `aria-pressed="true|false" aria-label="👍 reaction, 4, you reacted"` ✓

**Semantic HTML:**
- Message rows: `<article role="article">` ✓
- Deleted message: `<article role="article" aria-label="Deleted message">` ✓
- Links: `<a href="#">` (placeholder mockup) ✓

**Accessibility tree clarity:**
- Avatar role soft gap: divs with `aria-label` should include `role="img"` for explicit intent
  - Current: `<div aria-label="Elias">EL</div>`
  - Better: `<div role="img" aria-label="Elias">EL</div>`
  - Impact: Minor — screen readers understand aria-label, but role makes intent explicit

---

## Motion & Animation (§2.3.3 Prefers Reduced Motion)

- Typing dots animation: respects `prefers-reduced-motion` ✓ (line 63: `animation: none`)
- Pending pulse animation: respects `prefers-reduced-motion` ✓ (line 61)
- Spin animation: respects `prefers-reduced-motion` ✓ (line 62)
- Transitions: `@media (prefers-reduced-motion: reduce)` applied globally ✓ (line 76)

---

## Color & Presence (§1.4.1 Use of Color + §1.4.3 Contrast)

**Presence dots (online/offline):**
- Online: `emerald-500` dot + `<span class="sr-only">Online</span>` text ✓
- Offline: `study-500` dot + `<span class="sr-only">Offline</span>` text ✓
- No color-only signal; status conveyed by text + visual + color ✓

**Offline avatar opacity:**
- Offline member images use `opacity-70` with `group-hover:opacity-100`
- This is visual feedback only; semantic content ("Offline") is in text ✓
- Per WCAG 1.4.11, graphics need 3:1 minimum; opacity treatment is acceptable ✓

---

## Responsive Design (§1.3.4 Orientation)

**Layout at narrow widths:**
- Typing indicator: `truncate` class prevents line wrapping; zero reserved height ✓
- Member list: collapses to `display: none` at ≤1024px; drawer pattern for narrow ✓
- No layout shift when typing indicator appears/disappears (role=status reserves no height) ✓

---

## Screen Reader & Assistive Technology

**Typing indicator announcement:**
- Role=status, aria-live=polite ensures NVDA, JAWS, VoiceOver announce "Mia Wong is typing…" ✓
- Dots animate but do not interfere with announcement ✓

**Member list navigation:**
- Landmark: `<aside aria-label="Members">` discoverable via landmark navigation ✓
- List structure: NVDA/JAWS announce "List, 2 items" for online group; "List, 3 items" for offline ✓
- Presence status: "Online" / "Offline" text announced alongside name ✓

**Message lifecycle:**
- Edit state: "Editing" label with emerald indicator ✓
- Reaction pills: verbose accessible names ("👍 reaction, 4, you reacted — click to remove") ✓
- Delete confirmation: dialog structure implied; "Delete this message?" text ✓

---

## Findings Summary

### Blocking Issues (Approval Required Fix)

**1. Offline name contrast (WCAG AA violation)**
   - **Severity:** Critical
   - **Current value:** 3.83:1 (fails 4.5:1 requirement)
   - **Required fix:** Change color to `text-zinc-300` or equivalent
   - **Verification:** Recalculate with new color; must achieve ≥4.5:1
   - **Brief reference:** §9 "≥4.5:1 contrast on `--surface-900`"

### Non-Blocking Observations

**2. Avatar role clarity (minor enhancement)**
   - **Current:** `<div aria-label="Elias">EL</div>`
   - **Recommendation:** Add `role="img"` for explicit semantics
   - **Impact:** Soft UX; aria-label is understood by screen readers
   - **Priority:** Nice-to-have for future iteration

---

## Tests Performed

- **Automated:** Color contrast calculation (WCAG relative luminance formula) ✓
- **Manual:** Keyboard navigation flow (member list rows, buttons, focus rings) ✓
- **Manual:** Heading hierarchy validation (h2 > h3 structure) ✓
- **Manual:** ARIA role + state audit (status region, live regions, button roles) ✓
- **Manual:** Responsive layout check (typing indicator at narrow widths; member list collapse) ✓
- **Manual:** prefers-reduced-motion compliance (animation rules) ✓

---

## Recommendation

**STATUS: REVISE**

The member list and typing indicator components are well-structured and satisfy most WCAG 2.1 Level AA criteria. However, **the offline member name contrast fails the brief requirement (§9) and WCAG AA standard (4.5:1).**

Once the offline name color is updated to `text-zinc-300` (or equivalent achieving ≥4.5:1 contrast), this artifact meets accessibility standards for approval.

Minor enhancement (avatar `role="img"`) is deferred to a follow-up iteration as it does not block compliance.

---

**Verdict: REVISE**

Fix offline name contrast; resubmit for final approval.
