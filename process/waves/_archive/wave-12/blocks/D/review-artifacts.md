# Wave 12 — D-block review artifacts (DELTA)

**Block:** D · **Wave topic:** message UI — message-row + composer primitives · **Gate:** D-3 · **Status:** complete

## Gap (delta — design/server-channel-view.html EXISTS)
The channel-view message LIST + COMPOSER primitives: (1) message-row (author avatar/name, content, timestamp; states pending [optimistic, greyed] / sent [confirmed] / failed [retry]); (2) composer (textarea + send; empty/typing/sending); (3) list shape (newest-at-bottom, load-older-on-scroll-up, empty-channel). Real-time messages appear inline. Composed on the existing server-channel-view shell. Dark theme, accent, Phosphor. NO reactions/threads/mentions/attachments/presence/typing UI (deferred).

## Audit outcome (D-1)
Existing `server-channel-view.html` rendered only the OFFLINE edge, was missing failed-row+retry / load-older / empty-channel, and polluted scope with deferred reactions/threads/attachments. → clean re-compose of the in-scope primitives (single variant; structure fully specified by DESIGN-SYSTEM §8).

## Dual-reviewer artifacts (review-gate.md; both fresh-context, parallel, blind)
- Reviewer A (design critique, subs `/plan-design-review`) → **ui-designer**. Final: APPROVE, composite 9.0/10.
- Reviewer B (criteria + WCAG + token/icon, subs `/ui-ux-pro-max`) → **accessibility-tester**. Final: APPROVE, 9/9 criteria, all contrast PASS.
- Reconciliation + 3-iteration ledger: `process/waves/wave-12/stages/D-3-review-and-adopt/message-ui-reconciliation.md`.
- Adoption rationale: `process/waves/wave-12/stages/D-3-review-and-adopt/message-ui-adopt.md`.

## Result
APPROVE/APPROVE → adopt. Canonical: `design/server-channel-view.html`. No new token (`design_system_updates: []`). Gate verdict: `process/waves/wave-12/blocks/D/gate-verdict.md` → **APPROVED**, next block B.
