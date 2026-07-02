# T-8 — Security (wave-34, M6 → screen-share token-grant widening)

**Wave:** 34 · **Block:** T · **Stage:** T-8 · **Mode:** automatic
**Prod API:** `https://api-production-b93e.up.railway.app` (api deployment `73938bde`, merge `87db7ec`)
**Fixtures:** `studyhall-e2e-fixture` (A, member) + `studyhall-e2e-fixture-b` (B, member) — both prod, email-verified, co-members of "Fixture Proof Server" `ad62cd12`.
**Voice channel under test:** `840ce9bd-4204-4460-9503-e772a18a78fc` (`w34-voice-e2e`, type=voice) — created in the proof server via the app DB public proxy for this run (BOTH A + B are members via server membership). Teardown at stage end.

**Auto-promotion:** wave is `auth`-adjacent — the token-mint path (`voice-token.service.ts`) is behind the SuperTokens AuthGuard + RBAC gate, and this wave WIDENS the mint capability (a security-scope change flagged at P-4). T-8 fires on the applicable-probe subset (auth smoke = the token-mint authz gate; secret grep = always). CSRF/session/rate-limit not touched by this diff (no new state-changing endpoint, no session-lifecycle code, no rate-limit policy change).

---

## The security-scope change under test

Wave-31 minted `canPublishSources: [MICROPHONE]`, which SUPERSEDES `canPublish` and EXCLUDES screen_share — a client-only screen-share publish was server-rejected. Wave-34 widens the grant to `[MICROPHONE, SCREEN_SHARE, SCREEN_SHARE_AUDIO]` so members may publish a screen-share. The T-8 job: prove the widening landed in the LIVE minted token, that it did NOT widen WHO can mint (the wave-31 uniform-403 gate is unchanged), and that no secret was committed.

---

## Action 1 — Token-grant live re-probe (the capability widening) — PROVEN LIVE

Member A (`studyhall-e2e-fixture`, authed via SuperTokens header mode) minted a token: `POST /channels/840ce9bd-…/voice/token` → **HTTP 200**. Decoded the returned JWT payload (base64url of the `.` -split middle segment):

```json
{
  "video": {
    "roomJoin": true,
    "room": "840ce9bd-4204-4460-9503-e772a18a78fc",
    "canPublish": true,
    "canPublishSources": ["microphone", "screen_share", "screen_share_audio"],
    "canSubscribe": true
  },
  "iss": "APITbjNH7bvEKEQ",
  "exp": 1782999273,
  "nbf": 1782995673,
  "sub": "21984eb2-8029-4c1b-9e73-bc586a0be4d2"
}
```

**Assertions (all PASS):**
- `canPublishSources` includes `screen_share` AND `screen_share_audio` — the wave-34 widening is LIVE in the minted token. ✅
- `canPublishSources` still includes `microphone` — mic capability retained (not regressed). ✅
- `canPublishSources` does NOT include `camera` — matches keep-out (no camera publish). ✅
- `video.room` == the requested channelId — token is room-scoped to the specific channel (not a global-publish grant). ✅
- `sub` == the caller's userId (A) — identity binding correct. ✅
- `exp - nbf` == 3600s — TTL bounded to 1h (no long-lived token). ✅
- Token url == `wss://claudomat-test-sgf9259q.livekit.cloud` — a real LiveKit Cloud endpoint. ✅

## Action 2 — Auth matrix — the gate did NOT weaken (uniform-403 unchanged)

| Probe | Request | Expected | Observed | Verdict |
|---|---|---|---|---|
| Unauth mint | `POST /channels/840ce9bd-…/voice/token` (no bearer) | 401 | **401** | PASS |
| Malformed :channelId (T-8 rule 2) | `POST /channels/not-a-uuid/voice/token` (authed A) | 400 (not 500) | **400** `{statusCode:400,message:"Bad Request"}` | PASS |
| Missing/non-member channel | `POST /channels/<random-uuid>/voice/token` (authed A) | 403 (uniform deny) | **403** | PASS |
| **IDOR — real authed non-member** | A mints on B's private voice channel `4a31cd1d-…` (A NOT a member of B's server `aea7c21a-…`) | 403 | **403** | PASS |
| **IDOR control — allowed member** | B (owner) mints on the same channel `4a31cd1d-…` | 200 | **200** | PASS |

The IDOR pair is the load-bearing check: an unauthorized user is asserted to receive **403** on a REAL voice channel, not merely the allowed user receiving 200. The capability widening added publish SOURCES for members; it did NOT change WHO the RBAC `canViewChannelById` gate admits. The wave-31 uniform-403 default-deny (missing == non-member, zero existence/type signal) is intact. Malformed-UUID returns 400 not 500 (T-8 principle 2 holds on the widened path).

## Action 5 — Secret / credential leak grep — CLEAN

```
git diff 87db7ec~1..87db7ec -- apps/api | grep -iE 'api[_-]?key|secret|token|password|bearer\s+[A-Za-z0-9]'
```

Matches are exclusively the WORDS `secret`/`token` in comments, test descriptions, and identifiers — e.g. the invariant comment `LIVEKIT_API_SECRET never leaves this service`, the JSDoc `Token is room-scoped`, test title `returns token + url`. A targeted high-entropy value grep (`(secret|key|password)\s*[:=]\s*["'][A-Za-z0-9+/]{16,}`) over `apps/**` returned **zero** matches. No credential VALUE is committed. `LIVEKIT_API_SECRET` remains a Railway env var on the api service only (confirmed in C-2 env-scoping: web holds only `VITE_API_ORIGIN` + `VITE_LIVEKIT_URL`, never the secret). **secret_grep_findings: [] (empty — APPROVED-eligible).**

---

## Teardown

Prod fixtures + throwaway artifacts created for this run torn down at T-block end (see teardown log in findings-aggregate.md): voice channel `840ce9bd-…`, throwaway server `aea7c21a-…` (+ its channel `4a31cd1d-…`). Fixtures A + B accounts are persistent (not deleted). Minted tokens are short-lived (1h TTL) and self-expire.

---

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [auth_smoke, secret_grep]
auth_smoke:
  positive:
    - "member A mints -> 200; JWT canPublishSources=[microphone,screen_share,screen_share_audio], no camera, room-scoped, sub=A, ttl=3600s"
    - "member B (owner) mints on own private channel 4a31cd1d -> 200"
  negative:
    - "unauth mint -> 401"
    - "malformed :channelId (not-a-uuid) authed -> 400 (not 500) [T-8 rule 2]"
    - "missing/random-uuid channel authed -> 403 (uniform deny)"
    - "IDOR: authed non-member A on B's real voice channel 4a31cd1d -> 403"
csrf_results: null
session_results: null
rate_limit_results: null
secret_grep_findings: []
fix_up_cycles: 0
findings: []
```

## head-tester sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-8
  reviewers: {}
  failed_checks: []
  rationale: >
    The wave-34 capability widening is proven LIVE in the minted token, not merely in the source:
    a member's real prod token decodes to canPublishSources=[microphone,screen_share,screen_share_audio]
    with no camera, room-scoped to the requested channel, 1h TTL, sub bound to the caller. The widening
    added publish SOURCES for members and did NOT weaken WHO can mint: unauth -> 401, malformed :id -> 400
    (T-8 rule 2, not 500), missing channel -> uniform 403, and the load-bearing IDOR pair on a REAL
    private voice channel returns 403 for the authed non-member vs 200 for the allowed member. The
    RBAC canViewChannelById default-deny (wave-31 uniform-403) is intact. Secret grep is clean:
    only the words secret/token appear in comments/tests/identifiers, no credential value is committed,
    and LIVEKIT_API_SECRET stays server-side per C-2 env-scoping. Every applicable probe complete;
    secret_grep empty. No measured pause trigger (b/d/e/f) fired.
  next_action: PROCEED_TO_T_9
```
