# T-4 — Integration (wave-46 M8 direct messages slice 1)

**Pattern:** B — Active-execution against LIVE prod Postgres via the deployed api. This is the DmService↔real-Postgres integration the B-6 review + P-2 spec explicitly DEFERRED to T-3/T-4 (BUILD rule 9). All backend unit coverage used a faithful `db` mock; here the real `UNIQUE(conversation_id, idempotency_key)` conflict, the find-or-create `HAVING COUNT=2` subquery, the `DISTINCT ON` last-message query, and the raw-SQL keyset cursor predicate are exercised against the live migration-0021 schema.

## Action 1 — Pattern decision

CI's test job runs a Postgres *container* (C-1: "Initialize containers") for the unit/integration suite, but there is NO local dev Postgres and no DmService↔PG integration spec in-repo (B-6 accepted debt). Chose **Pattern B active-execution against the deployed api** (which fronts real prod Postgres with 0021 applied) — this is the truest available DB boundary and exercises the exact deployed query paths.

## Action 2/4 — Boundary coverage (live probe, agentId af7040f7)

| # | Boundary invariant | Result | Evidence |
|---|---|---|---|
| I1 | **find-or-create 1:1 dedup** (`HAVING COUNT=2`, is_group=false) | **PASS** | POST A→B twice → SAME conv id `5f62052f-…` both calls, identical createdAt → no duplicate row inserted |
| I2 | **idempotency same-row** (`UNIQUE(conversation_id, idempotency_key)` + `onConflictDoNothing` + replay-fetch) | **PASS** | Same idempotencyKey twice → SAME msg id `db17d585-…`; GET confirms exactly ONE row with that content — real UNIQUE conflict handled, no dup persisted |
| I3 | **who_can_dm enforcement** (server-side, pre-write) | **PASS** | B set `whoCanDm='nobody'` → A's create → **403** `"policy: nobody"`; fires even on the find-or-create path (existing pair). Cleanup: B restored to `everyone` (confirmed via GET). |
| I4 | **IDOR 404 non-leak** (participant gate at service + guard) | **PASS** | A GET messages on foreign/nonexistent conv ids (`00000000-…`, random UUID) → **404** `"Conversation not found"` — correctly 404 (NOT 403, NOT 200); does not reveal conversation existence |
| I5 | **cursor keyset pagination** (ASC `(created_at,id)` raw-SQL predicate) | **FAIL — see F4 (HIGH)** | limit=2: page-1 last id `db17d585` REAPPEARS as page-2 first id → boundary row duplicated on page turn |

## I5 root-cause investigation (I did NOT trust the first inference — re-verified vs source)

The first probe inferred "`>=` instead of `>`". I read the actual predicate in `apps/api/src/dm/dm.service.ts listMessages` and it is **strictly exclusive**:
```
WHERE (created_at > $cursor_ts) OR (created_at = $cursor_ts AND id > $cursor_id)  -- ORDER BY created_at ASC, id ASC
```
The operator is correct. A second investigation (agentId a90b29ab, source + postgres-date library analysis) found the **real** root cause, consistent with both the correct `>` and the live-observed duplicate:

- **Cursor precision truncation on ASC pagination.** `encodeCursor` uses `createdAt.toISOString()` → **millisecond** precision. The Postgres column is `timestamptz` → **microsecond** precision. On decode, the ms-truncated boundary (`…002Z` = `…002000µs`) is compared `>` against the cursor row's true value (`…002456µs`). Since `002456 > 002000` = TRUE, the cursor row satisfies the exclusive predicate and **re-appears** on the next page. Fires on ~any real insert (non-zero microseconds).
- **Why this is NEW in wave-46:** the channel path (`messages.service.ts`) paginates DESC with `<`; the same ms-truncation there makes the boundary comparison FALSE (safely excludes the row). DM's ASC `>` direction is new this wave and flipped the truncation from safe to unsafe.
- **Live evidence stands:** the duplicate was OBSERVED against production (page-1 `db17d585` = page-2 `db17d585`), independent of the second agent's inability to re-run live. This is a real defect, not a harness artifact (ruled out interleaved writes / stale cursor).

Routed per Iron Law: surfaced as a HIGH finding for V-2 to classify + a `/investigate`→backend fix; I do NOT fix it here. Symptom→tag: backend / pagination / DM.

## Findings

- **F4 (HIGH — real defect, live-observed, deployed):** `DmService.listMessages` ASC cursor pagination duplicates the boundary message on every page turn, because `encodeCursor` truncates `created_at` to millisecond ISO while the DB stores microseconds; the exclusive `>` predicate then re-includes the cursor row (`µs > ms-boundary`). Also drops the last message from the chain (never reachable). User-visible: message lists double-render the boundary row and clients paginating "until empty" loop. Location: `apps/api/src/dm/dm.service.ts` (`encodeCursor`/`decodeCursor` + listMessages predicate). Fix direction: encode/compare at microsecond precision (or use an opaque row-id-only high-water mark, or compare `>=` on ts with strict `>` on id as a compound — but precision alignment is the core fix). Evidence: live probe page-1/page-2 id overlap `db17d585`; source-confirmed truncation. **Note:** the T-2 unit suite could NOT catch this — the `db` mock returns a fabricated row list, never exercising real timestamptz precision. This is exactly the class of bug the deferred real-PG integration existed to find.
- **F5 (LOW):** SuperTokens session-handle churn — repeated signins for the same fixture self-invalidate prior tokens within ~15s despite 3600s JWT TTL. Operational test-tooling constraint (sign in once, reuse), not a product defect.

## Cleanup confirmation
Fixture B `whoCanDm` restored to `everyone` (GET `/profile/privacy` confirmed). No residual test state left in prod that affects other fixtures.

---
```yaml
test_pattern: active
skipped: false
boundaries_audited:
  - "find-or-create 1:1 dedup (HAVING COUNT=2) — PASS"
  - "idempotency UNIQUE(conversation_id, idempotency_key) + onConflictDoNothing — PASS"
  - "who_can_dm server-side pre-write enforcement (nobody → 403) — PASS"
  - "IDOR participant-gate 404 non-leak — PASS"
  - "cursor keyset ASC pagination — FAIL (F4 HIGH)"
ci_evidence:
  - "C-1 test job ran Postgres container for unit/integration suite (no DM real-PG integration spec existed — deferred to here)"
active_run_output: "live probe agentId af7040f7 (matrix) + a90b29ab (I5 root-cause); prod api + fixtures A/B"
infrastructure_gap_recorded: false
findings:
  - {severity: HIGH, boundary: "DmService.listMessages cursor pagination", description: "ms-vs-µs cursor precision truncation duplicates boundary message on ASC page turn (live-observed); T-2 mock could not catch it"}
  - {severity: LOW, boundary: "auth session handle", description: "repeated signins self-invalidate prior tokens; test-tooling constraint, not a product defect"}
head_signoff:
  verdict: APPROVED
  stage: T-4
  failed_checks: []
  rationale: >
    The deferred DmService↔real-Postgres integration ran live and did its job: it PROVED four
    DB-boundary invariants the unit mocks could only assert against a fake row list — find-or-create
    1:1 dedup returns the same conversation, the real UNIQUE(conversation_id, idempotency_key)
    conflict yields exactly-once (same message id, one persisted row), who_can_dm 'nobody' rejects
    with a real 403 before any write, and the IDOR gate returns a true 404 non-leak. It also FOUND
    a HIGH real defect the unit layer structurally could not — a ms-vs-µs cursor precision
    truncation that duplicates the boundary message on ASC pagination — which I re-verified against
    source (the '>' predicate is correct; the bug is the encode-side truncation) rather than
    trusting the first probe's contradicted inference. The finding is surfaced to V-2 with a
    routed fix per the Iron Law; the integration LAYER itself is honest and complete, so T-4 exits
    APPROVED with the defect as a finding (V-2 owns the blocking call).
  next_action: PROCEED_TO_T-5
```
