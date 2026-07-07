# P-0 — Frame (wave-71)

## Discover
- wave_db_id: e58bc705-a0fc-4667-a2ed-c6685b8b533c (wave_number 71; waves.milestone_id backfilled = M14)
- Prior-work: wave-69 (reporting) + wave-70 (Block) shipped M14's mvp-critical scope LIVE. This wave finishes M14's block UI-polish.
- Roadmap milestone: M14 (6a9424fe, in_progress, Class=product-feature). ALL 4 mvp-critical ## Scope legs SHIPPED; residual = 2 UI-polish follow-ons.
- Spec-contract short-circuit: **no-prior-spec** (seed 1193aebf is prose). Full P-1..P-3.
- Product decisions: none Tier-3 at P-0. (Downstream: the public-launch GO + next-milestone theme pick are FOUNDER-RESERVED — surface at wave-71 L-1/N-1 when M14 closes, per ceo-reviewer.)

## Reframe
**Seed:** 1193aebf (member-row Block↔Unblock toggle, wave-70 V-2 FINDING-1, ~30-50 LOC). **Likely RESCOPE sibling:** 1c633d2f (enrich GET /blocks with display name+avatar, FINDING-2).

**problem-framer: PROCEED** — both correctly framed at CAUSE layer. FINDING-1: MemberListPanel already reflects live state for presence/mute/permissions; the block affordance is the LONE hardcoded one → a well-scoped state-slice addition (not a missing live-state layer). FINDING-2: contract-seam fix (BlockSchema bare FK ids, listBlocks flat SELECT no JOIN). Bundle appropriate (P-1 RESCOPE). **HANDOFF NOTE (P-2/P-3): FINDING-2's enriched GET /blocks DTO already carries blocked_id → FINDING-1's blocked-id Set derives from the SAME fetch — spec it as ONE fetch, not two.**

**ceo-reviewer: PROCEED (HOLD-SCOPE)** — scope exactly right, hold. Not expansion (M14 mvp-critical shipped; adding capability before the founder launch GO = drift). FINDING-2 is launch-visible (raw UUIDs on the privacy surface the displace-Discord bet names as a differentiator) — dropping it ships a 7/10 trust surface. **CLOSE-vs-PROCEED: finish the polish first; do NOT close M14 + auto-pull next-milestone work (M9 monetization / M10 compliance / M13 partnerships are founder-reserved theme picks). After wave-71 ships+verifies, M14 is a clean CLOSE candidate at L-1 → head-product surfaces the public-launch GO + next-theme pick to the FOUNDER, not auto-advance.**

**mvp-thinner: OVER-CUT** — M14 mvp-critical 100% done; both ACs are launch-quality polish (not metric gates). The seed alone is too thin; fold in the enrichment sibling = the one coherent "finish the Block UI polish" slice. No new scope, no split. Floor note: the merged bundle sits below the multi-spec floor → the legitimately-small high-value completion-wave pattern (wave-50 override-ship-by-rule precedent).

**Mediation:** no tie — all 3 converge on the 2-task M14 Block UI-polish bundle. ceo HOLD-SCOPE + mvp OVER-CUT both → keep the bundle, fold in the sibling, no new scope.

**Disposition: PROCEED to P-1.** wave-71 = the M14 Block UI-polish bundle: member-row Block↔Unblock toggle (1193aebf, seed) + GET /blocks display-name/avatar enrichment (1c633d2f, sibling via P-1 RESCOPE-AUTO-MERGE). Spec the two as ONE GET /blocks fetch (problem-framer note). Expect below-floor → P-1 override-ship-by-rule (wave-50 precedent) after the single RESCOPE expansion. Downstream: M14 closes at wave-71 L-1 → founder-reserved public-launch-GO + next-theme decision surfaces (a genuine founder decision, routes to founder even under automatic mode).

**Final framing for the rest of P-block:** Finish M14's Block UI polish — (1) enrich GET /blocks (listBlocks JOIN users/profile → blocked user's displayName + avatar; extend the shared Block list DTO), (2) render name+avatar in BlockedUsersPanel, (3) make the member-row Block affordance state-reflecting (Block↔Unblock, deriving isBlocked from the same GET /blocks fetch, wired to unblockUser). Reuse the existing MemberListPanel live-state pattern (presence/mute) + the wave-70 block api client. No new scope; out-of-scope M14 items (appeals/triage/rate-limits/auto-detection/platform-admin) stay fenced.
