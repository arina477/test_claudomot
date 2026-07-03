# T-8 Security — wave-38 avatar storage go-live

**Target (our own prod):** `https://api-production-b93e.up.railway.app`
**Scope:** wave-38 avatar surface — public `GET /users/:userId/avatar`; session-guarded `POST /profile/avatar/presign` + `POST /profile/avatar/confirm`.
**Method:** read-only / non-destructive. Authed fixture `studyhall-e2e-fixture@example.com` (SuperTokens **header-based** auth — tokens returned in `st-access-token` response header, sent back as `Authorization: Bearer <token>`; no ambient session cookies).
**Fixture user id:** `21984eb2-8029-4c1b-9e73-bc586a0be4d2` (email-verified; already owns an avatar object).

---

## Probe 1 — Auth boundary (presign/confirm without session) — PASS
Both state-changing endpoints reject anonymous callers before touching storage.

| Request | Result |
|---|---|
| `POST /profile/avatar/presign` no auth | **401** `{"message":"unauthorised"}` |
| `POST /profile/avatar/confirm` no auth | **401** `{"message":"unauthorised"}` |

Session guard intact; storage is NOT reachable unauthenticated (no 200, no 503 leak).

## Probe 2 — IDOR on confirm (cross-user key) — PASS
Ownership check `key.startsWith('avatars/${userId}/')` enforced with the trailing slash present.

| Submitted `key` | Result |
|---|---|
| `avatars/00000000-...-000000000000/evil.png` (other user) | **400** "key must be a valid avatar key scoped to the requesting user" |
| `avatars/../avatars/<myid>/x.png` (traversal) | **400** rejected |
| `avatars/<myid>-attacker/x.png` (prefix-injection / missing-slash bypass) | **400** rejected — confirms trailing `/` in the guard |
| `avatars/<myid>/<presigned-uuid>.png` (own key, object never uploaded) | **500** — see FIND-2 |

A user cannot point their avatar at another user's object. Prefix-injection bypass of the `startsWith` guard does not work.

## Probe 3 — Rate limit on public endpoint — PASS
`@Throttle({ default: { limit: 120, ttl: 60000 } })` engages on the unauthenticated, DB-hitting endpoint.
Burst: 140 parallel `GET /users/000...000/avatar` from one IP within the window.

- 101 x `404`, **39 x `429`**
- 429 carries `retry-after: 60`
- (the 120 budget is shared with the handful of same-IP requests from probes 4/5 in the same window, so the first-429 boundary lands slightly under 120 sent-in-this-burst — expected)

Throttle protects against enumeration / DoS. Not a HIGH finding.

## Probe 4 — Enumeration / info-leak — PASS (info-leak) / one robustness deviation (FIND-1)
Endpoint returns only 404 / 302 / 400; never leaks emails, names, or existence beyond avatar presence.

| Input | Result |
|---|---|
| random UUIDs (no avatar) | **404** `{"message":"User has no avatar"}` — identical for existent-no-avatar and nonexistent (no existence oracle) |
| fixture id (has avatar) | **302** → presigned GET URL |
| `not-a-uuid`, long string, `%2e%2e` | **404** (treated as no-avatar) |
| SQLi `' OR 1=1--` (encoded) | **404** — parameterized, no injection |
| `%ff`, `%c0%af` (bad UTF-8) | **400** framework decode-fail |
| **`%00` / `a%00b` (decoded NUL byte)** | **500** Internal server error — **FIND-1** |

Only defect: a NUL byte in `:userId` produces an unhandled exception (500) instead of 400. Generic body, no data leak.

## Probe 5 — Presigned URL scoping — PASS
302 `Location` for the fixture avatar is a short-lived, GET-only, single-object grant.

- `X-Amz-Expires=300` (5 min), `X-Amz-Date` present, `X-Amz-Signature` present, `x-id=GetObject`
- Direct GET → `200 image/png` (136 bytes) — renders anonymously as designed
- **PUT** same URL → **403 SignatureDoesNotMatch** (method-bound to GET; cannot overwrite)
- **DELETE** same URL → **403**
- Signature tamper (1 char) → **403**
- Credential is a scoped storage token (`tid_...`), not a root/static key

No write/delete capability, no broad-bucket access, time-limited. Presign PUT URL from probe-1-auth path is likewise `X-Amz-Expires=300` and scoped to `avatars/<callerId>/`.

---

## Findings

**FIND-1 — LOW — Unhandled exception (500) on NUL-byte userId at unauthenticated `GET /users/:userId/avatar`.**
`GET /users/%00/avatar` (and any embedded `%00`) returns `500 Internal server error`. Root cause: `:userId` is passed to the data layer without UUID validation; a decoded NUL byte throws an uncaught driver/DB error. Impact: violates the "never 500 on malformed input" AC; an anonymous caller can reliably generate 500s (log noise / minor error-path DoS surface). No data leak (generic message).
Remediation: validate `:userId` with a UUID pipe (`ParseUUIDPipe`) before any DB/storage call; return **400** for malformed ids. Cheap, closes the whole malformed-id class.

**FIND-2 — LOW — `POST /profile/avatar/confirm` returns 500 when the referenced own-scoped object was never uploaded.**
Authed, own-scoped key whose object does not exist in the bucket → `500 Internal server error` (uncaught storage HEAD/stat failure). Not exploitable cross-user (Probe 2 gates the key), but a normal client that confirms after a failed/aborted upload gets a 500 instead of an actionable error.
Remediation: catch the missing-object case in confirm and return **404/400** ("object not found — upload before confirm").

No Critical / High / Medium findings. The three headline controls — anonymous presign/confirm rejection, cross-user confirm rejection, and public-endpoint throttling — all hold.

---

```yaml
t8_security:
  target: https://api-production-b93e.up.railway.app
  wave: 38
  auth_model: supertokens-header-based-bearer  # no ambient session cookies
  applicable_probes:
    - auth_boundary_presign_confirm
    - idor_confirm_cross_user
    - rate_limit_public_avatar
    - enumeration_info_leak
    - presigned_url_scoping
  auth_results:
    presign_no_session: 401        # PASS (expected 401)
    confirm_no_session: 401        # PASS (expected 401)
    presign_with_bearer: 200       # control, key scoped to caller
    idor_confirm_cross_user: 400   # PASS — rejected
    idor_confirm_prefix_injection: 400  # PASS — trailing-slash guard holds
  csrf_results:
    applicable: false
    rationale: >
      presign/confirm are Bearer/header-authenticated (Authorization header, no
      ambient cookie) — not CSRF-reachable in this auth mode. SuperTokens ships
      anti-CSRF for cookie mode if ever enabled.
  rate_limit_results:
    endpoint: GET /users/:userId/avatar
    configured: { limit: 120, ttl_ms: 60000, scope: per-ip }
    burst_sent: 140
    http_200_302: 0
    http_404: 101
    http_429: 39
    retry_after_header: 60
    engages: true                  # PASS
  presigned_url_scoping:
    expires_seconds: 300
    operation: GetObject
    get: 200
    put: 403
    delete: 403
    tampered_signature: 403
    scoped_single_object: true     # PASS
  enumeration_info_leak:
    leaks_user_data: false         # PASS — no email/name/existence oracle
    codes_observed: [302, 400, 404, 500]
    malformed_500_case: "userId containing decoded NUL byte (%00)"  # FIND-1
  secret_grep_findings: []         # already run clean by orchestrator
  findings:
    - id: FIND-1
      severity: low
      title: 500 on NUL-byte userId at public GET /users/:userId/avatar
      remediation: >
        Validate :userId with ParseUUIDPipe before DB/storage access; return 400
        for malformed ids.
    - id: FIND-2
      severity: low
      title: 500 on confirm when own-scoped object was never uploaded
      remediation: >
        Catch missing-object in confirm; return 404/400 with actionable message.
  headline_verdict:
    presign_confirm_401_without_auth: true
    cross_user_confirm_rejected: true
    rate_limit_engages: true
  overall: PASS-with-2-LOW
```
