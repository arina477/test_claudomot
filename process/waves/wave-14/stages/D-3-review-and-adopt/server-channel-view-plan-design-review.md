# D-3 Plan-Design Review — server-channel-view.html (wave-14, iteration 2)
Reviewer: ui-designer (reviewer A / plan-design-review sub)
Iteration: 2 (re-review after iteration-1 APPROVE — verifying final polish)
Surfaces under review: (1) Right-sidebar Member-list Panel · (2) Typing Indicator above composer
Reference files: `design/staging/server-channel-view.html`, `design/DESIGN-SYSTEM.md`,
`process/waves/wave-14/stages/D-1-brief/member-list-panel-brief.md`,
`process/waves/wave-14/stages/D-1-brief/typing-indicator-brief.md`

---

## ITERATION-2 FIX VERIFICATION

Four items were targeted in this polish pass. Each is verified against the current HTML source before re-scoring.

| Item | Claim | HTML evidence | Status |
|---|---|---|---|
| P-1 | Avatar-initials `aria-label` on member rows (initials-based avatars in the sidebar) | L413: `aria-label="Elias"` on the Elias initials `div` in the Online group; L453: `aria-label="Michael K."` on the MK initials `div` in the Offline group | CONFIRMED |
| P-2 | Offline member names use `text-white/40` (`--text-muted`) instead of prior `text-zinc-500` | L436 (David C.), L448 (Sarah J.), L460 (Michael K.): all carry `text-white/40` | CONFIRMED — but see CONTRAST FAILURE below |
| P-3 | "MEMBERS" panel header `<h2>` added to the right sidebar | L395: `<h2 class="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Members</h2>` inside the scroll area | CONFIRMED |
| P-4 | Typing indicator gap raised to `bottom-2` (from prior `bottom-1` advisory A-carry-2) | L360: `class="absolute bottom-2 left-1 flex items-center gap-1.5 ...` | CONFIRMED |

All four polish items are present in the HTML. However, P-2 introduces a WCAG contrast failure that requires a required-fix before this iteration can ship. See below.

---

## CRITICAL CONTRAST FAILURE — P-2 (offline names, text-white/40)

### Finding

The change from `text-zinc-500` to `text-white/40` was intended to align the offline name color with the design-system token `--text-muted` (defined as `rgba(255,255,255,0.40)` in DESIGN-SYSTEM.md §1). However, the composited effective color of `rgba(255,255,255,0.40)` rendered on `bg-study-900` (`#121214`) fails WCAG AA for normal text.

### Contrast measurement

Background: `#121214` (study-900), luminance ≈ 0.0061.

`rgba(255,255,255,0.40)` composited over `#121214`:
- Channel composite: `0.40 × 255 + 0.60 × 18 ≈ 112.8 R/G`, `0.40 × 255 + 0.60 × 20 ≈ 114 B`
- Composited luminance ≈ 0.1648
- Contrast ratio: **3.83:1** — below WCAG AA 4.5:1 for normal text (14px `font-medium`).

For comparison, iteration-1's `text-zinc-500` (`#71717a`) produced 3.87:1 — also below AA. The prior iteration-1 review cited 4.52:1 for zinc-500, which was an arithmetic error; the actual value is 3.87:1. This means the AA pass claimed in iteration-1 was already inaccurate. The iteration-2 change to `text-white/40` has not improved the situation (3.83:1 vs 3.87:1 — essentially the same, and both below threshold).

The brief (member-list-panel-brief.md §9) explicitly requires: "Offline rows visibly de-emphasized (muted name) but ≥4.5:1 contrast on `--surface-900`."

### Token note

`--text-muted` at `rgba(255,255,255,0.40)` on `--surface-900` is inherently non-AA-compliant for normal text at this pairing. The design system token is suitable for placeholders and pure decorative text but not for informational offline member names that users must read. The brief's dual requirements (de-emphasis + ≥4.5:1) are in tension with the literal token value — the correct resolution is to use a slightly higher-opacity white or a fixed Tailwind gray that passes.

Minimum compliant options on study-900:
- `text-white/50` → contrast ≈ 5.32:1 (PASS — just above threshold)
- `text-zinc-400` (`#a1a1aa`) → 7.30:1 (PASS, less muted)
- `text-white/55` → contrast ≈ 6.20:1 (comfortable pass with visible de-emphasis)

`text-white/50` is the tightest de-emphasis that clears AA; it preserves the muted character while being compliant.

### Impact scope

Three offline rows in the main sidebar (L436, L448, L460). No impact on message list, composer, typing indicator, or state gallery.

---

## STRUCTURAL REGRESSION CHECK

All components from prior approved iterations verified present and unmodified.

| Component | Check | Status |
|---|---|---|
| Message list `role="log"` | L183 — `role="log" aria-live="polite" aria-label="Messages in #questions"` | PRESENT |
| Message articles (`role="article"`) | L196, L226, L239, L258, L280, L296, L305, L328, L339 — 9 article elements | PRESENT |
| Reaction pills (`reacted-by-me`, `aria-pressed`) | L207–L219 — thumbs-up reacted-by-me pill + thinking pill + add-reaction button | PRESENT |
| Row action bar (hover) | L221–L223, L251–L255, L322–L325 — `.row-actions` on three rows | PRESENT |
| Tombstone (deleted message) | L296–L303 — `aria-label="Deleted message"`, `ph-prohibit` icon + italic text | PRESENT |
| Edit inline state | L258–L278 — `Editing` badge, textarea with `<label>`, Save/Cancel | PRESENT |
| Delete confirm state | L280–L294 — `border-danger/30 bg-danger/5`, Delete/Cancel buttons | PRESENT |
| Pending send state | L328–L337 — `aria-busy="true"`, `pending-dim`, amber "Sending…" | PRESENT |
| Failed send state | L339–L351 — `role="alert"`, red "Failed to send", Retry button | PRESENT |
| Composer form | L370–L382 — `id="composerForm"`, labelled textarea, send button | PRESENT |
| Member groups (Online/Offline) | L398–L421 (Online), L425–L463 (Offline) — counts + `<ul aria-labelledby>` | PRESENT |
| State gallery | L471–L536 — empty channel, composer empty, typing 2-3 and many, member loading, member empty | PRESENT |
| Responsive media queries | L87–L100 — compact (≤1024) + narrow (≤768) drawer rules | PRESENT |
| `prefers-reduced-motion` | L60–L64 — all three animations suppressed | PRESENT |

No structural regression detected.

---

## SURFACE 1 — MEMBER-LIST PANEL (right sidebar, Pane 4)

### Visual Hierarchy · 9/10

Unchanged from iteration-1 score. The new `<h2>Members</h2>` panel header (P-3) provides an additional visual anchor at the top of the aside before the Online/Offline group headings. It uses the same `text-[11px] font-bold uppercase tracking-widest text-zinc-500` spec as the group headers, which is typographically consistent. The semantic hierarchy is now: `<h2>Members</h2>` > `<h3>Online — 2</h3>` + `<h3>Offline — 3</h3>`, which is correct and meaningful.

The visual de-emphasis of offline names remains perceptually effective (the opacity-based white creates a distinct tier below the `text-zinc-200` online names) even though the contrast value fails AA. The visual design intent is correct — only the specific token value must be adjusted.

Score would reach 10/10 with the contrast fix applied. Held at 9/10 pending that fix.

### Spacing Rhythm · 8/10

Unchanged. Score reflects the absence of a title-area divider between the `<h2>Members</h2>` and the first group header (`<h3>Online — 2</h3>`). The `space-y-6` gap on the scroll container provides 24px between them visually. The brief leaves any header treatment out of scope, so this is an observation, not a required fix.

### Brand Coherence · 9/10

Token discipline is otherwise clean. The `text-white/40` value is the correct semantic mapping of `--text-muted` from DESIGN-SYSTEM.md §1; the failure is at the interaction between the token value and the AA requirement for informational text — a gap in the design-system specification that the implementation has faithfully reproduced. No invented hex. The fix (raising alpha to `text-white/50`) stays within the token family. Score reflects the contrast issue reducing fidelity on the specific AA-for-normal-text axis; all other token disciplines correct.

### Edge-case Handling · 10/10

Unchanged from iteration-1. All four required states (skeleton, empty, populated, offline dimming) remain rendered in the state gallery. P-3's `<h2>Members</h2>` is also present in the live main pane. The skeleton and empty states in the gallery do not include the `<h2>` (they are isolated component variants, which is correct and expected for a component gallery). No regression.

### Accessibility · 8/10

P-1 is confirmed: both initials-based avatar `div` elements in the member sidebar (`aria-label="Elias"` at L413, `aria-label="Michael K."` at L460) now carry explicit `aria-label`. Screen readers using `div` elements with role-as-text will surface the label. However, a `div` with no interactive role and `aria-label` is acceptable as a purely presentational element providing a text equivalent for the visual initials — the assistive technology surface is the `<li>` row, which will be announced with its display name from the adjacent `<span>`. The `aria-label` on the avatar `div` provides a redundant but harmless accessible name; the meaningful accessible name for the row comes from the visible `<span>` text content. This is a minor concern, not a required fix.

The contrast failure at P-2 (`text-white/40` = 3.83:1 < 4.5:1 for normal text) is a WCAG 1.4.3 AA failure for the three offline member names. This lowers the accessibility score from the iteration-1 10/10. The fix is straightforward.

All other accessibility attributes from iteration-1 remain in place: `<ul aria-labelledby>`, `<li>` items, `tabindex="0"` + `focus-visible:ring`, sr-only Online/Offline labels, `<aside aria-label="Members">`.

Score: 8/10. Deducted 2 points for the WCAG 1.4.3 failure on offline member names (normal text below 4.5:1).

### Responsive · 10/10

Unchanged. No regression. P-3's `<h2>` is inside the flex-scroll container which collapses with the aside at ≤1024px.

---

## SURFACE 2 — TYPING INDICATOR

### Visual Hierarchy · 10/10

A-carry-2 from iteration-1 (typing indicator `bottom-1` too close to composer) is resolved in this pass. The indicator now sits at `bottom-2` (8px above the composer's top edge). At the standard single-row composer height (~48px min-height), this 8px gap provides a cleaner visual separation. Score raised from 9/10 to 10/10.

### Spacing Rhythm · 10/10

`bottom-2` resolves the proximity note. The full typing-gap chain is now: composer outer container `pt-2` (8px above composer border) → typing indicator positioned `bottom-2` (8px above its own `h-0` wrapper which sits at the top of the composer container) — the rhythm is consistent with §3's 8px base unit. Score raised from 9/10 to 10/10.

### Brand Coherence · 10/10

Unchanged. All tokens correct. No regression.

### Edge-case Handling · 10/10

Unchanged. All four typing states (1 typer in main canvas, 2-3 typers in gallery, many/several in gallery, hidden zero-height) remain in place. No regression.

### Accessibility · 10/10

Unchanged. `role="status" aria-live="polite"` on the outer container (L359), `pointer-events-none`, no interactive children. No regression.

### Responsive · 9/10

Unchanged. `bottom-2` does not affect truncation behavior. Single-line guarantee via `truncate` class remains structurally intact. Score unchanged (the minor drift in typing-text token name vs. semantic rgba is a carry-forward, not newly introduced in this iteration).

---

## CRITICAL TOKEN DISCIPLINE AUDIT (iteration-2)

### Offline name contrast
| Metric | Requirement | Iter-1 (`text-zinc-500`) | Iter-2 (`text-white/40`) | Status |
|---|---|---|---|---|
| Contrast on `--surface-900` | ≥4.5:1 (brief §9; WCAG 1.4.3 AA normal) | 3.87:1 | 3.83:1 | FAIL — both iterations below threshold |

Note: the iteration-1 review (this reviewer's prior output) claimed 4.52:1 for zinc-500; that calculation was incorrect. The true value is 3.87:1. The iteration-2 value of 3.83:1 is marginally worse.

### All other token checks (unchanged, passing)
| Token | Required | Implemented | Pass? |
|---|---|---|---|
| `--presence-online` | `#10b981` | `bg-emerald-500` | PASS |
| `--presence-offline` | `#52525b` | `bg-study-500` | PASS |
| Typing text | `--text-secondary` range | `text-zinc-400` | PASS |
| Typing dots | `--text-muted` range | `bg-zinc-500` | PASS |
| Invented hex in main HTML | None allowed | None found outside config block | PASS |

---

## DIMENSION SCORES SUMMARY

| Dimension | Iter-1 | Iter-2 | Surface | Change driver |
|---|---|---|---|---|
| Visual hierarchy | 9/10 | 9/10 | Member-list | Unchanged; pending contrast fix |
| Spacing rhythm | 8/10 | 8/10 | Member-list | Unchanged |
| Brand coherence | 10/10 | 9/10 | Member-list | text-white/40 contrast failure |
| Edge-case handling | 10/10 | 10/10 | Member-list | No change |
| Accessibility | 10/10 | 8/10 | Member-list | WCAG 1.4.3 failure on 3 offline names |
| Responsive | 10/10 | 10/10 | Member-list | No change |
| Visual hierarchy | 9/10 | 10/10 | Typing indicator | bottom-2 resolves proximity |
| Spacing rhythm | 9/10 | 10/10 | Typing indicator | bottom-2 aligns to 8px rhythm |
| Brand coherence | 10/10 | 10/10 | Typing indicator | No change |
| Edge-case handling | 10/10 | 10/10 | Typing indicator | No change |
| Accessibility | 10/10 | 10/10 | Typing indicator | No change |
| Responsive | 9/10 | 9/10 | Typing indicator | No change |

**Iteration-1 aggregate: 114/120 = 95%**
**Iteration-2 aggregate: 113/120 = 94%** — net -1 due to contrast regression on member offline names offsetting +2 from typing indicator improvements.

---

## REQUIRED-FIX REGISTER

**RF-1 (blocking, accessibility + brand): Offline member name contrast below WCAG AA.**

All three offline member name `<span>` elements (L436 David C., L448 Sarah J., L460 Michael K.) use `text-white/40` which composites to 3.83:1 on `bg-study-900` — below the 4.5:1 WCAG AA requirement for normal text and below the brief §9 explicit contrast requirement.

Fix: replace `text-white/40` with `text-white/50` on all three spans. `text-white/50` composites to 5.32:1 on `--surface-900` — above AA threshold while retaining visible de-emphasis relative to online names at `text-zinc-200` (13.1:1). The `group-hover:text-zinc-300` hover state is unaffected.

Scope: 3 lines (L436, L448, L460). Zero risk to any other component.

---

## OPEN ADVISORIES (non-blocking, carry-forward)

**A-carry-1 (visual, low):** The new `<h2>Members</h2>` sits inside the flex-scroll container at the same visual weight as the group headers. If a future wave adds a pinned header treatment (fixed title bar above the scroll area, matching Pane 2's server name header), the h2 should migrate out of the scroll container. Currently fine and within scope.

**A-carry-2 (token fidelity, low — from iter-1):** Typing text `text-zinc-400` and typing dots `bg-zinc-500` are Tailwind-name approximations of the design-system's rgba semantic tokens `--text-secondary` / `--text-muted`. Both values are within the acceptable range and produce no visual or contrast failure. Align in a future token-cleanup pass when the design system is formalized as CSS custom properties.

---

REVISE

---

*Iteration-2 fixes confirmed: avatar-initials aria-label on member rows (P-1 PASS), MEMBERS panel header added (P-3 PASS), typing indicator bottom gap raised to bottom-2 (P-4 PASS). One required fix: offline member name color `text-white/40` produces 3.83:1 on --surface-900 — below WCAG AA 4.5:1 and below the brief's explicit contrast requirement. Replace with `text-white/50` (5.32:1 composite) on L436, L448, L460. This is a 3-line targeted change; all other components verified structurally intact with no regression.*
