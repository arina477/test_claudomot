# Wave 12 stage completion

> Seeded by wave-11 N-3. Active milestone: M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, in_progress).
> Seed task: `a0c322b4-72de-4c8d-ac27-bb51dda5f464` — Build MessagingModule + send/list message REST data plane.
> Bundled siblings:
>   - `723b5b6a-5565-438f-bde4-7e85ba283781` — Wire /messaging Socket.IO gateway: WS-upgrade auth + room-per-channel fan-out
>   - `d999d29c-4f60-497b-95fb-875ae40410b9` — Build message UI: composer + virtualized message list with pending/failed states
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [a0c322b4-72de-4c8d-ac27-bb51dda5f464, 723b5b6a-5565-438f-bde4-7e85ba283781, d999d29c-4f60-497b-95fb-875ae40410b9]
>
> WHY THIS BUNDLE (wave-11 N-1 decomposition + N-2 ordering):
> - This is M3's FIRST real-time messaging slice — the core text data plane delivering the M3 success metric (two students exchange messages in real time <1s). The wave-11 N-1 fired milestone-decomposition because M3's messaging `## Scope` was unshipped (a feature-stockout: the 3 prior top-level todos under M3 are carried M2 tech-debt, not messaging seeds).
> - Slice cut: messages table + RBAC-gated send/list REST (idempotency + cursor pagination) [seed], /messaging Socket.IO real-time fan-out (WS-upgrade session-auth, room-per-channel) [sibling], composer + virtualized message-list UI with pending/failed states [sibling]. ~3200 LOC, ~25 files.
> - DEFERRED to later M3 waves (NOT this wave — bundle WIP-limited): reactions, threads, mentions, file/image attachments, presence/typing, member-list-with-presence.
>
> CARRY-FORWARDS (P-0/P-1 to honor):
> 1. **UI wave.** Bundle includes message composer + virtualized message-list UI (design/server-channel-view.html; primitives message-row with pending/failed states, composer). P-1 likely flags design_gap_flag → D-block runs. Confirm against design/ at P-1.
> 2. **Auth-touching → T-8 mandatory.** Message send/read paths are session-gated (SuperTokens) and RBAC-gated (ChannelPermissionGuard from wave-10). The /messaging Socket.IO namespace authenticates via SuperTokens session on WS **upgrade** (not first message). T-8 rule 1 (NEW this wave): **live-probe authz with the wave-11 verified prod fixture on every authed-feature wave** — message send/read authz MUST be live-verified through ChannelPermissionGuard with a real authenticated session, and realtime delivery verified with TWO authenticated clients (no single-client realtime theater).
> 3. **Architecture contracts (command-center/dev/architecture/_library.md) the build MUST respect:** cursor-only pagination (composite cursor created_at+id); idempotency-key dedup on UNIQUE(channel_id, idempotency_key); Socket.IO io.use() upgrade-auth; Zod schemas in @studyhall/shared as the single REST+WS contract; @UseGuards(JwtAuthGuard, ChannelPermissionGuard) → RbacService.can() with membership checked every message send.
> 4. **3 carried tech-debt tasks remain parked** as top-level M3 todos for a future wave (NOT this bundle): 46f16288 (browser-E2E create-server), 25523fb0 (PG-rollback test), d058283d (invite_code rotation).

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [ ] P-1 Decompose
- [ ] P-2 Spec
- [ ] P-3 Plan
- [ ] P-4 Gate

DESIGN (skip block if non-UI wave):
- [x] D-1 Brief — message-ui brief APPROVED (job named, 9 states scoped, tokens cited, non-goals §10)
- [x] D-2 Variants (with bounded iteration) — V1 composed; 3 refine iterations (cap 3)
- [x] D-3 Review & adopt — APPROVED (dual-reviewer APPROVE/APPROVE); canonical: design/server-channel-view.html; design_system_updates: []

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge (PR #23 merged @168c45f; boot-probe fix 006235b, all 7 checks green)
- [ ] C-2 Deploy & verify — HOLD: migration 0005 applied + verified; deploy BLOCKED (false-green / stale-revision; no GitHub-connected source + Railway CLI absent + no GraphQL source-upload)

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
