# D-2 Variants — invite-share (wave-9 delta)

**Staging file:** `design/staging/invite-share.html`
**Generation approach:** Delta refinement of the existing wave-8 `design/invite-share.html` (mockup EXISTS). Not a from-scratch `/aidesigner` generate — per the D-block dispatcher's "design/invite-share.html EXISTS → D validates/composes" path and the wave-9 delta brief. The wave-8 four states (default / copied / loading / error) are preserved with the delta applied; four new states added for the revoke flow.

## What changed vs wave-8 (the meaningful decisions, not restyle)

1. **8b permanent-default (decision: label + demote).** The default link block is now explicitly the **permanent server invite** (`ph-globe`, "Server invite link" + a "Permanent" pill, copy "This link doesn't expire"). The old wave-8 modal already showed a single link as default but did not name it permanent nor offer a limited path. A **secondary, lower-emphasis** "Generate a limited invite" action (surface-700 secondary button, `ph-clock-countdown`) sits below a divider — present but visually subordinate to the permanent Copy primary action.

2. **Revoke affordance (decision: inline-confirm on a managed list).** Added a **limited-invites list** (owner/creator only) where each active ad-hoc invite is a row (mono code excerpt + "N/M uses · expiry"). Each row carries a `ph-trash` revoke control with the **danger focus ring**. Revoke is a two-step: clicking trash swaps the row to an **inline danger confirm** (`role="alert"`, "Revoke …? It will stop working immediately. People who already joined stay." + Cancel / Revoke destructive button) — chosen over a separate full-screen confirm modal to keep the action in context and avoid modal-stacking. Confirm → honest **revoked** row (dimmed, struck mono code, `ph-prohibit`, "Revoked — this link no longer works.") + emerald Toast.

## States covered (8 total)

1. default — permanent link shown (owner view)
2. copied — button morph + Toast
3. loading — link + list skeletons (`aria-busy`)
4. error — inline danger alert + disabled field + Retry
5. limited-invites list — populated (revoke controls)
6. limited-invites list — empty (honest empty state + generate CTA)
7. revoke-confirm — inline destructive confirm row
8. revoked — honest "no longer works" row + Toast

## Token discipline

Reuses only DESIGN-SYSTEM.md tokens: surface-950/900/800/700/600, accent-emerald, danger (#ef4444), border-hairline/hover, shadow-pop, glow-focus, glow-danger (already in tokens §5, used for the destructive revoke focus ring), radius-md/lg, Geist + Geist Mono, Phosphor icons. **No new token introduced.** The `.focus-ring-danger` CSS class is a usage binding of the existing `--glow-danger` token (same value `0 0 0 2px rgba(239,68,68,0.4)`), not a new token.

## /aidesigner warnings

None — delta authored in-place against the existing approved mockup; no generator round-trip needed for a token-clean composition from existing primitives.
