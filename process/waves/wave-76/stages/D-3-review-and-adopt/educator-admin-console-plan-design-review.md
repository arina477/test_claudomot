# D-3 Plan-Design Review — Educator Admin Console (wave-76)

**Reviewer role:** `/plan-design-review` (designer's-eye, per-dimension 0–10)
**Artifact:** `design/staging/educator-admin-console.html`
**Brief:** `process/waves/wave-76/stages/D-1-brief/educator-admin-console-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`

## VERDICT: **REVISE**

Strong bones — the 4-state coverage is complete, the gating framing is clear, the danger-token usage is correct, and the stat-card scannability is genuinely good. But the mockup violates two **explicit, load-bearing brief fences** (no charts; calm/low-noise not growth-dashboard) and swaps the mandated typeface. These are measurable, bounded fixes a refine pass can land without a rebuild — hence REVISE, not APPROVE and not REJECT.

---

## Per-dimension scores

### Visual hierarchy — 8/10
The loaded dashboard is scannable: the 5xl/6xl `font-light tabular-nums` stat values read at a glance, uppercase tracked labels (`.label-text`, line 114) match the ServerPlanPanel label idiom (brief §4 typography), and the asymmetric 5/7/12 grid gives each of the aggregate groups a legible zone. Header + tier badge + descriptor establishes the console context immediately.
- **Concern (−2):** The brief (§3, §5) names exactly **4 aggregate groups** (members/roles, messages, assignments/submissions, activity). The mockup adds a 5th zone — "Focus Areas" (Due Soon / Overdue, lines 407–438) — split into Module 3's right half, plus a "System Audit Log" that duplicates the "activity" group's job with heavier chrome. This is one more competing focal band than the brief scoped, diluting the "4 groups legible at a glance" success criterion (§5).
- **What makes it a 10:** Collapse to the 4 named groups; fold "Due Soon / Overdue" into the assignments group as a compact sub-stat rather than a co-equal warning panel, so the eye lands on 4 zones, not 5–6.

### Spacing rhythm — 7/10
Radius is on-system: panels and cards use `border-radius: 0.5rem` = 8px = `--radius-lg` (DESIGN-SYSTEM §4). Card padding `1.5rem` (24px, line 92) and `p-6`/`p-8` sit on the 4px base scale (§3). Panel shadow `--shadow-sm` `0 1px 2px rgba(0,0,0,0.4)` matches the ServerPlanPanel idiom (brief §4 shadows, §5 DESIGN-SYSTEM).
- **Concern (−3, measurable):** Grid gaps are inconsistent with the brief's `gap-4` spec (§4 "inter-section gap `gap-4`"). Loaded state uses `gap-5` (20px, line 329); loading state uses `gap-4` (line 224). 20px is off the named rhythm and disagrees with the sibling state. Also `mb-8 md:mb-12` (32/48px) header margins and `mt-4` on Module 4 introduce a third gap value where the system wants section gaps at 24px (§3).
- **What makes it a 10:** Normalize all inter-card/inter-section gaps to `gap-4`/24px per brief §4 and DESIGN-SYSTEM §3; make loading and loaded states use the identical grid gap so the skeleton predicts the real layout.

### Brand coherence — 4/10
Palette primitives are correct (zinc surfaces + emerald + amber, all consumed as tokens, no invented hex in the core stat chrome). But three things push it out of the "calm · academic · low-noise" lane the brief and DESIGN-SYSTEM §preamble demand:
- **Concern A — wrong typeface (measurable):** Loads `Outfit` (line 11, and `font-family: 'Outfit'` line 58). DESIGN-SYSTEM §2 mandates **`Geist`, system-ui fallback**. Outfit is an invented, off-system face. Fix: swap to `Geist`.
- **Concern B — chart / growth-dashboard look (brief §6 + §5 explicit fence):** Module 2 renders a **7-bar histogram** (lines 368–377) with an emerald glow bar (`shadow-[0_0_12px_rgba(16,185,129,0.4)]`). Brief §6: "**NO charts / graphs / time-series viz**"; §5: "NOT a data-viz-heavy 'growth dashboard' ... **no charts this slice**; stat cards + counts only." This is a direct fence violation. Fix: delete the histogram; keep the count + a text delta only.
- **Concern C — noise / AI-slop against §5 elevation + §6 motion:** Multiple neon-ish glows (`shadow-[0_0_8px...]` presence dot line 314, `shadow-[0_0_6px...]` amber dot line 409, blur orbs lines 266/286), a `clipReveal` cinematic 0.8s expo entrance (lines 143–157), and a 2s "kinetic counter" number animation (lines 550–583). DESIGN-SYSTEM §5: dark UI "leans on borders + subtle glows, **not heavy drop-shadows**"; §6: "**No bouncy/playful easing — keep it calm and quick**," default 150ms, elevated 300ms, and "respect `prefers-reduced-motion`" (the mockup has no reduced-motion guard). The 0.8s staggered reveal + 2s counters read as marketing-page flourish, not a calm academic settings surface.
- **What makes it a 10:** Geist font; remove the histogram; strip decorative glows/blur-orbs down to `--glow-subtle` only where a state genuinely needs emphasis; cut counter animation and cap entrance transitions at ≤300ms with a `prefers-reduced-motion` guard.

### Edge-case handling — 9/10
All **4 brief-required states** are present and individually designed: loading (skeleton shimmer, lines 212–247), loaded (301–499), empty (250–280), forbidden (283–298). Loading uses skeleton blocks (correct per DESIGN-SYSTEM §8 "never spinners for content lists") — good, though it also shows a spinner in the header, a minor mixed signal. Forbidden is a clean access-denied with lock icon + explanation.
- **Concern (−1, measurable copy mismatch):** Empty-state headline reads **"No activity globally recorded"** (line 271); brief §3/§5 specify the **"No activity yet"** affordance. "globally recorded" + "server is currently pristine" is off-tone for the calm academic voice. Fix: use "No activity yet" as the headline, plain one-line body.
- **What makes it a 10:** Match the brief's "No activity yet" copy; drop the header spinner in loading in favor of skeleton-only per §8.

### Accessibility — 6/10
Danger tokens are used **correctly**: `--danger-text` (#f87171) appears only on danger/10 tints (forbidden icon line 288, overdue rows lines 429/436) — the exact PASS case DESIGN-SYSTEM §1 prescribes (6.30:1 vs the 3.93:1 FAIL of raw #ef4444 on tint). The demo state-switcher even self-documents WCAG intent (line 528). Emerald is used as an accent/border/dot, never as a fill under light text in the console body, avoiding the ~1.76:1 white-on-emerald trap.
- **Concern A (measurable):** No `prefers-reduced-motion` handling despite `clipReveal`, shimmer, and 2s counters — DESIGN-SYSTEM §6 requires it. The counter animation also means stat values are mid-count / not final text on load, which hurts SR and low-vision users reading the number.
- **Concern B (measurable):** `--text-muted` (rgba 255/.40 ≈ ~4.6:1 on `--surface-800`) carries meaningful copy — the forbidden error code (line 296), empty-state is `--text-secondary` (ok), audit-log timestamps (lines 461/475/489). At .40 opacity muted text is borderline for AA on body text; acceptable for decorative/metadata but the forbidden `ERR_INSUFFICIENT_ROLE_ENTITLEMENT` is arguably informational. Keep muted for true metadata only.
- **Concern C — semantics/keyboard:** State containers toggle via `display:none/block` (§ `.console-state`, lines 126–127) which is fine, but the loaded dashboard has no landmark/heading structure beyond raw `<h2>/<h3>` and the stat cards aren't marked as a list or described set; audit log is a real `<ul>` (good). No visible focus-ring proof on the interactive "View All Logs" / "Return to Settings" buttons beyond `focus:ring-2` utility (present on some, e.g. line 275; absent styling contract on line 446).
- **What makes it a 10:** Add `@media (prefers-reduced-motion: reduce)` disabling reveal/shimmer/counters; render final stat values as static text (animate only if motion allowed); confirm every interactive control has a visible `--glow-focus` ring; keep informational text at `--text-secondary` or brighter.

### Responsive behavior — 8/10
The stat-card layout degrades sensibly: the 12-col grid collapses to `grid-cols-1` below `md` (line 329), Module 3's split interior stacks (`flex-col md:flex-row`, line 387), the sidebar rail is `hidden md:flex` with a mobile header fallback (lines 174, 203), and content is capped at `max-w-5xl` centered (line 209). Cards hold at narrow widths because each is single-column below md.
- **Concern (−2):** DESIGN-SYSTEM §9 defines breakpoints at **1024 / 1280 / 1440** (desktop app, mobile out of scope) with content max ~1100px. The mockup keys off Tailwind's default `md` (768px) and `max-w-5xl` (1024px), not the system's 1024/1280 breakpoints — so the "collapse to single column" happens at 768px rather than the system's 1024px min. Minor, but it's a different responsive contract than the shipped app uses.
- **What makes it a 10:** Align the collapse breakpoint to the DESIGN-SYSTEM §9 1024px min and cap content at ~1100px to match the shipped panes.

---

## Summary table

| Dimension | Score |
|---|---|
| Visual hierarchy | 8 |
| Spacing rhythm | 7 |
| Brand coherence | 4 |
| Edge-case handling | 9 |
| Accessibility | 6 |
| Responsive behavior | 8 |
| **Average** | **7.0** |

## Blocking items for the refine pass (all measurable)
1. **Remove the 7-bar histogram** (Module 2, lines 368–377). Brief §6 + §5 explicitly fence charts this slice. *(brand coherence)*
2. **Swap `Outfit` → `Geist`** (lines 11, 58). DESIGN-SYSTEM §2. *(brand coherence)*
3. **Strip decorative motion + glows** to system spec: cut `clipReveal` (0.8s) and 2s counters, cap transitions ≤300ms, add `prefers-reduced-motion` guard, reduce neon glows to `--glow-subtle`. DESIGN-SYSTEM §5, §6. *(brand coherence + accessibility)*
4. **Empty-state copy** → "No activity yet" per brief §3/§5 (currently "No activity globally recorded"). *(edge-case)*
5. **Normalize grid gaps to `gap-4`/24px** across loading + loaded states. Brief §4, DESIGN-SYSTEM §3. *(spacing)*

## Non-blocking (nice-to-have)
- Fold "Focus Areas" (Due Soon/Overdue) into the assignments group so exactly 4 aggregate zones read at a glance (brief §3).
- Align responsive breakpoints to DESIGN-SYSTEM §9 (1024/1280) and content cap ~1100px.
- Keep informational text at `--text-secondary`+ (avoid `--text-muted` for the forbidden error code).

Once items 1–5 land, this is an APPROVE-grade surface — the structure, state coverage, and token/danger discipline are already sound.
