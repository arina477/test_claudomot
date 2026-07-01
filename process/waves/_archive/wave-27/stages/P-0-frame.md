# Wave 27 — P-0 Frame

## Discover section
- **wave_db_id:** 246e65b9-8358-4c06-b958-19b2db721a2a (wave_number 27, running).
- **Prior-work citation:** wave-14 V-2 (M-1/KI-1) filed the presence-perf debt; wave-26 shipped author-avatar presence dots (client presence consumer) + spawned the client per-row subscription perf task (07361daf).
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. Re-homed presence/perf debt under active M5 (M5 scope is assignments). wave row milestone backfilled = M5.
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **Product-decision:** none Tier-3 (backend perf).

## Reframe section
**Original framing:** 6a546c7b — optimize `getCoMemberUserIds` full server_members scan per connect (SELECT DISTINCT / index / cache).

**problem-framer:** PROCEED — with 3 code-verified corrections (folded into the forward framing):
1. **The seed named the WRONG method.** `getCoMemberUserIds` (`WHERE server_id IN (...)`, presence.service.ts:123-126) is ALREADY index-supported by the leading column of `unique(server_id, user_id)` (servers.ts:57); its dedup is an in-memory JS Set, so the seed's "SELECT DISTINCT" rewrite is a NO-OP. The ACTUAL un-indexed scan is **`getServerIdsForUser`** (`WHERE user_id=$1`, presence.service.ts:106-113) — `server_members` has NO standalone `user_id` index (confirmed: only `unique(server_id, user_id)`, server_id-leading). **Cheapest high-value lever = an index on `server_members(user_id)`.**
2. **"wave-26 made it hotter" is WEAK** — this query fires per connect/reconnect (not per message); wave-26's dots are a client-store consumer that doesn't re-invoke the server query. Do NOT let this justify a store/snapshot redesign.
3. Self-contained (the in-memory presenceMap/snapshot is out of scope); the client per-row subscription (07361daf) is a separate layer.
matched_antipatterns: [].

**ceo-reviewer:** SELECTIVE-EXPANSION — bundle the client-side presence-perf sibling **07361daf** (per-row → single message-list subscription) into a coherent "presence performance" pair (same concern/subsystem, same wave-26 trigger, one clean pass; shipping the server half alone leaves a half-optimized path + invites a 7th debt wave). Explicitly NOT invite-rotation/hardening. **META (raised LOUD):** this is the **6th consecutive under-floor M5-debt wave** while the bet-load-bearing headline (assignment reminders) sits blocked on one founder-clearable Resend key; draining debt while blocked has become the de-facto strategy — the failure mode. Recommends head-product sharpen the escalation into a **blocking park-or-key fork** as a first-class P-4 output (not a digest footnote).

**mvp-thinner:** OK — seed is atomic (single query optimization; no AC split). Keep-OUT: **cache infra** (index/query-shape fix only — a caching layer with invalidation/TTL/warmup is gold-plating for a 0-user app; constrain the spec to the index + benchmark). Deferred the 07361daf bundle to ceo-reviewer (not an mvp split). No precedence-tie (task is not M5-mvp-critical).

**Mediation outcome:** problem-framer (keep-separate) vs ceo-reviewer (bundle) — head-product arbitrates: **ACCEPT the SELECTIVE-EXPANSION.** Server + client presence perf are the SAME concern (one performance story), same subsystem, same wave-26 trigger — not the "unrelated coupling" antipattern problem-framer guards against; they are two cleanly-separable specs (a DB index vs a React subscription refactor) → a coherent **multi-spec** presence-performance wave, which also right-sizes an otherwise-trivial single-index wave and directly answers the perpetual-under-floor concern. mvp-thinner did not oppose the bundle on mvp-critical grounds (M5-mvp-critical scope has open tasks, but this task isn't in it). problem-framer's index-correction is folded into Spec A.

**Sibling re-homed:** 07361daf → milestone_id=M5, wave_id=NULL, parent_task_id=6a546c7b (per ceo mechanical note; was unassigned).

**Disposition:** PROCEED (with accepted SELECTIVE-EXPANSION → 2-spec presence-performance wave + problem-framer index-correction).

**Final framing for P-block (multi-spec, claimed_task_ids = [6a546c7b, 07361daf]):**
- **Spec A (6a546c7b, server/backend):** add an index on `server_members(user_id)` (Drizzle schema + migration) to fix the un-indexed `getServerIdsForUser` `WHERE user_id=$1` scan (the REAL hot query per connect/reconnect). Do NOT rewrite `getCoMemberUserIds` (already index-supported; SELECT DISTINCT is a no-op). Prove with a query-plan/index-usage assertion or a benchmark. Keep OUT: any cache layer (mvp keep-OUT — a future task if real multi-server load arrives).
- **Spec B (07361daf, client/frontend):** lift the per-row presence subscription in MessageList to a SINGLE message-list subscription + tick counter (like usePresence), so O(rows×events) callback work → O(events); each AuthorPresenceDot reads hasPresence/getPresenceStatus at render. Preserve AC3 (unknown→no dot) + AC4 (single socket) + the self-presence seed.
- design_gap_flag expected FALSE (backend + client-perf refactor, no new UI surface).

## Open escalation carried into gate (SHARPENED per ceo-reviewer)
**M5 park-or-key fork (founder decision, 6th-wave recurrence).** For 6 consecutive waves (w23→w27) the studio has shipped small under-floor M5-debt slices while M5's bet-load-bearing headline — assignment due-date reminders (cron + Resend), the actual "academic tooling Discord lacks" — sits blocked on ONE founder-clearable Resend API key. The digest-footnote escalation has been ignored ~6 waves. head-product to elevate this to a **first-class blocking founder fork at P-4** with opportunity cost explicit: **(A) provide the Resend API key → build reminders → close M5**, OR **(B) formally PARK M5 and pivot to a milestone the studio can drive end-to-end without founder credentials** (M6 voice/video, M7 privacy/notifications, M12 offline-first moat). Recorded to the founder digest.

## Exit
Discovery + reframe complete. Scope = 2-spec presence-performance wave [Spec A 6a546c7b server_members(user_id) index; Spec B 07361daf client single-subscription lift]. Sharpened M5 park-or-key escalation → P-4 + founder digest. → P-1 Decompose.
