# P-4 Phase-2 — Jenny spec-vs-roadmap drift check (wave-18, M3 threads)

**Verdict: APPROVE** — the 3-block spec matches M3 roadmap prose, the BOARD threads-first decision, and the 2-namespace lock with no drift. All scope-creep guards are honored; M3 is correctly left open.

## Sources read
- Spec (canonical): `tasks.description` of 497c2ae6 (YAML head, 3 specs: 497c2ae6 data plane / 6c008dd6 panel+affordance / 0b728319 outbox parity).
- M3 milestone prose: milestone 6198650e (`## Scope` "thread replies (thread_parent_id)"; success metric "...with reactions, threads, and attachments working").
- product-decisions.md L220-222 (2026-06-30 M3 threads bundle — BOARD override `N-1-ordering-wave-17` feature-first/threads-first), L188-194 (prior M3 bundles establishing the /messaging-reuse, no-new-namespace pattern), `_library.md` Resolved cross-branch decision #8 (2 namespaces: /messaging, /presence).
- feature-list.md #8 "Message actions (react, reply/thread, edit, delete, mention)" F3.
- user-journey-map.md row 9 (server-channel-view) + F3 ("Threads NOT built (later milestone)").
- P-0-frame.md (reframe trio + mediation).

## Per-item drift findings

1. **3-block spec ↔ M3 `## Scope` "thread replies (thread_parent_id)" + success-metric "threads working" — MATCHES (1:1).**
   Spec head delivers exactly: thread_parent_id self-FK data plane (497c2ae6), thread-view panel + in-list affordance (6c008dd6), outbox parity (0b728319). The milestone names the column verbatim (`thread_parent_id`); the spec's data-plane AC persists a reply with that column and the panel makes "threads working" observable end-to-end. No extra scope vs the Scope clause; nothing in the Scope clause left unaddressed by this slice (attachments are a separate Scope item, correctly deferred — see item 4).

2. **BOARD threads-first decision + 2-namespace lock — MATCHES.**
   This IS the BOARD-authored bundle (product-decisions L220-222, caller `N-1-next-bundle` BOARD override `N-1-ordering-wave-17`, decomposed by milestone-decomposer). Spec honors the namespace lock explicitly: the realtime AC fans out over the **EXISTING /messaging Socket.IO namespace** to the channel room as a thread-scoped event ("Reuse the message idempotency_key dedup", "Reuse... wave-12 /messaging gateway"). No new namespace, no new auth surface — consistent with `_library.md` decision #8 (only /messaging + /presence) and the established prior-bundle pattern (L190 "No new namespace, no new auth surface").

3. **Scope-creep guard (one-level only; nested/following/notifications/per-user-unread OUT) — MATCHES (none in scope).**
   - One-level enforced as a hard AC, not a hope: data-plane AC#2 REJECTS (4xx) a reply whose parent is itself a reply (non-null thread_parent_id) **and** a cross-channel parent; edge-cases restate "Reply-of-a-reply → 4xx (one-level)." No nested-thread affordance anywhere.
   - Milestone prose `Scope:` line "OUT: nested threads, thread-following/notifications, per-user unread-in-thread" maps 1:1 to spec exclusions — none of these appear in any AC, contract, or edge-case across the three tasks. Notifications (feature #14) untouched; unread-in-thread correctly identified (P-0 ceo-reviewer) as needing its own read-state plane = separate slice.

4. **M3 NOT closed (attachments remain) — MATCHES.**
   Spec head body states "Attachments = the NEXT M3 feature wave"; milestone success metric still requires "...and attachments working." Threads-this-wave does not satisfy the attachments clause, so M3 stays `in_progress`. No premature-close drift. (P-0 frame L6 confirms M3 in_progress, wave-18 backfilled.)

5. **Outbox parity (0b728319) kept in-slice despite mvp-thinner THIN — CONSISTENT (not creep).**
   0b728319 is a BOARD-authored sibling of the same threads bundle (claimed_task_ids in the spec head; product-decisions L220-222). The milestone requires M4 (offline) to build on the messaging send-path ("Required by: M4"); the milestone-decomposer placed outbox-parity in this slice as the explicit M3→M4 send-path handoff. Keeping it is honoring the roadmap, not bundling beyond it — P-0 mediation correctly REJECTED the split (coherent-slice + M4-handoff). The AC ties parity to the existing outbox machinery ("no separate reply-send path"), so it adds no new send model — zero creep.

6. **Thread flow ↔ feature-list #8 / journey-map — MATCHES.**
   feature-list #8 lists "reply/thread" under F3 message actions; spec implements the reply/thread action on the F3 server-channel-view (journey row 9, `/servers/:id/:channelId`). Journey-map F3 currently reads "Threads NOT built (later milestone)" — wave-18 is precisely the wave that flips that, with no route/page/namespace invention (panel is an in-page surface on the existing channel view; T-9 will regen the journey entry). Panel reuses MessageList row treatment (6c008dd6 edge-case "reuse MessageList row") — no divergent UI primitive.

## Notes (non-blocking, not drift)
- design_gap_flag: true is consistent with item 6 — thread panel + affordance is new UI markup absent from server-channel-view.html (D-block expected). This is a build-surface fact, not a roadmap conflict.
- Migration 0008 declares thread_parent_id as "verified ABSENT, not previously migrated despite _library prose" — an honest correction of `_library` drift, flagged in-spec; not a roadmap conflict (the column name itself matches the milestone exactly).

**No DRIFTS. APPROVE.**
