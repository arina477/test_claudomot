# D-3 Final Review — notifications-center (ui-ux-pro-max lens, iteration 3)

**Reviewer role:** D-3 Reviewer — ui-ux-pro-max
**Artifact:** `design/staging/notifications-center.html` (iteration 3, post-REJECT R1+R2 fixes)
**Brief:** `process/waves/wave-37/stages/D-1-brief/notifications-center-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Date:** 2026-07-02
**Prior verdict:** REJECT (iteration 2)

---

## Verdict

**APPROVE**

Both blocking items from the prior REJECT are resolved and verified in the current artifact. The token palette is clean — no invented hex, no off-palette Tailwind swatch of consequence, no WCAG contrast failure. All four panel states and all three bell states are present and complete. Phosphor icon names are real. A11y coverage meets the brief. Non-goals §10 are respected. The artifact is cleared for D-3 adoption.

---

## Prior REJECT Fixes — Resolution Confirmation (Iteration 3)

| Blocking item | Prior REJECT evidence | Current artifact | Status |
|---|---|---|---|
| R1 — off-palette hex `#34d399` via `hover:text-emerald-400` (line 273) | `hover:text-emerald-400` present in iteration 2 | Line 273: `hover:text-accent-emerald` — DS-sanctioned token only; `emerald-400` and `#34d399` do not appear anywhere in the file (`grep emerald-400` returns 0 matches) | RESOLVED |
| R2 — badge `bg-danger text-white` WCAG AA fail + brief §3/§4 violation | All badge instances used `bg-danger text-white text-[10px]`, contrast 3.76:1 < 4.5:1 | Lines 183, 194, 224: all badges now `bg-accent-emerald text-surface-950` — brief-mandated emerald badge with dark foreground; contrast ~8.86:1 (WCAG AAA) | RESOLVED |

Secondary item S1 from iteration 2 (row click handler absent) remains outstanding; it is a pre-handoff implementation note, not a D-3 blocking criterion.

---

## §9 Success Criteria — Full Checkbox Audit

### Criterion 1 — Only §4 tokens; no new hex (brief §9.1 / DESIGN-SYSTEM §1)

**PASS**

Complete hex and color-class inventory:

| Value | DS token | Location | Status |
|---|---|---|---|
| `#0a0a0b` | `--surface-950` | body CSS + Tailwind config | OK |
| `#121214` | `--surface-900` | Tailwind config | OK |
| `#1c1c1f` | `--surface-800` | Tailwind config + spec-label CSS | OK |
| `#27272a` | `--surface-700` | Tailwind config + skeleton-row CSS | OK |
| `#3f3f46` | `--surface-600` | Tailwind config + scrollbar-thumb CSS | OK |
| `#52525b` | `--surface-500` | Tailwind config + scrollbar-hover CSS | OK |
| `rgba(255,255,255,0.92)` | `--text-primary` | Tailwind config + body color | OK |
| `rgba(255,255,255,0.60)` | `--text-secondary` | Tailwind config | OK |
| `rgba(255,255,255,0.40)` | `--text-muted` | Tailwind config | OK |
| `#10b981` | `--accent-emerald` | Tailwind config | OK |
| `#f59e0b` | `--accent-amber` | Tailwind config | OK |
| `#ef4444` | `--danger` | Tailwind config; used only as `bg-danger/10` tint on error icon container (correct per DS §1 "fill/border use only") | OK |
| `#f87171` | `--danger-text` | Tailwind config; applied as `text-danger-text` on error icon (line 470) | OK |
| `rgba(255,255,255,0.06)` | `--border-hairline` | Tailwind config | OK |
| `rgba(255,255,255,0.10)` | `--border-hover` | Tailwind config | OK |
| `rgba(16,185,129,0.4)` | `--glow-focus` | `.ring-emerald-focus` CSS | OK |
| `rgba(0,0,0,0.4)` | `--shadow-sm` | Tailwind config boxShadow | OK |
| `rgba(0,0,0,0.5)` | `--shadow-pop` | Tailwind config boxShadow + JIT `shadow-[0_-8px_24px_rgba(0,0,0,0.5)]` on mobile sheet | OK |
| `rgba(0,0,0,0.6)` | DS §8 scrim spec | `bg-black/60` (line 237) | OK — `bg-black/60` is a raw Tailwind utility, not a named DS token; the resolved value exactly matches the DS Modal/Dialog scrim spec `rgba(0,0,0,0.6)`. Flag as implementation note, not a blocking violation. |
| shimmer `rgba(255,255,255,0.02)` / `rgba(255,255,255,0.05)` | shimmer overlay on `--surface-700` | skeleton-row CSS gradient | OK — compositional shimmer tints within the DS §113 skeleton pattern |

**No invented hex. No off-palette Tailwind swatch (`emerald-400`, `green-*`, `teal-*`, `blue-*`, etc.) present anywhere in the file.**

**Contrast spot-checks:**

| Pair | Contrast | WCAG requirement | Result |
|---|---|---|---|
| Badge: `text-surface-950` (#0a0a0b) on `bg-accent-emerald` (#10b981) | ~8.86:1 | 4.5:1 AA (small text) | PASS — AAA |
| Error icon: `text-danger-text` (#f87171) on `bg-danger/10` over surface-900 | ~6.3:1 | 4.5:1 AA | PASS — DS §1 documents this ratio |
| Active bell icon: `text-white` on `bg-surface-800` (#1c1c1f) | ~17.5:1 | 4.5:1 AA | PASS — AAA |
| Empty/error headings: `text-primary` on `bg-surface-900` (#121214) | ~14.5:1 | 4.5:1 AA | PASS |

**Implementation note (non-blocking):** Several places use the class `text-primary` rather than `text-text-primary` (the utility generated from the config's `text.primary` nested color). In the Tailwind CDN JIT context, `text-primary` does not resolve to a generated rule; the text inherits the body's `color: rgba(255,255,255,0.92)` which happens to match the token value. This is a code-quality note for the build engineer, not a design token violation — no new color is introduced. Similarly `text-white` on active bell buttons and `bg-black/60` on the scrim use standard Tailwind utilities whose resolved values match DS specs; flag for the engineer to align to DS token aliases when porting to the real stylesheet.

---

### Criterion 2 — All 4 panel states + all 3 bell states incl. 9+ cap (brief §9.2 / §3)

**PASS**

**Panel states:**

| State | Where | Key evidence |
|---|---|---|
| Loading (skeleton rows) | Section 3 "State: Loading" panel | 3 skeleton rows, `animate-shimmer skeleton-row`, surface-700 base, no spinner — satisfies brief §3 "skeleton rows, NOT spinner" and DS §113 |
| Loaded | Section 2 interactive demo | 4 rows (2 unread + 2 read), correct anatomy for mention type and assignment-reminder type |
| Empty | Section 3 "State: Empty" panel | `ph-bell-z` icon + `text-2xl` headline "You're all caught up" + one-line subtext "No new notifications. Go ace your classes." + "Browse channels" CTA button — all four DS §113 elements present |
| Error | Section 3 "State: Error" panel | `ph-warning-circle` in `text-danger-text` on `bg-danger/10` + "Couldn't load data" cause + "Retry connection" retry button — satisfies DS §113 "danger icon + cause + retry" |

**Bell states:**

| State | Where | Key evidence |
|---|---|---|
| 0 unread (no badge) | Section 1 "Empty (0 Unread)" tile | `ph ph-bell` (outline), no badge element, `aria-label="Notifications, 0 unread"` |
| N unread (badge) | Section 1 "Standard (3 Unread)" tile | `ph-fill ph-bell`, `bg-accent-emerald text-surface-950` badge "3", `aria-label="Notifications, 3 unread"` |
| 9+ cap | Section 1 "Capped (10+ Unread)" tile | `ph-fill ph-bell`, badge "9+", `aria-label="Notifications, 12 unread"` — correct capping per brief §3 |

---

### Criterion 3 — Responsive per §5: popover desktop, bottom-sheet below 1024px

**PASS**

Desktop (lg): `lg:absolute lg:top-14 lg:right-6 lg:w-[380px] lg:border lg:rounded-lg lg:shadow-pop lg:bg-surface-900` (lines 241–243). Width 380px within brief §5 "~360–380px" range. `shadow-pop` present.

Mobile (max-lg): `max-lg:fixed max-lg:bottom-0 max-lg:inset-x-0 max-lg:w-full max-lg:h-[80dvh] max-lg:rounded-t-xl max-lg:shadow-[0_-8px_24px_rgba(0,0,0,0.5)]` — full-width, pinned bottom, rounded top corners. Drag handle `w-12 h-1.5 rounded-full bg-surface-600` present (line 247). Backdrop scrim with `scrim.addEventListener('click', togglePanel)` (line 549) closes on tap.

JS resize listener (lines 629–638) cleans up stale scrim state on breakpoint crossing.

---

### Criterion 4 — Prior-art visual language (dark, restrained, emerald-only accent)

**PASS**

Zinc dark base, Geist type, Phosphor regular-weight icons, emerald confined to unread dot / badge / focus ring / mark-read confirmation, amber strictly in assignment due-date context. No secondary palette imported. Panel elevation uses border + `shadow-pop`, consistent with DS §5. Scrollbar uses surface-600/500 per DS §9 "minimal 6px dark scrollbar."

---

### Criterion 5 — mention vs reminder type-distinguishable (icon + source + time)

**PASS**

| Type | Icon | Content grammar | Time |
|---|---|---|---|
| Mention | `ph-at` in `text-text-muted` | Actor name bold + `text-accent-emerald` channel link + quoted excerpt behind `border-l-2 border-surface-600` | `text-text-muted` relative timestamp right-aligned |
| Assignment reminder | amber-tinted `ph-calendar-check` icon chip (`bg-accent-amber/10`) | "Assignment due soon" label + assignment title bold + `ph-clock text-accent-amber` + due interval in `text-accent-amber` | `text-text-muted` relative timestamp right-aligned |

Dual-axis differentiation — icon glyph AND accent color. Sighted users identify type without reading body text. A DM type (avatar + actor name) is shown as the third row variant, adding further type vocabulary.

---

### Criterion 6 — unread vs read distinct (emerald dot) + mark-all-read

**PASS**

Unread rows (Items 1–2): `bg-accent-emerald` dot at `w-2 h-2 rounded-full`, full row opacity.
Read rows (Items 3–4): `bg-transparent` dot, `opacity-70` on the row container.

Mark-all-read flow (lines 583–625): 800ms simulated network latency + `aria-busy="true"` + "Marking..." label; on resolve — clears all `indicator-dot` to transparent, adds `opacity-70` to rows, hides badge via `bellBadge.style.display = 'none'`, updates button to "All read" + `ph-check` icon, announces "All notifications marked as read." to `#a11y-announcer` aria-live region, updates `aria-label` to "Notifications, 0 unread." Flow is complete.

---

### Criterion 7 — Real Phosphor icon names

**PASS**

| Class name | Phosphor component | Role in design |
|---|---|---|
| `ph ph-bell` | Bell | 0-unread bell outline |
| `ph-fill ph-bell` | Bell (filled) | N-unread bell active + interactive bell |
| `ph ph-books` | Books | Mock nav logo (spec-board only) |
| `ph ph-at` | At | Mention notification type icon |
| `ph ph-calendar-check` | CalendarCheck | Assignment reminder type icon |
| `ph ph-clock` | Clock | Due-date urgency indicator |
| `ph ph-check` | Check | Mark-all-read confirmation icon |
| `ph ph-check-circle` | CheckCircle | Assignment-graded read-row icon |
| `ph ph-bell-z` | BellZ | Empty state sleeping bell |
| `ph ph-warning-circle` | WarningCircle | Error state danger icon |

All ten icon names are real, verified Phosphor web library components. No invented or misspelled names.

---

### Criterion 8 — a11y: aria-label with count, aria-live increments, focus-trap, Escape

**PASS**

| Requirement | Implementation | Lines | Status |
|---|---|---|---|
| `aria-label="Notifications, N unread"` on bell | All spec tiles and interactive bell carry count-qualified label | 171, 182, 192, 221 | PASS |
| `aria-live="polite"` announcer | `<div aria-live="polite" class="sr-only" id="a11y-announcer">` | 149 | PASS |
| Live region updated on state change | `announcer.textContent = 'All notifications marked as read.'` on mark-all-read | 617 | PASS |
| Focus trap in open panel | Tab/Shift+Tab handler cycles focusable elements within `#interactive-panel` | 562–580 | PASS |
| Escape closes + returns focus to bell | `if (e.key === 'Escape' && isOpen) togglePanel()` + `bell.focus()` in close path | 555, 546 | PASS |
| `aria-expanded` on bell | Set `true`/`false` in `togglePanel` | 518, 538 | PASS |
| `role="dialog"` + `aria-modal="true"` | Panel container | 240 | PASS |
| `aria-haspopup="dialog"` | Interactive bell button | 221 | PASS |
| Badge `aria-hidden="true"` | Count is conveyed via `aria-label`; badge is decorative | 183, 194, 224 | PASS |
| `aria-busy` on mark-read button | Set during async wait | 587 | PASS |
| Avatar `alt` text | `alt="Sarah Chen"` | 312 | PASS |

---

## Non-Goals §10 Respected

**PASS**

| Non-goal | Present in artifact |
|---|---|
| Notification-preferences UI | Not present |
| Toast / sound | Not present |
| Reminders live-pushed | Not shown |
| Per-channel useMentionBadge modified | Not touched |
| Grouping / threading | Not present; all rows independent |

---

## Implementation Notes for Developer Handoff (Non-Blocking)

These observations do not affect D-3 adoption but should be addressed in the B-block build:

1. **Token class aliases:** Replace bare `text-primary` / `text-secondary` utility references with `text-text-primary` / `text-text-secondary` (the generated Tailwind utilities from the config's `text` color namespace). The current no-op classes render visually correct only because the body inherits the right color — a fragile dependency.

2. **`bg-black/60` for scrim:** Define a named scrim token in the Tailwind config (e.g., `scrim: 'rgba(0,0,0,0.6)'`) and apply `bg-scrim` instead of the raw Tailwind utility. The value is correct; the alias provides DS traceability.

3. **`text-white` on active bell buttons:** Consider aliasing to `text-text-primary` or a dedicated `text-icon-active` token for semantic clarity in the codebase. Contrast is safe at ~17.5:1; this is a naming concern only.

4. **Row click handler (S1 carry-over):** Add a click listener on `.notification-row` elements that at minimum transitions the row to read-state optimistically (clear dot, add `opacity-70`) before navigating. The brief §6 "Row click → navigate to source + mark-read (optimistic)" is not wired in the demo. Required before developer handoff.

---

## Summary

All eight §9 success criteria pass. No invented hex, no off-palette Tailwind swatch, no WCAG contrast failure, no missing state, no §10 violation found. The two blocking items from the prior REJECT (off-palette `#34d399` via `hover:text-emerald-400`; badge `bg-danger text-white` contrast fail + brief §3/§4 violation) are both resolved in the current artifact. The design is clean, DS-aligned, accessible, and complete.

**Final verdict: APPROVE**
