# P-0 — ceo-reviewer (strategic-value + ambition lens) — wave-78

**Reviewer:** ceo-reviewer (BOARD seat)
**Lens:** Is this the right thing to build, and is it ambitious enough / too ambitious?
**Wave:** wave-78 — M13 leg-2 follow-up (2 member-profile-card UX polish tasks)

## Verdict: **PROCEED**

## Scope under review
1. **Seed 4be3b084** — Allow clearing `academicRole` back to unset (currently one-way once set; strict enum + dead editor affordance). ~10-20 LOC.
2. **Sibling 3b3530d8** — Distinguish a genuinely-hidden profile from a transient network error on the member card. Both currently render an identical "Profile Unavailable." Must preserve the uniform-404 privacy anti-oracle and only distinguish a *client-side transport failure* (with a retry), never leaking whether a profile exists.

## Reasoning

Both tasks are genuine correctness/usability defects on a surface that shipped **LIVE last wave**, not cosmetic gold-plating — and that distinction is what carries the PROCEED. Seed 4be3b084 fixes a data-model trap: a user can set their academic role but never take it back, which is a one-way door on user-controlled identity data (the kind of thing that reads as broken and erodes trust on a moat surface we're explicitly building). Sibling 3b3530d8 fixes a worse failure mode — a network blip currently masquerades as a deliberate privacy state, so a transient error and an intentional hide are visually indistinguishable; users draw the wrong conclusion about another member's profile, and the fix is narrowly scoped to *transport-layer* failures so it does not weaken the uniform-404 anti-oracle that protects existence-privacy. Finishing a just-shipped surface properly — closing the two defects the shipping wave itself filed as non-blocking follow-ups — is the correct use of an active-milestone wave under the state machine (work M13's own seed candidates before authoring new bundles or jumping to leg-3). Leg-3 (privacy/E2E) is not yet authored, so there is no ready higher-value M13 alternative to yield to; and the 27-deep unassigned backlog is correctly *not* this wave's job while M13 is in_progress with live seed candidates. On ambition: this is deliberately and appropriately small (~10-20 LOC + a targeted error-state branch), and that is right — it is a debt-retirement wave, not a scope-growth wave. I decline to expand it. Folding in adjacent "profile-card polish" would be speculative gold-plating with no filed defect behind it, and the two tasks are cleanly bounded and independently shippable, so neither is too ambitious and neither should defer. Both are small, both are real, both finish the surface — ship them together.

## Guardrails honored
- **No expansion into founder-reserved / fenced items:** identity verification, B2B2C go-to-market, and the M13 success metric are untouched. This wave is pure defect retirement on an already-shipped surface.
- **Privacy invariant preserved:** sibling 3b3530d8 must distinguish only client-side transport failure, never profile existence — the uniform-404 anti-oracle stays intact. Flag to P-2 spec: the acceptance criteria must prove the anti-oracle is not weakened (a hidden profile and a non-existent profile must remain indistinguishable to the client).

## Note to BOARD / head-product
No strategic tension here — this is not a horizon-jump, not an SDK commitment, not a wedge-blurring move. It is finishing what wave-77 shipped. My only downstream ask is that P-2 lock an AC that the privacy anti-oracle is measurably preserved, since that is the one place this small wave could quietly do harm.
