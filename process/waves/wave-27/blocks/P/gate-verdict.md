# Wave 27 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-P4-w27-6166)
**Reviewed against:** process/waves/wave-27/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is a well-framed, correctly-scoped two-spec presence-performance wave that ladders to the active M5 milestone, and its single load-bearing claim survived independent code verification. The problem-framer's index-correction — the crux of the whole wave — is confirmed against the codebase: `server_members` (servers.ts:57) carries only `unique(server_id, user_id)` (composite, server_id-leading) with NO standalone `user_id` index, and `getServerIdsForUser` (presence.service.ts:106-113) is the `WHERE user_id = $1` query (`eq(server_members.user_id, userId)`) that therefore Seq-Scans per /presence connect; `getCoMemberUserIds` (119-126) uses `WHERE server_id IN (...)` which the composite's leading column already covers, and its dedup is an in-memory JS `Set`, so the seed's original "SELECT DISTINCT rewrite" is genuinely a no-op. Spec A targets the RIGHT query and the RIGHT fix, and its proposed `index('server_members_user_id_idx').on(table.user_id)` follows the house pattern already in this same file (`cpo_channel_id_idx`, servers.ts:101) rather than inventing a parallel path. Both spec blocks are embedded in the primary task's `tasks.description` (rule 7 satisfied) and both carry falsifiable, observable ACs: Spec A demands a real EXPLAIN/index-usage assertion (Index Scan not Seq Scan), not "should be faster"; Spec B demands "N messages register 1 presence subscriber, not N" — a binary count assertion against a surface that genuinely exists today as per-row `subscribePresence` inside `AuthorPresenceDot` (MessageList.tsx:951-966), with `usePresence.ts` present as the single-subscription reference. Empty/edge/behavior-preserving states are enumerated per block; non-goals (cache infra, getCoMemberUserIds rewrite, presenceMap/snapshot rework, any UI change, invite rotation) are explicit. Scope discipline holds: cache infra is correctly kept OUT as gold-plating for a 0-user app, the client sibling 07361daf is a coherent same-concern re-home (DB index + React subscription lift = one performance story, cleanly separable specs — not cross-concern cramming), design_gap_flag=false is correct (no new UI surface), and the under-floor override-ship is a legitimate PRECEDENT-APPLICATION (6th consecutive, per the wave-24 BOARD "do-not-re-litigate" instruction, no fresh BOARD owed). Advancing to Phase 2 (karen + jenny + Gemini, per-spec).

## Stage-exit checkbox audit (Phase-1, from concrete artifacts)
- **P-0 Frame:** PASS — concrete user job (per-connect presence latency); maps to M5 (a5232e16, cited); falsifiable signal (query-plan flips Seq→Index Scan; subscriber count N→1); problem-framer + ceo-reviewer verdicts present and reconciled (SELECTIVE-EXPANSION accepted with rationale, index-correction folded into Spec A).
- **P-1 Decompose:** PASS — seed + one must-ship-together sibling (same perf story); every AC mvp-critical to the perf claim; no bundle task depends on an unbuilt out-of-bundle task. Under-floor override-ship is precedent-backed, not vibe.
- **P-2 Spec:** PASS — ACs enumerated + independently verifiable per block; empty/edge/behavior-preserving states specified; non-goals explicit; NO auth/session/cookie/rate-limit surface (security-scope tightened gate NOT triggered — additive DB index + client render wiring only); full 2-block contract embedded in 6a546c7b.description (verified in DB, not only the pointer copy).
- **P-3 Plan:** PASS — reuses established index pattern (cpo_channel_id_idx precedent) and the usePresence single-subscription topology; introduces NO new infra (no Redis/cache/replica); every step maps to a bundle task with an observable artifact (migration, EXPLAIN test, subscription-count test); parallelization is file-disjoint (apps/api vs apps/web).
- **Load-bearing-claim spot-check (code-verified this pass):** server_members has no user_id index (servers.ts:57) ✓; getServerIdsForUser is the WHERE user_id query (presence.service.ts:110) ✓; getCoMemberUserIds is WHERE server_id IN + in-memory Set dedup (119-132) ✓; AuthorPresenceDot per-row subscribePresence exists (MessageList.tsx:960) ✓; usePresence.ts + presence-dots.test.tsx exist ✓.
- **design_gap_flag handoff:** FALSE → correct (no new/changed visual surface) → on gate pass routes to B-0, skips D. ✓

## M5 park-or-key escalation — head-product read (gate output, not resolved here)
This is a first-class gate output per the ceo-reviewer's sharpening, NOT a verdict blocker — I record it and give my read; the founder resolves it.

- **Escalation framing is SOUND and correctly recorded.** The manifest and P-0/P-1 both carry it; it is on the founder digest dated 2026-07-01. The facts are not disputed: 6 consecutive under-floor M5-debt waves (w16/w23/w24/w25/w26/w27) while M5's bet-load-bearing headline — assignment due-date reminders (cron + Resend), the actual "academic tooling Discord lacks" — sits blocked on ONE founder-clearable Resend API key. Draining workable debt while the headline is credential-blocked has become the de-facto strategy, which is itself the failure mode ceo-reviewer named.
- **Should it BLOCK this wave? No.** This wave is workable debt with a real, code-verified performance payoff and no dependency on the Resend key; blocking it would waste a clean, shippable increment and punish the wrong thing. The escalation is about milestone *disposition*, not about this bundle's validity. Correct disposition = **proceed with the wave AND surface the fork loudly**, which is exactly what P-0/P-1 did.
- **Should the studio formally reconsider M5's active status? My read: YES — this needs to become a real founder decision now, not a 7th digest footnote.** The opportunity cost is now concrete and one-sided: every additional under-floor debt wave is capacity spent NOT building the thing M5 exists to deliver, and the blocker is a single credential the studio cannot self-provision (rule 6 SDK-key exception). The right shape is a blocking park-or-key fork: **(A)** founder provides the Resend API key → studio builds reminders end-to-end → M5 closes on its actual headline; OR **(B)** formally PARK M5 and pivot to a milestone the studio can drive end-to-end without founder credentials (M6 voice/video, M7 privacy/notifications, M12 offline-first moat — the last of which is closest to the live offline-first wedge bet). Continuing to drain M5 debt is a defensible *holding* pattern for exactly one more turn, but it is not a strategy, and the escalation should be treated as due for founder resolution at N-block/digest, not deferred again.
- **Routing:** mode is `automatic`; the fork is a founder split/strategic call (milestone disposition + a credential the studio cannot self-serve), so it routes to the founder via the digest — not the BOARD — consistent with how P-0/P-1 staged it. No action required from Phase 2 reviewers on this item.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## Phase 2 — Karen + jenny + Gemini (merged)

**Result: PASS** (karen APPROVE + jenny APPROVE + Gemini UNAVAILABLE → gate proceeds on karen+jenny per P-4 Action 3).

- **karen: APPROVE** — all load-bearing claims VERIFIED (server_members has no user_id index [servers.ts:57 only unique(server_id,user_id)]; getServerIdsForUser IS the WHERE user_id query [presence.service.ts:110]; getCoMemberUserIds already-covered + in-memory Set dedup → SELECT DISTINCT no-op; index() house pattern exists [servers.ts:101]; per-row subscription [MessageList.tsx:958]; usePresence single-sub reference [usePresence.ts:33-42]). Sibling 07361daf re-home VERIFIED. **1 plan-hygiene fix (applied):** `database-administrator` not in AGENTS.md → swapped Spec A routing to `postgres-pro` (rule 11, catalogued DB agent).
- **jenny: APPROVE** — 0 spec-drift, all ACs match, no conflicting decision; the M5 escalation consistently recorded. **1 LOW spec-gap (binding B-carry):** Spec B "dots render identically" is under-specified on the wave-26 CARRY-1 per-author render-scoping — a naive whole-list tick lift would re-render every dot on any presence event (partial regression of the render-scoping the perf wave should KEEP). B-3 must preserve per-author render-scoping (or explicitly accept whole-list re-render at 0-user scale + justify); task-completion-validator confirms at V.
- **Gemini: UNAVAILABLE** (HTTP 503 high-demand; helper retried). Non-blocking.

## Binding B-block carries
- **CARRY-A (karen, applied):** Spec A B-0/B-2 → `postgres-pro` (NOT database-administrator).
- **CARRY-B (jenny LOW):** Spec B (react-specialist) MUST preserve the wave-26 CARRY-1 per-author render-scoping when lifting to a single list-level subscription — a dot re-renders only when ITS author's status changes; do NOT let a whole-list tick re-render every dot on any presence event. If whole-list re-render is genuinely chosen (0-user scale), justify it explicitly. → task-completion-validator confirms at V.

## M5 park-or-key escalation (gate output, not a blocker)
Recorded to founder digest 2026-07-01 + product-decisions wave-27. head-product read: sound framing, should NOT block this wave (workable debt), but SHOULD become a real founder decision now (provide Resend key → build reminders → close M5, OR park M5 + pivot to a studio-drivable milestone). Continuing to drain M5 debt is defensible for one more turn, not as a strategy.

**Gate: PASSED.** design_gap_flag=false → B-block.
