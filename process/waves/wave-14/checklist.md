# Wave 14 stage completion

> Seeded by wave-13 N-3. Active milestone: M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, in_progress).
> Seed task: `d1c4693d-b793-4960-8adf-f561aad20677` — Wire /presence Socket.IO namespace: online/offline tracking.
> Bundled siblings:
>   - `58633934-e6c4-45a7-9432-62ab2d8adbac` — Add typing indicators over /presence namespace
>   - `058984c5-b57a-4b8c-b2a5-cefce88357a9` — Build member-list panel with live presence on server-channel-view
>   - `10b9d18e-5071-41dc-85de-ef257b9dfde0` — Add presence dots to message author rows and DM/member affordances
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [d1c4693d-b793-4960-8adf-f561aad20677, 58633934-e6c4-45a7-9432-62ab2d8adbac, 058984c5-b57a-4b8c-b2a5-cefce88357a9, 10b9d18e-5071-41dc-85de-ef257b9dfde0]
>
> WHY THIS BUNDLE (wave-13 N-1 decomposition + N-2 ordering):
> - M3's THIRD messaging slice — "presence + typing + member-list panel," the next Discord-core conversational primitive after the message lifecycle. Waves 11-13 shipped the full message lifecycle (send/receive over realtime, edit/delete, reactions). This wave adds the `/presence` namespace (online/offline tracking + typing indicators) and the member-list panel that renders live presence — the literal next `## Scope` clause group.
> - Slice cut: wire `/presence` Socket.IO namespace with online/offline tracking, WS-upgrade auth reused from `/messaging` [seed]; typing indicators over `/presence` ("X is typing…") [sibling]; member-list panel with live presence on server-channel-view [sibling]; presence dots on message-author rows + DM/member affordances [sibling]. ~2800 LOC.
> - NEW namespace: `/presence` (distinct from the existing `/messaging` namespace). Mentions, attachments, thread replies all DEFERRED to later M3 waves (bundle WIP-limited).
>
> CARRY-FORWARDS (P-0/P-1 to honor):
> 1. **UI wave.** Bundle includes member-list panel, presence dots, and typing-indicator affordances (design/server-channel-view.html). P-1 likely flags design_gap_flag → D-block runs. Confirm against design/ at P-1.
> 2. **Auth-touching → T-8 mandatory.** The `/presence` namespace MUST authenticate on WS upgrade via the SuperTokens cookie (reuse the `/messaging` upgrade-auth pattern from task 723b5b6a), AND scope presence/typing events to shared membership so presence never leaks to non-co-members. Realtime presence/typing fan-out MUST be verified with TWO authenticated clients (no single-client realtime theater) — carries the wave-11/12/13 T-8 rule. (Flagged by milestone-decomposer for the product/security gates.)
> 3. **Architecture contracts (command-center/dev/architecture/_library.md):** new `/presence` namespace under RealtimeGateway; Zod schemas in @studyhall/shared as single WS contract; WS-upgrade session validation via SuperTokens; membership scoping via RbacService / ChannelPermissionGuard equivalents for presence rooms; member-row / presence-dot primitives on server-channel-view.
> 4. **3 carried tech-debt tasks remain parked** as top-level M3 todos for a future wave (NOT this bundle): 46f16288 (browser-E2E create-server), 25523fb0 (PG-rollback test), d058283d (invite_code rotation).

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [ ] P-4 Gate

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [ ] C-1 PR, CI & merge
- [ ] C-2 Deploy & verify
- [ ] C-3 Canary

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
- [ ] V-3 Fast-fix & gate

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
