# Wave 79 — D-block review artifacts

**Block:** D (Design)
**Wave topic:** E2E DM encryption status indicator — a fail-closed trust signal in the direct-message view (encrypted / not-encrypted-plaintext-fallback / cannot-decrypt-on-this-device).
**Block exit gate:** D-3
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file(s) | Status | Notes |
|---|---|---|---|
| D-1 | stages/D-1-brief/e2e-indicator-brief.md | done | mask_mode_signoff PASS; 10+ §4 primitives; 3 prior-art mockups; 10 §9 checks incl. fail-closed |
| D-2 | stages/D-2-variants/e2e-indicator-variants.md (+ design/staging/e2e-indicator.html) | done | aidesigner HTTP 200; 6 states rendered; token+fail-closed audit PASS; checkpoint skipped-mode-automatic; iter 0 |
| D-3 | stages/D-3-review-and-adopt/e2e-indicator-{plan-design-review,ui-ux-pro-max,reconciliation,adopt}.md | pending | dual-review + head-designer gate + canonicalize |

## Block-specific context

- **Wave topic:** E2E DM encryption status indicator (fail-closed trust signal)
- **design_gap_flag:** true (from P-1)
- **Gaps inventoried:** [e2e-indicator] (DM key-setup affordance assessed at D-1 — likely silent keygen, reuse existing DM-view states, NOT a separate visual gap)
- **Gaps deferred to bug-design tag:** none
- **DM key-setup affordance disposition (D-1 audit):** FOLDED — not a separate gap. First DM triggers silent client-side keygen (Web Crypto, B-3); the only user-visible surface is the transient "loading/establishing" state, which is state 3.5 inside THIS indicator's brief. No separate onboarding modal / key-management / verify-safety-number screen (Signal-grade out of scope for v1 per P-3).
- **3-cap escalations during block:** none
- **DESIGN-SYSTEM.md token additions proposed:** <D-3 sets>

## Open escalations carried into gate

- LOAD-BEARING (anti-security-theater ship-blocker): the indicator MUST fail closed — a lock/shield/"encrypted" affordance appears ONLY when a message is provably end-to-end encrypted; a plaintext-fallback message (peer has no key) and a group DM show a clear NOT-encrypted state; an undecryptable message shows a calm "cannot decrypt on this device" state. NEVER a false padlock. The visual language must make "encrypted" vs "not encrypted" unambiguous at a glance without alarming the calm/academic/dark-only brand.

## Gate verdict log

<appended by fresh head-designer spawn at D-3 Action 1>
