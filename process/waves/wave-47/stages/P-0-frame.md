# Wave 47 — P-0 Frame

## Discover section
- wave_db_id: d8c59c4b-ddf3-460c-b2d4-1ee73fb89077 (wave_number 47, running, milestone M8)
- Prior-work: wave-46 shipped the DM engine LIVE; F-A (CRITICAL, BOARD-approved deferral) = DMs unstartable via UI. This wave = the #1 M8 follow-up (entry-point completion).
- Roadmap milestone: M8 (84e17739, in_progress); seed milestone-aligned; wave milestone_id backfilled at INSERT.
- Spec-contract short-circuit: **no-prior-spec** (seed 10967558 is V-2 prose) → full P-1..P-3.
- **Product decision RESOLVED (Action 4):** DM candidate-source = server co-members, who_can_dm-filtered, single-source list (NOT global directory / typeahead). Routing: BOARD-resolvable-with-default per all 3 reframe reviewers — implements existing who_can_dm='server-members' policy, NOT founder-reserved. Recorded in product-decisions.md (2026-07-04) with async founder-veto + global-directory-is-founder-reserved guardrail. NOT a founder pause.

## Reframe section
- Original framing: complete M8 DM entry point — seed 10967558 (candidate source + GET /dm/candidates + StartDmPicker rebuild) + sibling 379978a4 (username-vs-userId id-space fix; cures F7).
- **problem-framer: PROCEED.** Root cause confirmed (DmHome passes serverId=selectedId always-null; picker's only source is server-scoped GET /servers/:id/members; no /dm/candidates exists — a server-scoped source on a cross-server/serverless surface). Fix targets the true cause. Sibling F7 = cause-layer (self keyed on username not users.id). Routing: **BOARD-resolvable, server-co-members default, NOT founder-reserved**. Load-bearing: candidate-source resolved at spec-time before picker rebuild (else green-by-guessing).
- **ceo-reviewer: PROCEED (HOLD-SCOPE).** Highest-value completion (converts wave-46's sunk investment from 0% realized to usable). Routing: **BOARD-resolvable, server-co-members = faithful implementation of existing who_can_dm policy, NOT founder-reserved for this wave**; global-directory expansion IS founder-reserved (guardrail). block/report deferral acceptable (candidate surface bounded to shared-server graph → small abuse surface).
- **mvp-thinner: OK.** 2-task bundle minimal (both load-bearing for "startable" + correctness). Scope-fence: single candidate source (server co-members, who_can_dm-filtered LIST) — NOT directory/typeahead/search/ranking/presence/pagination (would be OVER-scope). Don't add picker-side who_can_dm restriction UI (backend 403s; later sibling 5bcbd27f).
- Mediation: none (no disagreement; all converge on server-co-members + hold-scope).
- Sibling task IDs created: none.
- Disposition: **PROCEED**. Candidate-source decision resolved (server co-members, who_can_dm-filtered).
- Final framing: complete the DM entry point. GET /dm/candidates (server co-members, who_can_dm-filtered, single-source) + rebuild StartDmPicker against it (DmHome no longer server-gated) + fix username→users.id id-space (cures F7). Scope-fenced: no directory/typeahead. design_gap_flag likely FALSE (picker UI + candidate-list states exist in design/direct-messages.html).

```yaml
p_stage_verdict: COMPLETE
disposition: PROCEED
short_circuit: no-prior-spec
reframe: {problem-framer: PROCEED, ceo-reviewer: PROCEED-HOLD-SCOPE, mvp-thinner: OK}
product_decision: "DM candidate-source = server co-members, who_can_dm-filtered, single-source (NOT directory); recorded product-decisions.md; async founder-veto; global-directory=founder-reserved guardrail"
carry_forward:
  - "P-2: candidate-source is server co-members, who_can_dm-filtered; GET /dm/candidates contract; NO directory/typeahead (mvp-thinner scope-fence)"
  - "P-2: fix DmHome self-id from username -> users.id (cures F7 optimistic-author + self-exclusion)"
  - "P-1: design_gap_flag likely false (StartDmPicker + candidate states already in design/direct-messages.html)"
```
