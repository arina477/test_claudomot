# D-3 Plan-Design Review — server-channel-view.html (wave-14)
Reviewer: ui-designer (reviewer A)
Surfaces under review: (1) Right-sidebar Member-list Panel · (2) Typing Indicator above composer
Reference files: `design/staging/server-channel-view.html`, `design/DESIGN-SYSTEM.md`,
`process/waves/wave-14/stages/D-1-brief/member-list-panel-brief.md`,
`process/waves/wave-14/stages/D-1-brief/typing-indicator-brief.md`

---

## SURFACE 1 — MEMBER-LIST PANEL (right sidebar, Pane 4)

### Visual Hierarchy · 9/10

The two-group structure (Online above Offline) is immediately legible. Group headers use `text-[11px] font-bold uppercase tracking-widest text-zinc-500` — an exact match to the brief §4 specimen and the channel-sidebar section-header language (Pane 2, L135-137). Avatar (32px) + name + presence dot stack left-to-right at a consistent `gap-3` with `p-1.5` row padding; the dot sits bottom-right of the avatar at the canonically specified `-bottom-0.5 -right-0.5` offset, bordered by a `bg-study-900` halo ring that lifts it off the avatar image without a hard edge. Online members render at `text-zinc-200` (≈92% white), offline at `text-zinc-400` (≈60% white), creating a clear two-tier name weight that immediately separates groups without relying on the dot alone. No element competes with the message canvas; the panel reads as secondary chrome.

What would make it a 10: A "Members" panel header / label at the top of the aside (matching the "CS-201 Data Structures" header of Pane 2) would close the visual symmetry of the three-panel shell. The brief leaves it out of scope but its absence is mildly noticeable at 1280px.

### Spacing Rhythm · 8/10

Intra-group row gap is `space-y-0.5` (2px) — correctly tight, matching channel-sidebar item rhythm. Inter-group gap is handled by `space-y-6` on the outer scroll div, placing Online and Offline sections 24px apart, which aligns with the §3 "section gaps 24px" directive. Row internal padding `p-1.5` (6px) is fractionally lighter than the brief's "8px×12px sidebar item padding" footnote at §3, but the slight underspace reads well at 32px avatar height and is a deliberate compact choice, not a violation. The `h-3 w-3` dot container (12px) with a `w-1.5 h-1.5` inner dot (6px) correctly uses the avatar halo pattern from DESIGN-SYSTEM §8 Avatar primitive.

What would make it a 10: The group header `mb-3` (12px below header before first row) is fine, but the online-group header lacks any `mt-X` top breathing room for the very first group when the panel is freshly loaded. 4–8px of top padding on the scroll area (`pt-4`) is already set — no change needed; this is already correct. Score stands. Minor note only: brief §4 specifies scroll area with `p-4` padding; the implementation uses `p-4 space-y-6` which delivers that.

### Brand Coherence (dark / academic / emerald, NO neon) · 10/10

Sidebar background is `bg-study-900` (#121214) — exactly `--surface-900`, matching the DESIGN-SYSTEM §1 explicit "Sidebars (server rail, channel sidebar, **member list**)" mapping. No invented hex appears on any member row, dot, or header. Online presence dot is `bg-emerald-500` (#10b981), confirming `--presence-online = --accent-emerald`. Offline dot is `bg-study-500` (#52525b), confirming `--presence-offline = --surface-500`. The emerald is not neon; it matches the same accent used by the composer send button and connection indicator — tonally correct. Hover fill `hover:bg-study-700` matches the `--surface-700` hover fill mandated by brief §6. The initials-fallback avatar for Michael K. (`bg-study-700/60`, `text-zinc-400`) is appropriately muted vs. the online initials fallback (`bg-study-600`, `text-zinc-100`), reinforcing the online/offline contrast hierarchy without adding a new hue.

### Edge-case Handling (loading / empty / offline / many-typers) · 7/10

Skeleton loading state is provided as a commented HTML block (L593-610): two rows with `animate-pulse` on `bg-study-700` placeholders for the avatar circle and name bar — correct skeleton pattern per DESIGN-SYSTEM §8 ("skeleton rows using surface-700 shimmer; never spinners for content lists"). Empty state is also commented (L583-591): centered `ph-users` icon + "No one else here yet" label at `text-zinc-400` — satisfies brief §9 checklist item. **Both states are commented out**, meaning a reviewer cannot visually evaluate them from the static HTML without editing the file. The message-canvas has its empty-channel state rendered in a `<template>` tag (L495-503) plus a live-rendered copy in the state gallery overlay (L622-643) — that pattern is not replicated for the member-list panel's skeleton and empty states. Per the staging review contract, both edge states should be statically visible (either in a state gallery, a separate stacked section, or an `aria-hidden` review panel) so D-3 can confirm token usage and contrast without guessing.

Offline row dimming is visually present and populated with three rows (David C., Sarah J., Michael K.). The `opacity-70` on offline avatar images and `opacity-90` on the name spans with `group-hover` restoration is a reasonable approach to dimming, though the name contrast concern is addressed below under Accessibility.

What would make it a 10: Render the skeleton and empty states visually (as the message canvas does via state gallery) so that token discipline and contrast can be confirmed without inference. A single collapsed `<details>` or an `aria-hidden="true"` review strip below the sidebar would suffice.

### Accessibility — Contrast / Focus / Semantics · 7/10

**Contrast — passes for online names; raises a concern for offline.**
- Online names (`text-zinc-200` on `bg-study-900`): zinc-200 is #e4e4e7 on #121214 → contrast ratio ~13.1:1. Excellent.
- Group headers (`text-zinc-500` on `bg-study-900`): #71717a on #121214 → ~4.9:1. Passes AA.
- Offline names — THE CONCERN: The implementation uses `text-zinc-400` on `bg-study-900`. zinc-400 is #a1a1aa on #121214 → contrast ratio approximately 6.4:1 at rest. However, the names carry `opacity-90` via a span-level class. Effective color becomes #a1a1aa at 90% opacity blended over #121214 ≈ #959599, which yields approximately 5.7:1 — still above 4.5:1 AA. This technically passes, but the intent of the brief §11 and brief §4 ("--text-muted (0.40) offline-dimmed names") suggests muted should use `--text-muted` (rgba 255,255,255,0.40), not `--text-secondary` (rgba 255,255,255,0.60, which is zinc-400-equivalent). The implementation chose zinc-400 rather than a true `--text-muted` value; this is slightly brighter than the brief specifies but does not fail contrast. **Flag as token drift vs. brief §4 intent**, not a hard failure.
- Offline avatar image `opacity-70`: at 70%, avatar images still serve as visual anchors; they do not carry text so contrast rules do not apply, and the alt text is always present.
- Presence dots: these convey presence status via color alone (emerald vs. grey). Per DESIGN-SYSTEM §8 MemberListItem: "presence conveyed by text too (not color alone)." The implementation does NOT add any visible text label ("Online"/"Offline") next to the dot on individual rows; the group header ("Online — N" / "Offline — 3") provides a group-level text label but row-level text redundancy is absent. Screen reader users tabbing through individual rows will receive `<span>Mia Wong</span>` with no additional state — the presence dot is decorative (`pointer-events-none`; no `aria-label`). **This is an accessibility gap.** Minimal fix: add `aria-label` or `title` to the dot container, or append a visually-hidden `<span class="sr-only">Online</span>` / `<span class="sr-only">Offline</span>` to each row.
- Focus-visible: all rows carry `focus-visible:ring-2 focus-visible:ring-emerald-400/70` and `tabindex="0"` — correct per brief §6 and DESIGN-SYSTEM §5 `--glow-focus`.

What would make it a 10: (a) Add `sr-only` presence label to each member row so presence is conveyed in text without depending on color alone. (b) The `<aside>` element has no `aria-label`; add `aria-label="Members"` to make it a landmark region. (c) Consider using `role="list"` + `role="listitem"` on the member rows to give the roster list semantics for assistive technology.

### Responsive (≤1024 collapse) · 10/10

The collapse media query at line 87-90 is unambiguous:
```css
@media (max-width: 1024px) {
  .three-pane-grid { grid-template-columns: 72px 240px 1fr !important; }
  .right-sidebar { display: none !important; }
}
```
The four-column grid (`72px 260px 1fr 240px`) loses the `240px` right column exactly at 1024px and the aside is hidden. At ≤768px, the channel sidebar becomes a drawer while the rail persists (L92-100), which is the §9 directive. No layout break is introduced. The `!important` overrides on the grid template are the standard pattern already established for this file. The sidebar has no toggle button composited into the channel header for re-opening at ≤1024px, but the brief §5 notes "toggled, not always-on" — a future toggle affordance; the brief classifies its absence as acceptable for this design wave.

---

## SURFACE 2 — TYPING INDICATOR

### Visual Hierarchy · 9/10

The indicator occupies a `h-0` container (`div.relative.w-full.h-0`) with an absolutely-positioned inner div at `bottom-1 left-1`. This zero-height wrapper is the architectural decision the brief calls the critical UX correctness test — the composer's layout does not shift when the indicator appears or disappears. The text and dots float above the composer's top edge. At 12px / `text-zinc-400`, the type is clearly subordinate to the composer's 16px `text-zinc-100` input text and sits visually between the message list and the composer without claiming vertical space. The 3-dot cluster to the right of the text adds a conventional typing idiom without any additional chrome.

What would make it a 10: The indicator sits at `bottom-1` (4px above the composer top edge), which means on short composer heights (single row) there is slight overlap risk between the dots and the composer's top border. A `bottom-2` (8px) offset would give a cleaner gap. Minor.

### Spacing Rhythm · 9/10

The `flex items-center gap-1.5` container keeps the text and dot cluster on a single baseline with 6px separation — appropriate. The `mb-[1px]` on the dot span nudges dots to optical center against the text cap-height. The dot size `w-[3px] h-[3px]` with `gap-[3px]` is properly minimal — a 3+3+3+3+3 = 15px total cluster, lightweight. No reserved margin or padding line wastes vertical space. The entire assembly is pointer-events-none so it cannot accidentally intercept composer clicks.

What would make it a 10: The text has a `drop-shadow-md` applied (`drop-shadow-md`). On the dark `--surface-800` background this shadow is not visible and adds no value; it also slightly blurs the letterforms. Remove for cleaner rendering at this small size.

### Brand Coherence · 10/10

No neon. The dots use `bg-zinc-500` (#71717a) — in the `--text-secondary` to `--text-muted` range, appropriate for subordinate meta-UI. The text uses `text-zinc-400` — consistent with `--text-secondary` metadata weight. The brief §4 specifies `--text-secondary` for typing text and `--text-muted` for dots; the implementation has these slightly swapped (zinc-400 ≈ text-secondary for text, zinc-500 slightly above text-muted for dots), but both values are within the muted half of the token range and neither breaks the no-neon, dark-academic aesthetic. No `--accent-emerald` is injected into the indicator, which the brief §4 labels optional and recommends against unless intentional — the implementation correctly omits it. The `drop-shadow-md` text shadow (noted above) is the only micro-blemish but is not a brand violation.

### Edge-case Handling · 6/10

The three states (1 typer, 2-3 typers, many) are provided — but only the 1-typer state is rendered live; the 2-3 and many states are in HTML comments (L450-467). The brief §3 requires all four states (none / one / 2-3 / many) to be visible for review.

State analysis from the commented code:

- 1 typer: "Mia Wong is typing" — correct grammar with singular "is".
- 2-3 typers (commented): "Mia Wong, David C. and Sarah J. are typing" — correct grammar; Oxford-style comma before "and" consistent with other copy in the file; "are typing" plural — correct.
- Many (commented): "Several people are typing" — correct aggregation.
- None/empty: The `h-0` container is always present; when no typers are active the absolute inner div would simply be invisible (no text content). The implementation does not toggle visibility explicitly but the zero-height wrapper achieves the zero-layout-shift goal regardless. **However, the current demo renders the 1-typer text unconditionally** — the `opacity` transition on the inner div is not toggled by a class; there is no `opacity-0` resting state applied. In a live implementation this would be JavaScript-driven, but in the static staging file, the indicator has no "empty / hidden" rendered state for reviewers to verify. This is the second instance of the "commented-out edge states" pattern seen in the member list.

The brief §9 checklist item "line sits directly above the composer; zero reserved height when empty (no layout shift)" cannot be fully verified without a rendered empty-state comparison.

What would make it a 10: Render all four states visually in the staging file — either as a stacked column of demo strips in the state gallery overlay (already established at L619-643) or via four static instances of the typing-indicator block in an `aria-hidden` review section. This is a staging presentation gap, not a code design flaw, but it materially limits the D-3 reviewer's ability to sign off on grammar and the no-shift promise.

### Accessibility · 6/10

**Critical gap: no `role="status"` or `aria-live` region.**

The brief §4 cites the `ConnectionStateIndicator` (L179, `role="status"`) as the "precedent for a subtle status-region line," and DESIGN-SYSTEM §8 ConnectionStateIndicator specifies `role="status" aria-live=polite`. The typing indicator's outer container has no role or aria-live attribute. Screen reader users will not be notified when a peer starts typing. At minimum the outer wrapper needs `role="status" aria-live="polite" aria-atomic="true"` so assistive technology announces the state change ("Mia Wong is typing") when it appears, without interrupting other announcements (polite is correct — not assertive).

The `pointer-events-none` and absence of focusable elements is correct — the indicator is read-only informational chrome, not interactive.

What would make it a 10: Add `role="status" aria-live="polite" aria-atomic="true"` to the outer container. The text content itself ("Mia Wong is typing" / "Several people are typing") is already human-readable and sufficiently descriptive for SR users once the live region is present.

### Responsive (single-line truncation, never 2 lines) · 9/10

The text span carries `truncate` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`). At ≤240px member-panel-gone layouts the 1fr main column can become very narrow, but `truncate` ensures the text clips rather than wrapping. The `h-0` container is `w-full` relative to the composer's `px-5` padded parent, so it always fills the available width. The dot cluster is a fixed `flex-row` with pixel gaps — it cannot wrap. No 2-line scenario is reachable from the HTML as written.

What would make it a 10: The `bottom-1 left-1` positioning is inside the `h-0` div's coordinate space. At very narrow widths, `left-1` (4px) keeps the text off the left edge — correct. Confirm the truncation breakpoint includes the dot cluster in the layout flow (currently the dots are siblings in the same flex row as the text, so the text will truncate before the dots start overflowing). This is correct. Score stands.

---

## CRITICAL TOKEN DISCIPLINE AUDIT

### Presence dots
| Token | Required value | Implemented value | Pass? |
|---|---|---|---|
| `--presence-online` | `--accent-emerald` = `#10b981` | `bg-emerald-500` (Tailwind = #10b981) | PASS |
| `--presence-offline` | `--surface-500` = `#52525b` | `bg-study-500` (Tailwind alias = #52525b via config `study.500`) | PASS |

The Tailwind config at L20-22 defines `study: { 500: '#52525b' }`, confirming `bg-study-500` resolves to `#52525b`. No drift.

### Member-list sidebar background
| Token | Required | Implemented | Pass? |
|---|---|---|---|
| `--surface-900` | `#121214` | `bg-study-900` (config L21 `900: '#121214'`) | PASS |

### Hover fill
| Token | Required | Implemented | Pass? |
|---|---|---|---|
| `--surface-700` | `#27272a` | `hover:bg-study-700` (config `700: '#27272a'`) | PASS |

### Typing text and dots
| Token | Brief requirement | Implemented | Verdict |
|---|---|---|---|
| Typing text | `--text-secondary` (rgba 255,255,255,0.60) | `text-zinc-400` (#a1a1aa ≈ ~58% luminosity match, not an exact rgba match) | MINOR DRIFT — zinc-400 approximates text-secondary but is not the direct token |
| Dots | `--text-muted` (rgba 255,255,255,0.40) | `bg-zinc-500` (#71717a ≈ text-secondary territory, brighter than text-muted) | MINOR DRIFT — dots are slightly brighter than the brief's text-muted spec; zinc-400 would be closer |

Neither drift constitutes a visual failure or a brand violation — both values stay within the muted low-emphasis register and produce sufficient contrast. However, for token discipline at scale these should align with the semantic rgba tokens rather than Tailwind name approximations.

### Invented hex check
A search of the entire file for inline `#` color values (outside the Tailwind config block L20-29) finds only system-defined config values. No rogue hex strings appear in the component markup. PASS.

---

## DIMENSION SCORES SUMMARY

| Dimension | Score | Surface |
|---|---|---|
| Visual hierarchy | 9/10 | Member-list |
| Spacing rhythm | 8/10 | Member-list |
| Brand coherence | 10/10 | Member-list |
| Edge-case handling | 7/10 | Member-list |
| Accessibility | 7/10 | Member-list |
| Responsive | 10/10 | Member-list |
| Visual hierarchy | 9/10 | Typing indicator |
| Spacing rhythm | 9/10 | Typing indicator |
| Brand coherence | 10/10 | Typing indicator |
| Edge-case handling | 6/10 | Typing indicator |
| Accessibility | 6/10 | Typing indicator |
| Responsive | 9/10 | Typing indicator |

**Aggregate: 100/120 = 83%**

---

## REQUIRED-FIX REGISTER

These items gate approval. Ordered by severity.

**R-1 (Accessibility — typing indicator):** Add `role="status" aria-live="polite" aria-atomic="true"` to the typing-indicator outer container div (L439). Without this, screen reader users receive no notification that a peer is typing. Cited against: typing-indicator-brief §4 (ConnectionStateIndicator precedent), DESIGN-SYSTEM §8 ConnectionStateIndicator spec.

**R-2 (Accessibility — member list, color-not-alone):** Add `<span class="sr-only">Online</span>` (or `aria-label`) to each Online member row, and `<span class="sr-only">Offline</span>` to each Offline row. Presence is currently dot-color only at the row level. Cited against: DESIGN-SYSTEM §8 MemberListItem "presence conveyed by text too (not color alone)", member-list-panel-brief §11.

**R-3 (Accessibility — member list landmark):** Add `aria-label="Members"` to the `<aside class="right-sidebar ...">` element (L508). It is currently an unlabelled landmark. Cited against: WCAG 2.1 SC 4.1.2.

**R-4 (Staging legibility — both surfaces):** Render the skeleton and empty states for the member-list panel (currently commented L583-610), and render the 2-3 typers and many-typers states for the typing indicator (currently commented L450-467), as visible review strips — either in the existing state gallery overlay or as `aria-hidden="true"` stacked panels. D-3 cannot fully sign off on grammar, contrast, or no-layout-shift without rendered examples. Cited against: member-list-panel-brief §9, typing-indicator-brief §9.

## ADVISORY (do-not-block)

**A-1:** Offline name spans use `text-zinc-400 opacity-90` rather than the brief's `--text-muted` (rgba 0.40). Effective value (~5.7:1) passes AA but diverges from the brief §4 token spec. Align to `text-zinc-500` (closer to 0.40 luminosity) on a future pass.

**A-2:** Typing indicator text uses `drop-shadow-md` which is invisible on dark backgrounds at 12px and slightly blurs letterforms. Remove it.

**A-3:** The `<aside>` member-list panel and the member-row divs would benefit from `role="list"` / `role="listitem"` to give the roster explicit list semantics. Currently they are plain divs inside an aside with no list role.

**A-4:** The three-dot typing animation uses `animation-delay` via inline style attributes (L445-447). This works but is less maintainable than CSS custom properties. No functional issue.

---

REVISE

---
*Items R-1 through R-4 must be addressed before APPROVE. R-1 and R-2 are accessibility regressions against the design system contract. R-3 is a landmark labelling omission. R-4 prevents complete staging verification of stated edge states. All fixes are mechanical: no design re-work required — aria attributes and uncommented HTML blocks only.*
