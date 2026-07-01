# P-4 Phase 2 — Karen Reality Check (wave-27, multi-spec presence-perf)

**Role:** Karen at P-4 Phase 2. Verify the LOAD-BEARING CLAIMS in the spec (6a546c7b, 2 blocks) + plan are TRUE in the codebase.
**Verdict: APPROVE** — with ONE non-blocking correction the gate MUST fold in (specialist-name mismatch, claim 7).

All 6 factual code-claims are VERIFIED. The antipattern scan comes back clean (no claimed-but-fake). The single defect is a plan hygiene issue (agent name not in AGENTS.md) that does not touch spec correctness and is trivially fixable at B-block claim-time.

---

## Spec A — server_members(user_id) index

### Claim 1 — server_members has NO standalone user_id index — **VERIFIED**
`apps/api/src/db/schema/servers.ts:44-58`. `server_members` third-arg config is `(table) => [unique().on(table.server_id, table.user_id)]` (line 57) — a single composite unique, `server_id`-leading. No `index().on(user_id)`. Confirmed by grep: the only `index(...user_id)` hits in the schema are `assignments.ts:80` (`assignment_status_assignment_user_idx`, composite) and `messages.ts:125` (`message_mentions_user_created_at_idx`) — neither on `server_members`. `server_members_user_id_idx` does not exist anywhere in `apps/api/src/db` or `apps/api/drizzle`. The spec's premise (an un-indexed `WHERE user_id` scan) is real.

### Claim 2 — getServerIdsForUser IS the WHERE user_id query — **VERIFIED**
`apps/api/src/presence/presence.service.ts:106-113`. Method `getServerIdsForUser(userId)` runs `db.select({server_id}).from(server_members).where(eq(server_members.user_id, userId))` (line 110). Exactly the `WHERE user_id = $1` shape the index targets. This is the query that goes Seq→Index Scan after the index. Confirmed.

### Claim 3 — getCoMemberUserIds is already index-covered + in-memory dedup (WHY spec doesn't touch it) — **VERIFIED**
`presence.service.ts:119-133`. Its filter is `inArray(server_members.server_id, serverIds)` (line 126) — a `WHERE server_id IN (...)`, which uses the **leading column** of the existing `unique(server_id, user_id)` composite (servers.ts:57), so it is already index-supported. Dedup is an in-memory JS `Set` (lines 128-132: `const seen = new Set<string>(); ... seen.add(r.user_id); return Array.from(seen)`), so a SQL `SELECT DISTINCT` rewrite would be a genuine no-op. The reframe's core correction (seed named the wrong method; the DISTINCT rewrite is dead) is TRUE against the code. Correctly scoped OUT.

### Claim 4 — index() house pattern already exists (plan's DDL is convention, not invention) — **VERIFIED**
`servers.ts:99-102`: `channel_permission_overrides` config uses `index('cpo_channel_id_idx').on(table.channel_id)` alongside a `unique()`. `index` is already imported (servers.ts:5). The plan's `index('server_members_user_id_idx').on(table.user_id)` (P-3 step 1) is a copy of an in-file, in-table pattern — not a novel construct. Confirmed. (Two further precedents: `assignments.ts:80`, `messages.ts:125`.)

---

## Spec B — client subscription lift

### Claim 5 — AuthorPresenceDot subscribes PER-ROW — **VERIFIED**
`apps/web/src/shell/MessageList.tsx:951-974`. `AuthorPresenceDot({authorId})` calls `subscribePresence(...)` inside its own `useEffect` (lines 958-968), keyed on `[authorId]`. It is rendered once per real row from `SentRow` (line 1068: `<AuthorPresenceDot authorId={msg.authorId} />`), which `MessageList` maps over every `msg.kind === 'real'` (lines 1605-1619). So N real messages → N `subscribePresence` subscribers → the O(rows) subscription fan-out Spec B lifts. This is exactly the pattern the spec targets. Confirmed. (Note: the per-row effect already does a `prev === next` guard at 963 to avoid needless re-renders, but the *subscription count* is still N — Spec B's target metric — so the lift is still the right move.)

### Claim 6 — usePresence single-subscription reference exists — **VERIFIED**
`apps/web/src/shell/usePresence.ts:28-45`. ONE `subscribePresence` in a `useEffect([])` (lines 33-38) bumping a `tick` counter; `getStatus` reads `getPresenceStatus(userId)` at render (lines 40-42). Header comment (lines 10-12) states the intent verbatim: "call once at MemberListPanel level … keeping subscription count at 1 regardless of member count." This is a real, in-repo one-subscription-per-consumer + tick pattern for Spec B to mirror. Confirmed.
Supporting: `presenceSocket.ts` exports `getPresenceStatus` (:148), `hasPresence` (:158), `subscribePresence` (:206) — all three render-time reads the lifted dot needs are present.

---

## Claim 7 — Specialists in AGENTS.md — **WRONG (partial)**

- `react-specialist` — **VERIFIED**: `command-center/AGENTS.md:82` ("React 19 + Vite SPA components, hooks, state, performance | B-3 frontend"). Correct routing for Spec B (step 6/7).
- `database-administrator` — **WRONG**: `grep -c "database-administrator" command-center/AGENTS.md` = **0**. Absent from AGENTS.md. The catalogued DB/Drizzle/index/migration agent is **`postgres-pro`** (`AGENTS.md:81` — "PostgreSQL + Drizzle schema, queries, indexing, migrations, performance | postgres / drizzle work"). The plan routes ALL of Spec A (P-3 steps 1-5, the routing table, and the parallelization line) to `database-administrator`, which the plan itself labels "In AGENTS.md" — that assertion is false.

**Why non-blocking:** `database-administrator` IS a spawnable agent type in this harness AND is listed in `process/session/.capability-sheet.md:53`. Per always-on rule 11 the spawn-gate is `capability-sheet AND AGENTS.md`; it passes the sheet but fails AGENTS.md, so as written it is a rule-11 violation. The fix is a pure name swap with zero spec impact: **route Spec A B-0/B-2 to `postgres-pro`** (the exact-match catalogued agent for "server_members index + migration + query-plan integration test"), OR register `database-administrator` in AGENTS.md before B-block. `postgres-pro` is the closest catalog match and its charter covers indexing + migrations + performance verbatim. Head-product should make this swap a REWORK-lite note on the plan (not a full gate REWORK) — it does not require re-decomposition.

---

## Antipattern scan

**1. Is the "6th consecutive under-floor M5-debt wave" claim legit (not fabricated)? — LEGIT / VERIFIED.**
`waves` w22-w27 all carry `milestone_id = a5232e16` (M5), statuses ok/ok/ok/ok/ok/running. Six consecutive waves on the same milestone. The bet-load-bearing headline is real: M5 milestone prose (`## Scope`) explicitly names "due-date reminder notifications (cron + NotificationsModule via Resend)" and `## References` cites `sdks.md (Resend)`. No decomposed reminder *task* is open yet (keyword sweep for remind/resend/due/cron returned 0 open rows) — but the escalation correctly targets the milestone-level scope, not a phantom task, so the park-or-key fork is founded on real milestone prose, not invented. The escalation is a legitimate first-class P-4 output.

**2. Is the client bundle (07361daf) actually re-homed? — VERIFIED.**
DB row: `07361daf` → `milestone_id = a5232e16` (M5), `wave_id = NULL`, `parent_task_id = 6a546c7b` (the seed). Exactly as P-0 frame line 25 claims. Seed `6a546c7b` is `milestone_id = M5`, `wave_id = NULL`, `parent_task_id = NULL`. The multi-spec bundle (`claimed_task_ids = [6a546c7b, 07361daf]`) is structurally coherent — seed + parented sibling, both under active M5, both unclaimed by a wave. No orphan, no cross-milestone leak.

**3. Any claimed-but-fake in the plan? — NONE (beyond claim 7's name error).**
- Data-model claim (P-3 line 10, "NEW index … No column/constraint/backfill"): matches — additive index only, no schema/data change.
- API/deps claim (line 13, "None … no new dep"): matches — Spec A is DDL, Spec B is a client refactor; no endpoint/dep touched.
- Parallelization claim (line 50, "disjoint file scopes apps/api vs apps/web"): matches — Spec A files are all `apps/api/*`, Spec B files all `apps/web/src/shell/*`. No shared file, no shared contract. Genuinely parallelizable.
- Self-consistency sweep (line 52-53): every AC maps to a step, every step (except the name in claim 7) has a valid specialist, `design_gap_flag=false` is consistent with a backend index + client-perf refactor (no new UI surface — the dot component already exists). Clean.
- The B-2 proof-test step (step 5) claims a "wave-17 pg-harness" for a real-PG EXPLAIN/index-usage assertion — I did not independently verify the harness exists; flagging as a T-block/B-block executable-proof item, not a P-4 blocker (the spec's AC requiring Index-Scan proof is verifiable and correctly demanded).

---

## Overall: **APPROVE**

Every load-bearing factual claim in the spec is TRUE in the codebase (claims 1-6 VERIFIED). The scope carve-outs (don't touch `getCoMemberUserIds`, no cache layer) are code-justified. The antipattern scan is clean: the 6th-under-floor escalation is founded on real milestone prose + real wave history, and the sibling re-home is structurally correct in the DB. No claimed-but-fake.

**One mandatory carry into B-block (does not block the gate):** the plan's Spec-A specialist `database-administrator` is NOT in `command-center/AGENTS.md` (claim 7 WRONG). Swap Spec A B-0/B-2 routing to **`postgres-pro`** (exact catalog match, AGENTS.md:81) — or register the agent before claim-time — to satisfy always-on rule 11. This is a one-word plan edit with zero effect on the spec's correctness or the ACs.
