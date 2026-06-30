# Wave 15 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-15/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-15 ships M3 @mentions — the lightest unshipped M3 scope item — and ladders cleanly to the single live founder bet (ad1a3685 "Academic tools + offline-first win students from Discord"): mentions is core displace-Discord engagement. The reframe trio (problem-framer, ceo-reviewer, mvp-thinner) all returned PROCEED and were reconciled with no silent override. I ratify the load-bearing P-1 floor call: the ~2600 LOC err-high estimate is defensible because this wave carries real backend weight the presence wave lacked — a 0007 migration, a word-boundaried parser, edit add/remove DIFFING, and a paginated authz-scoped /me/mentions endpoint — ON TOP of two net-new UI surfaces (autocomplete with keyboard-nav, pills/unread) and 3-layer tests; landing at the multi-spec floor boundary is honest and B-block confirms actual LOC. Rejecting RESCOPE-AUTO-MERGE is sound: the only adjacent M3 targets (threads, attachments) are incoherent with a mentions vertical slice and excluded by the reframe coherence finding — merging would bloat, not help. All three spec blocks are self-contained with falsifiable, observable ACs; the security-tightened authz ACs are explicit and correct (session-derived userId never a request param, no cross-user read, membership-scoped resolution, non-member tokens stay plain), edit-diffing is covered, and @everyone/@role + notification-inbox are correctly OUT. The plan reuses the locked architecture (persist-vs-parse-on-read trade-off named; realtime over the existing /messaging gateway with no new namespace; sound schema with FK CASCADE, UNIQUE, and a my-mentions index), introduces no new infra or deps (no gold-plating), and maps every AC to at least one file step. The spec contract is embedded as a YAML head in the seed task's description (verified directly from the DB row), not only the convenience pointer. design_gap_flag is correctly TRUE for three net-new surfaces, so the D-block handoff is right.

## Stage-exit checklist (Phase-1, walked from artifacts)

**P-0 Frame**
- [x] Concrete user job / root cause — @mention primitive, documented M3 ## Scope; not a demo-path artifact.
- [x] Maps to exactly one live bet — ad1a3685 (cited from founder_bets where status='live').
- [x] Falsifiable — observable signals: GET /me/mentions rows, realtime mention arrival, pill render, unread-clears-on-view.
- [x] problem-framer + ceo-reviewer verdicts present and reconciled (mediation: no ceo-expand vs mvp-thin conflict).

**P-1 Decompose**
- [x] One seed + only siblings that must ship together for the mvp-critical mention claim (data plane + autocomplete + pills/unread = coherent slice).
- [x] mvp-thinner floor-blocked OK ratified; err-high ~2600 LOC estimate defensible (migration + parser + edit-diffing + authz endpoint + 2 UI surfaces + 3-layer tests).
- [x] No task depends on an unbuilt task outside the bundle (reuses shipped wave-12/13/14 primitives).
- [x] RESCOPE-AUTO-MERGE rejection sound (only merge targets incoherent + excluded by reframe).

**P-2 Spec**
- [x] ACs enumerated, each independently verifiable, across all 3 blocks.
- [x] Empty/loading/error/offline-adjacent states specified (edge-cases: non-member→plain, dup→UNIQUE, self-mention no-badge, edit-remove/add, tombstone, pagination-stable, cross-user→403/empty, no-match dropdown, @-mid-word no-trigger).
- [x] Non-goals explicit (@everyone/@here/@role OUT; notification-inbox OUT).
- [x] Auth/session surface flagged for tightened security gate (my-mentions authz + membership-scoped resolution → T-8 + P-4).
- [x] Spec contract embedded as YAML head in seed tasks.description (verified from DB row, not only the pointer).

**P-3 Plan**
- [x] Reuses established architecture (persist-vs-parse-on-read named/rejected; /messaging gateway reuse, no new namespace; keyset-cursor my-mentions).
- [x] No unneeded infra (no Redis/multi-replica/billing); no new deps.
- [x] Each plan step maps to a bundle task and produces an observable artifact (self-consistency sweep present).

**P-4 Gate**
- [x] Every upstream checkbox ticked from concrete artifact (P-0/P-1/P-2(DB)/P-3 read this turn).
- [x] design_gap_flag handoff correct (TRUE → D-block; 3 net-new surfaces: autocomplete dropdown, mention-pill, unread affordance).

## Security-tightened gate note
wave_touches ∩ {auth, sessions} ≠ ∅ (GET /me/mentions session-derived authz + membership-scoped resolution). Phase-1 confirms authz ACs are explicit and present. Per Action 1 security rule, if the first Phase-2 pass returns BLOCK with >2 medium+ findings, a second Phase-2 iteration is forced after rework (cap 3 total). Phase 2 (karen + jenny + Gemini) must still run.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## Phase 2 — Karen + jenny + Gemini (appended)
| Reviewer | Verdict | Notes |
|---|---|---|
| karen | **APPROVE** | 7 claims VERIFIED. Hooks (messages.service create:136/edit:228), GET /servers/:id/members reuse, /messaging room emit carries DTO (no new ns), message_reactions pattern precedent, MessageResponse extend site. 2 non-blocking B-carries below. |
| jenny | **APPROVE** | No drift. 3-block spec MATCHES M3 ## Scope "mentions" 1:1; #8-primitive stays clear of #14-notifications (unread is primitive-level badge, no inbox); honors 2-namespace lock; @everyone/@role OUT; M3 not prematurely closed. |
| Gemini | **UNAVAILABLE** | exit=3 ("no text", retried). Degrades — gate proceeds on karen+jenny. |

## Gate result: PASSED → D-block (design_gap_flag: true)
### B-block carries (non-blocking, from karen):
1. Generate migration 0007 via the drizzle toolchain (prior numbering non-contiguous: two 0004_*, no 0003) — don't hand-name.
2. `users.username` is NULLABLE → filter `username IS NOT NULL` in mention resolution AND autocomplete candidates.
- Next: D-1 Brief (mention autocomplete dropdown + mention-pill + unread affordance).
