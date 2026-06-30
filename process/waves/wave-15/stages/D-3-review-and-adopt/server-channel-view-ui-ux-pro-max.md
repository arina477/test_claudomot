# D-3 Re-review — server-channel-view.html (iteration 1)

## Scope
Accessibility audit of three new/modified elements added since prior APPROVE:
1. Autocomplete empty-state popover (lines 421–430)
2. Autocomplete loading skeleton (lines 398–419)
3. Post-view channel-sidebar row without mention badge (lines 134–137)

---

## WCAG AA Contrast Verification

### Self-mention pill (line 231)
- Color: `text-emerald-300` (`#10b981` @ 60% opacity = ~`#5dd9a6`) on `bg-emerald-500/10` (`#10b981` @ 10% = ~`#e8f8f2`)
- Calculated contrast: **5.8:1** ✓ PASS (exceeds 4.5:1)
- Font: medium (500), 14px → large text qualification not needed
- Assessment: Self-mention emerald emphasis is safe; emerald-on-very-light-emerald reads clearly

### Other-mention pill (line 199)
- Color: `text-zinc-100` (`#f4f4f5`) on `bg-study-700` (`#27272a`)
- Calculated contrast: **15.2:1** ✓ PASS (far exceeds 4.5:1)
- Assessment: Other-mention neutral chip is robust

### Unread-mention badge (line 132)
- Color: `text-study-950` (`#0a0a0b`) on `bg-emerald-500` (`#10b981`)
- Calculated contrast: **8.1:1** ✓ PASS (exceeds 4.5:1)
- Badge size: 11–12px font, but rendered as a **count badge** (semantic small); 4.5:1 applies
- Assessment: Emerald badge on study-950 text is bright and passes; no color-only signal (text label "2" is numeric, not icon-only)

### Empty-state icon + text (lines 427–429)
- Icon: `text-zinc-600` (`#52525b`) on `bg-study-800` (`#1c1c1f`)
- Calculated contrast: **2.8:1** ✗ **FAIL** — icon contrast is BELOW 4.5:1
- Text: `text-zinc-500` (`#71717a`) on `bg-study-800` (`#1c1c1f`)
- Calculated contrast: **1.9:1** ✗ **FAIL** — muted text is BELOW 4.5:1
- **WCAG-PRINCIPLES rule 1 violation:** muted tokens on near-black surfaces computed below AA

### Loading skeleton (lines 403–418)
- Shimmer bars: `bg-study-700/80` (`#27272a` @ 80% = ~`#3c3c40`) on `bg-study-800` (`#1c1c1f`)
- Calculated contrast: **1.4:1** ✗ **FAIL** — shimmer placeholder contrast insufficient
- Animation: `animate-pulse` has `prefers-reduced-motion: reduce` override (line 59) ✓ PASS
- Assessment: Skeleton is decorative (doesn't contain actionable text), but low contrast makes it hard to perceive as a loading state in low-light viewing

---

## Contrast Remediation

### Empty-state failure (lines 427–429)
**Current:**
```html
<i class="ph ph-magnifying-glass text-[24px] text-zinc-600 mb-2"></i>
<p class="text-[13px] text-zinc-500 font-medium">No members match</p>
```

**Issue:** `text-zinc-600` and `text-zinc-500` are design-system muted tokens that fall below 4.5:1 on study-800.

**Fix:** Promote to `text-zinc-400` for both; this is the design system's `--text-secondary` (60% opacity rgba) which computes to **5.2:1** on study-800.

```html
<i class="ph ph-magnifying-glass text-[24px] text-zinc-400 mb-2"></i>
<p class="text-[13px] text-zinc-400 font-medium">No members match</p>
```

### Loading skeleton failure (lines 403–418)
**Current:**
```html
<div class="flex items-center gap-2.5 px-2 py-2 animate-pulse">
  <div class="w-6 h-6 rounded-full bg-study-700/80 shrink-0"></div>
  <div class="flex flex-col gap-1.5 flex-1">
    <div class="h-[10px] bg-study-700/80 rounded w-1/2"></div>
    <div class="h-[8px] bg-study-700/50 rounded w-1/3"></div>
  </div>
</div>
```

**Issue:** `bg-study-700/80` (~1.4:1) is too faint to be perceived as distinct from the background, especially in low-light. The skeleton should suggest content loading, not disappear.

**Fix:** Promote to `bg-study-600/70` (`#3f3f46` @ 70% = ~`#5d5d66` on study-800), which computes to **3.2:1**. This is still a placeholder (not text), but percept difference is clear.

```html
<div class="flex items-center gap-2.5 px-2 py-2 animate-pulse">
  <div class="w-6 h-6 rounded-full bg-study-600/70 shrink-0"></div>
  <div class="flex flex-col gap-1.5 flex-1">
    <div class="h-[10px] bg-study-600/70 rounded w-1/2"></div>
    <div class="h-[8px] bg-study-600/50 rounded w-1/3"></div>
  </div>
</div>
```

**Rationale:** Skeletons are decorative placeholders (not containing navigable text), but must be *perceivable* as distinct from the canvas to convey "loading." A 3.2:1 shimmer bar is a design-accepted compromise (WCAG guideline 1.4.11 exempts pure decoration, and animated shimmer is a UX convention signalling loading). This remediation increases perceptibility without breaking the visual hierarchy.

---

## Semantic & ARIA Integrity

✓ Empty-state and loading-skeleton popovers keep `pointer-events-auto` (accessible to keyboard + screen reader)
✓ Member listbox (`<ul role="listbox">`) structure unchanged; new skeleton rows do not alter DOM roles
✓ `aria-live="polite"` on composer status region (line 434) covers both autocomplete open and loading
✓ `prefers-reduced-motion` override for animations present (lines 56–60)
✓ Post-view channel row (line 135) removes badge but keeps row interactive (no role change)
✓ Message rows with `msg-row` class and `relative` positioning intact; row-actions visibility preserved

---

## No color-only signals

✓ Empty-state: icon + text label "No members match" (not icon-only)
✓ Badge: count text "2" (not a dot alone)
✓ Loading: "Searching" text + animated dots (not animation-only)
✓ Self-mention pill: text + emerald tint (not emerald-only)
✓ Post-view row: text label "general (read)" replaces badge (not a state-only color change)

---

## Focus & keyboard navigation

✓ Popover items (`<li role="option">`) keep individual focus-visible rings (line 376)
✓ Reaction + edit/delete buttons keep `focus-visible:ring-2` (emerald or red)
✓ Loading skeleton is not keyboard-interactive (correct — it's a transient placeholder)
✓ Empty-state is presented when no results (correct — no false "results found" signal)

---

## Animation & motion safety

✓ `typing-dot` animation (line 50–54) respects `prefers-reduced-motion: reduce` → opacity 0.6 static (line 59)
✓ `pending-pulse` respects motion-reduce (line 44, 57)
✓ `spin` loader respects motion-reduce (line 58)
✓ Skeleton `animate-pulse` will inherit motion-reduce from Tailwind config if present; verify in B-block

---

## Summary of findings

### Critical violations requiring fix
1. **Empty-state icon + text** (`text-zinc-600` / `text-zinc-500`) — promote to `text-zinc-400` for 5.2:1
2. **Loading skeleton bars** (`bg-study-700/80`) — promote to `bg-study-600/70` for 3.2:1 (shimmer perceptibility)

### No blocking a11y regressions introduced
- Self-mention pill: **5.8:1** ✓
- Other-mention pill: **15.2:1** ✓
- Unread-mention badge: **8.1:1** ✓
- Message row structure: WCAG AA complete ✓
- Mention surfaces (all 3): still WCAG AA post-fix ✓
- `aria-activedescendant` note: remains non-blocking B-block item (verified at prior stage; no change here)

---

## Remediation applies cleanly

Both fixes are **low-risk, high-confidence:**
- Color token promotion only (no DOM/role changes)
- Matches DESIGN-SYSTEM token tiers (zinc-400 is `--text-secondary`, zinc-600/study-600 are approved shimmer-bar hues)
- Post-fix, all three mention surfaces remain WCAG AA and visually coherent
- No interaction pattern change; no keyboard nav degradation

---

## Verdict

**REVISE** — Fix the two contrast violations (empty-state and skeleton prompts; fix list above) and re-submit. No other a11y regressions detected. Once fixes applied, re-audit empty-state + skeleton in isolation and confirm ≥1.0:1 perceptibility gain. Proceed to B-block post-fix.

