# P-4 Phase-2 — Spec-vs-Roadmap Drift (jenny) — Wave 20

**Verdict: APPROVE** — the 4-block spec matches M4 ## Scope with a coherent spine-first split; no drift.

Sources read: spec-contract `tasks.92d85e0e` (YAML head + prose), M4 milestone `eb2a1688`, `product-decisions.md` (top — stack + v6b cross-branch #5: outbox replay as idempotent POST, `?after=` cursor), `feature-list.md` #12, `P-0-frame.md`.

## Per-item MATCHES

| # | Drift question | Result | Evidence |
|---|---|---|---|
| 1 | 4-block spec vs M4 ## Scope | **MATCHES** | Every spec block maps to a named M4 scope clause: Dexie store = "IndexedDB local store … cached … reads, outbox queue w/ idempotency + pending"; catch-up cursor = "catch-up via ?after= keyset cursor"; outbox drain/replay = "reconnect reconciliation (replay as idempotent POST /api/messages, UNIQUE(channel_id, idempotency_key))"; offline composer = "composer stays enabled offline"; fake-indexeddb harness = "Heavily tested (fake-indexeddb unit + integration)". Path `apps/web/src/features/sync` matches milestone + v6b decision #11. |
| 2 | Spine-vs-UI split coherence + metric reachability | **MATCHES** | Deferred surfaces (connection-state indicator, pending/failed UI polish, catch-up history UI) are an explicit, *in-milestone* split, not an under-ship. The spine = the exactly-once+in-order send guarantee, which is the load-bearing half of the M4 success metric ("on reconnect every queued message sends exactly once in order with no data loss"). Cached-read half is also IN this wave (task 7332a4b8 AC-2). What is deferred is purely *presentational* (visibility of state), not behavior — the metric is **provable this wave** via fake-indexeddb (gating AC, task e29f6566) and merely made *visible* in wave 2. mvp-thinner already adjudicated this split (P-0: "OK — decomposer ALREADY cleanly split spine vs UI/catch-up = a 2nd M4 wave"). Coherent. |
| 3 | REFRAME (bind-key + forward-cursor, not rebuild) vs scope | **MATCHES** | M4 scope literally names "outbox queue with idempotency keys" + "replay as idempotent POST /api/messages, UNIQUE(channel_id, idempotency_key)" — i.e. the idempotency *mechanism is named as existing infrastructure to reuse*, not a deliverable to build. v6b decision #5 (2026-Q2) recorded the same: "offline outbox replays as idempotent POST … no /sync namespace; catch-up via paginated history ?after= cursor." The reframe (server idempotency exists → bind + forward-cursor) is a faithful read of scope, not a scope change. Reusing listThreadReplies ASC/gt is in-scope mechanism choice. |
| 4 | Scope creep — CRDT / conflict-res / service-worker / multi-device / offline-for-all-entities | **MATCHES (all OUT)** | Spec prose "OUT (milestone): CRDT/conflict-resolution, background-sync service-worker, offline-for-all-entities, multi-device sync" matches M4 scope (bounded to messages+channels read-cache + message outbox) and routes the deeper items to H2 feature-list #26 ("Advanced offline-first … conflict UI"). No creep. |
| 5 | New deps dexie@4 + fake-indexeddb@6 | **MATCHES** | M4 scope names "IndexedDB local store" + "fake-indexeddb" verbatim; "fake-indexeddb" appears literally in the success-test strategy. Client-side, no founder cred-ask (correct per rule 17 technical default). SDK-doc path declared. |
| 6 | Does NOT claim M4 complete | **MATCHES** | Spec title + prose both label this "M4 offline-first SPINE … First M4 wave"; OUT-list explicitly carries surfaces to "a 2nd M4 wave." Milestone stays `in_progress`. No premature-close. |

## Notes (non-blocking)
- design_gap_flag=false is consistent with the spine-first split: connection-state indicator + pending/failed UI are the deferred 2nd-wave surfaces, and the M3 optimistic pending/failed states already exist (P-0). If the offline composer needs a *minimal* pending affordance this wave, the existing M3 state covers it — no new D-block gap. Flagged for B-block awareness, not a drift.
- Spec correctly conjoins the metric's two halves across waves: spine (this wave, behavior + proof) and surfaces (wave 2, visibility). The metric is **reachable** and its falsifiable half (exactly-once) is gated HERE.

**No DRIFTS flagged. APPROVE.**
