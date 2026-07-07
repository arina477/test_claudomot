# D-3 Review — Educator Admin Console (`/ui-ux-pro-max`)

**Reviewer role:** requirement + UX-best-practice + design-token audit
**Target:** `design/staging/educator-admin-console.html`
**Brief:** `process/waves/wave-76/stages/D-1-brief/educator-admin-console-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`

---

## VERDICT: **REVISE**

The mockup is well-structured, all four states are present, the gated framing reads clearly, and the aesthetic is broadly calm/academic. But it **violates two hard brief constraints** (a chart appears despite brief §6's explicit "NO charts/graphs"; the console renders a mutation-style "System Audit Log" and role-modification event that read as admin actions, straining the read-only §6 constraint) and it **imports an off-system font + off-system icons** (Outfit instead of Geist; three Phosphor glyphs with no counterpart in `apps/web/src/shell/icons.tsx`). These are concrete, measurable, and fixable — hence REVISE, not REJECT. None is a fundamental re-architecture.

---

## 1. Brief success-criteria checklist (brief §5 / §6)

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| 5.1 | Dark-mode only; consumes DESIGN-SYSTEM tokens exactly, no invented hex | ⚠️ PARTIAL | Dark-only ✓. Surface/text/accent/danger tokens all trace to DESIGN-SYSTEM §1. But raw hex `#10b981` is hardcoded in the `selection:` / `bg-[#10b981]/30` Tailwind classes (body line 162) and demo-overlay ring instead of `var(--accent-emerald)` — see §3. |
| 5.2 | Scannable 4-group analytics dashboard (members/roles, messages, assignments/submissions, activity) as stat cards/rows, not a dense table | ✓ PASS | All 4 groups present as distinct cards (Module 1 roster+role split, Module 2 messages, Module 3 assignments/submissions, Module 4 activity log). Scannable at a glance. |
| 5.3 | Calm/academic/low-noise — NOT a data-viz-heavy growth dashboard; **stat cards + counts only, no charts this slice** | ✗ **FAIL** | Module 2 renders a **7-bar CSS histogram** ("Simulated 7-day volume histogram", lines 368–377) with an emerald glow bar. This is a chart/time-series viz — directly prohibited by brief §6 ("NO charts / graphs / time-series viz"). Must be removed and replaced with a scalar (e.g. "+8% vs last week" text, matching the roster's "+12 this week" idiom). |
| 5.4 | All 4 states (loading/loaded/empty/forbidden) designed | ✓ PASS | All four present and switchable; loading uses skeletons (correct per DS §8 "never spinners for content lists"); empty is a graceful zero-state; forbidden is clean. |
| 5.5 | Owner/educator-gated framing visually clear (subtle "Educator"/"School plan" marker, consistent with ServerPlanPanel tier framing) | ✓ PASS | "School Plan" pill on loaded + empty, emerald-dotted; sidebar "Educator Console" nav item is emerald-active with a shield glyph. Framing legible. |
| 5.6 | Accessible: WCAG AA contrast on all text; correct `--danger-text`/`--danger-btn`; keyboard-navigable | ⚠️ PARTIAL | `--danger-text` (#f87171) is correctly used for red text on danger/10 tints (forbidden icon, overdue chip/count — lines 288, 429, 432, 436) ✓. `--danger-btn` correctly reserved for the demo button fill under white text ✓. **But:** `--text-muted` (rgba 255/.40 ≈ 3.6–3.8:1 on surface-800/900) is used for real content, not just placeholders — the forbidden error code (line 296), the empty-state icon, and the "Synchronized 2 mins ago" / log timestamps. On body text this is a WCAG AA (4.5:1) fail; on the ≥18px empty headline it passes as large text. Flag: audit each `--text-muted` usage — decorative/metadata OK, but the forbidden `ERR_...` string and any sub-16px muted copy should move to `--text-secondary`. No visible focus-ring styling on the sidebar `<a>` nav links or "View All Logs" button beyond default; keyboard-nav present via native elements but focus-visible not explicitly tokened. |
| 6.1 | NO charts / graphs / time-series viz | ✗ **FAIL** | See 5.3 — the histogram violates this. |
| 6.2 | NO B2B2C / pricing / success-metric UI | ✓ PASS | No pricing or partnership UI. "School Plan" is a tier *marker*, not a pricing surface — acceptable. |
| 6.3 | Read-only, NO mutation of server data from the console | ⚠️ PARTIAL | No forms/inputs/toggles ✓. But Module 4 is titled **"System Audit Log"** and surfaces mutation *events* ("Role Entitlement Modified… Added the manage_assignments capability", "Channel Created") with a "View All Logs" action. This reframes a read-only analytics console as an admin/audit surface — beyond the brief's "recent activity" (brief §3 loaded: "recent activity"). Recommend renaming to "Recent Activity" and softening entries to analytics-flavored events, to stay inside the read-only-aggregates framing. |

---

## 2. UX flow audit (settings-surface coherence)

| Aspect | Result | Note |
|--------|--------|------|
| Entry / context clear | ✓ PASS | Left rail "Server Settings → Advanced CS 101" with Overview / Roles / Your Plan / Educator Console mirrors the ServerPlanPanel sibling-surface idiom (brief §2). Console sits where expected. |
| Gated framing legible | ✓ PASS | Emerald "School Plan" pill + crown/shield header marker + "Read-only aggregate metrics… Individual student message content is sequestered" subhead (line 319) make the entitlement + privacy posture explicit. Strong. |
| loading → loaded → empty transitions sensible | ✓ PASS | Skeleton layout mirrors the loaded bento geometry (header + 2-up + panel) so there is no layout jump. Counter animation on load is a reasonable "data mounting" affordance. |
| Empty state | ✓ PASS | "No activity globally recorded / This server is currently pristine…" with a "Return to Settings" CTA — graceful zero-state, not an error (brief §3 empty requirement met). Minor: the `ph-chart-line-down` icon is a *declining-chart* glyph (semantically "loss/down") for an empty state — off-message tone and off-system icon (see §4). |
| Forbidden state | ✓ PASS | Clean lock-key card, "Access Restricted / reserved strictly for owners and authorized educators on a School tier plan", danger-text on danger/10 tint. Reads as intentional, not a crash. |
| Concern | — | The demo state-switcher overlay (lines 164–170) is explicitly injected for review and must NOT ship — confirm it is stripped at build. Not a blocker for adoption, but flag for B-3. |

---

## 3. DESIGN-SYSTEM.md token audit (§1 color / §2 type / §3 spacing / §4 radius / §5 shadow)

**Colors — mostly traceable, a few off-token:**
- All `--surface-*`, `--text-*`, `--accent-emerald`, `--accent-amber`, `--danger`, `--danger-btn`, `--danger-text`, `--border-*`, `--shadow-*`, `--glow-focus` primitives in the `:root` block match DESIGN-SYSTEM §1/§5 **exactly**. ✓
- ✗ **Hardcoded `#10b981`** appears in Tailwind arbitrary values instead of the token: `selection:bg-[#10b981]/30` (line 162) and the demo overlay `background: var(--accent-emerald)` is fine but the loaded-button ring references. Replace literal hex with `var(--accent-emerald)` for single-source-of-truth (DESIGN-SYSTEM §1 "no invented hex" — here it is the *right* value but bypasses the token).
- ✗ **`--danger` raw rgba `rgba(239, 68, 68, 0.1)` / `0.2`** is used inline for danger-tint fills/borders (forbidden icon line 287, overdue icon line 428). The value equals `--danger` at low alpha, which is the documented pattern, but it is written as a literal rather than `color-mix`/token — acceptable per DS (danger fill/border use is allowed) but note it is not a named token. Low severity.
- ✓ `--accent-amber` correctly assigned to the assignments "Focus Areas / Due Soon" accent (brief §4 amber = assignments/due-soon). Emerald correctly reserved for positive/primary (roster growth, completion rate, active bar). Assignment split is on-spec.

**Typography — off-system font family:**
- ✗ **Font is `Outfit`** (loaded from Google Fonts, lines 8–11, and `font-family: 'Outfit'` line 58). DESIGN-SYSTEM §2 mandates **`Geist`, system-ui fallback**. Outfit is not in the design system. Must switch to Geist. Medium-high severity — this is a visible brand-consistency break vs the shipped panels.
- ✗ **Display sizes exceed the DS scale.** DESIGN-SYSTEM §2 tops out at `text-2xl` (24px, empty-state headlines). The stat values use `text-6xl` (line 338, 364) and `text-5xl` (line 397). The DS has no 60px/48px step; these read closer to a "growth dashboard" hero-number treatment than the calm/academic panel idiom the brief §5 asks for. Recommend dropping to `text-3xl`/`text-4xl` max, or explicitly extending the DS §2 scale at D-3 canonicalization if large stat numerals are wanted system-wide.
- ✓ Label idiom (`text-xs font-semibold uppercase tracking-widest`, `.label-text` class lines 114–120) matches brief §4 / ServerPlanPanel exactly. Panel-title weights (600 semibold) on-spec.

**Spacing / radius / shadow:**
- ✓ Panel `rounded-lg` (0.5rem = 8px, DS §4 `--radius-lg`), stat-card `p-6` (24px, within DS §3 scale), inter-card `gap-4`/`gap-5`. `gap-5` (20px) is off the DS §3 4px scale steps (…16 / 24…) — 20px is a valid 4px multiple but not an enumerated step; low severity, prefer `gap-4` or `gap-6`.
- ✓ `--shadow-sm: 0 1px 2px rgba(0,0,0,0.4)` matches DS §5 and brief §4 exactly.
- ⚠️ Motion: `clipReveal` 0.8s reveal + 2s counter animation + `--spring-bounce` easing defined. DS §6 says "No bouncy/playful easing — keep it calm and quick" and default 150ms / elevated 300ms. The 800ms cinematic reveal and 2000ms counter run are slower/showier than the DS motion budget and lean "growth dashboard." `--spring-bounce` is defined but (correctly) not applied to the reveal; still, remove it or confirm unused. Also **no `prefers-reduced-motion` guard** (DS §6 requires it) — the counter + reveal + shimmer must be gated. Medium severity.

---

## 4. Icon audit (DESIGN-SYSTEM §7 / `apps/web/src/shell/icons.tsx`)

The shipped set (`icons.tsx`) contains: ShieldCheck, Crown, LockKey, Users, ClipboardText, WarningCircle, ArrowsClockwise, Spinner, UserAdd, Menu, Clock, TimerFill, ArrowLeft, SignOut, ChatTeardrop, ChatsCircle, Flag, etc. Cross-check of every glyph used:

| Mockup glyph | Shipped counterpart | Result |
|---|---|---|
| `ph-shield-check` (sidebar, empty header) | `ShieldCheckIcon` | ✓ |
| `ph-crown` (loaded header) | `CrownIcon` | ✓ (matches brief §4 "Crown/Shield-style header icon") |
| `ph-lock-key` (forbidden) | `LockKeyIcon` | ✓ |
| `ph-users` (roster) | `UsersIcon` | ✓ |
| `ph-clipboard-text` (assignments, log) | `ClipboardTextIcon` | ✓ |
| `ph-warning-circle` (overdue) | `WarningCircleIcon` | ✓ |
| `ph-arrows-clockwise` (sync) | `ArrowsClockwiseIcon` | ✓ |
| `ph-spinner` (loading) | `SpinnerIcon` | ✓ |
| `ph-list` (mobile header) | `MenuIcon` (equivalent) | ✓ acceptable |
| `ph-user-plus` (log entry) | `UserAddIcon` (equivalent) | ✓ acceptable |
| `ph-arrow-circle-left` ("Back to Server") | none (set has `ArrowLeftIcon`, `SignOutIcon`) | ✗ **off-set** — swap to `ArrowLeftIcon`. |
| `ph-chart-line-down` (empty-state icon) | none | ✗ **off-set** AND semantically wrong (declining-chart tone for an empty state). Replace with an on-set neutral glyph (e.g. `CompassIcon`, `ClipboardTextIcon`, or `UsersIcon`). |
| `ph-chat-centered-text` (messages) | none exact (set has `ChatTeardropIcon`, `ChatsCircleIcon`) | ✗ **off-set** — swap to `ChatsCircleIcon` or `ChatTeardropIcon`. |
| `ph-clock-countdown` (due soon) | none exact (set has `ClockIcon`, `TimerFillIcon`) | ✗ **off-set** — swap to `ClockIcon` or `TimerFillIcon`. |
| `ph-tag` (log entry) | none | ✗ **off-set** — swap to an on-set glyph or drop. |

All glyphs are Phosphor-family (correct family per DS §7), but **five reference Phosphor icons that are not in the shipped inline set** — brief §4 says "no new icons unless unavoidable." Each has an on-set substitute; none is unavoidable. Must be swapped to shipped icons before B-3 (which builds inline SVGs from `icons.tsx`, not the Phosphor web CDN — the mockup's `<script src="@phosphor-icons/web">` won't exist in the real component, so any glyph without an `icons.tsx` export cannot be rendered as-is).

---

## Required revisions (measurable, actionable)

1. **Remove the 7-bar histogram** (Module 2, lines 368–377). Replace with a scalar delta text ("+8% vs last week") in the roster "+12 this week" idiom. *[brief §5.3 / §6.1 — hard fail]*
2. **Switch font from Outfit → Geist** (lines 8–11, 58). *[DESIGN-SYSTEM §2]*
3. **Swap 5 off-set icons** to shipped `icons.tsx` exports: `arrow-circle-left`→ArrowLeft, `chart-line-down`→neutral on-set glyph, `chat-centered-text`→ChatsCircle, `clock-countdown`→Clock, `tag`→on-set. *[brief §4 / DESIGN-SYSTEM §7]*
4. **Add `prefers-reduced-motion` guard** on reveal/counter/shimmer; trim the 800ms reveal + 2000ms counter toward the DS §6 calm-and-quick budget; remove unused `--spring-bounce`. *[DESIGN-SYSTEM §6]*
5. **Move real-content `--text-muted` usage to `--text-secondary`** where sub-18px (forbidden `ERR_` code line 296; verify log timestamps). *[brief §5.6 / WCAG AA]*
6. **Rename "System Audit Log" → "Recent Activity"** and soften mutation-event entries so the surface reads read-only, not admin-action. *[brief §6.3]*
7. **Replace literal `#10b981`** in `selection:` / arbitrary Tailwind classes with `var(--accent-emerald)`; consider dropping stat-value type from `text-6xl`/`text-5xl` to `text-3xl`/`text-4xl` (or extend DS §2 scale explicitly). *[DESIGN-SYSTEM §1 / §2]*
8. **Confirm the demo state-switcher overlay is stripped** before B-3 build (lines 164–170).

Items 1–3 are blocking (hard constraint / brand break). Items 4–8 are should-fix before adoption.
