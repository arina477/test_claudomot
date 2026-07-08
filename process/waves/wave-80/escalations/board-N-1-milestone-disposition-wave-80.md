# BOARD — N-1-milestone-disposition-wave-80

**Convened:** 2026-07-08 (wave-80 N-block, N-1 survey & triggers)
**Mode:** automatic
**Decision class:** Tier-3 milestone-disposition (strategic scope call) → 6+/7 strict threshold
**Question:** M13's autonomous engineering scope is shipped; the only open child is a demand-gated read-receipts subsystem all 3 wave-80 P-0 reviewers deferred. Keep M13 open to build read-receipts next (A), or re-classify read-receipts to backlog + close M13 at its autonomous boundary (B)?

## Options
- **(A)** Keep M13 open + build read-receipts next (wave-81). Completes the literal M13 queue but autonomously commits a Discord/Telegram-parity subsystem with zero demand evidence, contradicting the P-0 deferral.
- **(B)** Re-classify `12f6135e` to unassigned backlog (`milestone_id=NULL`, NOT deleted) + transition M13 → done (substantively complete for its autonomous scope; fenced B2B2C + `_TBD_` metric reach the founder-disposition point). read-receipts stays a demand-gated backlog item.

## Votes (7/7)

| Seat | Vote | Hard-stop | One-line rationale |
|---|---|---|---|
| strategist | **APPROVE B** | none | B tightens the academic + offline-first wedge; A blurs it by spending a subsystem off-thesis on Discord-parity. Mirrors M11 close-at-boundary precedent. |
| industry-expert | **APPROVE B** | none | Milestone-hygiene + anti-feature-factory: close at shipped boundary, park demand-gated parity. Read-receipts is a solved primitive but not the wedge; industry ships it opt-out/off-by-default. |
| realist | **APPROVE B** | none | Zero demand evidence for read-receipts (product-decisions.md:879). (B) is the honest, cheap, reversible two-way door; verified M13 "done" is real (13 other children done, fenced items genuinely founder-reserved), not hand-waving. |
| user-advocate | **APPROVE B** | none | Read-receipts imports "seen-but-no-reply" social pressure — opposite of the calm/academic brand. No user harmed by parking it. A `sendReadReceipts` toggle over a nonexistent feature would be privacy-theater (already forbidden by disabled `whoCanDm` precedent). |
| risk-officer | **APPROVE B** | none | (A) commits 3 highest-risk surfaces (schema migration + Socket.IO fan-out + privacy-enforcement) speculatively. (B) is fully reversible metadata-only DB op. State-machine hygiene: set milestone_id=NULL FIRST, then M13→done, then stockout cascade. |
| counter-thinker | **APPROVE B** | none | Steel-manned (A) and it broke on the facts: read-receipts is a mis-parented orphan (spun off from a toggle gating a nonexistent feature), not deferred M13 scope. Re-homing corrects scope, not moves goalposts. Backlog is reversible via N-1 queue-walk. (B) survives strongest attack. |
| founder-proxy | **APPROVE B** | none | Documented founder-accepted precedent on all 3 lenses: demand-gating discipline (product-decisions.md:876,879,880,883), fencing pattern (839,854,873), M9-substrate-then-founder completion pattern (687,770). B matches documented intent. |

## Tally
- **APPROVE B: 7/7** — clean unanimous.
- APPROVE A: 0 | REJECT: 0 | ABSTAIN: 0
- Hard-stop vetoes: 0
- **Threshold:** Tier-3 strict = 6+/7. **7/7 clears the bar decisively.**

## Consolidated decision
**Option B adopted (7/7).** Re-classify `12f6135e` (read-receipts + sendReadReceipts toggle) to the unassigned backlog (`milestone_id=NULL`) and transition M13 → done. M13's autonomous engineering scope (educator console, portable academic identity, E2E DM encryption, presence privacy toggle) is shipped; the remaining `## Fenced` items (B2B2C go-to-market + `_TBD_` success metric) are founder-reserved and reach the founder-disposition point.

## Dissent / caveat notes (unanimous-approve conditions carried into execution)
1. **Re-classify, do NOT delete** — `12f6135e` stays a queryable `todo` row at `milestone_id=NULL` so N-1's per-wave unassigned-queue walk can re-home it the instant founder or real demand signals (counter-thinker, realist, founder-proxy). This is the sole failure mode of (B) — strand-forever — and the live queue-walk mitigates it.
2. **Preserve the parked spec's privacy contract** — the deferred who_can_dm + blocks enforcement note and the anti-theater rule (build the real seen-by feature BEFORE any toggle) must survive in the task description (risk-officer, user-advocate, founder-proxy). No task-description rewrite needed — the existing description already carries this.
3. **Fenced items reach founder-disposition, not silent drop** — closing M13 surfaces B2B2C go-to-market + `_TBD_` success metric to the founder (strategist). Recorded in product-decisions.md and the board digest.

## Downstream consequence
(B) empties the active-milestone queue AND the todo-milestone queue was already empty (0). N-1 Action 8b **stockout cascade fires** → roadmap-planning (reason `milestone-stockout`), routed to BOARD under automatic mode (slug `N-1-roadmap-planning-wave-80`).
