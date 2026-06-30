# D-2 Variants — Message UI (composer + message list)

**Wave:** 12 · **Mode:** automatic · **Gap:** message-ui (d999d29c) · **Brief:** `process/waves/wave-12/stages/D-1-brief/message-ui-brief.md`

## Approach

DELTA wave. The audit (D-1) found `design/server-channel-view.html` already carries the 3-pane shell, channel header, sent-row, and pending-row patterns, but:
1. **Missing primitives:** failed-row + Retry, loading-older affordance, empty-channel state.
2. **Wrong baseline state:** the canonical file renders ONLY the offline edge (readonly composer, "will queue") — not the populated/typing/sending baseline B-3 must build against.
3. **Scope pollution:** reactions, threads/replies, attachment button, emoji popover — all M3-deferred (brief §10) — were present and would fragment the build.

Because the design system (§8) fully specifies MessageRow + MessageComposer + Empty/Loading states, the meaningful design decision here is **structural, not exploratory**: render exactly the nine in-scope states, in one clean variant, on the reused shell — distinct row-state encoding (opacity+amber / normal / danger+retry) being the load-bearing choice. A multi-variant fan-out would be pseudo-variants (restyles of one settled idea), which the head-designer playbook forbids. So D-2 produces ONE variant.

## Variant V1 — `design/staging/server-channel-view.html`

The single in-scope composition. Decisions encoded:

| Concern | Decision | Rationale |
|---|---|---|
| 3 row states distinct at a glance | pending = 55% opacity + amber `ph-clock` "Sending…"; sent = full-opacity normal; failed = `--danger` border+bg tint + red `ph-warning-circle` + Retry button | scannability — a user spots send-status without reading text; color is backed by text label (not color-alone) |
| Failed retry | real `<button type=button>` with `focus-visible:ring`, plus secondary Delete | keyboard-reachable; recovery path for the optimistic-send wedge |
| Composer states | empty → `disabled` dimmed send; typing → emerald send; sending → `ph-circle-notch` spin (brief) | the send button itself carries composer state; Enter-to-send + Shift+Enter hint visible below |
| Empty channel | `<template>` with `ph-chats-circle` + "No messages yet" headline + one-line | DESIGN-SYSTEM §8 empty-state pattern; swapped in when `messages: []` |
| Loading older | top-of-list `ph-circle-notch` spin + "Loading older messages…", `aria-live` | subtle, non-spinner-for-content per §8 |
| Real-time incoming | renders via the normal sent row; list is `role="log" aria-live="polite"` | no special design needed (brief), screen-reader announces new messages |
| Scope | reactions / threads / mentions / attachments / presence-typing REMOVED | brief §10 non-goals — no fragmentation |
| Tokens | only study-* surfaces, accent-emerald/amber/danger, Geist, radius-md, hairline | zero invented hex (token audit at D-3) |

## Iteration log

- Iteration 1: V1 authored. → D-3 dual-review.

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: D-2
  reviewers: {}
  failed_checks: []
  rationale: >
    One variant is correct here, not a contract violation: the design decision is
    structural (which nine states, encoded how) and fully constrained by
    DESIGN-SYSTEM §8 primitives; fanning out restyles would be pseudo-variants.
    V1 covers all nine in-scope states, encodes the 3 row states distinctly with
    text-backed (not color-alone) status, uses only system tokens, designs the
    composer focus + Enter/Shift-Enter + disabled-empty states, makes Retry a real
    keyboard-reachable button, and strips every deferred feature. Spacing follows
    the 8px row rhythm. Proceeds to the mandated D-3 dual-reviewer gate.
  next_action: PROCEED_TO_D-3
```
