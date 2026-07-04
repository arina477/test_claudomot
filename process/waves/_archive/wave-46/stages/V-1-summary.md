# Wave 46 — V-1 reviews summary (orchestrator)

**Block:** V (Verify) · Stage V-1 · Reviewers spawned in parallel, no shared context (independence preserved).
**Target:** LIVE deployed + merged state — merge SHA `2a738f7b`; api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`.

## Verdicts

| Reviewer | Lens | Verdict | Findings |
|---|---|---|---|
| **Karen** | source-claim truth (deployed/committed) | **APPROVE** | 6 (all CONFIRM; 0 defects) + 1 methodology note |
| **jenny** | semantic spec-match (deployed behavior ↔ P-2 contract) | **REJECT** | 5 defects (1 CRITICAL new, 3 HIGH, 1 MEDIUM) + 1 coverage note |

**Split is legitimate, not a contradiction.** Karen's lane = "are the wave's load-bearing claims true?" (files exist, exports present, routes registered, migration applied, who_can_dm enforcement is real non-stub code, IDOR guard + idempotency present, outbox discriminator generalized). All TRUE. jenny's lane = "does deployed behavior semantically match spec intent beyond the ACs T-block tested?" The backend spine is semantically strong; the **UI layer has spec-breaking defects the T-block E2E single-flow missed.** Orthogonal axes → both verdicts stand.

## Karen — APPROVE (all confirmed)
1. DM schema + migration 0021 — all 3 tables + both UNIQUE + indexes + 5 FKs present.
2. who_can_dm enforcement is NEW + non-stub — real loop over targets, whole-create 403, no partial row.
3. /dm routes registered + LIVE — 4 routes return 401 unauth (mounted); control 404.
4. IDOR gate (session-derived callerId, never client-supplied) + idempotency (onConflictDoNothing + refetch, UNIQUE-backed).
5. Outbox discriminator generalized ({kind:'channel'|'dm'}) with legacy channel fallback — no regression.
6. Shared Zod schemas exported + re-exported; deploy serves merge SHA; /health live.
Methodology note (Info): `$CLAUDOMAT_DB_URL` = brain DB, not app DB — app-schema truth rests on C-2's authoritative to_regclass verification + live 401-not-500 corroboration. No mutations performed.

## jenny — REJECT (defects)
- **F-A — CRITICAL (spec-drift, NEW — T-block missed):** Start-DM picker is **unstartable through the UI.** `DmHome.tsx:23,105` passes `serverId = useServers().selectedId` to the picker, but the DM home surface always has `serverId=null` (selecting a server unmounts DM home). Picker's only candidate source is `GET /servers/:id/members` gated on a non-null serverId → shows "Join a server to find people to message." with zero candidates from its only entry point. Spec 1ceffdc9 AC2 explicitly names this ("without it DMs are unstartable"). ORCHESTRATOR-CONFIRMED at source (StartDmPicker.tsx:108-119, 281-287; DmHome.tsx:23,105). Compounding: `DmHome.tsx:25` sets `currentUserId = profile?.username` (a username), but member/participant ids are opaque `users.id` text — self-exclusion `m.userId !== currentUserId` (StartDmPicker.tsx:115) compares mismatched id spaces, so it silently fails to exclude self and mis-keys name resolution.
- **F-C1/F3 — HIGH (spec-drift):** `displayName` returned as raw userId UUID for all participants incl. self (whose username is known). Leaks into conv list, thread title, composer placeholder, every message-row author; persists across reload. `displayName||username||userId` fallback (wave-29 pattern) dropped in the DM DTO mapper. (T-block rated this MEDIUM/F-C1; jenny + live spread raises to HIGH.)
- **F6 — HIGH (spec-drift):** Sender's own message double-renders (optimistic copy + echo), never reconciles, stable until reload. Server truth = exactly 1 row (id 51865496…). Violates "reconcile, not the fan-out echo" (spec 32f5d29e AC1 / 1ceffdc9 AC3). Confirms T-block F6.
- **F-I4 — HIGH (spec-drift):** Cursor pagination re-emits boundary message every page turn (28 emitted vs 23 unique across 6 pages; page2-first-id == page1-last-id). Inclusive `>=` where strict `>` required. Confirms the duplication half of T-block F-I4; the "drops last" half did NOT reproduce (composite createdAt|id cursor id-tiebreaker prevents drops).
- **F7 — MEDIUM (spec-drift, DOWNGRADE):** "Unknown user" author reproduced on the OPTIMISTIC row only (self name unresolved at optimistic-render), NOT on delivered rows. T-block rated MAJOR; jenny's live repro narrows scope to optimistic row.
- **Coverage note — MEDIUM:** userB fixture password is WRONG (WRONG_CREDENTIALS_ERROR) → jenny ran single-token. Full who_can_dm 3-policy matrix + two-client realtime + offline pending-state could NOT be freshly re-driven by jenny. (who_can_dm enforcement IS proven live: 403 whole-create with policy message. Two-client realtime + offline WERE proven at T-5 by two-client testers; F6 double-render is from that T-5 live evidence.)

## Reviewer false-negative probe
Karen "found no defects" on a non-trivial change — probed: her APPROVE is claim-truth only (correctly scoped); jenny's REJECT covers the behavior axis Karen doesn't own. Not a rubber-stamp — Karen deep-verified 5 load-bearing claims with command evidence. jenny's CRITICAL F-A is precisely the class of defect a green E2E can miss (the T-5 tester reached a thread via a pre-existing conversation / direct nav, never exercised cold-start "new user starts first DM from DM home").

```yaml
karen_verdict: APPROVE
karen_findings_count: 6
karen_false_positives_documented: 0
jenny_verdict: REJECT
jenny_findings_count: 5
spec_drift_count: 5
spec_gap_count: 0
jenny_false_positives_documented: 0
findings:
  - id: F-A
    source: jenny
    severity: CRITICAL
    kind: spec-drift
    loc: apps/web/src/shell/DmHome.tsx:23,105 + StartDmPicker.tsx:108-119,281-287
    desc: Start-DM picker unstartable from DM home (serverId always null there); +currentUserId=username vs userId id-space mismatch
    orchestrator_confirmed: true
  - id: F-C1
    source: jenny+T-block(F-C1/F3/F3b/F3c)
    severity: HIGH
    kind: spec-drift
    loc: DM DTO mapper (server) — displayName falls back to userId not username
    desc: raw userId UUID shown as displayName everywhere; dropped displayName||username||userId fallback
  - id: F6
    source: jenny+T-block(F6)
    severity: HIGH
    kind: spec-drift
    loc: apps/web/src/shell/useDm.ts:205
    desc: sender's own message double-renders; socket echo not deduped against optimistic-by-idempotencyKey
  - id: F-I4
    source: jenny+T-block(F-I4)
    severity: HIGH
    kind: spec-drift
    loc: apps/api/src/dm/dm.service.ts encodeCursor/listMessages
    desc: cursor boundary re-emitted on ASC page turn (inclusive >= vs strict >; ms-vs-µs truncation)
  - id: F7
    source: jenny+T-block(F7)
    severity: MEDIUM
    kind: spec-drift
    loc: apps/web/src/shell/DmThread.tsx:54 (optimistic row)
    desc: 'Unknown user' author on optimistic row only (self unresolved at optimistic render)
  - id: V1-COV
    source: jenny
    severity: MEDIUM
    kind: coverage-gap
    desc: userB fixture password wrong; jenny single-token; 2-client + full who_can_dm matrix not re-driven by jenny (but proven at T-5 / live 403)
```
