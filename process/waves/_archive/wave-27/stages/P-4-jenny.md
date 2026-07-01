# Wave-27 — P-4 jenny (spec/plan ↔ journey-map + product-decisions DRIFT cross-reference)

**Agent:** jenny (spec-compliance auditor) · **Phase 2** · **wave_type:** multi-spec (2 specs)
**Spec source:** tasks.description of 6a546c7b (2 spec blocks) — read via P-2-spec.md pointer + P-0/P-1/P-3 stage files.
**Method:** independent — cross-referenced spec+plan claims against the actual codebase (presence.service.ts, servers.ts schema, MessageList.tsx, usePresence.ts, presenceSocket.ts, presence-dots.test.tsx) AND against user-journey-map.md + product-decisions.md.

**Verdict: APPROVE** (0 spec-drift, 0 blocking spec-gap). One LOW documentation-quality spec-gap noted (behavior-preserving proof under-specified for Spec B tri-state edge) + one process observation (6th under-floor override, consistently recorded).

---

## Per-spec-item MATCHES / DRIFTS

### Spec A — 6a546c7b (server: index on server_members(user_id))

| AC / claim | Result | Evidence |
|---|---|---|
| The un-indexed scan is `getServerIdsForUser` (`WHERE user_id=$1`), NOT `getCoMemberUserIds` | **MATCH** | `presence.service.ts:106-113` — `getServerIdsForUser` is `.where(eq(server_members.user_id, userId))`. `getCoMemberUserIds:123-133` uses `inArray(server_members.server_id, …)` — the leading column of the composite. Code confirms the P-0 problem-framer correction verbatim. |
| `server_members` has NO standalone `user_id` index (only composite, server_id-leading) | **MATCH** | `servers.ts:57` — `(table) => [unique().on(table.server_id, table.user_id)]`. No `index().on(user_id)` present. A `WHERE user_id` lookup cannot use the composite (non-leading) → Seq Scan confirmed as the real cost. |
| Do NOT rewrite `getCoMemberUserIds` (SELECT DISTINCT is a no-op) | **MATCH** | `presence.service.ts:127-132` — dedup is an in-memory JS `Set` (`seen`), not a SQL DISTINCT; the cost is the scan, not the dedup. Rewrite would be a genuine no-op. Plan step 4 correctly marks the method `confirm` (no code change). |
| Behavior-preserving (same co-member set) | **MATCH** | Additive index changes only the query PLAN, not the result set. `getServerIdsForUser` returns identical rows Index-Scan vs Seq-Scan (same predicate). No column/constraint/backfill (plan Data-model §). Failure domain: none — forward-only additive migration. |
| Keep OUT cache infra | **MATCH** | Spec "Out of scope" + P-3 Alternatives (b) REJECTED cache; mvp-thinner keep-OUT. No cache primitive in plan. |
| Prove with Index-Scan (EXPLAIN / index-usage) assertion | **MATCH** | Plan step 5 — real-PG integration spec asserting `server_members_user_id_idx` used (Index Scan not Seq Scan) via the wave-17 pg-harness. Verifiable AC. |

**Spec A — journey drift check:** NONE. An index is invisible to every documented flow. `getServerIdsForUser` feeds room-join list + (via getCoMemberUserIds) the `presence:snapshot` — both return the identical co-member set post-index. F5/F3/wave-14 member panel + wave-26 author dots behave identically. No journey-map surface, route, endpoint, or behavior changes.

### Spec B — 07361daf (client: lift MessageList per-row subscription to ONE list-level)

| AC / claim | Result | Evidence |
|---|---|---|
| Current state = per-row subscription (N messages → N subscribers) | **MATCH** | `MessageList.tsx:958-964` — `AuthorPresenceDot` calls `subscribePresence(...)` inside its own `useEffect`, one per rendered dot. Confirmed per-row. |
| Target = ONE list-level subscription + tick (mirror usePresence) | **MATCH** | Reference pattern exists and is proven: `usePresence.ts` — single `subscribePresence` in one effect + `tick` counter, docstring "keeping subscription count at 1 regardless of member count." Plan step 6 mirrors it; the member panel already uses it (precedent). |
| Each dot reads hasPresence/getPresenceStatus at render off the tick | **MATCH** | `presenceSocket.ts:148/158` — `getPresenceStatus` + `hasPresence` are already render-time reads; lifting the subscription doesn't change the read API, only who owns the subscription. |
| Behavior-preserving: online/offline/unknown→no-dot / self→online; single socket (AC4) | **MATCH (with 1 LOW gap, below)** | Tri-state is currently enforced at `MessageList.tsx:954-970` (`status===null → return null`). Self-seed path proven by the T-5 regression test (`presence-dots.test.tsx:299-320`, `seedSelfPresence`). Single-socket = the store singleton in presenceSocket.ts is unchanged; lifting stays on the same store. |
| Tests green with subscription-count assertion updated to 1 | **MATCH — AC points at a real, existing assertion** | `presence-dots.test.tsx:449` — `expect(subscribePresenceCallCount).toBe(2)` (2 rows → 2 subs today). Spec B's AC ("update the count assertion to 1 / single list-level subscription for an N-message list") is concrete and verifiable, not hand-wavy. Plan step 7 covers it. |

**Spec B — journey drift check:** NONE to any documented behavior. wave-26 journey entry (user-journey-map.md:14) documents author dots as: emerald online / muted offline / unknown→NO dot / self→online (via seedSelfPresence). Spec B preserves each. The wave-26 entry itself names this exact lift as future work: "per-row presence subscription is O(rows × events) callback work … = future perf lift (B-6 P2, non-blocking)." Spec B IS that documented follow-up — MATCHES the journey map's own forward-pointer. No new/changed route, endpoint, or visible surface; annotation-only regen expected at T-9.

---

## Cross-reference (a)–(d) — product-decisions consistency

**(a) Under-floor override-ship precedent chain — CONSISTENT.** The wave-27 entry (product-decisions.md:325-329) is recorded identically to the standing precedent: w16 (263-266 origin/extension) → w23 (300-304, BOARD 6/7) → w24 (306-310, BOARD 6/7) → w25 (312-316, PRECEDENT-APPLICATION, "do NOT re-litigate Nth") → w26 (318-323, PRECEDENT-APPLICATION 5th) → w27 (6th, PRECEDENT-APPLICATION, `floor_merge_attempt: 0`, `board_convened: false`). P-1-decompose.md:17-22 cites the identical precedent list. No drift — the 6th application follows the wave-24 BOARD's explicit standing instruction, not a skipped gate.

**(b) Bundling 6a546c7b (server) + 07361daf (client) — CONSISTENT (both presence-perf).** 07361daf originates as the wave-26 client per-row perf debt (user-journey-map.md:14 B-6 P2; product-decisions.md M4-close re-home list 276 / M5 re-home). P-0 SELECTIVE-EXPANSION bundled it as a coherent presence-perf pair (same subsystem, same wave-26 trigger, cleanly-separable specs — DB index vs React refactor). This is NOT the "unrelated coupling" antipattern (problem-framer's guard) — head-product arbitrated ACCEPT (P-0-frame.md:22-25). Re-home mechanics (07361daf → M5, wave_id NULL, parent_task_id=6a546c7b) recorded at P-0-frame.md:25. Consistent.

**(c) M5 park-or-key escalation — CONSISTENTLY recorded.** Present in ALL required locations: founder digest 2026-07-01 (cited P-0-frame.md:35, P-1:22, product-decisions.md:328), product-decisions.md wave-27 entry (325-329, "SHARPENED STRATEGIC ESCALATION … first-class BLOCKING founder fork"), and carried as a gate output (P-3 Exit line 56 "carry the M5 park-or-key escalation"). It correctly escalates the SAME dependency (one founder-clearable Resend key) recorded since w24 (309), w25 (315), w26 (322) — now sharpened from digest-footnote to blocking fork A/B. Consistent and traceable across all three artifacts.

**(d) Prior-decision conflicts — NONE found.**
- **No "do NOT add indexes" decision exists.** Prior perf decisions (denormalized reply_count/last_reply_at wave-18, covering indexes) go the SAME direction — indexes are the established perf lever. Spec A is consistent with prior data-model practice.
- **No "do NOT refactor the presence subscription" decision exists.** The opposite: the single-subscription pattern is the ESTABLISHED convention — usePresence.ts docstring mandates "subscription count at 1," the member panel already uses it, and the wave-14 presence bundle prose (product-decisions.md:198) explicitly required "one presence client/store — no duplicate socket connections, single presence-dot primitive." Spec B brings MessageList INTO compliance with a standing decision the per-row wave-26 implementation deviated from. Consistent (corrective, not conflicting).

---

## Behavior-preserving watch (the KEY risk for a perf wave)

**Spec A (index) — behavior-preserving claim SOUND.** An additive secondary index cannot change a query's result set — only its plan. `getServerIdsForUser` returns identical `server_id` rows; the derived co-member set (getCoMemberUserIds → snapshot) is byte-identical. No wrong co-member set, no missed presence update, no self-dot effect (self-seed is client-side, untouched). Zero observable-behavior risk. No spec-gap.

**Spec B (subscription lift) — behavior-preserving claim SOUND, with ONE LOW spec-gap on proof specificity.** The lift changes subscription topology (N→1), not the read path (hasPresence/getPresenceStatus at render is unchanged). The real risk surfaces for a perf refactor are all covered by preserved logic:
- **Self-dot regression (the wave-26 T-5 critical bug):** self-seed is in ProfileContext/presenceSocket (`seedSelfPresence`), NOT in the per-row subscription being lifted — so the lift cannot re-break it. The regression guard test (`presence-dots.test.tsx:299-320`) must remain green post-lift.
- **Dot flicker / missed update:** the list-level tick fires the same store notifications; each dot re-reads at render. usePresence proves this exact pattern is flicker-free at the member panel.

**LOW spec-gap (documentation-quality, NON-blocking):** Spec B says "dots render identically" and lists the tri-state (online/offline/unknown→no-dot/self→online), but does NOT explicitly require that the lifted implementation preserve the **per-author memoization** (CARRY-1: `setStatus((prev) => prev===next ? prev : next)` at MessageList.tsx:962) — i.e. that a status change for user-B must not re-render user-A's dot. Under a naive tick-counter lift (like usePresence's single `tick` bumping the whole list), EVERY dot re-renders on ANY presence event. That is behavior-preserving for the DOM (dots still show correct state) but a partial regression of the wave-26 CARRY-1 render-scoping optimization — which is arguably the point of a perf wave. **Recommendation:** B-3 should either (a) preserve per-author render-scoping (dot reads its own value; only re-render if its author's value changed), or (b) explicitly accept whole-list re-render as acceptable at 0-user scale and note it. Not a blocker — the observable behavior (correct dots) is preserved either way; this is about whether the perf wave fully delivers the render-scoping it inherits. Flag to head-product / react-specialist at B-3, and to @task-completion-validator at V to confirm the lift didn't silently drop CARRY-1.

---

## Summary

- **Spec A:** 6/6 ACs MATCH. Every premise code-verified (getServerIdsForUser is the real hot query; no user_id index; getCoMemberUserIds already covered; dedup in-memory). Behavior-preserving is structurally guaranteed for an additive index. 0 drift, 0 gap.
- **Spec B:** 5/5 ACs MATCH. Per-row→single-subscription lift mirrors the proven usePresence pattern; the count-assertion AC points at a real assertion (`presence-dots.test.tsx:449 toBe(2)→1`); tri-state + self-seed + single-socket all preserved by untouched logic. 1 LOW spec-gap: proof under-specified re: preserving CARRY-1 per-author render-scoping (not a behavior change; a perf-completeness clarification).
- **Journey-map:** confirmed PURELY performance — no route/endpoint/behavior change; Spec B is the journey map's own documented wave-26 forward-pointer.
- **Product-decisions:** (a) 6th override CONSISTENT with standing precedent; (b) presence-perf bundling CONSISTENT; (c) M5 park-or-key escalation CONSISTENTLY recorded across digest + decisions + gate-carry; (d) no conflicting prior decision — both specs are corrective-toward or aligned-with established conventions.

**Overall: APPROVE.** No spec-drift (plan faithfully implements the spec), no blocking spec-gap. Carry the ONE LOW proof-specificity note (CARRY-1 render-scoping) to B-3 / V, and ensure the M5 park-or-key fork lands as a first-class P-4 gate output per the sharpened escalation.
