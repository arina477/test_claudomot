# Wave 13 stage completion

> Seeded by wave-12 N-3. Active milestone: M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, in_progress).
> Seed task: `e12886d7-532b-4824-906a-7f336bacfd65` — Implement message edit and delete with realtime fan-out.
> Bundled siblings:
>   - `d78df376-26e4-4569-b2d1-bb8c7bc81519` — Add message reactions: toggle endpoint + realtime fan-out
>   - `f323a71f-9047-426c-ab20-6f0e488460fd` — Extend message UI for edit, delete tombstones, and reactions
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [e12886d7-532b-4824-906a-7f336bacfd65, d78df376-26e4-4569-b2d1-bb8c7bc81519, f323a71f-9047-426c-ab20-6f0e488460fd]
>
> WHY THIS BUNDLE (wave-12 N-1 decomposition + N-2 ordering):
> - M3's SECOND messaging slice — "complete the core message lifecycle." Wave-12 shipped send/receive over realtime (<1s metric MET, 93ms two-client). This wave adds edit/delete (the literal next `## Scope` clause after send/receive) + reactions, the cohesive engagement+lifecycle pair.
> - Slice cut: message edit/delete with realtime fan-out (emit message.updated / message.deleted over the existing /messaging room-per-channel fan-out) [seed]; reactions toggle endpoint + realtime fan-out (message_reactions table) [sibling]; UI for edit affordance, delete tombstones, and reaction-pills [sibling]. ~2200-2800 LOC, ~24-32 files.
> - Reuses MessagingModule + the wave-12 /messaging Socket.IO gateway: NO new namespace, NO new auth surface. Presence/typing (the /presence namespace), threads, mentions, attachments, member-list-with-presence all DEFERRED to later M3 waves (bundle WIP-limited).
>
> CARRY-FORWARDS (P-0/P-1 to honor):
> 1. **UI wave.** Bundle includes message-row edit/delete affordances, tombstone rendering, and reaction-pill primitive (design/server-channel-view.html). P-1 likely flags design_gap_flag → D-block runs. Confirm against design/ at P-1.
> 2. **Auth-touching → T-8 mandatory.** Edit/delete/react are mutating, session-gated (SuperTokens) + RBAC-gated. Edit/delete authz: only the author (or a permitted role) may edit/delete; live-verify authz through ChannelPermissionGuard + author-ownership check with a real authenticated session. Realtime fan-out (message.updated/deleted, reaction toggles) MUST be verified with TWO authenticated clients (no single-client realtime theater) — carries wave-11/12 T-8 rule.
> 3. **Architecture contracts (command-center/dev/architecture/_library.md):** MessagingModule owns messages + message_reactions tables; emits over /messaging; Zod schemas in @studyhall/shared as single REST+WS contract; @UseGuards(JwtAuthGuard, ChannelPermissionGuard) → RbacService.can(); Drizzle migration committed for message_reactions + any edited_at/deleted_at columns; cursor pagination + idempotency contracts unchanged.
> 4. **3 carried tech-debt tasks remain parked** as top-level M3 todos for a future wave (NOT this bundle): 46f16288 (browser-E2E create-server), 25523fb0 (PG-rollback test), d058283d (invite_code rotation).

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [ ] P-1 Decompose
- [ ] P-2 Spec
- [ ] P-3 Plan
- [ ] P-4 Gate

DESIGN (skip block if non-UI wave):
- [x] D-1 Brief
- [x] D-2 Variants (with bounded iteration)
- [x] D-3 Review & adopt
> D-block PASS — message-lifecycle gap (edit/(edited) + delete→tombstone + reaction-pills + add-reaction popover, hover+focus row-actions) composed onto design/server-channel-view.html. Dual reviewers: iter1 APPROVE|REVISE (1 WCAG tombstone-contrast fix) → iter2 APPROVE|APPROVE. head-designer gate APPROVED. Zero token additions. Reviewer-B sub: accessibility-tester for /ui-ux-pro-max.

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge (PR #24, SHA 427d5d6, 6/6 checks incl boot-probe)
- [x] C-2 Deploy & verify (api+web SUCCESS via CLI up; migration 0006 applied; lifecycle + two-client realtime verified; canary skipped <1000 DAU)

TEST:
- [ ] T-1 Static
- [ ] T-2 Unit
- [ ] T-3 Contract
- [ ] T-4 Integration
- [ ] T-5 E2E
- [ ] T-6 Layout
- [ ] T-7 Perf
- [ ] T-8 Security
- [ ] T-9 Journey

VERIFY:
- [ ] V-1 Independent reviews (Karen + jenny, parallel)
- [ ] V-2 Triage
- [ ] V-3 Fast-fix loop (or close)

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
