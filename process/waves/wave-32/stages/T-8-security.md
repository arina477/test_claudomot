# T-8 — Security (LIVE authz matrix)

**Wave:** 32 (M6 voice occupancy — `GET /channels/:channelId/voice/participants`)
**Pattern:** active-execution (auto-promoted — RBAC membership boundary touched)
**Target:** DEPLOYED PROD — api `https://api-production-b93e.up.railway.app` (merge 45b08c3 live)
**Fixtures:** `studyhall-e2e-fixture` (A, uid `21984eb2…`) + `studyhall-e2e-fixture-b` (B, uid `da74148e…`). No real users touched.

## Auto-promotion

Wave is `backend + ui`, not natively `auth`. The endpoint reuses the wave-31 uniform-403 membership gate
(`canViewChannelById`) — an RBAC boundary path → **auto-promoted** to fire T-8. Applicable-probe subset per the
auto-promotion matrix: **auth-boundary (authz matrix)** + **rate-limit** (new endpoint) + **secret-grep** (always).
CSRF/session/auth-smoke probes are N/A — this wave adds a read-only GET, modifies no auth flow, no state-changing
endpoint, no session-lifecycle code.

## Live authz matrix — the crux

Test fixtures were created directly in the prod app DB (public proxy `yamanote.proxy.rlwy.net:40008`) to make the
full matrix provable, then **fully torn down** after probing (prod DB restored to prior state — verified):
- voice channel `c0000032…0001` in "Fixture Proof Server" (A is a member) → member-on-voice target
- server `50000032…0002` + voice channel `c0000032…0004`, member = B only (A excluded) → non-member target
- existing text channel `general` (`93982063…`) in proof server (A is a member) → member-on-text target

Fixture A signed in via `POST /auth/signin` (`st-auth-mode: header`) → `Authorization: Bearer <st-access-token>`
(authed sanity: `GET /servers/ad62cd12…/members` → 200).

| # | Scenario | Expected | Observed | Body | Verdict |
|---|----------|----------|----------|------|---------|
| 1 | **Unauthenticated** (no bearer) — nil channel | 401 | **401** | `{"message":"unauthorised"}` | PASS |
| 1b | **Unauthenticated** — real voice channel | 401 | **401** | `{"message":"unauthorised"}` | PASS |
| 2 | **Auth NON-MEMBER** on voice channel A cannot view (**LOAD-BEARING**) | 403 uniform, no leak | **403** | `{"message":"Insufficient permissions to view this voice channel","error":"Forbidden","statusCode":403}` | PASS |
| 2b | **Auth NON-MEMBER** on nonexistent nil UUID (enumeration control) | 403 identical | **403** | *byte-identical to 2* | PASS |
| 2c | **Auth NON-MEMBER** on random nonexistent valid UUID | 403 identical | **403** | *byte-identical to 2* | PASS |
| 3 | **Auth MEMBER** on VOICE channel | 503 (creds unset) / empty, not 500 | **503** | `{"message":"Voice service is not configured","error":"Service Unavailable","statusCode":503}` | PASS |
| 4 | **Auth MEMBER** on NON-VOICE (text) channel | 400 (type check, member-reachable) | **400** | `{"message":"Participants can only be listed for voice channels","error":"Bad Request","statusCode":400}` | PASS |

**Enumeration-leak proof (the wave-31 P1 fix, load-bearing):** rows 2 / 2b / 2c returned a **byte-identical 403 body**
whether the voice channel exists, is a nonexistent nil UUID, or a random nonexistent valid UUID. A non-member cannot
distinguish "channel exists but you're not a member" from "channel does not exist" → **no cross-server occupancy
enumeration leak**. Default-deny confirmed live.

**Gate-order proof:** the sequence `canViewChannelById → 403` (FIRST) → `type != voice → 400` → `creds guard → 503`
is confirmed by the matrix: a member on a text channel reaches **400** (type check), a non-member never does (stops at
**403**), and a member on a voice channel with creds unset reaches **503** (proves the gate PASSED and execution reached
the creds guard — RBAC + type-check run BEFORE `RoomServiceClient`, so no LiveKit creds are needed to prove the gate).

## Rate-limit probe (Action 4)

30 rapid authed requests on the member voice channel (503 path): request 1 → **503**, requests 2–30 → **429**
(29× `429`). Rate limit **IS active** on this read endpoint (global NestJS `ThrottlerException`, per-IP, ~short window;
observed window reset in ≤18s on a spaced poll). 429 body = `"ThrottlerException: Too Many Requests"` — **no internal
state leak** (no redis key names, no raw config). Behavior matches the project's global-throttler baseline. Not a finding.

## Secret grep (Action 5 — always runs)

`git diff 45b08c3~1..45b08c3 -- '*.ts' '*.tsx' '*.env*' | grep -iE 'api[_-]?key|secret|token|password|bearer …'`

The only literal secret-shaped values are `'devkey'` and `'devsecretdevsecretdevsecretdevse'` inside
`voice-participants.service.spec.ts` — **fake 32-char test fixtures** assigned to `process.env.LIVEKIT_API_*` inside
`it()` blocks to exercise the 503 creds-guard path. NOT real LiveKit credentials. All other matches are JSDoc comments,
identifiers (`apiSecret = process.env.LIVEKIT_API_SECRET`), or `credentials:include`. No hardcoded real secret committed.
Cross-check: Railway `api` service has **no** `LIVEKIT_*` var set (confirmed) — nothing to leak. LiveKit secret is
server-side only (`RoomServiceClient` in `apps/api`; no `livekit-server-sdk` / `VITE_` in `apps/web`).

**`secret_grep_findings`: EMPTY of real secrets** → APPROVED-eligible on this always-on check.

## Findings

- **F-32-T-8-1 (LOW→MEDIUM, robustness):** a **malformed (non-UUID) `channelId`** on the authenticated path returns
  **500** `{"statusCode":500,"message":"Internal server error"}` instead of 400 (param validation) or 403 (gate).
  Unauthenticated malformed → 401 (auth guard first, correct). The 500 body is a **generic message — no stack-trace or
  internal-state leak**, so not security-critical, but it is a genuine input-validation gap (missing `ParseUUIDPipe` or
  equivalent on the `channelId` route param). Classified for V-2 (Iron Law — NOT fixed here). Likely tag: B-2 backend /
  input-validation. Repro: `GET /channels/not-a-uuid/voice/participants` with a valid bearer.

## Deferred (documented boundary, non-blocking)

Populated occupancy (real LiveKit participants) is NOT live-verifiable — `LIVEKIT_*` unset in Railway. This is the
credential-independent boundary; the full RBAC + type + empty-room security surface IS proven live (matrix above). N-1
tripwire stands: 3rd cred-blocked M6 wave → park-or-key fork.

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [auth_boundary_authz_matrix, rate_limit, secret_grep]
auth_smoke: null            # N/A — no auth flow modified
csrf_results: null          # N/A — read-only GET, no state-changing endpoint
session_results: null       # N/A — no session-lifecycle code touched
authz_matrix:
  - {row: 1,  scenario: unauthenticated_nil,        expected: 401, observed: 401, verdict: PASS}
  - {row: 1b, scenario: unauthenticated_voice,      expected: 401, observed: 401, verdict: PASS}
  - {row: 2,  scenario: authed_nonmember_voice,     expected: 403, observed: 403, verdict: PASS, load_bearing: true}
  - {row: 2b, scenario: authed_nonmember_nil,       expected: 403, observed: 403, verdict: PASS, enumeration_control: true}
  - {row: 2c, scenario: authed_nonmember_random,    expected: 403, observed: 403, verdict: PASS, enumeration_control: true}
  - {row: 3,  scenario: authed_member_voice,        expected: 503, observed: 503, verdict: PASS}
  - {row: 4,  scenario: authed_member_text,         expected: 400, observed: 400, verdict: PASS}
enumeration_leak: none      # rows 2/2b/2c byte-identical 403 body
gate_order_proven: true     # canViewChannelById -> 403 FIRST; type -> 400; creds -> 503
rate_limit_results:
  - {probe: "30 rapid authed reqs", observed: "1x503 then 29x429", leak: none, note: "global NestJS throttler, ~<=18s window"}
secret_grep_findings: []    # empty of REAL secrets (2 matches = fake test fixtures 'devkey'/'devsecret…')
fix_up_cycles: 0
db_fixtures_cleaned: true   # all created channels/server/role/membership torn down; prod restored + verified
findings:
  - {id: F-32-T-8-1, severity: low-medium, category: input-validation, description: "malformed non-UUID channelId on authed path returns 500 (generic message, no leak) instead of 400/403; missing ParseUUIDPipe", remediation: "add UUID param validation on channelId route param", route_to: V-2}
```
