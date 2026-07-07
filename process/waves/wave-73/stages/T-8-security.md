# T-8 Security — wave-73 privacy-events audit log

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [auth_smoke, session, no_idor, pii_discipline, hook_non_blocking, secret_grep]
secret_grep_findings: []
findings: []
```

Executed: 2026-07-07. Live targets: `https://api-production-b93e.up.railway.app` + `https://web-production-bce1a8.up.railway.app`. All probes completed. Prod left clean.

---

## Probe 1 — Endpoint mounts + auth boundary

**PASS**

Request: `GET /profile/privacy-events` (no auth header)
Response: `401 {"message":"unauthorised"}`

No `userId` path param or query param exists on this route — confirmed by:
- `GET /profile/privacy-events/:id` → `404 Cannot GET /profile/privacy-events/<uuid>` (no path param route)
- `GET /profile/privacy-events?userId=<uuid>` (with B's token) → `200 {"events":[]}` (query param silently ignored — B gets B's own empty list, not A's events)

The route accepts no caller-supplied identity parameter. Session `callerId` is the sole source of identity.

---

## Probe 2 — No-IDOR (critical AC)

**PASS**

### Step 1: Fixture A initial read
`GET /profile/privacy-events` with A's token → `200 {"events":[]}`

### Step 2: Real privacy action to generate an event
`PUT /profile/privacy` with A's token, body `{"profileVisibility":"server-members","whoCanDm":"everyone"}` → `200 {"profileVisibility":"server-members","whoCanDm":"everyone"}`

### Step 3: A sees its own event
Re-`GET /profile/privacy-events` with A's token → `200`:
```json
{
  "events": [{
    "id": "2ce7c7d7-9254-4444-a9c7-789d09a24cd6",
    "actorId": "21984eb2-8029-4c1b-9e73-bc586a0be4d2",
    "eventType": "privacy_settings_changed",
    "targetType": "self",
    "targetId": "21984eb2-8029-4c1b-9e73-bc586a0be4d2",
    "context": {
      "whoCanDmTo": "everyone",
      "visibilityTo": "server-members",
      "whoCanDmFrom": "everyone",
      "visibilityFrom": "everyone"
    },
    "createdAt": "2026-07-07T10:52:25.605Z"
  }]
}
```
Event present with `eventType: privacy_settings_changed`. Correct.

### Step 4: Fixture B cannot see A's event (no-IDOR proof)
Sign in as Fixture B (userId `da74148e-132e-4faf-a526-a34c28e7481b`). `GET /profile/privacy-events` with B's token → `200 {"events":[]}`.

A's event ID (`2ce7c7d7-...`) is NOT present in B's result. A's userId (`21984eb2-...`) is NOT present in B's result. B sees only its own (empty) list.

**No-IDOR holds.** Each user sees only their own audit log. There is no mechanism to read another user's events: the route has no userId parameter, the query param is silently dropped (server resolves identity from the verified session), and a path param returns 404 (no such route exists).

---

## Probe 3 — Hook fires live + PII discipline

**PASS**

The `privacy_settings_changed` event generated in Probe 2 was inspected for PII. Fields:
- `actorId`: opaque UUID (not PII)
- `eventType`: enum string
- `targetType`: `"self"` literal
- `targetId`: opaque UUID (same as actorId for self-action — not PII)
- `context`: `{whoCanDmTo, visibilityTo, whoCanDmFrom, visibilityFrom}` — all enum values (`"everyone"`, `"server-members"`, `"nobody"`)
- `createdAt`: timestamp

No email address, display name, username, message body, or token appears in any field or nested context. PII discipline confirmed.

**Block/unblock probe (optional):** The `POST /profile/block/:userId`, `PUT /profile/block/:userId`, `PATCH /profile/block/:userId`, and `POST /profile/blocks` endpoints all return `404`. The block/unblock feature endpoints are not deployed in prod. This probe is marked **NOT APPLICABLE** (feature not yet shipped); no `user_blocked`/`user_unblocked` events can be generated. No cleanup required.

---

## Probe 4 — Hook non-blocking (best-effort)

**PASS**

`PUT /profile/privacy` with A's token: HTTP `200`, response time 152 ms (within normal p95 for prod Railway). The audit hook fires without adding user-visible latency or causing the action to fail. The response body returns the updated privacy settings correctly.

Two additional `PUT /profile/privacy` calls were made during probing (toggling to `nobody` then reverting to `everyone`) — all returned `200` within ~150–200 ms. No hook-induced failures observed across any of the three mutating calls.

---

## Secret grep

**0 findings.**

- `SUPERTOKENS_API_KEY` hardcoded in source: 0 matches
- `LIVEKIT_API_SECRET` hardcoded in committed source: found in `apps/api/src/voice/voice-participants.service.spec.ts` only — this is a **test fixture** that sets `process.env.LIVEKIT_API_SECRET = 'devsecretdevsecretdevsecretdevse'` (a synthetic 32-char dev string, not a real credential). Test-only, not shipped in the API bundle. Not a finding.
- `connectionURI` hardcoded: 0 matches outside `ConfigService`/env-var paths
- `localStorage`/`sessionStorage` auth token writes: `sessionStorage.setItem('sh:select-server', serverId)` in `ServerDiscoverPage.tsx` — stores a server UUID for post-join auto-navigation, not an auth token. Not a finding.

No secrets committed; no token in JS-readable storage.

---

## Cleanup confirmation

- Fixture A `profileVisibility` reverted from `nobody` → `everyone` (final verified GET: `{"profileVisibility":"everyone","whoCanDm":"everyone"}`).
- No block actions were performed (block endpoints returned 404 — feature not deployed).
- Audit rows for A's three test mutations remain in the DB (append-only log — expected artifact, not a cleanup concern).
- Fixture B state unchanged.

**Prod left clean.**

---

## Summary

| Probe | Result | Evidence |
|---|---|---|
| 1. Auth boundary (401 unauth) | PASS | `401 {"message":"unauthorised"}` with no auth |
| 2. No-IDOR (own-scoped audit log) | PASS | B's token returns `[]`; A's event ID/userId absent from B's response |
| 2. No-IDOR (no userId param exists) | PASS | Query param silently dropped; path param route is 404 |
| 3. Hook fires live | PASS | `privacy_settings_changed` event present in A's list after PUT |
| 3. PII discipline | PASS | Context contains only enum values; no email/name/token |
| 3. Block/unblock events | N/A | Block endpoints not deployed in prod |
| 4. Hook non-blocking | PASS | PUT returns 200 in ~152 ms; no latency or failure from hook |
| Secret grep | PASS | 0 real credential matches; test fixture value is synthetic dev string |

**No security findings. No-IDOR holds.**
