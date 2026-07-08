# P-0 ceo-reviewer — wave-79 (M13 leg-3: richer privacy/E2E posture)

**Seat:** ceo-reviewer (strategic-value + ambition lens, BOARD seat)
**Lens:** "Is this worth doing, ambitious enough or too ambitious?" — NOT "is the problem framed right?" (problem-framer owns that).

---

## VERDICT: SELECTIVE-EXPANSION

Proceed with the E2E core (tasks 1–3) as a coherent minimum-viable-E2E bundle, but **re-sequence task 4 (read-receipt/presence privacy toggles) to lead, ship-independent, and gate it in front of the E2E slice rather than folding it into the same acceptance surface.** Keep the 4-task scope; do not add or defer tasks. The "selective" is about internal ordering + honest labeling of the E2E indicator, not about cutting scope.

---

## Reasoning

This leg earns its ~3,200 LOC now, but for a *portfolio* reason more than an *activation* reason — and that distinction must be kept honest in the UI. Feature 29 ("richer privacy/E2E posture as a differentiator vs Discord/Telegram") is an explicit standing backlog item, and M13's own framing already concedes portable identity is a moat-builder, not the H1 activation wedge — so no one is pretending this is the north-star. Given that leg-3 is the **last autonomous M13 leg**, shipping it is what lets M13 reach a clean founder-disposition point (after this, only the fenced founder-reserved items remain: verification, B2B2C, success metric). That sequencing value is real and is the strongest argument for PROCEED-now over deferring to backlog: a half-finished milestone with one autonomous leg left is worse strategic inventory than a completed one awaiting a founder call. On ambition: a browser-only-key, plaintext-fallback v1 is the *right* altitude — full Signal-grade E2E (key backup, multi-device sync, forward secrecy, verified safety numbers) is a product in itself and would be gold-plating for a self-use-MVP with zero external users; Telegram itself ships opt-in secret-chat E2E, so "real-but-limited" is a defensible industry posture, not a cop-out. The one genuine hazard is the "false privacy promise" — a half-E2E *is* worse than none if the UI over-claims. That risk is fully mitigable and is why the E2E-vs-plaintext indicator in task 3 is load-bearing: it must fail closed and read plainly (plaintext peers → "not encrypted," never a padlock), the server-blind envelope must actually NULL plaintext when encrypted, and the plaintext-fallback path must be visibly distinct — spec must make the indicator's honesty a hard acceptance criterion, not decoration. Tasks 1→2→3 are a coherent dependency chain (key registry → server-blind envelope → client crypto+indicator) and none can be sensibly deferred without breaking the E2E claim, so they stand as the minimum bundle. Task 4 (read-receipt/presence toggles) is the odd one out: it is a genuinely *cheaper, standalone* privacy win that touches none of the crypto surface, so bundling it risks diluting E2E test focus and letting a simple toggle ride security-critical review latency. But it does not warrant deferral — it's small, it rounds out the "privacy posture" theme that makes leg-3 legible as one milestone leg, and it's the kind of concrete user-facing control that reads as privacy value even to users who never touch E2E. My recommendation is therefore SELECTIVE-EXPANSION in the ordering sense: land task 4 first as an independent shippable slice (fast privacy win, de-risks the wave delivering *something* even if E2E review drags), then the 1–3 E2E chain behind it. Strictly no drift into the fenced items (verification, B2B2C, success metric) — those are founder-reserved and this wave stays clear of them.

---

## Strategic notes for the plan (P-3) / BOARD

- **Honesty-of-indicator is the make-or-break AC.** A padlock shown on a plaintext-fallback message converts a differentiator into a liability. Spec the indicator to fail closed; T-8 security should attack the "does the server ever see plaintext when the UI claims encrypted?" path explicitly.
- **Sequence task 4 first, ship-independent.** Cheapest value, zero crypto coupling; guarantees the wave delivers a user-visible privacy win even if the E2E slice needs a fast-fix loop.
- **This is a moat/portfolio leg, not an activation leg — and that's fine.** Don't let anyone reframe it as moving H1 activation/retention; its job is (a) close out M13's last autonomous leg so it reaches founder disposition, and (b) bank the Feature-29 differentiator. Both are legitimate.
- **Do not expand the crypto scope.** Key backup, multi-device, forward secrecy, safety-number verification are all out — that would be the gold-plating a self-use-MVP cannot justify. Note the deferral in task prose so it isn't re-litigated.
- **Founder-reserved fence respected:** no identity verification, no B2B2C go-to-market, no success-metric authoring in this wave.
