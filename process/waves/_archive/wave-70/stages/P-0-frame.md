# P-0 — Frame (wave-70)

## Discover
- wave_db_id: f8473a3b-9165-41fe-a67c-ff26459846db (wave_number 70; waves.milestone_id backfilled = M14)
- Prior-work: wave-69 shipped M14's reporting primitive LIVE (report substrate + owner/mod action loop + report dialog/inbox). This wave continues M14.
- Roadmap milestone: M14 (6a9424fe, in_progress, Class=product-feature, mvp-critical launch gate for the public directory).
- Spec-contract short-circuit: **no-prior-spec** (seed cc783559 description is prose). Full P-1..P-3.
- Product decisions: none Tier-3 at P-0 (the Block feature's scope is a product decision but resolved by convergent reframe below; the founder-reserved public-launch GO stays reserved — this wave builds toward the gate, doesn't launch).

## Reframe
**Original framing:** seed = cc783559 "Suppress the Report affordance on the viewer's own member row" (~15-25 LOC UI fix, wave-69 V-3 follow-on).

**problem-framer: PROCEED** (merge-up note) — seed correctly framed (cause not symptom: MemberItem lacks viewer identity + isSelf guard). Verified MemberItem is a LONE regression vs an established convention (MessageList / FocusRoomPanel / DmConversationList all correctly guard self) — a one-off, not an architectural gap; fix stays narrow. Merge-up target = the greenfield Block feature; sizing is P-1's call.

**ceo-reviewer: SCOPE-EXPANSION** — seed is a 2/10 wave in isolation; M14's success metric has 2/3 legs shipped, ONE unshipped: **Block** (user-to-user block → hide blocked user's DMs + content, cross-server, directory-safe). Recommend promoting Block to the wave seed, folding cc783559 in as a cheap sibling. Reuse session identity + RBAC guard idiom + content soft-delete (NOT a second permission system). Out-of-scope (fenced to later M14 bundles): review-queue/triage UI, appeals, auto-detection, report rate-limits, distinct platform-admin unlist role.

**mvp-thinner: OVER-CUT** — the wave has 1 AC (member-row fix), below any coherent-slice floor, nothing to split (valuable-slice problem, not thinness). Block is the mvp-critical unshipped item ("directory cannot be publicly launched without it"). Expand to Block (user_blocks substrate + block/unblock endpoints [blocker_id server-derived] + cross-server DM/content hiding via the message-visibility idiom + block affordance on the member/profile surface — same MemberListPanel prop-threading the seed touches) + fold cc783559 as trailing UI polish.

**Mediation:** no tie — ceo-reviewer (SCOPE-EXPANSION) + mvp-thinner (OVER-CUT) both point to Block; problem-framer PROCEEDs with a merge-up note. Convergent.

**Disposition: PROCEED to P-1 with EXPANSION framing.** wave-70 = the **user-to-user Block feature** (M14's mvp-critical launch-gate leg), with the member-row fix (cc783559) folded in as a sibling. Block has no task row → P-1 RESCOPE-AUTO-MERGE fires milestone-decomposition to author the Block seed + siblings under M14, folding cc783559 in.

**Final framing for the rest of P-block:** Build user-to-user Block — a `user_blocks` relation (blocker_id server-derived from session, blocked_id), block/unblock endpoints, cross-server hiding of a blocked user's DMs + content (reuse the message-visibility/soft-delete idiom, NOT a new permission system), and a Block affordance on the member/profile surface. Fold in cc783559 (member-row own-Report suppression) as a sibling UI-polish. Out-of-scope: review-queue/triage UI, appeals, auto-detection, rate-limits, platform-admin unlist. Public-launch GO stays founder-reserved.
