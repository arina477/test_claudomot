# BOARD vote — industry-expert — descope-who-can-dm-w35

## Vote
APPROVE Path A

## Rationale (≤150 words)
Industry sequencing is unambiguous: privacy controls ship *with* the surface they govern, never before it. Discord's "who can DM you" / "allow DMs from server members" settings exist because DMs exist; Slack, Telegram, Teams all followed the same order — surface first, control second (`competitive-benchmarks/discord.md`). Gating a non-existent feature (feature #21, H2-deferred, `feature-list.md:43`) produces a dead toggle — the privacy-theater antipattern — unless honestly disclosed. Path A avoids it: profile-visibility (real target: member-roster + profile-read endpoints) is enforced now; who-can-DM is a forward-declared preference *explicitly labeled* "applies when DMs arrive," and the M7 metric is amended to buildable reality. Honest labeling is load-bearing — that disclosure is what separates this from theater. Path B pulls a full DM+group-DM subsystem forward to satisfy one control — a recognized over-build and scope-creep that contradicts the convergent sequencing and multi-wave-expands a launch-polish wave.

## Hard-stop?
none

## Dissent note (only if APPROVE with concerns)
Enforce the honest label in shipped UI copy — an unlabeled forward-persisted toggle degrades to privacy-theater; and file the who-can-DM enforcement as an explicit acceptance criterion on feature #21 so it isn't lost.
