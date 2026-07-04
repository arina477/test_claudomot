# BOARD — N-1-wave-46-disposition

**Convened:** 2026-07-04, wave-45 N-1 (Next block, Survey & triggers).
**Mode:** automatic. **Threshold:** 4+/7 standard; 6+/7 for Tier-3 strategic. **Slug:** `N-1-wave-46-disposition`.
**Question:** What should wave-46 do at N-1 disposition, given the 3rd-consecutive-debt guardrail and the pending founder-reserved M8 success-metric?

## Decision packet (survey facts, verified against the DB)

- Active milestone **M8 Educator tools & deeper academics** (id `84e17739`, in_progress, Horizon H2): child tasks open=2, done=16, seed_candidates=2.
- The 2 open M8 seed candidates are BOTH tech-debt V-2 follow-ups from wave-45: `f8eb49c1` (unit-test buildTypingLabel — test-coverage) + `a1dda389` (harden delete-any-message 2-client E2E — test-honesty). wave_id=NULL, parent NULL → seedable.
- M8 `## Success metric = _TBD by founder_`. Remaining M8 discretionary product scope (study-groups / DMs / message search) unbuilt AND contract-barred from decomposition while the metric is _TBD.
- 5 todo milestones M9–M13: **ALL FIVE carry `## Success metric = _TBD by founder_`** (verified). M9 Monetization (H2), M10 Compliance (H2, gates on a paying-school trigger not fired), M11 Growth (H2, T6), M12 Offline-first moat (H3), M13 Institution partnerships (H3).
- Unassigned queue (milestone_id NULL): 11 tasks — 10 unambiguous tech-debt / hardening / test-hygiene; the 11th (`fdb444fc` presence-dots) self-labeled "re-homed M3 presence debt", "ZERO backing acceptance criterion", "unspecified surface, partly not-yet-built".
- Guardrail (product-decisions.md, wave-45 P-1, BOARD 7/7): "wave-46 must NOT be a 3rd consecutive debt-only wave — re-escalate the founder's M8 metric rather than auto-merging more hygiene." wave-44 AND wave-45 were both metric-independent tech-debt hygiene waves. The M8 success-metric is founder-RESERVED (established wave-43/44 — NOT BOARD-decidable), pending 3+ waves.

**Options:**
- **A** — Seed wave-46 from the 2 M8 debt follow-ups → 3rd consecutive debt-only wave (guardrail-forbidden).
- **B** — Promote a todo milestone (M9–M13) for a product wave-46 (premature-close of unshipped M8 + all metric-barred + horizon-jumps; rejected at wave-44).
- **C** — PAUSE the loop + re-escalate the founder-reserved M8 metric (guardrail-required regardless). Measured board-escalation hard-stop.
- **D** — CONTINUE on a legitimate non-debt unassigned task (e.g. presence-dots `fdb444fc`) WITHOUT pausing.

## Votes (7 members, fresh context, parallel, no cross-talk)

| Member | Vote | Hard-stop flag |
|---|---|---|
| strategist | **APPROVE C** | HARD-STOP: M8 metric founder-reserved, gates every non-debt path |
| industry-expert | **APPROVE C** | none |
| realist | **APPROVE C** | HARD-STOP: no legitimate non-debt path; founder must supply M8 metric or park M8 |
| user-advocate | **APPROVE C** | none |
| risk-officer | **APPROVE C** | none (C is the required measured board-escalation; clean pause, zero tech-risk) |
| counter-thinker | **APPROVE C** | HARD-STOP: M8 metric is the single load-bearing decision barring all product scope; only founder can unblock |
| founder-proxy | **APPROVE C** | none |

**Tally: C = 7/7.** Exceeds the 4+/7 default and the 6+/7 Tier-3 strict bar. 0 REJECT, 0 ABSTAIN. Three HARD-STOP flags (strategist, realist, counter-thinker) reinforce founder-escalation.

## Consolidated decision

**PAUSE wave-46. Re-escalate the founder-reserved M8 success-metric to the founder. Do not open wave-46; do not run N-2/N-3.**

Rationale (converged across all 7 lenses):
- **A is barred** by the wave-45 P-1 guardrail (BOARD 7/7) — it is the 3rd consecutive debt-only wave, the "avoidance disguised as flow" the counter-thinker warned of.
- **B is blocked** — M8 is in_progress + unshipped (promotion forces a premature-close anti-pattern), and all M9–M13 hit the same `_TBD` metric wall + are H2/H3 horizon-jumps; wave-44 N-1 (6/7) already rejected this.
- **D is debt in disguise** — the only non-debt-sounding unassigned task (`fdb444fc`) self-declares zero acceptance criterion on a partly-unbuilt surface; realist + user-advocate + counter-thinker independently rejected it as re-homed debt, not forward product work.
- **C is the only lawful, on-thesis outcome** — metric-independent M8 work is exhausted; every remaining product path is contract-barred by a founder-RESERVED decision that no BOARD member can set. This is a MEASURED hard-stop (board-escalation), not a preemptive/anticipatory pause.

## Dissent / caveats (APPROVE-with-concerns notes)

- **industry-expert:** the 2 open M8 tech-debt follow-ups may be salvaged into the paused wave's tail if the founder answers quickly — but must not become the wave's reason to exist.
- **risk-officer:** ensure the 2 M8 V-2 follow-ups (`f8eb49c1`, `a1dda389`) are not silently stranded on pause — keep them seedable per the V-2 wave_id-NULL rule (they already are: wave_id NULL, parent NULL).
- **user-advocate:** self-use-mvp, zero external users — C is a procedural board-escalation to the founder, correctly routed there; no user-perceivable regression.

## Applied outcome

- No milestone transition. M8 stays `in_progress`. No promotion. No decomposition fired.
- No wave-46 opened (N-2/N-3 not run).
- Founder re-escalation written to `process/session/updates/checkpoint-2026-07-04-wave46-m8-metric-reescalation.md`.
- Recommended loop pause: `STATUS: BLOCKED`, `pause_evidence.trigger: d-hard-stop-verdict`, `measurement.shape: board-escalation` (citing this artifact + slug). The flag is written by the orchestrator after trigger verification, NOT by head-next.
