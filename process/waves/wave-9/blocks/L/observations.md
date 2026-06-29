# Wave 9 — L-block observations (candidate principle promotions)

> Append-only. L-2 distill + karen vet these; promotion to a `*-PRINCIPLES.md` file requires the observation to recur across 2+ waves AND the relevant head to approve. "Broke once" stays here until a second wave confirms.

## D-block (Design)

### Candidate: destructive/disabled-state colored text must meet WCAG AA on its own surface

- **Origin:** D-3 invite-share. The revoked-row label used `text-danger` (#ef4444) on surface-800 (#1c1c1f) ≈ 3.5:1, below WCAG AA 4.5:1 for body text. Caught by the D-3 accessibility reviewer; fixed by moving the label to `t-primary` (white) while keeping the danger icon + strikethrough + dimming as the color-independent revoked signal.
- **Why it matters:** Semantic colors (danger/warning) read as low-contrast text on dark surfaces; the danger MEANING should be carried by icon + state styling, with the text itself on a high-contrast token. This is a recurring dark-theme trap (a designer eyeballs red-on-near-black as "fine").
- **Candidate rule (for L-2/karen if it recurs):** "Semantic-color text (danger/warning) on dark surfaces must use a high-contrast text token; carry the state meaning with an icon plus styling, not colored text alone."
  Why: "Red/amber on near-black often falls below WCAG AA 4.5:1 and becomes unreadable for some students."
- **Status:** single-wave occurrence — do NOT promote yet. Confirm on a second wave before L-2 considers it for `command-center/principles/DESIGN-PRINCIPLES.md`.

### Note: rejected variant / decision lineage (this wave, for the record)

- **Rejected approach:** revoking via a one-click trash with no confirm — rejected for accidental-revoke risk; adopted a two-step inline `role="alert"` confirm instead.
- **Rejected approach:** silently removing a revoked invite from the list — rejected for dishonesty; adopted an explicit honest "Revoked — this link no longer works" row (icon + strikethrough + dimming).
- **Rejected approach:** keeping the wave-8 single-link default without naming it — rejected because 8b requires the default to be unambiguously the PERMANENT link; adopted a labeled "Server invite link" + "Permanent" pill with limited-invite generation demoted to a secondary action.
