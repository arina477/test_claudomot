verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
symptom_vs_cause:
  status: run
  result: |
    Both findings verified as cause-layer, not symptom-layer, against the cited code.

    FINDING-1 (member-row Block↔Unblock toggle) — MemberListPanel.tsx:546-566 hardcodes a
    block-only <button> (aria-label "Block", ProhibitIcon, onClick=onBlock) with NO isBlocked
    lookup. Confirmed. This is NOT a symptom of a missing live-state layer: the same component
    already carries a live-state layer for every other member-row concern — presence
    (getStatus(m.userId) → online), mute (isMuted(member.mutedUntil) → memberIsMuted),
    permissions (getMyPermissions fetch). The block affordance is the lone action that
    hardcodes its state instead of reflecting it. The cause is a missing state slice on an
    established pattern; the proposed fix (fetch GET /blocks → blocked-id Set → pass isBlocked
    → render Unblock/unblockUser on blocked rows) is at the exact cause layer.

    FINDING-2 (enrich GET /blocks) — packages/shared/src/blocks.ts BlockSchema returns bare
    FK ids (blocker_id, blocked_id, id, created_at) with no display name / avatar; blocks.service.ts
    listBlocks() does a flat SELECT on user_blocks with zero JOIN. Confirmed. The "blocked-users
    list shows raw UUID" symptom traces directly to this DTO shape. The proposed fix (listBlocks
    JOIN to users + a richer DTO + render) lands at that contract seam — cause layer, not a UI
    string-formatting workaround.
reasoning: |
  Both V-2 findings are correctly framed: right problem, right layer, no symptom-masking.
  FINDING-1 fixes state-reflection in the frontend where the bug lives (backend already exposes
  unblockUser + listBlocks), and the member panel already has a live-state layer so this is a
  well-scoped state-slice addition, not evidence of a deeper missing-live-state issue.
  FINDING-2 is a genuine contract-seam fix at the DTO/service layer, not a workaround. No
  antipattern matches. The two form a coherent M14 block UI-polish slice; whether they share one
  wave is P-1's RESCOPE-AUTO-MERGE call, not a framing defect — I flag it as appropriate and
  defer the merge decision to P-1.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
merge_note: |
  Bundle disposition is P-1's call, not mine. This is NOT antipattern #5 (scope creep through
  coupling): the two findings are not unrelated changes stapled "while we're in there" — they
  are the two remaining UI-POLISH legs of M14 after all 4 mvp-critical Scope legs shipped in
  wave-70, and they share one surface concern (surfacing block state to the user). RESCOPE-AUTO-MERGE
  (both in one wave) is the P-1 sizing authority per the P-0 stage contract; PROCEED-with-note is
  the correct P-0 disposition. I do NOT invoke RESCOPE-AUTO-SPLIT.
smell_no_catalog_match: |
  One thing to hand to P-1 / P-2 (framing-adjacent, not a reframe): FINDING-1's blocked-id Set is
  built from GET /blocks (blocker_id === viewer). FINDING-2 enriches that same endpoint's DTO.
  If both ship together, the enriched DTO already carries blocked_id, so the Set for FINDING-1 can
  be derived from the same fetch with no second call — a natural reason the merge-up is coherent.
  Not a framing defect; flagged so P-1/P-2 avoid speccing two independent GET /blocks fetches.
sibling_visible: false
