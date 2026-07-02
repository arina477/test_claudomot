# Wave 35 — T-8 Security (LOAD-BEARING — authz negative-path reproduction)

Stage: T-8 (Security) · Block: T (Test) · Mode: automatic
Target: LIVE prod deploy (deploy_commit `0c71585`), api https://api-production-b93e.up.railway.app
Method: **live negative-path reproduction** (BUILD-PRINCIPLES rule 4 — not code-read). Real prod API, real SuperTokens sessions for two distinct verified fixtures.
Fixtures:
- A = `studyhall-e2e-fixture@example.com` · userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`
- B = `studyhall-e2e-fixture-b@example.com` · userId `da74148e-132e-4faf-a526-a34c28e7481b`
- Co-members of "Fixture Proof Server" `ad62cd12-b78e-4a85-a214-042cf176b16c` (roster count 2 baseline).
Auth: `POST /auth/signin` (rid emailpassword, `st-auth-mode: header`) → `Authorization: Bearer <st-access-token>`.

## Overall verdict: PASS — all 5 checks. Zero CRITICAL findings. Core privacy enforcement PROVEN LIVE.

| # | Check | Severity if FAIL | Verdict |
|---|---|---|---|
| 1 | profile-visibility enforcement (roster hiding) | CRITICAL | **PASS** |
| 2 | data-export self-scoping (IDOR) | CRITICAL | **PASS** |
| 3 | auth boundary (401 unauth + malformed) | HIGH | **PASS** |
| 4 | PUT enum validation (400 not 500 / bad write) | MEDIUM | **PASS** |
| 5 | email PII absent from roster | HIGH | **PASS** |

---

## Check 1 — profile-visibility enforcement (roster hiding) — CRITICAL — PASS
The core security assertion of this wave. Reproduced the full matrix live against `GET /servers/ad62cd12.../members`:

| A's `profileVisibility` | B's roster (co-member view) | A's own roster (caller-sees-self) |
|---|---|---|
| `everyone` (baseline) | count 2 — **A PRESENT** | (n/a) |
| `nobody` (Hidden) | count 1 — **A ABSENT** ✓ | count 2 — **A PRESENT (sees self)** ✓ |
| `server-members` | count 2 — **A PRESENT** (co-member sees) ✓ | (n/a) |
| `everyone` (restored) | count 2 — **A REAPPEARS** ✓ | (n/a) |

Evidence (userId prefixes in each roster):
```
A=nobody       -> B view: count 1, ids [da74148e]              (A hidden)
A=nobody       -> A view: count 2, ids [da74148e, 21984eb2]    (A sees self)
A=server-members -> B view: count 2, ids [da74148e, 21984eb2]  (co-member sees A)
A=everyone     -> B view: count 2, ids [da74148e, 21984eb2]    (restored)
```
Enforcement is **server-side** on the member-roster endpoint — not a client-side hide. `nobody` removes A from every other member's roster while A still sees themselves; `server-members` correctly shows A to co-member B. All PUTs returned 200 and A was restored to `everyone` (clean state). **PASS — enforced privacy proven.**

## Check 2 — data-export self-scoping (IDOR) — CRITICAL — PASS
As A, attempted to pivot to B's data via a `userId` param on both export routes:
```
GET /profile/data                 (A auth) -> 200, profile.userId = 21984eb2 (A)   email = A's
GET /profile/data?userId=<B>      (A auth) -> 200, profile.userId = 21984eb2 (A)   <-- param IGNORED
GET /profile/data/export          (A auth) -> 200, profile.userId = 21984eb2 (A)
GET /profile/data/export?userId=<B> (A auth) -> 200, profile.userId = 21984eb2 (A) <-- param IGNORED
```
Both routes are **structurally self-scoped via the session** — there is no userId path/query param that changes the subject. Appending `?userId=<B>` is silently ignored and A's own data is returned. No IDOR. **PASS.**

## Check 3 — auth boundary — HIGH — PASS
```
GET /profile/privacy              (no auth)        -> 401
GET /profile/data                 (no auth)        -> 401
GET /profile/privacy              (garbage bearer) -> 401   (not 500 — guard rejects malformed cleanly)
GET /profile/data                 (garbage bearer) -> 401
GET /servers/ad62cd12.../members  (no auth)        -> 401
GET /profile/definitely-not-a-route (control)      -> 404   (401s above are genuine auth-guard, not catch-all)
```
Unauthenticated and malformed-token requests return **401**, never 200 and never 500. Control 404 confirms the 401s are real route+guard, not a masking catch-all. **PASS.**

## Check 4 — PUT enum validation — MEDIUM — PASS
```
PUT /profile/privacy {"profileVisibility":"pizza","whoCanDm":"everyone"} (A auth) -> 400
  body: {"formErrors":[],"fieldErrors":{"profileVisibility":
         ["Invalid enum value. Expected 'everyone' | 'server-members' | 'nobody', received 'pizza'"]}}
```
Invalid enum is rejected at the validation layer with a **400** and a precise zod field error — not a 500, not a bad DB write. Confirmed A's stored visibility was **unchanged** (`everyone`) after the rejected PUT. **PASS.**

## Check 5 — email PII absent from roster (P-3 T-8 flag) — HIGH — PASS
Every member row in the live `GET /servers/:id/members` response has keys exactly `[avatarUrl, displayName, userId, username]` — **no `email` field** (verified `'email' in JSON` = false on the full response for both rows). ServerMemberSchema omits email as designed; confirmed against the live response, not just the schema. **PASS.**

---

## Notes
- The "notifications panel" surface does not exist yet — not tested, not faulted (out of scope this wave).
- No production data was left mutated: A's `profileVisibility` restored to `everyone`; the bad-enum PUT was rejected (no write). Roster count returned to baseline 2.

```yaml
head_signoff:
  stage: T-8
  verdict: PASS
  checks:
    profile_visibility_enforcement: PASS   # CRITICAL — roster hiding proven (nobody absent, self-present, server-members co-member-visible, restore)
    data_export_self_scoping: PASS         # CRITICAL — ?userId ignored on /profile/data + /profile/data/export
    auth_boundary: PASS                    # 401 unauth + malformed; control 404
    put_enum_validation: PASS              # 400 zod error, no bad write
    email_pii_absent_from_roster: PASS     # roster keys omit email
  critical_findings: 0
  findings: []
```
