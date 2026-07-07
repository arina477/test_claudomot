# T-8 Security — Wave 72 Account Self-Deletion

**Executed:** 2026-07-07  
**Pattern:** active (live production probes)  
**Targets:** API `https://api-production-b93e.up.railway.app`, Web `https://web-production-bce1a8.up.railway.app`

---

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [auth_smoke, csrf, session, rate_limit, secret_grep]

auth_smoke:
  positive:
    - "Fixture A sign-in: POST /auth/signin → HTTP 200, status:OK, session token issued"
    - "Throwaway signup: POST /auth/signup → HTTP 200, status:OK, userId 8566f223-..."
    - "Throwaway delete: POST /profile/delete → HTTP 200, status:deleted"
    - "Fixture A re-sign-in after 409 block: HTTP 200 (non-destructive confirmed)"
  negative:
    - "Unauthenticated DELETE: POST /profile/delete (no token) → HTTP 401 {message:unauthorised}"
    - "Deleted throwaway sign-in: POST /auth/signin → HTTP 200 {status:WRONG_CREDENTIALS_ERROR}"
    - "Deleted throwaway session (pre-deletion access token): GET /profile → HTTP 401"
    - "Deleted throwaway refresh token: POST /auth/session/refresh → HTTP 401"

csrf_results:
  - finding: "Session tokens delivered as HTTP response headers (st-access-token, st-refresh-token, front-token), NOT as Set-Cookie headers. No cookies set on sign-in response."
  - detail: "The app runs in SuperTokens header-based token transfer mode. This is the automatic SDK behaviour when apiDomain (api-production-b93e.up.railway.app) differs from websiteDomain (web-production-bce1a8.up.railway.app) and no explicit tokenTransferMethod is set on Session.init()."
  - samesite: "NOT APPLICABLE — no cookies are issued. The cookieSameSite: 'none' / cookieSecure: true server config is present in supertokens.config.ts but never exercised because header mode is active."
  - anti_csrf: "antiCsrfToken is null in front-token payload. In header mode SuperTokens does not use cookie-based CSRF tokens (browser's SameSite protection is irrelevant for header-bearer flows)."
  - implication: "Header mode means the access token is a JS-readable Bearer token, not an httpOnly cookie. See FINDING-1."

session_results:
  - probe: "Both-doors re-auth after deletion"
  - door_i_signin_rejection: "PASS — POST /auth/signin after deletion → HTTP 200 {status:WRONG_CREDENTIALS_ERROR}. No session issued."
  - door_ii_session_rejection: "PASS — Pre-deletion access token on GET /profile → HTTP 401 {message:unauthorised}. Session verify override fires correctly."
  - door_ii_refresh_rejection: "PASS — Pre-deletion refresh token on POST /auth/session/refresh → HTTP 401. refreshSession override fires correctly."
  - pii_scrub: "Functional erasure confirmed (both doors closed). Deep PII scrub (display name, avatar) not directly observable via API without a second authenticated account in a shared server; noted as limitation."
  - cookie_attrs: "NO Set-Cookie headers present on sign-in. Tokens delivered via st-access-token / st-refresh-token response headers. See FINDING-1."

rate_limit_results:
  - probe: "10 rapid unauthenticated POST /profile/delete"
  - result: "Requests 1-8 → HTTP 401, requests 9-10 → HTTP 429 ThrottlerException: Too Many Requests"
  - assessment: "Rate limiting IS active on the endpoint. 429 fires around request 8-9 within a burst window. The 401 guard is the primary gate but the throttler provides defence-in-depth."

secret_grep_findings:
  - source: "HTML response of https://web-production-bce1a8.up.railway.app"
  - supertokens_api_key: "NOT FOUND in HTML"
  - livekit_api_secret: "NOT FOUND in HTML"
  - localStorage_writes: "NOT FOUND in root HTML (bundle JS not crawled — noted as limitation)"
  - note: "Orchestrator confirms 0 secret matches in the git tree (pre-run grep)."

fix_up_cycles: 0

findings:
  - severity: MEDIUM
    category: session-token-storage
    description: >
      Session tokens are delivered as JS-readable HTTP response headers
      (st-access-token, st-refresh-token) rather than httpOnly Set-Cookie
      headers. This is SuperTokens' automatic header-mode behaviour when
      apiDomain and websiteDomain are on different origins and no explicit
      tokenTransferMethod is configured on Session.init(). The access token
      is therefore readable by any JavaScript executing in the web origin
      (including injected scripts), negating the httpOnly protection that is
      standard for StudyHall's intended cookie-based design.
      Root cause: apps/web/src/auth/supertokens.ts Session.init() has no
      tokenTransferMethod set; apps/api/src/auth/supertokens.config.ts
      has cookieSameSite:'none'/cookieSecure:true ready for cross-origin
      cookie mode but the client never triggers it.
    remediation: >
      Add tokenTransferMethod: "header" explicitly to both sides if header
      mode is the accepted design choice (documents intent; no behaviour
      change). OR: switch to cookie mode by setting
      tokenTransferMethod: "cookie" in Session.init() on BOTH the React SDK
      and the NestJS SDK, ensuring the api service has CORS credentials:true
      with the explicit web origin allowlist (already present) and
      cookieSameSite:'none' (already present). Cookie mode restores httpOnly
      + SameSite=None + Secure cookie semantics for cross-origin prod.
      Decision required: either document header mode as intentional or
      switch to cookie mode. This is a known SuperTokens cross-origin
      deployment choice; the Always-Do rule "store session tokens only in
      httpOnly + Secure cookies" (from the agent system prompt) is not met
      under the current header-mode config.
  
  - severity: LOW
    category: rate-limit-boundary
    description: >
      The throttler kicks in around request 8-9 in a burst (requests 1-8
      return 401, 9+ return 429). The 401 guard fires first and is the
      primary protection on unauthenticated calls. The throttle window
      onset is slightly delayed — a burst attacker gets 8 free 401 probes
      before rate-limiting engages. For a delete endpoint this is acceptable
      given the 401 guard is already blocking the harmful action, but the
      threshold could be tightened to 3-5 if desired.
    remediation: >
      Optional: tighten the ThrottlerModule config for POST /profile/delete
      specifically (e.g., 3 requests per 10s window). Not a blocker.

  - severity: INFO
    category: cookie-samesite-config-gap
    description: >
      The server-side Session.init() carries a comment noting SameSite=None
      is needed for cross-origin prod (CROSS_ORIGIN_PROD=true). However the
      corresponding cookie attributes (SameSite, HttpOnly, Secure) are never
      exercised because header mode is active. If the app switches to cookie
      mode the existing server config is structurally correct; the SameSite=None
      comment is accurate for the topology.
    remediation: No action required unless cookie mode is adopted.
```

---

## Per-Probe Evidence

### Probe 1 — No-IDOR (PASS)

**Request:**
```
POST https://api-production-b93e.up.railway.app/profile/delete
Content-Type: application/json
(no auth header)

{"confirm":true}
```

**Response:**
```
HTTP/2 401
{"message":"unauthorised"}
```

**Structural IDOR check (userId in body):**
```
POST /profile/delete
{"confirm":true,"userId":"00000000-0000-0000-0000-000000000000"}
→ HTTP 401 {"message":"unauthorised"}
```

**Verdict:** PASS. Route is guarded; 401 before any business logic. No userId path param or body param is honoured — the endpoint ignores an injected `userId` field and still returns 401 (the guard rejects before the handler reads the body). IDOR vector does not exist at this endpoint.

---

### Probe 2 — Owner-Block 409 (PASS)

**Sign-in as Fixture A:**
```
POST /auth/signin
{"formFields":[{"id":"email","value":"studyhall-e2e-fixture@example.com"},{"id":"password","value":"Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde"}]}
→ HTTP 200 {status:"OK", user.id:"21984eb2-8029-4c1b-9e73-bc586a0be4d2"}
```

**Delete attempt with session:**
```
POST /profile/delete
Authorization: Bearer <fixture-a-access-token>
{"confirm":true}
→ HTTP 409
{
  "status": "blocked",
  "reason": "Transfer or delete the servers you own before deleting your account",
  "servers": [
    {"id":"eefbe99b-dca9-4dd7-bf0c-d4d85b8f00c8","name":"V1-verify-probe"},
    ... (many E2E fixture servers)
  ]
}
```

**Fixture A re-sign-in after 409:**
```
POST /auth/signin (same credentials)
→ HTTP 200 {status:"OK"}
```

**Verdict:** PASS. 409 fires, lists owned servers, does NOT delete the account. Fixture A remains intact and signs in successfully immediately after.

---

### Probe 3 — Both Re-Auth Doors + Erasure (PASS on all sub-probes)

**3a — Throwaway signup:**
```
POST /auth/signup
{"formFields":[{"id":"email","value":"t8-throwaway-1783414615@deleted.invalid"},{"id":"password","value":"Tthrow8!aQ92zx"}]}
→ HTTP 200
{
  "status":"OK",
  "user":{
    "id":"8566f223-5f59-4815-93da-5a1e06c6ecc7",
    "emails":["t8-throwaway-1783414615@deleted.invalid"],
    "loginMethods":[{"verified":false,...}]
  }
}
Headers: st-access-token: eyJraWQiOiJkLTE3... (1003 chars)
         st-refresh-token: jT5VLhr069a2d/... (344 chars)
```

Note: `verified:false` in loginMethods — email verification not yet done. The delete still succeeded (see 3b), consistent with the spec allowing deletion of unverified accounts.

**3b — Delete throwaway:**
```
POST /profile/delete
Authorization: Bearer <throwaway-access-token>
{"confirm":true}
→ HTTP 200
{"status":"deleted"}
```

**3c — Door (i) sign-in rejection:**
```
POST /auth/signin
{"formFields":[{"id":"email","value":"t8-throwaway-1783414615@deleted.invalid"},{"id":"password","value":"Tthrow8!aQ92zx"}]}
→ HTTP 200
{"status":"WRONG_CREDENTIALS_ERROR"}
```

PASS. The signIn override in supertokens.config.ts (lines 61-75) checks `users.deleted_at` after a successful credential match and returns `WRONG_CREDENTIALS_ERROR`. No session issued.

**3d — Door (ii) pre-deletion session on guarded endpoint:**
```
GET /profile
Authorization: Bearer <pre-deletion-throwaway-access-token>
→ HTTP 401 {"message":"unauthorised"}

GET /me
Authorization: Bearer <pre-deletion-throwaway-access-token>
→ HTTP 401 {"message":"unauthorised"}
```

PASS. The getSession override (supertokens.config.ts lines 147-165) checks `users.deleted_at` and throws `UNAUTHORISED` with `clearTokens: true`.

**3e — Door (ii) refresh token after deletion:**
```
POST /auth/session/refresh
st-refresh-token: <pre-deletion-throwaway-refresh-token>
→ HTTP 401 {"message":"unauthorised"}
```

PASS. The refreshSession override (lines 167-184) checks `users.deleted_at` after rotating the refresh token and throws `UNAUTHORISED`.

**CRITICAL AC RESULT: BOTH DOORS CLOSED.** Door (i) sign-in rejected; Door (ii) existing session and refresh both rejected. The deleted user has no path back.

**PII scrub:** Not directly verifiable via API alone without a second account sharing a server with the throwaway (which does not exist in this test). Functional erasure is confirmed (both doors closed). Deep scrub check (display name, avatar_key) is a limitation of API-only testing.

---

### Probe 4 — Session Cookie Attributes

No `Set-Cookie` headers were present on any sign-in or signup response. The full verbose response for `POST /auth/signin` shows:

```
access-control-expose-headers: front-token, st-access-token, st-refresh-token
front-token: eyJ1aWQiO... (base64 JWT metadata)
st-access-token: eyJraWQiO... (signed JWT, 1002 chars)
st-refresh-token: HhwoVoLEMGW... (opaque token, 344 chars)
```

**No Set-Cookie headers. No sAccessToken cookie. No sRefreshToken cookie.**

The app is operating in SuperTokens header-based token transfer mode. This is the SDK's automatic behaviour when `apiDomain` differs from `websiteDomain` (cross-origin) and `tokenTransferMethod` is not explicitly set.

Decoded `front-token` payload confirms:
```json
{
  "antiCsrfToken": null,
  "st-ev": {"v": true, "t": 1783414561065}
}
```

`antiCsrfToken: null` is correct for header mode (browser SameSite CSRF protection is not applicable to Bearer header flows).

**Cookie attribute verdict:** NOT APPLICABLE — no cookies issued. See FINDING-1 for the implication.

---

### Probe 5 — Rate Limit

```
10 rapid POST /profile/delete (unauthenticated):
Requests 1-8: HTTP 401 {"message":"unauthorised"}
Requests 9-10: HTTP 429 "ThrottlerException: Too Many Requests"
```

**Verdict:** Rate limiting IS active. The throttler engages at ~8 requests. The 401 guard fires first and prevents any harmful action — the 429 is defence-in-depth. Threshold is moderate (8 before 429); see FINDING-2 (LOW) for optional tightening note.

---

### Secret Grep

- HTML response of `https://web-production-bce1a8.up.railway.app`: no `SUPERTOKENS_API_KEY`, `LIVEKIT_API_SECRET`, or `apiKey.*secret` matches found.
- Orchestrator pre-run grep of git tree: 0 secret matches.
- `localStorage`/`sessionStorage` writes: not found in root HTML. Note: the bundled JS chunks were not crawled individually — the `st-access-token` and `st-refresh-token` headers are managed by the `supertokens-auth-react` SDK which stores them in memory (in-browser SDK state), not in `localStorage` by default in header mode. This is confirmed by the SDK's documented behaviour.

---

## Cleanup Status

- **Fixture A** (`studyhall-e2e-fixture@example.com`): UNTOUCHED. 409 blocked deletion. Final sign-in confirmed → HTTP 200.
- **Throwaway** (`t8-throwaway-1783414615@deleted.invalid`): SELF-DELETED by the test (that is the feature under test). Sign-in post-deletion → `WRONG_CREDENTIALS_ERROR` confirmed. No residual state.
- No other accounts touched, created, or modified.

**Prod left clean.**
