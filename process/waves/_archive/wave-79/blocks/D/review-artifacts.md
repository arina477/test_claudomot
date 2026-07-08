# Wave 79 — D-block review artifacts

**Block:** D (Design)
**Wave topic:** E2E DM encryption status indicator — a fail-closed trust signal in the direct-message view (encrypted / not-encrypted-plaintext-fallback / cannot-decrypt-on-this-device).
**Block exit gate:** D-3
**Status:** gate-passed

```yaml
design_block_status:    complete
gaps_resolved:          [e2e-indicator]
gaps_deferred:          []
design_system_updates:  []
canonicalized_at:       2026-07-08T00:54:00Z
```

## Stage deliverables

| Stage | Deliverable file(s) | Status | Notes |
|---|---|---|---|
| D-1 | stages/D-1-brief/e2e-indicator-brief.md | done | mask_mode_signoff PASS; 10+ §4 primitives; 3 prior-art mockups; 10 §9 checks incl. fail-closed |
| D-2 | stages/D-2-variants/e2e-indicator-variants.md (+ design/staging/e2e-indicator.html) | done | aidesigner HTTP 200; 6 states rendered; token+fail-closed audit PASS; checkpoint skipped-mode-automatic; iter 0 |
| D-3 | stages/D-3-review-and-adopt/e2e-indicator-{plan-design-review,ui-ux-pro-max,accessibility,reconciliation,adopt}.md | done | 3 dual-review rounds (B APPROVE, A REVISE=stale false-negative); head-designer APPROVED; canonicalized to design/e2e-indicator.html |

## Block-specific context

- **Wave topic:** E2E DM encryption status indicator (fail-closed trust signal)
- **design_gap_flag:** true (from P-1)
- **Gaps inventoried:** [e2e-indicator] (DM key-setup affordance assessed at D-1 — likely silent keygen, reuse existing DM-view states, NOT a separate visual gap)
- **Gaps deferred to bug-design tag:** none
- **DM key-setup affordance disposition (D-1 audit):** FOLDED — not a separate gap. First DM triggers silent client-side keygen (Web Crypto, B-3); the only user-visible surface is the transient "loading/establishing" state, which is state 3.5 inside THIS indicator's brief. No separate onboarding modal / key-management / verify-safety-number screen (Signal-grade out of scope for v1 per P-3).
- **3-cap escalations during block:** none
- **DESIGN-SYSTEM.md token additions proposed:** none (head-designer blessed NO addition; `#34d399` NOT adopted — token-safe path taken)

## Open escalations carried into gate

- LOAD-BEARING (anti-security-theater ship-blocker): the indicator MUST fail closed — a lock/shield/"encrypted" affordance appears ONLY when a message is provably end-to-end encrypted; a plaintext-fallback message (peer has no key) and a group DM show a clear NOT-encrypted state; an undecryptable message shows a calm "cannot decrypt on this device" state. NEVER a false padlock. The visual language must make "encrypted" vs "not encrypted" unambiguous at a glance without alarming the calm/academic/dark-only brand.

## Gate verdict log

- 2026-07-08 — head-designer (Phase-2 fresh spawn) — **APPROVED** attempt 1 — e2e-indicator: fail-closed PASS (5 shield-check occurrences all encrypted-only, grep-verified in static markup + simulateKeygen setTimeout; no lock over plaintext/group/loading/cannot-decrypt); A's 6 CRs independently re-greped, all stale/B-3-handoff (reviewer false-negative caught); token discipline clean, #34d399 NOT adopted (no new token added); touch targets all 44px in current file (a11y audit's 32px finding was stale). rework_cap_remaining=3.
