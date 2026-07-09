# Wave 87 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave87-p4)
**Reviewed against:** process/waves/wave-87/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave fixes the right problem at the right layer. P-0 caught what looked like an RBAC security gap and, through both reviewers converging independently, reframed it correctly to behavior-preserving data-hygiene: new server joins insert `role_id=NULL` rows that a standing backfill (`backfill-roles.ts`) must perpetually repair, and the wave converges both join paths onto the server's existing `is_default` 'Member' role so that invariant holds at write time. I verified the two load-bearing claims against the codebase: (1) `server_members.role_id` already exists as a nullable FK in `db/schema/servers.ts` — confirming no schema change or migration is needed; (2) both `joinPublicServer` (`servers.service.ts:711`) and `joinViaInvite` (`:754`) insert via `.onConflictDoNothing()`, so a re-join skips the insert and an existing member's `role_id` is untouched (AC4 holds structurally, not by extra code). I also confirmed the per-server default role is seeded at `createServer` (all flags false, `is_default:true`) and that `is_default` carries no unique constraint — the architect-reviewer caveat the spec and plan correctly defend with `LIMIT 1` + a null fallback that leaves `role_id` NULL rather than throwing. The five acceptance criteria are each independently verifiable and observable; empty/edge states (zero default role, multiple default roles, re-join, concurrent joins, private/invalid-invite) are enumerated; non-goals are explicit ("NOT a security fix," no schema/migration). The plan reuses the shared-resolver pattern without over-abstracting (Alt C rejected — no gold-plating), adds no infrastructure or dependencies, and maps every AC to a concrete file step. The wave ladders to the live "academic tools + offline-first win students from Discord" bet on the core servers/RBAC membership surface — no orphan wave. The sub-floor single-spec size was correctly escalated (RESCOPE-AUTO-MERGE structurally impossible: roadmap complete, seed milestone-unassigned) and resolved by BOARD 7/7 override-ship, with the reusable precedent logged to product-decisions.md. `wave_touches` correctly excludes auth/sessions/csrf, so the security-scope tightened gate does not apply. Every upstream stage-exit checkbox ticks from a concrete artifact; the reframe reviewers are present and reconciled; `design_gap_flag` is correctly false (backend-only, no user-visible change). No REWORK trigger fired.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## Phase 2 — Karen + jenny + Gemini (merged)

**Attempt:** 1 · **Phase:** 2

| Reviewer | Verdict | Notes |
|---|---|---|
| Karen | **APPROVE** | All 7 load-bearing claims VERIFIED at file:line (createServer default-role seed :102-111; both join inserts + onConflictDoNothing :708-711/:751-755; role_id existing nullable FK schema servers.ts:68; backfill-roles.ts:79; RBAC NULL≡base-member rbac.service.ts canViewChannel/can(); no unique idx on (server_id,is_default) → LIMIT 1 load-bearing; spec test role_id:null at spec:177). Non-blocking: spec prose says role_id is `text` FK — actually `uuid` (cosmetic; resolver Promise<string\|null> still correct). |
| jenny | **APPROVE** | All 5 ACs MATCH prior decisions; framing "behavior-preserving / not-a-security-fix" consistent with documented default-DENY RBAC model + wave-87 P-0 reframe (product-decisions L919-922). Fulfills standing journey-map finding F67-T5-2 (T-9 should retire that finding line). No drift. |
| Gemini | **UNAVAILABLE** | Helper exit=3, HTTP 429 (AI Studio prepayment credits depleted). Degrade-and-proceed per P-4 Action 3 — does NOT block; gate passes on Karen + jenny. |

## Phase 2 verdict: PASS — exit P-block.

Karen + jenny both APPROVE; Gemini UNAVAILABLE (recorded, non-blocking). Security-scope tightened gate N/A (wave_touches excludes auth/sessions/csrf — behavior-preserving data-hygiene, not an authz change).

### B-block carry-forward notes
- role_id column is `uuid` (not `text`) — resolver returns string; no impact. Update spec prose opportunistically, not required.
- architect-reviewer caveat (from P-1 BOARD): no unique idx on (server_id, is_default) → resolver `LIMIT 1` + stable ORDER BY + zero-default NULL fallback (no throw); keep backfill-roles.ts running until new-NULL creation drains.
- jenny: T-9 Journey should retire journey-map finding F67-T5-2 once shipped.

- verdict_complete: true
- gate_result: PASS (Phase 1 APPROVED + Phase 2 Karen/jenny APPROVE, Gemini UNAVAILABLE)
