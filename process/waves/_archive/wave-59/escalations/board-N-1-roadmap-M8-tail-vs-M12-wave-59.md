# BOARD — N-1-roadmap-M8-tail-vs-M12-wave-59

**Convened:** wave-59 N-1 (automatic mode), milestone-disposition fork.
**Decision framed to the board:** APPROVE = pivot to M12 (Offline-first moat) — close M8, promote M12, decompose, seed wave-60 from M12. REJECT = keep draining the M8 tail (stay on M8).
**Classification:** Tier-3 strategic milestone-disposition / promotion → strict bar 6+/7.

## Canonical state (verified via psql this turn)
- Wave-59 waves row 66ce66c5 status='running' (to be closed at N-3).
- Active milestone: M8 (84e17739, in_progress). Child summary: open=3, done=40, seed_candidates=3.
  - Open/drainable: 5bcbd27f (DM off-token surfaces, created 2026-07-04 12:25), 874bd233 (DM throttle/429, created 2026-07-04 14:40).
  - Open/do-not-auto-drain: 999a14d1 (getDmCandidates pagination, created 2026-07-06; deferred at wave-56 P-0 as premature-at-zero-users).
- todo milestones: M9 (Monetization, FOUNDER-RESERVED), M10, M11, M12 (Offline-first moat, 36378340), M13 — all linked to live bet ad1a3685.
- M12 prose (verified): Horizon H3, Class product-feature, Tier T6, Bet source "Founder-bet", `## Success metric = _TBD by founder_`, zero child tasks.
- unassigned queue depth 13; next-claimable non-null. No stockout. Exactly one in_progress (no invariant violation).

## Votes (7 seats, fresh context, parallel, no shared state)

| # | Seat | Vote | Note |
|---|---|---|---|
| 1 | ceo-reviewer (strategist) | APPROVE | pivot to M12, disposition (ii) close-now; M8 delivered its bet-value, tail bet-neutral; offline-first is highest-value autonomous move |
| 2 | architect-reviewer | APPROVE | disposition act is reversible/low-blast; conditions: re-home 999a14d1 (not force-drain), surface _TBD metric; highest-complexity domain argues for MORE deliberate P-block framing, not against promotion |
| 3 | ux-researcher | APPROVE | offline-first is directly user-perceivable at the "moment of truth" (bad wifi); M8 tail items are near-invisible polish |
| 4 | risk-manager | APPROVE | disposition (i) drain-first; re-home 999a14d1 to keep seedable; offline-sync risk correctly contained by downstream P-block, not the milestone-direction level; no irreversible action |
| 5 | founder-proxy | **REJECT** | grounded in binding precedent (decision log): wave-37 7/7 rejected horizon-jump auto-promotion; wave-44 6/7 + wave-46 7/7+3-HARD-STOP rejected M9-M13 promotion as "_TBD metric wall + H2/H3 horizon-jump front-running founder"; M8's only prior promotion (wave-49) was a FOUNDER directive. M12's _TBD founder-metric + H3 make its direction founder-reserved. No formal HARD-STOP emitted. |
| 6 | competitive-analyst | APPROVE | offline-first is the one axis no Tier-1/2 competitor plays; high time-to-copy = genuine moat; M8 academic parity substantively reached |
| 7 | product-manager | APPROVE | disposition (ii) close-now; unblocks 3-4 waves of bet-central work; M12 zero-scope is by-design (per-wave decomposition), not a blocker |

**Tally: 6 APPROVE / 1 REJECT / 0 ABSTAIN. No formal HARD-STOP.**

## Consolidated decision — HOLD (do NOT pivot to M12); surface M12 + M9 as soft founder-direction flags

Although the 6/7 tally nominally clears the Tier-3 strict bar, the decision is resolved as **HOLD / surface-to-founder**, NOT auto-pivot. Rationale (concurred by head-next N-1 gate, verdict APPROVED):

- The founder-proxy REJECT is the **only seat that consulted the decision log** and correctly identified that M12's promotion is a **rule-17 FOUNDER-RESERVED** decision (founder-authored direction + `## Success metric = _TBD by founder_` + H3 horizon-jump), which is *above* BOARD-resolvable authority. A vote cannot grant authority the body doesn't hold; the 6/7 is advisory on this decision, not dispositive.
- The 6 APPROVE seats voted correctly on **value** (M12 is bet-central, competitor-uncontested, non-M9, credential-independent — genuinely the highest-value *autonomous-if-blessed* move). Value ≠ authority. Who-decides was the founder-proxy's point, and on that it is correct.
- Binding precedent chain (all verified in `command-center/product/product-decisions.md`): wave-37 **7/7** rejected crossing the horizon/MVP line unattended; wave-44 (6/7) + wave-46 (**7/7 + 3 HARD-STOP**) rejected M9-M13 promotion; wave-49 M8 promotion was an explicit **founder directive** ("founder authority > standing automatic-mode default"); wave-55/58 M9 disposition = keep active milestone in_progress + SOFT non-pausing founder flag (even with M8 substantive scope shipped). M12 is the same class as M9.

## Applied disposition

- **No milestone transitions.** M8 stays `in_progress`; M12 stays `todo`; M9 untouched (`todo`, founder-reserved, never routed to this or any board).
- **Surface M12 (offline-first) + M9 (paid plans) as SOFT, NON-PAUSING founder-direction flags** — checkpoint note `checkpoint-2026-07-06-m8-tail-vs-m12-offline-first.md` + this digest. No STATUS write, no `.loop-paused.yaml`.
- **Seed wave-60 with the oldest drainable M8 tail item** to keep the loop shipping value: 5bcbd27f (single-task bundle, 0 siblings). Loop-preserving, NOT the wave-46 debt-drain-while-blocked anti-pattern (M8 headline scope is SHIPPED — premise inverted vs waves 45-49).
- **999a14d1 left untouched** (do-not-auto-drain; wave-56 P-0 deferral stands).

## Escalate-as-flag, NOT escalate-as-pause

No measured rule-13 pause trigger (b/d/e/f) fired: no `.loop-paused.yaml`, no STATUS change, no founder message, no formal HARD-STOP verdict. Claimable forward work exists (M8 drainable tail). A STATUS:BLOCKED write here would itself be a preemptive-pause violation. This is a wave-55 (soft-flag, loop continues), not a wave-46 (measured pause, cupboard bare + HARD-STOPs). Loop **CONTINUES** to wave-60 P-0.

## Dissent note

founder-proxy dissent is the LOAD-BEARING signal here and was adopted as the outcome — the reverse of a routine "log dissent, majority applies." The 6-seat value-majority is recorded as correct-on-value / wrong-on-authority. No member tuning proposed: the six seats performed their lens correctly; the structural point is that a founder-reserved decision should not have been framed to the board as board-resolvable in the first place. Flag for L-2: consider whether a `_TBD by founder_` success-metric on a todo milestone should auto-route milestone-promotion to founder-flag rather than BOARD.
