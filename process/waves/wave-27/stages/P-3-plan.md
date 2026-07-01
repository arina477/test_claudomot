# Wave 27 — P-3 Plan (multi-spec: presence-perf pair)

## Approach section

### Architecture deltas
- **Spec A (server, 6a546c7b):** add a secondary index on `server_members(user_id)`. Currently `server_members` has only `unique(server_id, user_id)` (composite, server_id-leading) — a `WHERE user_id = $1` lookup (`getServerIdsForUser`, presence.service.ts:106-113) can't use it → Seq Scan per /presence connect. Adding `index().on(user_id)` makes it an Index Scan. No column/constraint change, no query rewrite (`getCoMemberUserIds`'s `WHERE server_id IN (...)` already uses the composite's leading column; untouched). **Alternatives:** (a) SELECT DISTINCT rewrite — REJECTED, no-op (dedup is in-memory Set; the cost is the un-indexed scan, not dedup). (b) cache the co-member set — REJECTED (mvp keep-OUT: invalidation/TTL/warmup is gold-plating at 0 users; an index is the minimal correct lever). (c) composite `(user_id, server_id)` covering index — considered; a plain `(user_id)` index suffices for the `WHERE user_id` lookup and is smaller. **Failure domain:** none — additive index, forward-only migration, no data change.
- **Spec B (client, 07361daf):** lift the per-`AuthorPresenceDot`-row `subscribePresence` useEffect to a SINGLE message-list-level subscription + tick counter (mirroring `usePresence.ts`), so a presence event does O(1) list-level work instead of O(rows) per-row callbacks. Each dot reads `hasPresence(authorId)`/`getPresenceStatus(authorId)` at render off the shared tick. **Alternative:** keep per-row (status quo) — REJECTED (the wave-26 V-2 / B-6 P2 perf debt this spec exists to fix). Behavior-preserving: the tri-state render (online/offline/unknown→null) + AC4 single socket + self-seed all unchanged. **Failure domain:** client-only render wiring; the unsubscribe on unmount must stay correct (no leak).

### Data model
Spec A: NEW index `server_members(user_id)` (Drizzle `index()` + generated migration; forward-only per project convention). No column/constraint/backfill.

### API contracts / deps
None (no endpoint change, no new dep — Spec A is a DB index, Spec B is a client refactor).

### SDK pre-build
N/A.

## Plan section

### File-level steps by B-stage

**B-0 Schema (Spec A):**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 1 | apps/api/src/db/schema/servers.ts | modify | add `index('server_members_user_id_idx').on(table.user_id)` to server_members table config | database-administrator |
| 2 | apps/api/drizzle/migrations/ (generated) | create | `drizzle-kit generate` → migration adding the index; commit per project convention | database-administrator |
| 3 | (local) | run | apply migration to local dev DB; verify `\d server_members` shows the index | database-administrator |

**B-1 Contracts:** SKIP (no shared type / Zod / API contract change).

**B-2 Backend (Spec A proof):**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 4 | apps/api/src/presence/presence.service.ts | confirm | `getServerIdsForUser` unchanged in logic; the index makes its `WHERE user_id` an Index Scan (no code change needed beyond confirming) | database-administrator |
| 5 | apps/api/test/integration/presence-perf.spec.ts (or extend a presence integration spec) | create | real-PG test: EXPLAIN (or pg_stat/index-usage) asserts `getServerIdsForUser` uses `server_members_user_id_idx` (Index Scan, not Seq Scan) for a user with servers; + behavior: same co-member set as before. Uses the wave-17 pg-harness. | database-administrator |

**B-3 Frontend (Spec B):**
| # | Path | Op | What | Specialist |
|---|---|---|---|---|
| 6 | apps/web/src/shell/MessageList.tsx | modify | lift the per-row `subscribePresence` to ONE list-level subscription + tick; `AuthorPresenceDot` reads hasPresence/getPresenceStatus at render off the tick (no per-row subscribe). Preserve tri-state + AC4 + self-seed. | react-specialist |
| 7 | apps/web/src/shell/presence-dots.test.tsx | modify | update the AC4 subscription-count assertion to the single-subscription model (1, not N); confirm dots still render online/offline/unknown→no-dot/live-flip; assert one list-level subscription for an N-message list | react-specialist |

**B-4 Wiring:** repo typecheck + `biome check` (BUILD rule 7) + build. **B-5 Verify:** api+web tests + build (+ integration tier runs the new presence-perf spec — CI rule 5 executed-count). **B-6 Review:** head-builder gate + /review. Commit-per-spec discipline (multi-spec): Spec-A commits cite 6a546c7b, Spec-B commits cite 07361daf (B-6 Action 6 checks this).

### Specialist routing (validated against AGENTS.md)
- `database-administrator` — server_members index + migration + query-plan integration test (DB/migration/perf). In AGENTS.md.
- `react-specialist` — MessageList subscription lift + test. In AGENTS.md (used w25/w26).

### Parallelization
Spec A (B-0/B-2, database-administrator) ∥ Spec B (B-3, react-specialist) — disjoint file scopes (apps/api vs apps/web), no shared contract → run in parallel. B-4 gates both.

### Action 8 — self-consistency sweep
Spec A ACs → steps 1-3 (index+migration) + 5 (proof test). Spec B ACs → steps 6-7. Every AC maps to a step; every step has a specialist; no file in two batches; design_gap_flag=false referenced; contracts concrete (index DDL; no API/data-shape change); no new deps; no SDK. Clean.

## Exit
Multi-spec plan: Spec A server_members(user_id) index (database-administrator, B-0/B-2) ∥ Spec B MessageList single-subscription lift (react-specialist, B-3). design_gap_flag=false → skip D. → P-4 Gate (carry the M5 park-or-key escalation).
