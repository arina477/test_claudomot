# Wave 33 — T-block findings aggregate

## T-8 Security + T-5 E2E (LIVE against prod `api-production-b93e`, deployment `d69feba2`)

**Verdict: both stages APPROVED (head-tester active-tier). No new findings. F-32-T-8-1 RESOLVED, verified LIVE.**

### Load-bearing evidence (malformed non-UUID → 400, was 500)

| Probe | Route | Result |
|---|---|---|
| authed member + malformed (voice participants) | `GET /channels/not-a-uuid/voice/participants` | **400** `{"statusCode":400,"message":"Bad Request"}` (was 500) |
| authed + malformed (state-changing POST) | `POST /channels/junk/voice/token` | **400** |
| NON-voice authed + malformed (project-wide proof #1) | `GET /servers/not-a-uuid/members` | **400** |
| NON-voice authed + malformed (project-wide proof #2) | `GET /channels/not-a-uuid/messages` | **400** |
| injection-ish / numeric / hyphenated malformed | `channelId ∈ {123, '%27OR..', abc-def-ghi}` | **400 ×3** |

→ The fix is the **root-cause global filter** (22P02 → BadRequestException), proven live across voice + non-voice controllers, not a per-route patch.

### Auth boundary UNAFFECTED (regression — the 22P02 branch did NOT break authz)

| Probe | Expected | Observed |
|---|---|---|
| unauth + malformed (guard-first) | 401 | **401** `{"message":"unauthorised"}` |
| authed NON-member + valid-format voice (existing) | 403 uniform | **403** `Insufficient permissions…` |
| authed NON-member + valid-format NONEXISTENT uuid | 403 uniform (byte-identical) | **403** *(enumeration gate holds)* |
| authed MEMBER + valid-format voice | 503 creds-guard, NOT 400 | **503** `Voice service is not configured` |
| authed MEMBER + valid-format TEXT channel | existing domain-400 (distinct body) | **400** `Participants can only be listed for voice channels` |

→ Two distinct 400 paths confirmed byte-distinct: **malformed-format → generic "Bad Request"** (new, before DB access) vs **valid-UUID-wrong-type → existing domain message** (unchanged). Valid-UUID behavior preserved exactly.

### Clean body

Malformed-400 body = `{"statusCode":400,"message":"Bad Request"}`. Leak-grep (`stack|sql|SQLSTATE|22P02|QueryFailed|postgres|drizzle|table|column|node_modules`) → **zero matches**. No stack/SQL/DB detail.

### Secret grep (T-8 Action 5, always-on)

`git diff main~1..main -- apps/api | grep -iE 'api[_-]?key|secret|token|password|bearer …'` → **NO MATCHES**. Diff is a filter + helper + integration spec. `secret_grep_findings: []`.

### T-5 happy-path (no regression)

Valid authed journeys `GET /servers/:id/members`, `GET /channels/:id/messages`, `GET /servers/:id` → **200 with real data**. Wave-32 occupancy path reachable for valid member (503 = gate passed). Routing intact (404 on nonexistent). No FAIL/FLAKE/BLOCKED.

### Fixtures

Prod DB fixtures (voice channel `c3300033…0001` in proof server; non-member server `53300033…0002` + its channel) created via public proxy, **FULLY torn down** — verified prod restored (proof server = only `general` text channel). `db_fixtures_cleaned: true`.

### Findings

- **F-32-T-8-1** (wave-32 LOW→MED input-validation gap): **RESOLVED — verified LIVE on prod.** No new findings this wave.
