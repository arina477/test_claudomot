# BOARD escalation — `V-3-cap-wave-46`

**Convened:** wave-46 V-3 gate (mode: automatic). Trigger: V-3 fast-fix disposition escalation — head-verifier attempt-2 verdict ESCALATE (triage sound, but shipping a live feature with a known-CRITICAL "unstartable through the UI" gap deferred to a follow-up is a revert-vs-accept-known-broken-vs-expedite product/risk call the V-block may not self-certify).
**Decision:** how to dispose of wave-46 given the CRITICAL Start-DM-picker entry-point gap (F-A) that is NOT a bounded fast-fix.

## Options
- **A — ACCEPT-KNOWN-BROKEN:** leave live; fast-fix [F-C1, F6, F-I4] now; F-A + F7 as #1 seeded M8 follow-up bundle; advance to Learn.
- **B — REVERT:** roll back merge/deploy (unwinds live migration 0021); re-cycle with F-A in scope.
- **C — EXPEDITE-IN-WAVE:** hold V-block; build candidate-source endpoint + picker fix this wave (B→C→T→V) before Learn.

## Votes (7 members, fresh context, independent — none saw another's vote)

| Member | Vote | One-line rationale |
|---|---|---|
| ceo-reviewer | **A** | Pre-launch ~0 users; live-but-unstartable costs ~nothing while proven reusable backend advances offline-first/displace-Discord bets. F-A is a P-0 framing question, not a V-3 fast-fix. |
| architect-reviewer | **A** | Lowest blast radius: F-A fix is additive (new read endpoint + client rewire, no schema change); REVERT unwinds a live migration-bearing deploy (0021) with rollback-of-rollback risk. |
| ux-researcher | **A** | UX gap real but invisible (dead end, not misleading partial flow); no user harm at ~0 users; validating the DM substrate now makes the entry-point fix land cleanly. |
| risk-manager | **A** | Strictly-better-than-now, no data-loss/security/auth exposure (IDOR + who_can_dm proven; dead entry point = zero reachable attack surface). F-A deferred WITH TEETH (CRITICAL, gates clean exit) — CRITICAL still means CRITICAL. |
| founder-proxy | **A** | Founder's live direction + logged pattern ("fold follow-ups around core work, keep momentum"; 2026-07-04 "go with B, connect it yourself"). Flag: the "who's DM-able" candidate-set is a taste call the founder will want at the follow-up's P-block (not this gate). |
| competitive-analyst | **A** | Industry (Discord/Slack) sources DM candidates via directory/global-search, not server-context — a real product decision worth framing properly, NOT rushing as an in-wave fast-fix. |
| product-manager | **A** | The backend IS the MVP; the picker is UI over a proven backend. Seeding F-A as explicit #1 M8 follow-up protects the outcome; caveat: flag "backend solid, entry point deferred" at handoff. |

**Tally: A = 7/7 · B = 0 · C = 0 · hard-stop vetoes = 0.**
Threshold: 4+/7 default → **met unanimously.** No dissent to log (0 against). No member flagged HARD-STOP: must be human.

## Consolidated decision: **A — ACCEPT-KNOWN-BROKEN**

1. Wave-46 stays LIVE (no revert).
2. V-3 Phase 2 fast-fixes the bounded queue **[F-C1, F6, F-I4]** this wave (Iron Law: route to node/react specialists), re-verify with Karen + jenny, re-deploy api+web (user-facing code on live main).
3. **F-A (CRITICAL) + F7** remain the highest-priority M8 follow-up — seeded as a blocking bundle (parent `10967558-f27f-4f47-81be-5b5e5d878259` + sibling `379978a4-0497-449f-8807-4cffe53d1436`, milestone M8, wave_id NULL). Its P-block must frame the candidate-source product decision (founder-proxy + competitive-analyst both flagged "who's DM-able" as a real product/taste call). Flagged at N-handoff as a known-gap for the founder's next prioritization.
4. After fast-fixes clear + re-verify APPROVE → V-block exits to Learn.

## Carried notes for downstream
- **founder-proxy + competitive-analyst flag:** the candidate-source ("who is DM-able from the DM home") is a product/taste decision — the follow-up wave's P-0/P-2 must surface it, not guess it.
- **product-manager flag:** surface "backend solid, entry point deferred" as a known-gap at N-handoff for the founder.
