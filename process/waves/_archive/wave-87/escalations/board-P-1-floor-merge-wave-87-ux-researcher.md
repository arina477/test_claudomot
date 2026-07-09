# BOARD vote — ux-researcher — P-1-floor-merge-wave-87

## Vote
APPROVE A

## Rationale (<=150 words)
Through my lens — user-experienced impact, trust, coherence of what ships to the
student — Option A is the clear user-value-per-risk winner.

A is UX-invisible by construction: NULL and the default 'Member' role resolve to
the identical all-flags-false base-member permission surface (verified in P-0
frame: `can()` denies NULL on privileged routes, `canViewChannel()` treats NULL
as implicit base member). No student notices anything, and no trust surface moves.
Zero user-perceivable regression risk.

Option B is worse on my exact axis: bundling ~6 unrelated fixes (auth + servers +
privacy + web-error-surface) widens the blast radius across multiple
student-facing surfaces at once, purely to satisfy a mechanical LOC floor. That
trades zero user risk for real user risk to clear a process gate — the wrong
tradeoff for the remote student.

Option C strands a coherent, correct hygiene fix for no user benefit.

## Hard-stop?
none

## Dissent note (only if APPROVE with concerns)
This decision is near-abstainable from a pure UX lens — the fix has no
user-perceivable surface. I vote APPROVE A rather than ABSTAIN because the choice
BETWEEN options is user-relevant: B would manufacture user-facing risk where A has
none. My APPROVE is for A specifically as the lowest-user-risk path, not an
endorsement of the fix's product value (that is strategist/realist territory).
