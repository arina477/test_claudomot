# D-2 — Iterate log (message-lifecycle)

**Iteration:** 2 of 3 (D-3 Phase 1 backedge: APPROVE | REVISE)
**Staging:** `design/staging/server-channel-view.html`

## Changes applied (from reconciliation aggregate)

| # | Change | Was → Now | Source | Verifiable effect |
|---|---|---|---|---|
| 1 | Tombstone text | `text-zinc-500` → `text-zinc-400` | B (BLOCKING) | 3.8:1 → ~5.2:1, clears WCAG AA |
| 2 | reactedByMe count | `text-emerald-300` → `text-emerald-200` | B borderline + A | comfortable margin over 4.5:1 |
| 3 | `(edited)` tag | `text-zinc-400` → `text-zinc-300` | A | comfortable margin over ~4.6:1 |
| 4 | Edit textarea wrapper | `mt-1.5` → `mt-2` | A | back on the 4px/8px §3 scale |

Non-blocking impl-note (popover absolute-positioning + clip guard) carried to the adopt deliverable as a build note; no markup change in the static staging artifact.

## Re-review

Reviewer A already APPROVE (changes only strengthen its noted dimensions). Re-running Reviewer B (accessibility-tester) on the corrected staging to confirm the contrast fixes clear.
