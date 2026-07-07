# Design Brief — Educator Admin Console

**Wave:** 76
**Parent stage invoking:** P-1 (design_gap_flag: true) / P-3 plan
**Blocking current wave:** yes (B-3 EducatorAdminConsole.tsx builds against the adopted layout)
**Mode:** automatic

## 1. What we need

A new **Educator Admin Console** surface for a school-tier server: an owner/educator opens it to see server **analytics** (aggregate stats over already-shipped data) plus the educator-tools context — a read-only admin dashboard, calm and academic, gated so non-entitled/non-authorized users never see it.

## 2. Where it lives

- **Route / file path:** `apps/web/src/shell/EducatorAdminConsole.tsx` (new). Rendered on the per-server settings surface, alongside `ServerOverviewSettings.tsx` / `ServerRolesPage.tsx` / `ServerPlanPanel.tsx`.
- **Navigation entry:** a new entry in the server-settings surface (the same owner-gated Server Settings area that hosts Overview / Roles / Your plan), visible only when the caller is owner/educator AND the server tier enables `educatorAdminTools` (school). Mirrors the `ServerPlanPanel` gating idiom.

## 3. Audience + state

- **Who sees it:** owner OR educator member (a member holding a role with `manage_assignments`) on a **school-tier** server. Everyone else: entry hidden / access blocked.
- **States to design:**
  - **loading** — analytics fetch in flight (spinner + "Loading analytics…", matching ServerPlanPanel loading).
  - **loaded** — the analytics dashboard: member count + educator/role breakdown, message volume, assignment count + submission rollup, recent activity — as scannable stat cards / rows.
  - **empty** — a brand-new server (0 members beyond owner / 0 messages / 0 assignments): show zeroed stats gracefully, not an error ("No activity yet" affordance).
  - **forbidden** — a non-owner/non-educator or non-school caller who somehow reaches it: a clean access-denied state (should normally be prevented by the hidden entry).

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:** `--surface-800` (#1c1c1f, panel canvas) · `--surface-900` (#121214, nested cards / rail) · `--surface-700` (#27272a, borders/hover) · `--border-hairline` (rgba(255,255,255,0.06)) · `--text-primary` (rgba 255/.92, stat values + headings) · `--text-secondary` (.60, stat labels) · `--text-muted` (.40, empty-state copy) · `--accent-emerald` (#10b981, primary accent — active/positive stats, section headers, online/active) · `--accent-amber` (#f59e0b, assignments / due-soon stat accent). Restrained palette — one base (zinc) + emerald + amber; NO gaming-neon.
- **Typography:** section header (H3-scale) for "Educator Console" + each dashboard section title; Body-m for stat values; Label (uppercase tracked) for stat labels — match ServerPlanPanel's `text-xs font-semibold uppercase tracking-widest` label idiom + `text-[17px] font-semibold` panel title.
- **Spacing / radius:** panel `rounded-lg`; card padding `p-4 sm:p-6`; inter-section gap `gap-4`; nested stat card `rounded-lg p-4` — match the ServerPlanPanel structure (header + body sections).
- **Shadows:** panel `box-shadow: 0 1px 2px rgba(0,0,0,0.4)` (ServerPlanPanel idiom).
- **Icons:** reuse `apps/web/src/shell/icons.tsx` (e.g. a Crown/Shield-style icon for the console header like ServerPlanPanel's CrownIcon; Spinner for loading; WarningCircle for forbidden). Phosphor-family per the icon set; no new icons unless unavoidable.
- **Components to reuse:** the ServerPlanPanel panel chrome (header + section + nested-card + dl stat-row pattern) and ServerRolesPage full-surface layout; the credentialed-fetch + loading/error state pattern.

## 5. Success criteria (D-3 reviewers check against these)

- Dark-mode only; consumes DESIGN-SYSTEM tokens exactly (no invented hex).
- A scannable analytics dashboard: the 4 aggregate groups (members/roles, messages, assignments/submissions, activity) legible at a glance as stat cards/rows, not a dense table.
- Calm/academic/low-noise aesthetic consistent with the shipped settings panels — NOT a data-viz-heavy "growth dashboard" (no charts this slice; stat cards + counts only, matching the read-only-aggregates spec constraint).
- All 4 states (loading/loaded/empty/forbidden) designed.
- Owner/educator-gated framing is visually clear (a subtle "Educator" or "School plan" context marker), consistent with the ServerPlanPanel tier framing.
- Accessible: WCAG AA contrast on all text (use `--danger-text`/`--danger-btn` correctly if any red appears); keyboard-navigable.

## 6. Out of scope (fenced / deferred)

- NO charts / graphs / time-series viz (read-only aggregate counts only this slice; charting is a later slice if warranted).
- NO B2B2C / institution-partnership UI, NO pricing UI, NO success-metric surfacing (M13 fenced, founder-reserved).
- NO editing/mutation of server data from the console (read-only dashboard this slice).
