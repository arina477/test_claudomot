# D-3 Phase-1 Review — notifications-center (ui-ux-pro-max lens)

**Reviewer role:** D-3 Phase-1 Reviewer B — ui-ux-pro-max  
**Artifact:** `design/staging/notifications-center.html`  
**Brief:** `process/waves/wave-37/stages/D-1-brief/notifications-center-brief.md`  
**Design system:** `design/DESIGN-SYSTEM.md`  
**Date:** 2026-07-02

---

## Verdict

**REVISE**

Three fixable issues prevent APPROVE. No invented tokens, no fake icon names, no §10 non-goal violations. All 4 panel states are present. The token palette and icon set are clean. Issues are correctable without redesign.

---

## §9 Success Criteria — Checkbox Audit

### Criterion 1 — Uses ONLY §4 DESIGN-SYSTEM tokens (no new hex / invented tokens)

**PASS**

Full hex/color inventory cross-referenced against DESIGN-SYSTEM.md §1:

| Value in mockup | Maps to | Status |
|---|---|---|
| `#0a0a0b` | `--surface-950` | OK |
| `#121214` | `--surface-900` | OK |
| `#1c1c1f` | `--surface-800` | OK |
| `#27272a` | `--surface-700` | OK |
| `#3f3f46` | `--surface-600` | OK |
| `#52525b` | `--surface-500` | OK |
| `rgba(255,255,255,0.92)` | `--text-primary` | OK |
| `rgba(255,255,255,0.60)` | `--text-secondary` | OK |
| `rgba(255,255,255,0.40)` | `--text-muted` | OK |
| `#10b981` | `--accent-emerald` | OK |
| `#f59e0b` | `--accent-amber` | OK |
| `#ef4444` | `--danger` | OK |
| `#f87171` | `--danger-text` | OK |
| `rgba(255,255,255,0.06)` | `--border-hairline` | OK |
| `rgba(255,255,255,0.10)` | `--border-hover` | OK |
| `rgba(16,185,129,0.4)` | `--glow-focus` | OK |
| `rgba(239,68,68,0.4)` | `--glow-danger` | OK |
| `rgba(0,0,0,0.5)` | `--shadow-pop` | OK |
| `rgba(0,0,0,0.6)` | modal scrim per DESIGN-SYSTEM §8 Modal spec | OK |
| `rgba(16,185,129,0.5)` | unread-dot glow — derived from `--accent-emerald` RGB, non-standard opacity | NOTE (see below) |
| `text-[#0a0a0b]` on badge (line 211) | raw hex of `--surface-950`; value is correct | NOTE (see below) |

No gaming-neon, no invented accent. Amber is used only for assignment due-date metadata (DESIGN-SYSTEM §1: "Secondary accent — assignments / due-soon"). Palette is zinc + emerald + amber only, matching the brief's stated aesthetic DNA.

**Notes (non-blocking):** The unread-dot glow `shadow-[0_0_8px_rgba(16,185,129,0.5)]` (line 243, 263, 283) derives from `--accent-emerald` at a custom opacity; it is not an off-palette color but it does not map to a named shadow token (`--shadow-pop`, `--shadow-sm`, `--glow-focus`, `--glow-danger`, `--glow-subtle`). Fix in implementation: could use `--glow-focus` at reduced spread, or define a named token. The badge `text-[#0a0a0b]` should reference `text-surface-950` to stay on the token system rather than embedding a raw hex literal.

---

### Criterion 2 — Renders all 4 panel states + both bell states (0 / N unread)

**FAIL — 0-unread bell state and 9+ cap not statically illustrated**

Panel states — all four present:

| State | Where | Evidence |
|---|---|---|
| Loaded | Section 1 interactive prototype | 3 notification rows, unread + read mix |
| Empty | Section 2 "Empty State" card | `ph-bell-z` icon, "You're all caught up" headline, "View Server Directory" CTA |
| Error | Section 2 "Error State" card | `ph-warning-circle`, "Couldn't load updates", "Retry Connection" button |
| Loading | Section 2 "Loading (Suspense)" card | Skeleton rows with shimmer — no spinner (correct per §11) |

Bell states:

| State | Where | Evidence |
|---|---|---|
| N unread (badge) | Section 1 nav bar | Badge "3", `aria-label="Notifications, 3 unread"` |
| 0 unread (no badge) | Not statically shown | Badge removal occurs via JS `badge.style.display = 'none'` after mark-all-read — interactive only |
| 9+ cap | Not demonstrated | No row or label showing ≥10 unread being capped to "9+" |

**Required fix:** Add a "Bell States" static section (two small side-by-side illustrations or inline annotations) showing (a) 0-unread bell (icon only, badge absent) and (b) 10+ unread bell with badge text "9+". These are spec'd by brief §3 and needed for unambiguous developer handoff.

---

### Criterion 3 — Responsive per §5 (popover desktop, bottom-sheet mobile)

**PASS**

Desktop: panel declared `md:absolute md:top-full md:right-0 md:w-[380px] md:rounded-[var(--radius-lg)] md:shadow-pop` — popover anchored under bell, correct shadow, correct radius. JS removes `md:opacity-0 md:pointer-events-none` on open.

Mobile: panel declared `fixed bottom-0 left-0 right-0 top-[20vh] rounded-t-xl translate-y-full` — full-width bottom sheet with slide-up animation. Backdrop overlay `bg-black/60` present for tap-to-close. Resize event handler prevents stale transforms on viewport change.

---

### Criterion 4 — Matches prior-art visual language (§8) — dark, restrained, emerald accent

**PASS**

Zinc dark base (`surface-950` app frame, `surface-900` panel), Geist font, Phosphor icons at regular weight. Emerald used only for unread indicators, badge, focus ring, and done-state confirmation. Amber used only for assignment due-date metadata. No neon, no purple, no secondary palette deviations. Panel elevation uses `border + shadow-pop`, not a heavy drop-shadow or glow on the panel itself, consistent with DESIGN-SYSTEM §5's "Dark UI leans on borders + subtle glows, not heavy drop-shadows."

---

### Criterion 5 — Mention vs reminder rows visually distinguish type (icon) + show actor/source + relative time

**PASS**

| Type | Icon | Content pattern | Time |
|---|---|---|---|
| Mention | `ph-at` (line 247, 285) | Actor name bold + channel bold | "Just now" / "2 hours ago" |
| Assignment reminder | `ph-calendar-check` (line 266) | Assignment title bold + due in amber with `ph-clock` | "Tomorrow at 11:59 PM" in `text-accent-amber` |

The amber `ph-clock` + amber timestamp for assignment rows creates an immediate visual signal distinguishing urgency from social pings. Icons, content grammar, and color are all distinct between types.

---

### Criterion 6 — Unread vs read visually distinct (emerald dot); mark-all-read control present

**PASS**

Unread rows (lines 241–293): emerald left-dot absolute-positioned (`bg-accent-emerald`, line 243), subtle background tint `bg-white/[0.02]`, body text `text-text-secondary`.

Read row (line 298): no dot, `opacity-75`, body text `text-text-muted`. Hover lifts opacity to 100% (affordance preserved).

Mark-all-read: present in panel header (line 226), `ph-check` icon, correct text. JS interaction removes all unread dots, collapses badge, and shows `ph-check-circle` confirmation feedback for 2 s before resetting the control label.

---

### Criterion 7 — All icon names are real Phosphor components

**PASS**

All `ph-*` class names verified against Phosphor Icons web distribution:

| Class | Real? | Source |
|---|---|---|
| `ph-hash` | Yes | Channel glyph |
| `ph-magnifying-glass` | Yes | Search |
| `ph-push-pin` | Yes | Pinned |
| `ph-bell` | Yes | Brief §4 "Bell (header)" |
| `ph-at` | Yes | Brief §4 "At (mention type)" |
| `ph-calendar-check` | Yes | Brief §4 "CalendarCheck (reminder type)" |
| `ph-clock` | Yes | Brief §4 "Clock (reminder type)" |
| `ph-check` | Yes | Brief §4 "Check (mark-read)" |
| `ph-x` | Yes | Mobile close |
| `ph-bell-z` | Yes | Empty state (real Phosphor icon, not invented) |
| `ph-warning-circle` | Yes | Error state |
| `ph-arrows-clockwise` | Yes | Retry button |
| `ph-check-circle` | Yes | Mark-all-read confirmation (JS line 515) |
| `ph-spinner` | Yes | Button loading (JS line 495) |

`ph-bell-z` is not listed in brief §4 but is a real Phosphor icon used appropriately for the "quiet/sleeping" empty state. The brief's `BellRinging` icon (listed as suggested for mark-read context) is not used — the mockup substitutes `ph-check` for mark-read, which is also listed in brief §4 and is the cleaner choice for a text-label control. No invented icon names.

---

## DESIGN-SYSTEM Token Audit

**PASS overall — no invented hex, no off-palette color**

Scrollbar thumb uses `surface-600` (correct per DESIGN-SYSTEM §1 use column). Scrollbar hover uses `surface-500` (correct). Skeleton shimmer uses `surface-700` base with a white overlay gradient (matches DESIGN-SYSTEM §8 Empty/Loading pattern). `--radius-lg` is set to 10px (within the 8–10px spec). `--radius-md` is 6px (exact match). `--radius-full` (9999px) used for unread dot and badge (correct per spec for "pills, presence dots").

The `bg-surface-800` on panel header and row hover is correct — DESIGN-SYSTEM maps `--surface-800` to "Main canvas (message view)" but it is also the standard hover/elevated fill for interactive rows across all existing mockups.

---

## Phosphor Icon Audit

**PASS — 14 distinct classes, all real**

See Criterion 7 table above.

---

## UX Flow Audit

**PASS with one a11y gap**

| Flow step | Implemented | Evidence |
|---|---|---|
| Bell click → panel open | Yes | `bellBtn.addEventListener('click', () => togglePanel())` |
| `aria-expanded` on bell | Yes | `bellBtn.setAttribute('aria-expanded', isOpen)` |
| Panel `role="dialog"` + `aria-modal` | Yes | Lines 220 |
| Row click → optimistic mark-read | Yes | Lines 527–544 |
| Row click → navigate to source | Not simulated | Acceptable in static mockup; rows are `cursor-pointer`, intent is clear |
| Mark-all-read → zero badge | Yes | Lines 493–522 |
| Escape → close + focus restore | Yes | `bellBtn.focus()` on Escape close (line 488) |
| Backdrop tap → close (mobile) | Yes | `backdrop.addEventListener('click', ...)` |
| Outside click → close (desktop) | Yes | `document.addEventListener('click', ...)` guard |
| Focus trap inside panel | No | `role="dialog"` + `aria-modal="true"` declared but no JS focus-trap implemented; Tab can escape the panel |

**A11y gap (required fix):** Brief §6 specifies "Tab order bell→mark-all→rows" which implies the panel traps focus while open. `aria-modal="true"` communicates the intent to screen readers but does not mechanically trap keyboard focus. Implementation must add a focus-trap loop (on `keydown Tab`, cycle between first and last focusable element inside the panel, and on Escape release focus back to bell). This is a §6 a11y requirement, not an implementation detail.

---

## States Completeness

| State | Present | Notes |
|---|---|---|
| Panel: loading skeleton | Yes | 3 skeleton rows with shimmer, no spinner |
| Panel: loaded | Yes | 3 unread + 1 read row |
| Panel: empty | Yes | Icon + headline + CTA |
| Panel: error | Yes | Error icon + cause + retry |
| Bell: N unread | Yes | Badge "3", static |
| Bell: 0 unread | Partial | Achieved interactively; no static illustration |
| Bell: 9+ cap | No | Not demonstrated |

Skeleton implementation is correct — surface-700 shimmer via CSS pseudo-element, no spinner element used for the content-list loading state.

---

## Non-Goals §10 Respected

**PASS — all five non-goals respected**

| Non-goal | Violated? |
|---|---|
| No notification-preferences/settings UI | Not present |
| No real-time toast/sound | Not present |
| Reminders not live-pushed (next fetch only) | Socket event only increments badge; no push-delivery mockup for reminders |
| Per-channel inline mention badge (useMentionBadge) unchanged | Not shown; no drift |
| No grouping/threading | All rows independent |

---

## Additional Observations (Non-blocking)

**Typography token mis-specification on empty-state headline (REVISE item):**  
Brief §4 explicitly lists `text-2xl` for "empty-state headline per §113." DESIGN-SYSTEM §2 defines `text-2xl` as 24px for "landing/empty-state headlines." The empty state in Section 2 uses `text-xl` (20px) on `<h4>` (line 350: `class="text-xl font-semibold..."`). Fix: change to `text-2xl`.

**`ph-check` icon in read notification row (line 301):** The "Graded: Essay Draft 1" row uses a `ph-check` icon to represent a completed/graded item. This introduces a visual type that is not mapped to either `mention` or `assignment_reminder` in the §7 data schema. This is acceptable as an illustrative choice for a read item, but implementation should clarify whether "graded" is a sub-type or the icon is simply reused as a generic "read" marker for assignment rows.

---

## Required Fixes Before APPROVE

| # | Severity | Location | Fix |
|---|---|---|---|
| R1 | Blocking | Missing from layout | Add a "Bell States" static section with two side-by-side visuals: (a) 0-unread bell, icon only, no badge; (b) ≥10-unread bell with badge capped to "9+". Satisfies §9 criterion 2. |
| R2 | Blocking | Empty state `<h4>` line 350 | Change `text-xl` to `text-2xl` to match brief §4 typography token for empty-state headline per §113. |
| R3 | Blocking | Panel JS, no focus trap | Add focus-trap loop on panel `keydown Tab` to contain keyboard focus within panel while open, per brief §6 a11y spec. |

Non-blocking notes (fix in implementation, not required for D-3 APPROVE):
- `text-[#0a0a0b]` on badge (line 211) → use `text-surface-950` (Tailwind config already defines `surface.950`).
- Unread-dot glow `shadow-[0_0_8px_rgba(16,185,129,0.5)]` → consider defining as a named token or aliasing to a reduced-spread `--glow-focus` variant.
