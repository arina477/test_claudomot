# D-3 Review — Educator Admin Console (`/ui-ux-pro-max`)

**Reviewer role:** requirement + UX-best-practice + design-token audit
**Target:** `design/staging/educator-admin-console.html`
**Brief:** `process/waves/wave-76/stages/D-1-brief/educator-admin-console-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`

---

## VERDICT: **REVISE**

The refined mockup is on-concept: layout, calm/academic tone, all four states, gated framing, correct danger-token discipline, Geist font, and full out-of-scope adherence (no charts, no pricing, no mutation surface) are all correct. But it must not be adopted verbatim because it ships icons via the **Phosphor web CDN (`<i class="ph …">`) idiom**, whereas the shipped surface uses the **inline-SVG component set at `apps/web/src/shell/icons.tsx`** that brief §4 explicitly names — and one glyph (`ph-tray`) has **no export in that set**. There is also a **type-scale violation** (24px stat numerals vs the DS §2 scale / brief §4 "Body-m") and a **stray class typo**. Every defect is mechanical and bounded — hence REVISE, not REJECT. No re-architecture is warranted.

---

## 1. Brief success-criteria checklist (brief §5 / §6)

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| 5.1 | Dark-mode only; consumes DESIGN-SYSTEM tokens exactly, no invented hex | ✓ PASS | `class="dark"`, dark-only. Every `:root` var traces to DESIGN-SYSTEM §1/§5 verbatim (surfaces, text, emerald `#10b981`, amber `#f59e0b`, danger trio, shadow-sm/pop, glow-focus). No stray hex in the markup — all colors reference `var(--…)`. |
| 5.2 | Scannable 4-group analytics dashboard as stat cards/rows, not a dense table | ✓ PASS | 3-col grid — Module 1 Total Members + educator/student split, Module 2 Messages (7D), Module 3 Assignments + due-soon/overdue — plus Module 4 Recent Activity list. The 4 aggregate groups (members/roles · messages · assignments/submissions · activity) are legible at a glance. |
| 5.3 | Calm/academic/low-noise — NOT a growth dashboard; stat cards + counts only, no charts | ✓ PASS | No charts, sparklines, or histograms anywhere. Single restrained scalar delta ("+412 versus last week"). Reads calm, quiet, academic. |
| 5.4 | All 4 states (loading/loaded/empty/forbidden) designed | ✓ PASS | loading = skeleton grid + spinner (mirrors loaded geometry, no jump; DS §8 "never spinners for content lists" honored via skeletons); loaded; empty = "No activity yet" graceful zero-state; forbidden = clean "Access Restricted". |
| 5.5 | Owner/educator-gated framing visually clear, consistent with ServerPlanPanel tier framing | ✓ PASS | "School Plan" pill (emerald-dotted) in loaded + empty headers; emerald-active "Educator Console" nav item with shield-check glyph; subhead "Read-only aggregate metrics…". Framing legible and on-idiom. |
| 5.6 | Accessible: WCAG AA contrast; correct `--danger-text`/`--danger-btn`; keyboard-navigable | ⚠️ PARTIAL | Danger tokens correct (see §3). `prefers-reduced-motion` guards present on shimmer + stat-card hover ✓. **But:** stat numerals exceed the §2 type scale (see 5.3-adjacent CONCERN-4), and nav uses native `<a>`/`<button>` (keyboard-reachable) with no explicit `focus-visible` ring token — relies on browser default. Recommend a tokened `--glow-focus` ring at B-3. |
| 6.1 | NO charts / graphs / time-series viz | ✓ PASS | None present. |
| 6.2 | NO B2B2C / pricing / success-metric UI | ✓ PASS | "School Plan" is a gating tier *marker*, not a pricing/upsell surface. No partnership UI, no M13 metric surfacing. |
| 6.3 | Read-only, NO mutation of server data | ✓ PASS | Zero forms/inputs/toggles/mutating buttons. "Back to Server" + a passive "Sync 2m ago" status pill only. Activity footer "Displaying recent ledger" is informational. |

---

## 2. UX flow audit (settings-surface coherence)

| Aspect | Result | Note |
|--------|--------|------|
| Entry / context clear | ✓ PASS | Left rail "Advanced CS 101 → Server Settings" with Overview / Roles / Your Plan / **Educator Console** (active) mirrors the exact ServerPlanPanel sibling surfaces brief §2 names. Console sits where expected. |
| Gated framing legible | ✓ PASS | Emerald "School Plan" pill + shield-check header glyph + "Read-only aggregate metrics to monitor general server health…" subhead make entitlement posture explicit. |
| loading → loaded → empty transitions sensible | ✓ PASS | Skeleton mirrors the loaded 3-card + activity geometry, so no layout jump on resolve. Empty is a distinct graceful zero-state (tray icon + "No activity yet"), not an error. |
| forbidden state | ✓ PASS | Centered lock card, "Access Restricted / strictly reserved for authorized educators on designated School tier servers", danger-text on danger/10 tint, plus a machine code `ERR_INSUFFICIENT_ROLE_ENTITLEMENT`. Reads intentional, not a crash. |
| Demo overlays / state-switchers | ✓ PASS | No visible switcher UI. State selection is via commented CSS `.console-state-*` display rules (dev-only, invisible in render). B-3 replaces with real conditional rendering. |

---

## 3. DESIGN-SYSTEM.md token audit (§1 color / §2 type / §3 spacing / §4 radius / §5 shadow)

**Colors — fully traceable:**
- Every `:root` primitive matches DESIGN-SYSTEM §1/§5 exactly: `--surface-950…500`, `--border-hairline`/`--border-hover`, `--text-primary/secondary/muted`, `--accent-emerald`, `--accent-amber`, `--danger`/`--danger-btn`/`--danger-text`, `--shadow-sm`/`--shadow-pop`, `--glow-focus`. ✓
- No hardcoded hex in the body markup — all colors go through `var(--…)`. `selection:bg-[var(--accent-emerald)]` uses the token. ✓
- **Danger-token correctness (§1):** Overdue chip label + count use `--danger-text` `#f87171` (6.30:1 on tint — PASS). Forbidden icon + heading use `--danger-text` on a `rgba(239,68,68,0.1)` tint — correct on-tint use. **No white text sits on a `--danger` `#ef4444` fill anywhere** → the documented AA-fail trap is avoided. `--danger-btn` correctly not needed (read-only surface, no danger button). ✓
- **Accent assignment (§1 / brief §4):** emerald = console accent, positive `+412` delta, School-Plan dot, active nav; amber = "Due Soon" chip. Correct academic/alert split. ✓

**Typography:**
- ✓ Family is **Geist** (Google Fonts wght 400/500/600 = DS §2 weights) with `-apple-system` fallback. On-system.
- ✓ Label idiom `text-xs font-semibold uppercase tracking` (`.label-text`) matches brief §4 / ServerPlanPanel. Panel title `text-[17px] font-semibold` matches brief §4 exactly.
- ✗ **Stat numerals exceed the DS §2 scale.** Hero stat values use `text-2xl` (24px) — `342`, `15,289`, `942`. Per §2, `text-2xl` (24px) is reserved for "landing/empty-state headlines"; the largest in-panel data step is `text-xl` (20px). Brief §4 calls stat values "**Body-m**" (i.e. `text-base`/`text-sm`), not a 24px display size. See CONCERN-4.

**Spacing / radius / shadow:**
- ✓ Panel `rounded-lg` (0.5rem = DS §4 `--radius-lg`); nav items `rounded-md` (DS §4). Stat-card `p-6` (24px, DS §3), body `space-y-8` (32px, DS §3), grid `gap-6` (24px, DS §3). All on the 4px scale.
- ✓ `--shadow-sm: 0 1px 2px rgba(0,0,0,0.4)` matches DS §5 + brief §4 exactly.
- ✓ Motion: `transition-colors 150ms` on nav/rows (DS §6 default); shimmer + hover both gated behind `prefers-reduced-motion: no-preference` (DS §6 requirement met). No bouncy easing. On-budget.

---

## 4. Icon audit (DESIGN-SYSTEM §7 / `apps/web/src/shell/icons.tsx`)

**Critical finding — delivery idiom mismatch.** The mockup loads the **Phosphor web CDN** (`<script src="…@phosphor-icons/web">`) and renders every icon as `<i class="ph ph-…">`. The shipped project set is **inline stroke-based SVG React components** (`icons.tsx`: 24×24 viewBox, `stroke="currentColor"`, `aria-hidden="true"` default). B-3 builds `EducatorAdminConsole.tsx` from those components — the `<i class="ph">` markup and the CDN `<script>` will not exist in the real component, so any glyph without an `icons.tsx` export cannot render as-is. Shapes are Phosphor-family (correct per DS §7); the *delivery* is off-idiom. See CONCERN-1.

Cross-check of every glyph used (shipped exports confirmed in `icons.tsx`):

| Mockup glyph | Shipped counterpart | Result |
|---|---|---|
| `ph-shield-check` (nav, headers) | `ShieldCheckIcon` | ✓ |
| `ph-arrow-left` ("Back to Server") | `ArrowLeftIcon` | ✓ |
| `ph-arrows-clockwise` (sync pill) | `ArrowsClockwiseIcon` | ✓ |
| `ph-users` (members) | `UsersIcon` | ✓ |
| `ph-clipboard-text` (assignments, log row) | `ClipboardTextIcon` | ✓ |
| `ph-clock` (due soon) | `ClockIcon` | ✓ |
| `ph-warning-circle` (overdue) | `WarningCircleIcon` | ✓ |
| `ph-hash` (channel-created log row) | `HashIcon` | ✓ |
| `ph-lock` (forbidden) | `LockKeyIcon` | ✓ acceptable |
| `ph-spinner` (loading) | `SpinnerIcon` | ✓ |
| `ph-list` (mobile header) | `MenuIcon` (equivalent) | ✓ acceptable |
| `ph-user-plus` (role-modified log row) | `UserAddIcon` (equivalent) | ✓ acceptable |
| `ph-chat-circle` (Messages 7D) | none exact — set has `ChatsCircleIcon` / `ChatTeardropIcon` | ⚠️ rename to `ChatsCircleIcon` (see CONCERN-3) |
| `ph-tray` (empty-state icon) | **none** | ✗ **off-set** (see CONCERN-2) |

12 of 14 glyphs map cleanly to shipped exports; `ph-chat-circle` needs a rename; `ph-tray` has no counterpart.

---

## Concerns (actionable, cited)

**CONCERN-1 (BLOCKING — brief §4 "reuse `icons.tsx`" / icon-audit) — icon delivery idiom is wrong.**
Icons render via the Phosphor web CDN (`@phosphor-icons/web`, `<i class="ph …">`). B-3 must build against the inline-SVG components in `apps/web/src/shell/icons.tsx` (`stroke="currentColor"`, `aria-hidden`), NOT introduce the webfont dependency. *Fix:* annotate the adopted mockup with the glyph→component map (§4 table) so B-3 does not copy the `<i class="ph">` markup or the CDN `<script>`. No visual change — the shipped set is the same Phosphor shapes.

**CONCERN-2 (BLOCKING — brief §4 "no new icons unless unavoidable" / icon-audit "no off-set icons") — `ph-tray` is off-set.**
The empty-state icon (`ph-tray`) has no export in `icons.tsx`. *Fix:* substitute a shipped glyph — `ClipboardTextIcon` (academic/assignments idiom) reads naturally for "no activity yet"; `UsersIcon` also works. Do not add a Tray icon for a single empty-state.

**CONCERN-3 (MINOR — icon audit) — `ph-chat-circle` rename.**
Nearest shipped export is `ChatsCircleIcon` (plural). Functionally equivalent; annotate so B-3 uses the correct component name (there is no `ChatCircleIcon`).

**CONCERN-4 (BLOCKING — DESIGN-SYSTEM §2 / brief §4 "Body-m") — stat numerals exceed the type scale.**
Hero stat values use `text-2xl` (24px), reserved by §2 for landing/empty-state headlines; the largest in-panel data step is `text-xl` (20px), and brief §4 specifies "Body-m" for stat values. A 24px numeral nudges the calm read-only panel toward the "big-number growth-dashboard" look §5 rejects. *Fix:* drop stat values to `text-xl` at most (`text-lg`/`text-base` is more faithful to "Body-m"). Sub-stat values already correctly use `text-[15px]`.

**CONCERN-5 (MINOR — correctness / a11y) — stray class typo on forbidden icon.**
`<i class="ph ph-lock p text-2xl">` (forbidden state) carries a stray `p` token (no such utility). Harmless in render; clean it so it does not propagate into B-3.

**CONCERN-6 (NON-BLOCKING / note for B-3) — static placeholder strings.**
"Sync 2m ago" and "142 total events recorded this week" are hardcoded. Fine for a mockup — flagging so B-3 wires them to real aggregates (or omits if outside the read-only aggregate contract) rather than shipping literals.

---

## Required revisions (measurable, actionable)

1. **Map icons to the shipped SVG set** — B-3 builds `EducatorAdminConsole.tsx` from `icons.tsx` components, not the Phosphor web CDN / `<i class="ph">` markup. Annotate the adopted mockup with the §4 glyph→component map. *[brief §4 — blocking]*
2. **Substitute `ph-tray`** (empty-state) with a shipped export — `ClipboardTextIcon` or `UsersIcon`. *[brief §4 — blocking]*
3. **Drop stat-value numerals** from `text-2xl` (24px) to `text-xl` max (prefer `text-lg`/`text-base` per brief §4 "Body-m"). *[DESIGN-SYSTEM §2 / brief §4 — blocking]*
4. **Rename `ph-chat-circle` → `ChatsCircleIcon`** in the annotation. *[icon audit — minor]*
5. **Delete the stray `p` class** on the forbidden lock icon. *[correctness — minor]*
6. **Flag static strings** ("Sync 2m ago", "142 total events") for B-3 wiring. *[non-blocking]*

Items 1–3 are blocking (brief §4 icon contract + DS §2 type scale). Items 4–6 are should-fix before adoption. Everything else — palette, states, gated framing, danger tokens, Geist, spacing/radius/shadow, out-of-scope adherence — is correct as shipped.
