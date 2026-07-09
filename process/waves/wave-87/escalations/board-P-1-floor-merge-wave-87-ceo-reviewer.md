# BOARD vote — ceo-reviewer — P-1-floor-merge-wave-87

## Vote
APPROVE A

## Rationale (<=150 words, cite evidence)
The floor exists to block wasteful tiny waves, not coherent ones. This wave is coherent, valuable, and behavior-preserving: it converges both join paths onto the existing default 'Member' role so a standing backfill script (`backfill-roles.ts`) stops being a perpetual repair (P-0-frame §Final framing). The floor is mis-firing exactly as the wave-50 precedent already flagged ("mechanically trips on legitimately-small high-value reuse-heavy fix waves; needs an exemption clause" — product-decisions 2026-07-05). RESCOPE-AUTO-MERGE is structurally impossible: 0 in_progress + 0 todo milestones, seed milestone_id NULL (P-1 decompose). Option B's 6-bug grab-bag spanning auth + servers + privacy-schema + web-error trades coherence for a mechanical count — wider blast radius, weaker review, no strategic gain; that is the wasteful shape the floor was meant to prevent, inverted. A per-fix pipeline pass in a 31-item bug-fix phase is cheaper than mis-batched review churn. Set the reusable precedent.

## Hard-stop?
none

## Dissent note (only if APPROVE with concerns)
The precedent must be bounded, not blanket. Log it as: "In an explicit founder bug-fix phase with roadmap complete (0 in_progress + 0 todo milestones), a single-fix wave that is coherent, traces to a live bet, and reuses existing substrate MAY override-ship below the single-spec floor without re-escalating — the floor's merge remedy is structurally void when no milestone exists to decompose from." It must NOT read as "any small wave may skip the floor" — the floor still governs the normal case where a milestone is active and siblings can be authored. When the roadmap is refreshed and a milestone goes in_progress, the standard RESCOPE-AUTO-MERGE path reactivates. Batching (B) stays the right tool when several fixes genuinely share a surface and review context; it is wrong here only because the backlog items don't.
