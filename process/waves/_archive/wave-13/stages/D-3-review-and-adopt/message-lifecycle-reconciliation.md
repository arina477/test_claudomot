# D-3 Phase 1 — Reconciliation (message-lifecycle)

**Wave:** 13 · **Gap:** message-row edit / delete-tombstone / reaction-pill primitives
**Staging:** `design/staging/server-channel-view.html`
**Reviewer substitution (per design/review-gate.md):** Reviewer B `/ui-ux-pro-max` → `accessibility-tester` agent — this dark-theme delta's load-bearing risk is contrast/focus/keyboard, accessibility-tester's specialty. Reviewer A ran via `ui-designer` acting as `/plan-design-review`.

## Verdicts (independent, no shared context)

| Reviewer | Verdict | Blocking concern |
|---|---|---|
| A — plan-design-review (ui-designer) | **APPROVE** | none blocking; flagged `(edited)` tag margin (~4.6:1), add-reaction popover positioning impl-note, `mt-1.5` off-scale |
| B — ui-ux-pro-max (accessibility-tester) | **REVISE** | **CRITICAL: tombstone `text-zinc-500` = 3.8:1 on surface-800 < 4.5:1 WCAG AA.** Borderline: reactedByMe count `text-emerald-300` ~4.8:1 |

## Matrix outcome

**APPROVE | REVISE → aggregate B's concerns → D-2 refine** (iteration 2). Both reviewers converge on the same contrast family of issues — fixes are precise and measurable.

## Aggregated refine instructions (applied to staging — iteration 2)

1. **[BLOCKING — B]** Tombstone text: `text-zinc-500` → `text-zinc-400` (3.8:1 → ~5.2:1). Brief §9 criterion "tombstone reads as deleted… ≥4.5:1". The prohibit glyph stays muted (decorative, not the sole signal — text carries it).
2. **[B borderline + A]** reactedByMe count: `text-emerald-300` → `text-emerald-200` for anti-alias margin over 4.5:1.
3. **[A]** `(edited)` tag: `text-zinc-400` → `text-zinc-300` for comfortable margin over the ~4.6:1 floor.
4. **[A spacing]** edit-textarea wrapper `mt-1.5` (6px, off the 4px scale) → `mt-2` (8px) to keep §3 rhythm.
5. **[A impl-note, non-blocking]** Add-reaction popover ships `absolute`-positioned with a rightward clip guard at narrow breakpoints — recorded as a build note in the adopt deliverable (static mockup renders it in-flow for reviewer evaluation, which is acceptable for the staging artifact).

## Next

Apply 1-4 to staging → re-run Reviewer B (accessibility-tester) on the same staging to confirm the contrast fixes clear, A already APPROVE. Iteration 2 of 3 (cap not at risk).
