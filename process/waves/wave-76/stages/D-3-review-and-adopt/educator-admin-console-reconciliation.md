# Wave 76 — D-3 Reconciliation (Educator Admin Console) — iteration 0→1

| Reviewer | Verdict |
|---|---|
| /plan-design-review | REVISE (avg 7.0/10) |
| /ui-ux-pro-max | REVISE |

**Matrix: REVISE + REVISE → aggregate both → D-2 refine (iteration 1; cap 3).** Both independently flagged the SAME core drift: the mockup leans into a "growth dashboard" aesthetic the brief §5/§6 explicitly fences. Consolidated actionable concerns → refine prompt.

## Aggregated refine concerns (both reviewers)
1. REMOVE the 7-bar histogram / any chart (brief §6 "NO charts/graphs") — replace with scalar count/delta stats.
2. Font: Outfit → **Geist** (DESIGN-SYSTEM §2 mandates Geist).
3. Motion: cut the 0.8s clipReveal + 2s counter animation; cap transitions ≤300ms; add `prefers-reduced-motion` guard; reduce neon glows to subtle (DS §5/§6) — calm/quiet, not cinematic.
4. Empty-state copy → exactly **"No activity yet"** (brief §3/§5).
5. Grid gaps → normalize to `gap-4` (24px) across loading + loaded (brief §4, DS §3).
6. Icons: the 5 off-set icons (ph-arrow-circle-left, ph-chart-line-down, ph-chat-centered-text, ph-clock-countdown, ph-tag) have NO export in apps/web/src/shell/icons.tsx — substitute on-set icons only (brief §4 "no new icons unless unavoidable").
7. `--text-muted` (~3.6:1) on sub-18px real content (incl the forbidden ERR_ code) → `--text-secondary` (WCAG AA).
8. Oversized stat numerals (text-6xl/5xl) → cap at DS §2 scale (≤text-2xl) — the oversize reads growth-dashboard.
9. Rename "System Audit Log" → **"Recent Activity"** (read-only framing, brief §6 no audit/mutation surface).
10. Hardcoded `#10b981` in selection/arbitrary classes → `var(--accent-emerald)`.
11. Strip the demo state-switcher overlay before adoption.

**Overall steer:** pull back to the calm, read-only, low-noise academic settings surface (ServerPlanPanel-consistent), NOT a kinetic growth dashboard.
Next destination: **D-2 refine** (aidesigner refine_design, iteration 1) → re-run D-3 Phase 1.

---
## Iteration 1→2 reconciliation
| Reviewer | Verdict |
|---|---|
| /plan-design-review | APPROVE (9.0/10) — all brief fences confirmed fixed |
| /ui-ux-pro-max | REVISE — 3 minor mechanical items |
**Matrix: APPROVE + REVISE → aggregate B's concerns → D-2 refine (iteration 2; cap 3).** Concerns are mechanical (not aesthetic): (1) icons must all map to the shipped inline-SVG set apps/web/src/shell/icons.tsx (swap ph-tray → an on-set icon; the CDN-webfont-vs-inline-SVG idiom is a B-3 port note, annotated at adopt); (2) stat numerals text-2xl → text-xl (DS §2: 24px reserved for landing headlines; brief §4 Body-m); (3) plan-design non-blocking polish folded in: strip the stray `p` class typo on the forbidden lock icon, responsive card padding p-4 sm:p-6, focus-visible rings on nav.
Next: D-2 refine (aidesigner) iteration 2 → re-run D-3 Phase 1.
