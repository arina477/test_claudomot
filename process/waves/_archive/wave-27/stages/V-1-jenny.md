# V-1 jenny — wave-27 (multi-spec presence perf) — DEPLOYED-BEHAVIOR spec-conformance

**Reviewer:** jenny (independent spec-conformance)
**Method:** semantic-spec verification of DEPLOYED behavior vs the two spec blocks in `tasks.description` of `6a546c7b` (+ re-homed `07361daf`). Behavior-preserving perf wave — the bar is: **NO observable behavior change + the perf intent met.** Distinguished spec-drift (code wrong) from spec-gap (spec missed a case).
**Deployed state re-confirmed at V-1:** web bundle `assets/index-Dr2UkTXH.js` live on https://web-production-bce1a8.up.railway.app/ (curl'd this session); api health `{"status":"ok",...}` on https://api-production-b93e.up.railway.app/health. Matches the deploy-under-test (api 855f1ea1 / web 328b1ae9, merge 87b6ef7).

**DB-verification note (scope-honest):** `CLAUDOMAT_DB_URL` from this env is the **brain-state DB** (only `founder_bets/milestones/tasks/waves` — verified by `information_schema.tables`), NOT the StudyHall app prod Postgres. So I could not directly `pg_indexes`-inspect prod `server_members` from here. Per the V-1 assignment, Spec A's index-applied + index-scan claim is covered by the T-4 CI EXPLAIN proof against real PG + the migration-applied evidence — which I verified below at the source/migration/CI level.

---

## Spec A (6a546c7b — server: index the getServerIdsForUser scan) — **MATCHES**

| AC | Claim | Independent evidence | Verdict |
|----|-------|----------------------|---------|
| A1 | index on server_members(user_id) in Drizzle schema + generated migration + applied | `apps/api/src/db/schema/servers.ts:59` → `index('server_members_user_id_idx').on(table.user_id)`; migration `apps/api/drizzle/migrations/0012_flashy_spacker_dave.sql` = `CREATE INDEX "server_members_user_id_idx" ON "server_members" USING btree ("user_id");`; T-4 + journey-map confirm 0012 applied to prod (index confirmed on public.server_members) | MATCH |
| A2 | getServerIdsForUser uses Index Scan (not Seq Scan) — EXPLAIN proof | `T-4-integration.md`: `presence-index-scan.spec.ts` EXECUTED+PASSED in CI PR#40 vs real PG — asserts EXPLAIN Index Scan on `server_members_user_id_idx` (`enable_seqscan=off` forcing eligibility, deterministic) | MATCH (via CI EXPLAIN, the authoritative path for a query-plan claim) |
| A3 | behavior-preserving — /presence connect returns SAME co-member set; presence tests green | T-4 asserts behavior-preserving getServerIdsForUser co-member set in the same integration spec; the index is a pure access-path change (transparent to result rows — a btree index on the WHERE column cannot change the returned set) | MATCH |
| A4 | getCoMemberUserIds NOT rewritten (index + proof test only) | migration 0012 is index-only (no column/unique/query change); schema `unique().on(server_id,user_id)` at :58 unchanged; no SELECT-DISTINCT rewrite | MATCH |

Data-contract exactness: the migration is a **non-unique btree on user_id only** — no column change, no unique-constraint change, exactly what the `contracts.data` line specifies. **Semantically the index is transparent to results**, so Spec A cannot produce a user-visible behavior change by construction; the perf intent (Index Scan) is CI-proven. **MATCHES.**

---

## Spec B (07361daf — client: lift per-row → single list-level subscription) — **MATCHES**

| AC | Claim | Independent evidence (source of the DEPLOYED bundle) | Verdict |
|----|-------|------------------------------------------------------|---------|
| B1 | exactly ONE list-level presence subscription (not per-row); N messages → 1 subscriber | `MessageList.tsx:1515-1520` — single `subscribePresence` in a `useEffect(…, [])` (list-level, `presenceTick` counter). `grep -c "subscribePresence("` on MessageList = **1** (no per-row subscribe survives). AuthorPresenceDot (`:962`) does NOT subscribe — takes a `status` prop. | MATCH |
| B2 | each dot reads hasPresence/getPresenceStatus at render, driven by the single tick; O(1) list-level | `SentRow` (`:1006-1008`) derives tri-state via `hasPresence(msg.authorId) ? getPresenceStatus(...)==='online' : null` on each `presenceTick`; passed as prop to memoized AuthorPresenceDot | MATCH |
| B3 | dots render IDENTICALLY: online→emerald, offline→muted, unknown→NO dot, self→online | AuthorPresenceDot (`:964`) `status===null → return null` (unknown = no dot, AC3). PresenceDot (`:60`) online→`--color-accent-emerald` (= `#10b981` = **rgb(16,185,129)**, globals.css:18), offline→`--color-surface-500` (muted). **T-5 LIVE prod DOM observed exactly rgb(16,185,129) online + sr-only "Online" ×3, 1 grey rgb(82,82,91) offline.** Self-seed intact (ProfileContext seedSelfPresence, wave-26 carry). | MATCH |
| B4 | exactly one /presence socket | `presenceSocket.ts` singleton `subscribePresence`; member panel `usePresence.ts` also single-sub (grep=1) — no second socket introduced; T-5 saw self + member-panel dots from one store | MATCH |
| CARRY-B | per-author render-scoping preserved | AuthorPresenceDot is `memo(...)` on the derived scalar `status` (`:962`, comment `:1073-1074`) — a row bails re-render unless ITS author's tri-state flips. Behaviorally identical to per-author scoping (memo is a perf preservation, not a behavior change). | MATCH (behavior); perf-preservation is Karen/head-builder's code-level carry |

**KEY RISK cleared:** the "dots render identically" claim is the load-bearing behavior-preserving assertion for the whole wave. It is MET **live on prod** — T-5 confirmed the exact same emerald online dot + sr-only label + member-panel online/offline + a11y-reachable ×3 with zero flakes on the new bundle, and the source token (`#10b981`→rgb(16,185,129)) matches the observed DOM byte-for-byte. **No observable difference from wave-26.** **MATCHES.**

---

## Drift / cross-reference audit — **CONSISTENT (no conflicts)**

- **product-decisions.md:325-329** (wave-27 P-1): under-floor override-ship 6th (precedent-application, not fresh BOARD) ✓; presence-perf pair framing ✓; P-0 code-correction (real target = getServerIdsForUser WHERE user_id, getCoMemberUserIds already covered, SELECT DISTINCT no-op) ✓ — matches the spec Problem section verbatim; M5 park-or-key escalation raised to a first-class founder fork ✓ (this is an M5-strategy item, not a wave-27 behavior claim — does not affect this verdict).
- **journey-map wave-27 annotation (line 15):** "behavior-preserving, NO user-visible/route/screen/endpoint change" + both fixes + migration 0012 + bundle `index-Dr2UkTXH.js` + T-5 PASS×3 + revisions api 855f1ea1/web 328b1ae9 — all match the deployed state I re-confirmed. Annotation-only regen is correct (no new surface).
- **No prior-decision conflict:** wave-26 (product-decisions:319) shipped the author dots; wave-27 is the pre-announced perf lift of exactly that surface (wave-26 V-2 07361daf, B-6 P2). Consistent, not contradictory.
- Only carries noted (non-blocking, already routed to V-2): presence-dots.test comment misnames the memo mechanism (cosmetic, B-6 P3); Playwright MCP chrome-absent → bundled-chromium T-5 substitute (infra, not product).

---

## Overall verdict — **APPROVE**

Both spec blocks MATCH deployed behavior. For a behavior-preserving perf wave the bar — **NO observable behavior change + perf intent met** — is satisfied on both halves:
- **Spec A:** index is transparent to results (co-member set preserved by construction; T-4 CI EXPLAIN proves Index Scan). Perf intent met, behavior preserved.
- **Spec B:** single list-level subscription replaces per-row (source-verified in the deployed bundle); dots render identically on LIVE prod (T-5 ×3, token matches observed DOM); AC3 unknown→no-dot, AC4 single socket, self-seed, CARRY-B per-author memo all present. Perf intent met, behavior preserved.

No spec-drift (code is correct against every AC). No spec-gap (edge cases — 0 messages, N-same-author, live flip, unmount — are covered by the single-tick + tri-state + `[]`-dep unsub design; none observably regress). CARRY-B is behavior-safe here and remains a **perf-preservation** carry for Karen/head-builder to confirm at the code level (memo comparator), not a behavior blocker.

```yaml
stage: V-1
reviewer: jenny
verdict: APPROVE
wave: 27
wave_type: multi-spec-behavior-preserving-perf
specs:
  - task_id: 6a546c7b-e459-46a6-95f2-d00707353308
    label: server-members-user_id-index
    result: MATCHES
    acs: {A1: match, A2: match, A3: match, A4: match}
  - task_id: 07361daf-0fa2-426b-ab26-98427b86adf1
    label: client-subscription-lift
    result: MATCHES
    acs: {B1: match, B2: match, B3: match, B4: match, CARRY-B: match-behavior}
drifts: []
spec_gaps: []
notes:
  - "CLAUDOMAT_DB_URL is brain-state DB, not app prod — Spec A index verified via T-4 CI EXPLAIN + migration 0012 + schema, not direct pg_indexes."
  - "Spec B dots-render-identically confirmed live (T-5 x3); emerald token #10b981=rgb(16,185,129) matches observed prod DOM."
  - "CARRY-B behavior-safe; per-author memo is a perf-preservation carry for Karen/head-builder code-level."
findings: []
```
