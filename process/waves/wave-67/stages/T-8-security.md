# Wave 67 — T-8 Security (live, LOAD-BEARING per head-product P-4)

**Layer:** T-8 security — Pattern B (active, live prod probe)
**Key assertion (NAMED by head-product P-4):** a PRIVATE server must NOT be joinable via `POST /servers/:id/join-public` — the is_public gate is not a backdoor into private servers.
**Auth:** fixture A authenticated session (`studyhallfixturea`, `21984eb2-...`).

## Security matrix (actual observed status codes)

| # | Case | Request | Result | Verdict |
|---|------|---------|--------|---------|
| 1 | Private server A IS a member of | authed POST `/servers/eefbe99b-.../join-public` (V1-verify-probe, is_public=false) | **403** `{"message":"Server is not open for public joining","error":"Forbidden"}` | REJECTED — gate not bypassed even for a member |
| 2 | Private "Fixture Proof Server" | authed POST `/servers/ad62cd12-b78e-4a85-a214-042cf176b16c/join-public` (is_public=false) | **403** `{"message":"Server is not open for public joining"}` | REJECTED — the load-bearing assertion, PROVEN |
| 3 | Unauthenticated join-public on private server | `POST /servers/ad62cd12-.../join-public` credentials omitted (curl, no cookie) | **401** `{"message":"unauthorised"}` | REJECTED — no anonymous backdoor |
| 4 | Rate-limiting active | rapid repeated auth requests | **429** `"Rate limit exceeded — maximum 10 auth requests per minute"` | positive signal — auth-surface throttle live |
| 5 | GET /servers/discover authed | authed GET | **200** `{"servers":[]}` (empty; later `[{...1 public...}]` during T-5) | only public servers surfaced (566 exist, 0-or-1 public returned per state) |
| 6 | GET /servers/discover unauthenticated | GET credentials omitted (curl) | **401** `{"message":"unauthorised"}` | AuthGuard enforced — endpoint not anon-readable |

## Notes
- The `GET /servers/discover` 200 (not 500) independently reconfirms migration 0024 is live in prod.
- Cases 3 + 6 were initially masked by 429 (the running SPA saturates the IP-keyed auth throttle); re-run cleanly via curl after the SPA polling was stopped + the rate window reset → true 401 observed.
- During T-5 with one public server live, `GET /servers/discover` returned EXACTLY that one server while 566 total servers exist → is_public filter proven (no private-server leakage into the directory).
- The private-reject is ALSO CI-verified at T-2 (servers.service.spec: private join throws Forbidden, insert never reached) — the live 403×2 confirms the deployed behavior matches the unit assertion.

## Verdict
T-8 PASS (live). The load-bearing is_public join-gate rejects private servers LIVE (403 for both a member-private and the proof-private server), with no anonymous backdoor (401 unauth) and active rate-limiting. Directory read is auth-gated (401 anon) and public-only.

```yaml
stage: T-8
layer: security
pattern: active-live
verdict: PASS
private_join_rejected_live: true       # 403 x2 (member-private + proof-private)
unauth_join_rejected_live: true        # 401
unauth_discover_rejected: true         # 401 AuthGuard
public_only_filter_proven: true
rate_limit_active: true                # 429 observed
migration_live: true                   # discover 200 not 500
findings: []
head_signoff: APPROVED
```
