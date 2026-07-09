# BOARD decision — P-1-floor-merge-wave-87

**Mode:** automatic · **Threshold:** 4+/7 (process/scope call, not Tier-3) · **Convened:** wave-87 P-1

## Question
Wave-87's reframed fix (converge new server-member joins onto the server's existing `is_default` 'Member' role in the shared join-insert; behavior-preserving data-hygiene, ~140 LOC; removes a standing backfill dependency) trips the single-spec minimum size floor (>1,500 LOC). The RESCOPE-AUTO-MERGE remedy is structurally impossible: roadmap complete (0 in_progress + 0 todo milestones), seed milestone-unassigned. Resolve.

## Votes (7/7 APPROVE A — unanimous)

| Member | Vote | One-line |
|---|---|---|
| ceo-reviewer | APPROVE A | Floor blocks wasteful tiny waves, not coherent high-value ones; B inverts the floor's intent. |
| architect-reviewer | APPROVE A | Single fix = tiny blast radius + single revertable commit; B couples independent rollbacks to game a count. Caveat: no unique idx on (server_id,is_default) → defensive LIMIT 1 + zero-default fallback. |
| ux-researcher | APPROVE A | Fix is UX-invisible by construction; B manufactures student-facing regression risk across 6 surfaces. |
| risk-manager | APPROVE A | Incoherent 6-bug grab-bag hides regressions — larger process risk than override-shipping a coherent fix whose floor can't structurally be met. |
| founder-proxy | APPROVE A | Direct precedent: wave-83 floor-waive entry (bug-fix phase, natural coherent size, no merge candidate → "Floor WAIVED per PRODUCT-PRINCIPLES #5"); B is logged contra-precedent ("padding = the floor's anti-goal"). |
| competitive-analyst | APPROVE A | DORA-elite maintenance cadence = continuous small revertable PRs; B is an artificial release-train anti-pattern. |
| product-manager | APPROVE A | LOC floor is a thin-feature guard that misfires on maintenance; A maximizes healthy throughput. Settled waves 16/21/23/24/25/50 pattern. |

**Hard-stops:** none.

## Decision: A — override-ship the coherent sub-floor single-fix.

## Precedent + guardrails (BOARD-attached)
Bug-fix-phase sub-floor waves ship at their natural coherent size when ALL FOUR conjunctive conditions hold:
1. founder bug-fix phase active,
2. RESCOPE-AUTO-MERGE impossible (no in_progress/todo milestone; seed milestone-unassigned),
3. a single coherent fix (not a grab-bag),
4. behavior-preserving or live-verified at natural size.

**Apply-by-citation — do NOT re-convene BOARD** for future waves meeting all four; resolve by rule and cite this decision + the wave-83 lineage. Each override tags a reminder that the founder's parked strategic re-plan (roadmap-planning) remains open, so a long sub-floor run does not mask it.

## B-block carry-forward (architect-reviewer caveat)
- No unique constraint on `(server_id, is_default)` (`apps/api/src/db/schema/servers.ts:54` plain boolean). Join fix MUST `SELECT id FROM roles WHERE server_id=$ AND is_default=true LIMIT 1` and handle the zero-default legacy-server case (fallback: leave role_id NULL rather than throw, OR upsert-then-assign) — do not assume exactly one default role exists.
- Keep `backfill-roles.ts` running until new-join NULL creation drains; retire only after the fix has been live long enough that no NULL-role rows are being created.
