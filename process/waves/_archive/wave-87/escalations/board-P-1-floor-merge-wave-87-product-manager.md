# BOARD vote — product-manager — P-1-floor-merge-wave-87

## Vote
APPROVE A

## Rationale (<=150 words)
Operationally the floor is a thin-FEATURE-wave guard; it does not fit maintenance
work. In a founder bug-fix phase with a ~31-item backlog and roadmap complete
(0 in_progress/todo, seed milestone_id NULL), EVERY single fix trips a 1,500-LOC
feature floor with no milestone to merge from — the remedy is structurally void.
Option A maximizes healthy throughput: one coherent ~140-LOC fix flows through the
full pipeline per wave, cleanly reviewable and independently revertable, and it
retires a standing backfill job (net WIP reduction).
Option B manufactures WIP — 6 unrelated fixes (auth+servers+privacy+web) coupled
onto one branch/deploy inflate review burden and blast radius and couple
independent rollbacks, purely to game a count. That is the incoherent-batch shape
the floor was meant to prevent, inverted.
This is the 7th instance of an already-settled pattern (waves 16/21/23/24/25/50).

## Hard-stop?
none

## Dissent note (only if APPROVE with concerns)
Guardrails for the logged precedent (operational, so bug-fix throughput stays
deterministic without eroding the gate):
1. **Scope-fenced:** applies ONLY when (a) founder is in an explicit bug-fix phase,
   (b) roadmap is complete (0 in_progress + 0 todo milestones) so no sibling can be
   authored, AND (c) the wave is a single coherent fix tracing to a live bet. It is
   NOT "any small wave skips the floor" — when a milestone goes in_progress the
   standard RESCOPE-AUTO-MERGE reactivates.
2. **Precedent-application, not re-convening:** future identical bug-fix-phase
   floor-merges apply this ruling by citing it (as wave-25 did off wave-24) — do
   NOT convene a fresh BOARD each wave; that is the ceremony-without-value the
   BOARD has repeatedly deprecated.
3. **Batching (B) stays valid** only when several backlog items genuinely share a
   surface + review context; it is wrong here because these do not.
4. **Coherence bar for A:** one revertable commit, behavior-preserving, tests
   included. If a fix cannot meet that bar, it does not qualify for override-ship.
