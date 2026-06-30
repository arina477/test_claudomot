# BOARD — P-1-floor-merge-wave-23

**Mode:** automatic | **Threshold:** 4+/7 (process/sizing call, not Tier-3) | **Convened:** wave-23 P-1 RESCOPE-AUTO-MERGE recursion-guard escalation.

## Question
Wave-23 bundle [seed 8aa67564 manage_assignments split + sibling edbdea8f /me-roles CTA] (~380 LOC, 2 specs) is below the multi-spec minimum floor (>2,500 LOC OR ≥6 specs). The mandated decomposition-expansion returned `incomplete-scope` (M5's sole unbuilt scope = reminders, externally cred-blocked on a founder Resend key). Options: **A** override-ship the under-floor coherent slice + log floor exception · **B** hold-until-roadmap-planning · **C** cancel seed.

## Votes (7)
| Member | Vote | Hard-stop | One-line |
|---|---|---|---|
| strategist | APPROVE A | none | On-bet; hardens delegated-organizer authz, deepens academic wedge; floor is a size heuristic not a thesis gate. |
| industry-expert | APPROVE A | none | Granular capability-based permission split is the converged RBAC pattern; conforms to _library.md locked model; mature teams don't batch authz behind a LOC floor. |
| realist | APPROVE A | none | All 3 load-bearing claims code-verified (~380 LOC honest, additive/risk-free, value speculative-not-near-term); two-way door; holding adds no evidentiary gain. |
| user-advocate | APPROVE A | none | Real F6/F9 wedge moment (delegate posting to a TA without over-grant); A bundles both halves so capability is end-to-end not half-wired. |
| risk-officer | APPROVE A | none | Additive migration (0011), owner superuser short-circuits before flag lookup → no lockout; under-floor is LOWER risk than batched. Condition: /me endpoint session-scoped. |
| counter-thinker | APPROVE B | none | Steel-man held: floor-defeat-by-precedent + speculative authz at 0 users + better-ROI unblocked presence/mention debt available → batch-later. |
| founder-proxy | APPROVE A | none | product-decisions ll.295-298 scheduled this exact flip-trigger; ll.215-217 (w16) + ll.263-266 (w21) precedent that floor-merge BOARD ceremony for infra-reuse/authz-completion is exemptable; founder disposition = keep momentum, fold follow-ons in. |

## Decision: APPROVE A — override-ship (6/7, default threshold 4+/7 cleared; no hard-stops)

Run wave-23 as the under-floor coherent slice [8aa67564 + edbdea8f]. Log the floor exception. Loop keeps shipping autonomously; reminders stays correctly deferred behind the founder Resend key.

## Dissent (counter-thinker, B)
Floor-defeat-by-precedent + the presence/mention M3/M4 debt is real unblocked floor-sized work that may be better loop ROI. **Disposition:** noted but outvoted 6-1; founder-proxy showed override-ship for authz-completion/infra-reuse waves is established precedent (w16/w21), not a novel floor defeat. The presence/mention debt remains claimable by a future N-2 — not lost.

## Conditions carried to P-2/P-3/T (from approving seats; spec requirements, not blockers)
1. **Migration (industry-expert + risk-officer):** avoid silent privilege loss — backfill `manage_assignments=true` for any role with `manage_channels=true` (or confirm none exist beyond owners, which P-0 verified) so current organizers keep posting; `can()` must default-deny when the flag/column is absent (fail-closed).
2. **/me effective-permissions endpoint (risk-officer + T-8):** derive identity from the verified session ONLY (no `?userId=` param); session-scoped IDOR assertion required before merge.
3. **CTA 403 path (user-advocate):** non-permitted user sees an honest explanation, not a dead/silent CTA (trust-after-failure).
4. **Owner-lockout guardrails (user-advocate):** existing self-demotion / owner-lockout protection extends to the new permission.
5. **Reminders surfacing (strategist + realist):** keep the Resend founder-key ask surfaced (pending-founder-asks.log) so M5's reminder/North-Star arc isn't stranded; ship this slice as build-quality progress, NOT as validated-demand evidence.
