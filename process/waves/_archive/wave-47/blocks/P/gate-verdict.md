# Wave 47 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-47/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-47 completes the M8 direct-message entry point — it makes the wave-46 DM engine (shipped live but unstartable through the UI) actually usable, which is the highest-value follow-up available and converts prior sunk investment from 0% realized to functional. It ladders cleanly to the live founder bet (Academic tools + offline-first win students from Discord, ad1a3685) via the in_progress M8 milestone. The two-task bundle is correctly sized and scope-fenced: a single co-members candidate source with no directory, typeahead, ranking, presence, or pagination. Every acceptance criterion is independently observable (co-members union, self + who_can_dm='nobody' exclusion, cross-server dedup, 200 empty-array, end-to-end startable flow resolving F-A, optimistic author rendering the sender's display name rather than "Unknown user" — resolving F7). Empty, loading, and the removed server-gated dead-end state are all specified; non-goals are named explicitly; the id-space root cause (self keyed on username vs opaque users.id) is fixed at the cause layer. The plan reuses the locked architecture (mirrors the ServerMember DTO shape, the caller's-servers server_members query pattern, and wave-46 find-or-create) with no schema change and no scale gold-plating. Both contested routing calls resolve soundly (see below). No defect found.

### Gate-focus adjudications (recorded for the reviewer pool)

**Candidate-source founder-vs-BOARD routing — SOUND (not founder-reserved for this wave).** The resolution (server co-members, who_can_dm-filtered, single-source) *implements* the already-shipped, founder-set `who_can_dm='server-members'` privacy policy rather than making a novel social-model decision. The new candidate population is bounded to people the caller already shares a server with — the exact population that shipped privacy option governs — so there is no new stranger-DM / social-reach surface. The genuinely founder-reserved expansion (global / stranger directory) is explicitly guardrailed to re-escalate, and the decision is recorded in product-decisions.md (2026-07-04) with async founder-veto. All three P-0 reframe reviewers (problem-framer, ceo-reviewer [board seat], mvp-thinner) independently endorsed. Under rule 17 this is a technical consequence of an existing founder decision, not a fresh product/taste bet — BOARD-resolvable-with-default + async-veto is correct routing, not a founder-ask that was skipped.

**Sub-floor override shortcut — DEFENSIBLE (no redundant 8th BOARD required).** The bundle is correctly-sized, not under-scoped: both reframe reviewers with scope authority (ceo-reviewer HOLD-SCOPE, mvp-thinner OK) explicitly rejected expansion, so padding the bundle to meet the multi-spec LOC floor would violate reframe consensus. This is the 8th instance of the documented "correctly-sized completion wave trips the thin-FEATURE LOC floor" pattern (w16/21/23/24/25/26/27/45); the wave-45 founder-proxy ruled "do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead." Resolving by standing precedent + ceo-reviewer board-seat ratification + product-decisions log, rather than convening a fresh 8th BOARD purely to re-affirm the precedent, is proportionate — it is the exact shortcut the founder-proxy authorized. P-1 correctly flags this as the L-2 floor-rubric-carve-out candidate for promotion.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini
| Reviewer | Verdict | Notes |
|---|---|---|
| karen | **APPROVE** | 6/6 claims VERIFIED: root cause real (DmHome serverId-null + username id-space; picker server-gated; no /dm/candidates); co-member query is a near-copy of live presence.service.ts getCoMemberUserIds; member DTO shape exists (servers.service listServerMembers); no migration; specialists valid. Correction: true-id field is `profile.userId` (not profile.id) — applied to spec. |
| jenny | **APPROVE** | 5/5 drift checks MATCH: candidate-source decision (product-decisions 2026-07-04), who_can_dm consistency (wave-35 enum + wave-46 create-enforcement; co-members satisfy 'server-members'), scope-fence (co-members not global directory), clean completion of recorded DM journey, id-space fix cures F7 (no prior username-identity decision). |
| Gemini | **UNAVAILABLE** | 429 credits — degradable; gate proceeds on Karen+jenny. |

## Gate result: **PASS** (Phase 1 APPROVED; Karen+jenny APPROVE; Gemini UNAVAIL) → design_gap_flag=false → skip D → B-block.
Carry to B-3: source currentUserId from `profile.userId` (NOT profile.id — nonexistent); mirror presence.service.ts getCoMemberUserIds for the co-member query; mirror servers.service listServerMembers DTO shape.
