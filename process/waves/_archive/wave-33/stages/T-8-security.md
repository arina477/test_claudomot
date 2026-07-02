# T-8 — Security (LIVE malformed-UUID → 400 re-probe)

**Wave:** 33 (M6 hardening — malformed non-UUID route param → 400 before DB, project-wide)
**Pattern:** active-execution (auto-promoted — input-validation hardening on auth-gated routes)
**Target:** DEPLOYED PROD — api `https://api-production-b93e.up.railway.app` (merge `e1a64f6`, deployment `d69feba2` SUCCESS, digest `sha256:4fec6143…c51fd4`)
**Fix under test:** `apps/api/src/auth/auth.exception.filter.ts` (+ `pg-error-utils.ts`) maps Postgres `22P02` (malformed-uuid cast / `QueryFailedError`) → `BadRequestException` (400). Global filter → project-wide across all 7 UUID-param controllers.
**Fixtures:** `studyhall-e2e-fixture` (A, uid `21984eb2…`) + `studyhall-e2e-fixture-b` (B, uid `da74148e…`). No real users touched. Prod DB fixtures created via public proxy, **fully torn down** (verified — prod restored).

## Auto-promotion

Wave is `single-spec` backend, not natively `auth`. The fix extends the `SupertokensExceptionFilter` (an auth-boundary path at `main.ts`) and changes the error contract on ~30 UUID-typed `@Param` bindings across 7 auth-gated controllers → **auto-promoted** to fire T-8. Applicable-probe subset per the auto-promotion matrix:

- **Action 2 (input-validation / state-changing) + auth-boundary regression** — the wave modified error handling on authed routes incl. a state-changing POST (`voice/token`). APPLIES.
- **Action 5 (secret-grep)** — ALWAYS runs.
- Action 1 (auth-smoke), Action 3 (session), Action 4 (rate-limit): **N/A** — no auth flow modified, no session-lifecycle code touched, no new endpoint / no rate-limit policy change (rate limit was proven active in wave-32 T-8; unchanged this wave).

`applicable_probes: [input_validation_authz_regression, secret_grep]`

## Live probe matrix — the crux

The CI integration tests (`malformed-uuid-params.spec.ts`, 10 real-DB tests) already proved `22P02 → 400` against a real Postgres in PR #46. This stage CONFIRMS the behavior on the DEPLOYED prod revision `d69feba2`.

Fixture A signed in via `POST /auth/signin` (`rid: emailpassword`, `st-auth-mode: header`) → `Authorization: Bearer <st-access-token>`. Authed sanity: `GET /servers/ad62cd12…/members` → **200** (2 members A+B, session valid).

| # | Scenario | Route | Expected | Observed | Body | Verdict |
|---|----------|-------|----------|----------|------|---------|
| 1a | **Authed member + malformed non-UUID** (LOAD-BEARING — the wave-32 F-32-T-8-1 fix) | `GET /channels/not-a-uuid/voice/participants` | **400** (was 500) | **400** | `{"statusCode":400,"message":"Bad Request"}` | **PASS** |
| 1b | **Authed + malformed non-UUID, state-changing POST** | `POST /channels/junk/voice/token` | **400** (was 500) | **400** | `{"statusCode":400,"message":"Bad Request"}` | **PASS** |
| 2a | **NON-voice authed route + malformed UUID** (proves project-wide convention) | `GET /servers/not-a-uuid/members` | **400** | **400** | `{"statusCode":400,"message":"Bad Request"}` | **PASS** |
| 2b | **NON-voice authed route + malformed UUID** (2nd non-voice route) | `GET /channels/not-a-uuid/messages` | **400** | **400** | `{"statusCode":400,"message":"Bad Request"}` | **PASS** |
| 3a | **Unauth + malformed UUID** (guard-first regression) | `GET /channels/not-a-uuid/voice/participants` | **401** (guard before param) | **401** | `{"message":"unauthorised"}` | **PASS** |
| 3b | **Authed NON-member + VALID-format voice channel** (uniform-403 regression) | `GET /channels/c3300033…0004/voice/participants` | **403** uniform | **403** | `{"message":"Insufficient permissions to view this voice channel","error":"Forbidden","statusCode":403}` | **PASS** |
| 3c | **Authed MEMBER + VALID-format voice channel** (valid-UUID unchanged) | `GET /channels/c3300033…0001/voice/participants` | **503** (creds unset), NOT 400 | **503** | `{"message":"Voice service is not configured","error":"Service Unavailable","statusCode":503}` | **PASS** |
| 3d | **Authed member + VALID-format TEXT channel** (existing domain-400 preserved) | `GET /channels/93982063…/voice/participants` | **400** type-check (distinct body) | **400** | `{"message":"Participants can only be listed for voice channels","error":"Bad Request","statusCode":400}` | **PASS** |
| E1 | **Valid-format NONEXISTENT UUID** authed (mechanism catches FORMAT only, never missing rows) | `GET /channels/00000000-…-0000/voice/participants` | **403** uniform (not 400/404/500) | **403** | *byte-identical to 3b* | **PASS** |
| E2 | **injection-ish / numeric / hyphenated-nonuuid** malformed params | `channelId='123'`, `'%27OR%271%27%3D%271'`, `'abc-def-ghi'` | **400** each (not 500) | **400 ×3** | `{"statusCode":400,"message":"Bad Request"}` | **PASS** |

### The load-bearing distinction (two different 400s, both correct)

- **Malformed-UUID → 400** body = `{"statusCode":400,"message":"Bad Request"}` — the NEW `22P02` filter branch, a generic Bad Request, fired **before any DB row access** (the cast fails at query execution).
- **Valid-UUID-but-wrong-type → 400** body = `{"message":"Participants can only be listed for voice channels",…}` — the EXISTING domain type-check on a well-formed UUID, **unchanged**.

These are two distinct 400 paths with distinct bodies. The fix added the malformed-format 400 without collapsing or altering the existing domain 400. Confirms the acceptance criterion "valid-UUID behavior is UNCHANGED" at the byte level.

### Auth boundary UNAFFECTED (the regression that matters most)

- Row 3a: unauth + malformed → **401** — `AuthGuard` runs BEFORE param handling; the `22P02` branch never downgraded auth to 400/500.
- Row 3b + E1: authed non-member on valid-format existing / nonexistent channel → **byte-identical 403** — the wave-31/32 uniform-403 enumeration gate STILL holds; the new filter branch did not break or bypass `canViewChannelById`.
- Row 3c: authed member on valid voice channel → **503** (gate passed, execution reached the creds guard) — proves RBAC + type-check still run before `RoomServiceClient`, unchanged. NOT 400.

### Clean-body forensics (Action — no leak on the 400)

Full malformed-400 body: `{"statusCode":400,"message":"Bad Request"}`. Leak-grep against `stack|sql|query|22P02|QueryFailed|postgres|drizzle|invalid input syntax|uuid|node_modules|at Object` → **ZERO matches**. No stack trace, no SQLSTATE, no driver text, no SQL, no column/table names. Generic Bad Request only. Security-clean.

## Secret grep (Action 5 — always runs)

```
git diff main~1..main -- apps/api | grep -iE 'api[_-]?key|secret|token|password|bearer …'
```

→ **NO MATCHES.** The wave-33 api diff is `pg-error-utils.ts` + `auth.exception.filter.ts` + `malformed-uuid-params.spec.ts` (a filter + helper + integration tests). No hardcoded credential of any kind committed. (Consistent with C-2: schema-neutral filter extension, no new env var, `LIVEKIT_*` remain unset.)

`secret_grep_findings`: **EMPTY** → APPROVED-eligible on the always-on check.

## Findings

- **F-32-T-8-1 (from wave-32): RESOLVED — verified LIVE on prod.** The malformed-non-UUID → 500 gap is now malformed → **400** on prod, project-wide (voice participants, voice token, servers/members, channels/messages all confirmed). No new findings this wave.

## Deferred (documented boundary, non-blocking)

Populated occupancy (real LiveKit participants) remains NOT live-verifiable — `LIVEKIT_*` unset in Railway (credential-independent boundary). Not this wave's concern; the malformed→400 + RBAC + type + creds-guard surface is fully proven live. N-1 park-or-key fork stands (mandatory per C-2 forward flag).

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [input_validation_authz_regression, secret_grep]
auth_smoke: null            # N/A — no auth flow modified
csrf_results: null          # N/A — no state-changing endpoint added (POST voice/token pre-existing; only error-contract changed)
session_results: null       # N/A — no session-lifecycle code touched
rate_limit_results: null    # N/A — no new endpoint / no rate-limit policy change (proven active wave-32)
malformed_uuid_matrix:
  - {row: 1a, scenario: authed_member_malformed_voice_participants, route: "GET /channels/not-a-uuid/voice/participants", expected: 400, observed: 400, verdict: PASS, load_bearing: true, body: '{"statusCode":400,"message":"Bad Request"}'}
  - {row: 1b, scenario: authed_malformed_voice_token_POST,          route: "POST /channels/junk/voice/token",             expected: 400, observed: 400, verdict: PASS, body: '{"statusCode":400,"message":"Bad Request"}'}
  - {row: 2a, scenario: authed_malformed_NONVOICE_servers_members,  route: "GET /servers/not-a-uuid/members",              expected: 400, observed: 400, verdict: PASS, project_wide_proof: true}
  - {row: 2b, scenario: authed_malformed_NONVOICE_channel_messages, route: "GET /channels/not-a-uuid/messages",           expected: 400, observed: 400, verdict: PASS, project_wide_proof: true}
  - {row: 3a, scenario: unauth_malformed_guard_first,               route: "GET /channels/not-a-uuid/voice/participants", expected: 401, observed: 401, verdict: PASS, auth_regression: true}
  - {row: 3b, scenario: authed_nonmember_valid_voice_403_uniform,   route: "GET /channels/<valid-nonmember>/voice/participants", expected: 403, observed: 403, verdict: PASS, auth_regression: true}
  - {row: 3c, scenario: authed_member_valid_voice_503_not_400,      route: "GET /channels/<valid-member>/voice/participants",    expected: 503, observed: 503, verdict: PASS, valid_uuid_unchanged: true}
  - {row: 3d, scenario: authed_member_valid_TEXT_domain400,         route: "GET /channels/<text>/voice/participants",     expected: 400, observed: 400, verdict: PASS, distinct_body: "Participants can only be listed for voice channels", valid_uuid_unchanged: true}
  - {row: E1, scenario: authed_nonmember_valid_NONEXISTENT_uuid_403, route: "GET /channels/00000000-…/voice/participants", expected: 403, observed: 403, verdict: PASS, note: "format-only mechanism; never catches missing rows"}
  - {row: E2, scenario: injection_numeric_hyphenated_malformed,     route: "channelId in {123, %27OR..., abc-def-ghi}",   expected: 400, observed: "400x3", verdict: PASS}
clean_body_400: {malformed_body: '{"statusCode":400,"message":"Bad Request"}', leak_grep: "zero matches (no stack/SQL/SQLSTATE/driver/table/column text)"}
distinct_400_paths_confirmed: true   # malformed->generic Bad Request vs valid-UUID-wrong-type->existing domain message (byte-distinct)
auth_boundary_unaffected: true       # 401 guard-first + uniform-403 enumeration gate + 503 creds-guard all preserved
secret_grep_findings: []             # git diff main~1..main -- apps/api: NO MATCHES
fix_up_cycles: 0
db_fixtures_cleaned: true            # voice channel c3300033…0001 + non-member server 53300033…0002 (CASCADE) deleted; prod restored (proof server = only 'general' text channel, verified)
findings:
  - {id: F-32-T-8-1, status: RESOLVED-VERIFIED-LIVE, severity: was-low-medium, category: input-validation, description: "malformed non-UUID on authed path now returns 400 (generic Bad Request, no leak) instead of 500, confirmed LIVE on prod deployment d69feba2 across voice + non-voice routes", remediation: "shipped: 22P02->BadRequestException in auth.exception.filter.ts (global, project-wide)"}
```

## head-tester sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-8
  reviewers: {}
  failed_checks: []
  rationale: >
    Every applicable probe (input-validation/authz regression + always-on secret-grep) complete
    and PASS against the deployed prod revision d69feba2. The load-bearing fix is proven LIVE:
    authed member + malformed non-UUID on GET /channels/:id/voice/participants and POST
    /channels/:id/voice/token both return 400 (was 500). Project-wide convention proven on TWO
    non-voice authed routes (GET /servers/:id/members, GET /channels/:id/messages) — it is the
    root-cause global filter, not a 2-route patch. The auth boundary is untouched: unauth +
    malformed stays 401 (guard-first), authed non-member on a valid-format channel (existing OR
    nonexistent) returns a byte-identical uniform 403 (the wave-31/32 enumeration gate survived
    the new 22P02 branch), and an authed member on a valid voice channel still reaches 503
    (creds-guard), NOT 400. The two 400 paths are byte-distinct: malformed-format -> generic
    "Bad Request" (new filter, before DB row access) vs valid-UUID-wrong-type -> the existing
    domain message (unchanged) — so valid-UUID behavior is preserved exactly. The 400 body is
    clean: a leak-grep for stack/SQL/SQLSTATE/driver/table text returned zero matches. Secret-grep
    on the api diff (main~1..main) is empty of real secrets. Prod DB fixtures were created via the
    public proxy and FULLY torn down (verified: proof server restored to its single 'general'
    channel). Iron Law honored — findings classified, none fixed here; F-32-T-8-1 is confirmed
    RESOLVED live with no new findings.
  next_action: PROCEED_TO_T9_GATE
```
