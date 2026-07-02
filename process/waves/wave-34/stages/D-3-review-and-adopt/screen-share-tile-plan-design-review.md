# D-3 Plan-Design-Review — Screen-Share Prominent Tile (RE-REVIEW after refine)

**Reviewer role:** senior product designer, independent D-3 gate pass
**Pass:** 2 of N (RE-REVIEW). Prior pass verdict was REVISE on 2 blocking concerns.
**Mockup:** `design/staging/screen-share-tile.html` (refined)
**Brief:** `process/waves/wave-34/stages/D-1-brief/screen-share-tile-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Prior art:** `design/voice-study-room.html` (STATE 3 in-room tile grid + control cluster)

---

## Prior REVISE concerns — resolution check

### Concern 1 (medium) — Live-region announce was scaffold-only → **RESOLVED**

The polite live region now carries a demonstrated announce string. `:119-122`:
```
<div aria-live="polite" role="status" class="sr-only" id="voice-room-announcer">
  Alice T. started sharing their screen
</div>
```
The region is a real `role="status"` + `aria-live="polite"` + `sr-only` node with a concrete sample string that matches the brief §6 copy ("Alice started/stopped sharing"). The pattern is now shown, not asserted — the implementer has the exact copy and the load-bearing announce behavior is visible in the artifact. Requirement met.

### Concern 2 (low) — Share tile not centered/capped at 1440+ → **RESOLVED**

`max-w-[1000px] mx-auto` is now on the prominent share region, and applied consistently across all three states that render it:
- Sharing-active tile `:211` — `w-full max-w-[1000px] mx-auto flex-1 min-h-0`
- Share-loading tile `:304` — `w-full max-w-[1000px] mx-auto flex-1 min-h-0`
- Own-share tile `:344` — `w-full max-w-[1000px] mx-auto flex-1 min-h-0`

This is exactly §5's "large screen-share tile centered (max ~1000px)" for the 1440+ breakpoint, and `w-full` below the cap preserves the "fills the canvas width" behavior at 1280/1024. Consistent application across states (not just the primary one) is a stronger fix than the minimum. Requirement met.

### Token nit — `hover:bg-emerald-400` removed → **CONFIRMED REMOVED**

`grep` for `emerald-400` / `hover:bg-emerald` returns nothing in markup. The only hex values in the file are token definitions inside `tailwind.config` plus the scrollbar CSS reusing study-600/500 palette values — zero invented ad-hoc hex in the component body. Clean.

**New issue introduced by the refine?** None. The centering wraps the existing tile without disturbing the internal `flex-1 min-h-0` dominance math, the overlay-pill positions, or the demoted-strip layout. The live-region node sits at the top of `<body>` as an out-of-flow `sr-only` element — no visual impact. No regressions.

---

## Per-dimension scores (0–10) — refined mockup

### 1. Visual hierarchy — screen-share tile DOMINANT vs. avatars — **9/10**

Unchanged and still strong. `flex-1 min-h-0` (`:211`) makes the share region consume all remaining vertical space; the demoted strip is `h-[60px] md:h-[72px] shrink-0` (`:250`). The new `max-w-[1000px] mx-auto` does not weaken dominance — the tile still owns ~85–90% of canvas height and remains the top, full-height focus with the "Live Share" pill (`:222-224`) anchoring the eye. Held from 10 only by the same cosmetic note as before (overlay crowding at very short canvas heights). Non-blocking.

### 2. Spacing rhythm (§3 4px scale) — **10/10**

Still fully on the 4px scale. `p-4 md:p-6` (16/24), `gap-4` (16), pills `px-3 py-1.5` (12/6), `gap-2`/`gap-2.5` (8/10), control cluster `px-3 py-2` (12/8). No off-scale values. The `mx-auto` centering adds no new spacing tokens.

### 3. Brand coherence (calm academic dark, emerald, no neon) — **9/10**

Token discipline intact and now cleaner with `hover:bg-emerald-400` gone. All surfaces `study-950/900/800/700`, borders hairline/hover, text primary/secondary/muted, danger correct. Emerald reserved for live-share / presenter-speaking / own-share-active / self-ring. `subtle-pulse` 3s calm (`:95-101`). No invented hex. Held from 10 by the one remaining un-tokenized flourish: own-share decorative glow `bg-accent-emerald/5 blur-[120px]` (`:347`), outside the §5 glow token set — on-brand and subtle, optional polish (was concern 3 last pass, explicitly non-blocking).

### 4. Edge-cases (all 4 states, clean revert, own-share indicator) — **9/10**

All four states render: no-share (`:132`), sharing-active (`:201`), share-loading (`:295`), own-share (`:335`). Clean revert structurally guaranteed (State 1 is the unchanged grid; share region simply absent from that DOM — no orphan tile). Own-share triple-signalled: in-canvas panel + Stop Presenting (`:356-363`), emerald `aria-pressed="true"` screencast button (`:388`), self-avatar emerald ring (`:371`). Loading honest (`aria-busy`, named target `:304,:317`). Held from 10 only by the optional own-share permission-denied path (was concern 4 last pass, explicitly a follow-up, not required by §3).

### 5. Accessibility — labeled region, real button, live-region announce — **9/10**

**Up from 7/10.** The blocking gap is closed. Now all three §6/§9 a11y requirements are met and shown: labeled region `aria-label="Screen shared by Alice T."` (`:211`); real `<button>` with `aria-pressed` toggling false→true across states (`:187,:285,:388`); and the **live-region announce is now present with a demonstrated string** (`:119-122`, "Alice T. started sharing their screen"). Loading uses `aria-busy` + `aria-live` (`:304`); every strip avatar/control is a focus-visible `<button>` with emerald focus ring; `prefers-reduced-motion` fully honored (`:85-92`). Held from a perfect 10 only because the sample shows the start-announce; a matching stop-announce string isn't also shown — trivial for the implementer to mirror, and the pattern is now unambiguous. Not blocking.

### 6. Responsive (§5: tile priority, avatars demote/collapse, 1440+ centered) — **10/10**

**Up from 8/10.** The one §5 deviation is fixed: the share tile is now `max-w-[1000px] mx-auto` (`:211,:304,:344`) — exactly §5's "large screen-share tile centered (max ~1000px)" at 1440+, while `w-full` preserves "fills the canvas width" at 1280 and full-width priority at 1024 and below. Avatar strip still collapses to `overflow-x-auto` with `+4` overflow badge (`:250,:269-273`) per §5. Full §5 contract now satisfied.

---

## Score summary

| # | Dimension | Prior | Refined |
|---|-----------|-------|---------|
| 1 | Visual hierarchy (dominant tile) | 9/10 | 9/10 |
| 2 | Spacing rhythm (§3 4px) | 10/10 | 10/10 |
| 3 | Brand coherence (calm dark, emerald, no neon) | 9/10 | 9/10 |
| 4 | Edge-cases (4 states, revert, own-share) | 9/10 | 9/10 |
| 5 | Accessibility (label / button / live-region announce) | 7/10 | 9/10 |
| 6 | Responsive (§5 tile priority, avatars demote, 1440+ centered) | 8/10 | 10/10 |
| | **Mean** | **8.7/10** | **9.3/10** |

## Concerns (cited) — refined mockup

Both prior blocking concerns are resolved. Remaining items are optional polish, explicitly non-blocking in the prior pass and unchanged:

1. **[low, optional] Un-tokenized decorative glow.** Own-share `bg-accent-emerald/5 blur-[120px]` (`:347`) is a flourish outside the §5 glow token set; prefer `--glow-subtle` or an emerald hairline. Cosmetic.
2. **[nit, follow-up] No own-share failure/permission-denied state.** User cancels/denies the browser picker. Not in brief §3's required four; worth a follow-up task, not a D-3 blocker.
3. **[nit] Stop-announce copy not shown.** The live region shows the start-announce; a mirrored stop-announce ("Alice T. stopped sharing their screen") isn't also demonstrated. Pattern is now clear; trivial implementer mirror.

No token-invention, no hierarchy failure, no missing required state. Everything scored well in the prior pass (dominance via `flex-1`, all 4 states, clean revert, zero invented hex) stands.

## VERDICT: APPROVE

Both prior REVISE concerns are resolved and verified against the file: the live-region announce is now demonstrated with a concrete string (`:119-122`), and the share tile is capped and centered at `max-w-[1000px] mx-auto` across all three states that render it (`:211,:304,:344`). The `hover:bg-emerald-400` token nit is gone. No new issues introduced by the refine. Mean rises 8.7 → 9.3; accessibility 7→9, responsive 8→10. The three remaining items are optional polish and a follow-up, none gate-blocking. Adopt this variant.

---

*Note: this D-3 gate re-review was run as a single independent reviewer per the invocation. The gstack `/plan-design-review` interactive scope-gate and mockup-generation flow were not applicable — the mockup already exists and the task is to re-score an existing refine, not generate variants — so this artifact is a direct rubric scoring, not a plan-file review report.*
