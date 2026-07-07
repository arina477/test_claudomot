# D-3 Review — Educator Admin Console (`/ui-ux-pro-max`)

**Wave:** 76
**Reviewer role:** `/ui-ux-pro-max` — requirement + UX + token + icon audit
**Artifact reviewed:** `design/staging/educator-admin-console.html` (refined mockup, latest)
**Brief:** `process/waves/wave-76/stages/D-1-brief/educator-admin-console-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**On-set icon inventory checked:** `apps/web/src/shell/icons.tsx`

---

## VERDICT: APPROVE

The refined mockup satisfies every brief §5 success criterion, holds all §6 out-of-scope fences, and consumes DESIGN-SYSTEM tokens exactly (no invented hex). All four states are coherent and strictly read-only. Every icon glyph maps to an on-set inline-SVG equivalent in `icons.tsx` — two are near-synonym port notes for B-3, not blockers, and no exotic/off-set glyph (e.g. `ph-tray`) remains. No demo state-switcher / JS overlay is present. No blocking concerns. Adopt as-is.

---

## 1. Brief §5 success-criteria audit

- [x] **Dark-mode only; DS tokens exactly, no invented hex** — `class="dark"`, `--surface-950` body base. Line-by-line hex scan found ZERO literal hex outside the DS token set; every color resolves through a `--surface-*`/`--text-*`/`--accent-*`/`--danger*` token via `var(--…)`. `selection:bg-[var(--accent-emerald)]` uses the token. (§5 line 37, DS §1)
- [x] **Scannable dashboard, 4 aggregate groups legible at a glance** — Members/roles (Module 1 + educator/student `dl` split), Messages 7D (Module 2, `+412` delta), Assignments + Due-Soon/Overdue rollup (Module 3), Recent Activity ledger (Module 4). 3-col stat grid + activity list; NOT a dense table. (§5 line 38, brief §3)
- [x] **Calm/academic/low-noise; NOT a growth dashboard** — `panel-container` chrome mirrors ServerPlanPanel (header + section + nested `stat-card` + `dl` rows). No charts, sparklines, or time-series — a single restrained scalar delta only. (§5 line 39, DS §8)
- [x] **All 4 states designed (loading / loaded / empty / forbidden)** — All present. Loading = skeleton-block shimmer mirroring loaded geometry (DS §8 "never spinners for content lists" honored: content uses skeletons; spinner is header-adjacent only, no layout jump on resolve). Empty = "No activity yet" graceful zero-state. Forbidden = clean "Access Restricted" with lock + `ERR_INSUFFICIENT_ROLE_ENTITLEMENT`. (§5 line 40, brief §3)
- [x] **Owner/educator gating visually clear** — Emerald-dotted "School Plan" pill in loaded + empty headers; forbidden state names "School tier" explicitly; sidebar "Educator Console" item is active/emerald with shield-check glyph. Mirrors ServerPlanPanel tier framing. (§5 line 41, brief §2/§3)
- [x] **Accessible: WCAG AA contrast; correct `--danger` trio; keyboard-navigable** — Forbidden icon tint `rgba(239,68,68,0.1)` (=`--danger`/10) carries `--danger-text` `#f87171` (6.30:1 PASS — exactly the DS §1 prescribed on-tint pairing, NOT `#ef4444` which would fail). Overdue chip label + count both `--danger-text`, correct. Every interactive nav item + button carries `.focus-visible-glow` (=`--glow-focus` emerald ring). `prefers-reduced-motion` guards shimmer AND hover transitions. (§5 line 42, DS §1 danger trio, DS §5, DS §6)

## 2. Brief §6 out-of-scope audit (fences held)

- [x] **NO charts / graphs / time-series** — none; aggregate counts + one textual delta only. (§6 line 46)
- [x] **NO B2B2C / pricing / success-metric (M13) surfacing** — none. "School Plan" is a gating tier marker, not a pricing/upsell surface. (§6 line 47)
- [x] **NO editing / mutation** — read-only throughout: "Read-only aggregate metrics…" subhead, "Displaying recent ledger" footer, passive "Sync 2m ago" metadata (not a button). Zero forms/inputs/toggles/mutating CTAs. (§6 line 48)

## 3. UX flow — 4-state coherence

- [x] **Loading → loaded** shape-consistent: skeleton grid mirrors the real 3-col stat grid + activity rows → no layout jump on hydration.
- [x] **Empty** reuses the exact panel header (shield + title + School Plan pill), then centered icon + headline + one-line — matches DS §8 empty-state pattern; correctly omits a CTA (read-only surface, nothing to create).
- [x] **Forbidden** is a distinct, calm access-denied (lock in danger/10 tint, danger-text headline, mono error code); framed as "normally prevented by hidden entry" per brief §3, no leaky data.
- [x] All four are mutually exclusive `console-state-*` CSS `display` blocks; a code comment documents flipping `display` for preview. **No JS state-switcher, no onclick, no overlay, no demo toggle chrome** — grep-confirmed clean.

## 4. DESIGN-SYSTEM token audit

- [x] **Colors** — all trace to tokens (see §1). Emerald = console accent / positive delta / School-Plan dot / active nav; amber = Due-Soon; danger trio applied per contrast rules. Restrained zinc + emerald + amber + red — no gaming-neon. (DS §1)
- [x] **`--danger` trio correct** — `--danger` (#ef4444) used ONLY as a /10 fill tint (never under white/badge text); `--danger-text` (#f87171) for all danger *text* on tint; `--danger-btn` correctly not needed (read-only surface, no danger button). Textbook-correct. (DS §1 lines 35-37)
- [x] **Geist (DS §2)** — `font-family: 'Geist'` loaded (weights 400/500/600, matching DS scale) with system fallback.
- [x] **Type scale / numerals ≤ text-xl** — Primary stat numerals are `text-xl` (20px) — at the DS §2 ceiling, NOT exceeded; sub-stat values `text-[15px]`. Scanned for `text-2xl+`: the only three hits are DECORATIVE ICON glyphs (mobile hamburger line 172, empty-state clipboard line 227, forbidden lock line 241), not numerals. **No oversized display numerals.** Label idiom `text-xs font-semibold uppercase tracking-*` matches ServerPlanPanel; panel title `text-[17px] font-semibold` matches brief §4. (DS §2, brief §4 line 29)
- [x] **Spacing / radius** — panel `rounded-lg` (0.5rem); card padding `p-4 sm:p-6`; stat grid `gap-6`; body `space-y-8`; nested `stat-card` rounded-lg. On the 4px scale, matches brief §4 line 30 + DS §3/§4.
- [x] **Shadow / motion** — `--shadow-sm: 0 1px 2px rgba(0,0,0,0.4)` on panel + stat cards (ServerPlanPanel idiom); `--glow-focus` focus ring. `transition-colors 150ms` default; no bouncy easing. (DS §5/§6, brief §4 line 31)

## 5. Icon audit (Phosphor → on-set inline-SVG mappability)

Every glyph in the mockup maps to an on-set `icons.tsx` inline-SVG export for the B-3 port. The Phosphor CDN webfont in the mockup is DISPLAY-only — a B-3 port idiom, NOT a mockup blocker (per review-note).

| Mockup glyph | On-set export (`icons.tsx`) | Status |
|---|---|---|
| `ph-shield-check` / `ph-fill ph-shield-check` | `ShieldCheckIcon` (filled variant OK per DS §7) | exact |
| `ph-arrow-left` | `ArrowLeftIcon` | exact |
| `ph-list` | `MenuIcon` | exact (list/hamburger) |
| `ph-spinner` | `SpinnerIcon` | exact |
| `ph-clipboard-text` | `ClipboardTextIcon` | exact |
| `ph-arrows-clockwise` | `ArrowsClockwiseIcon` | exact |
| `ph-users` | `UsersIcon` | exact |
| `ph-clock` | `ClockIcon` | exact |
| `ph-warning-circle` | `WarningCircleIcon` | exact |
| `ph-user-plus` | `UserAddIcon` | exact (Phosphor user-plus) |
| `ph-hash` | `HashIcon` | exact |
| `ph-lock` | `LockKeyIcon` | near-synonym — only lock glyph on-set; B-3 port note |
| `ph-chat-circle` | `ChatsCircleIcon` (or `ChatTeardropIcon`) | near-synonym — B-3 port note |

- [x] **No exotic / off-set glyph remains** — no `ph-tray` or any unmappable glyph. All 13 distinct glyphs resolve to on-set SVG exports. (The empty-state icon is `ph-clipboard-text`, fully on-set.)
- [x] **Phosphor-family, line weight regular, filled only for active** — respected (shield filled in active/loaded header per DS §7).

**B-3 port notes (non-blocking):** (a) render every glyph from the inline-SVG set in `icons.tsx`, not the CDN webfont / `<i class="ph">` markup, and do not introduce the `@phosphor-icons/web` `<script>` dependency; (b) `ph-lock` → `LockKeyIcon`; (c) `ph-chat-circle` → `ChatsCircleIcon`.

---

## Concerns

None blocking.

- **(non-blocking, B-3 port)** Icons use the Phosphor CDN webfont for preview — B-3 must build from the inline-SVG `icons.tsx` components. Glyph→component map is in §5; two near-synonym substitutions (`ph-lock`→`LockKeyIcon`, `ph-chat-circle`→`ChatsCircleIcon`) noted there. Per the review-note this is a port idiom, not a mockup defect.
- **(non-blocking, B-3 wiring)** Static placeholder strings ("Sync 2m ago", "142 total events recorded this week") are literals — B-3 wires them to real aggregates or omits if outside the read-only aggregate contract.
- **(optional taste)** Primary stat numerals sit exactly at the DS §2 `text-xl` ceiling (acceptable, not a violation). If a future refinement wants tighter "Body-m" numerals per brief §4 line 29, drop to `text-lg` — optional, not required for adoption.

**Adopt as-is.**
