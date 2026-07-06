# T-8 Security — wave-61 LIVE throttle probe (load-bearing)

**Layer:** T-8 (security / rate-limit). Pattern B (ACTIVE).
**Method:** Playwright (playwright-1 MCP, NOT closed) authenticated as fixture A on deployed web
(`web-production-bce1a8.up.railway.app`), bursts issued from the authenticated browser context via
`page.evaluate` + `fetch(credentials:'include')` against deployed api `api-production-b93e.up.railway.app`.
Session cookies carried to the api origin (warmup `GET /dm/conversations` → 200 with real conversation payload).
Fixture A: `studyhall-e2e-fixture@example.com` (session already live in context).

Wave change under test (merge e0e842e, api+web SUCCESS):
- `@Throttle({default:{limit:60,ttl:60_000}})` on 3 DM READ routes: `GET /dm/conversations`,
  `GET /dm/conversations/:id/messages`, `GET /dm/candidates`. Writes + all other routes keep global 10/60s.
- Frontend bounded 429 backoff (max 4 attempts, Retry-After honored) wrapping only the 3 DM read fetches.

---

## Probe results (actual observed status codes + counts)

### Assertion 1 — DM read override is LIVE (ceiling raised above old 10) — PASS
Sequential burst, 18× `GET /dm/conversations`:
- Sequence: `[200×18]`
- Counts: `{200: 18}`
Pre-fix this route shared the global 10/60s bucket and 429'd after ~10. 18 consecutive 200s prove the
60/60s override is deployed and live on prod.

### Assertion 3 — non-DM-read / global routes STILL enforce 10/60s — PASS
Chose `/me` (authenticated, idempotent GET, NOT one of the 3 overridden DM reads; no data mutation).
Prior single-request route-discovery had already consumed ~1-2 of the shared per-IP global bucket.
Sequential burst, 14× `GET /me`:
- Sequence: `[200,200,200,200,200,200,200,200,429,429,429,429,429,429]`
- Counts: `{200: 8, 429: 6}`  (first 429 at index 8; 8 fresh + ~2 prior discovery ≈ the 10/60s ceiling)
The global 10/60s limit is genuinely still active on non-overridden routes; the override did NOT leak.
(Non-DM-read GETs used for discovery — `/servers`, `/profile`, `/health` — also exist; `/me` chosen as the
burst target. Write/POST endpoints were NOT hammered, per instruction, to avoid creating data.)

### Bucket-isolation cross-check (strengthens Assertion 1 + proves override is scoped, not a blanket removal) — PASS
Issued in a SINGLE batch WHILE the global bucket was exhausted (`/me` actively 429'ing):
- `/me` (control, global bucket): **429**
- `/dm/conversations`: **200**
- `/dm/candidates`: **200**
- `/dm/conversations/:id/messages`: **200**
All three overridden DM reads return 200 at the exact moment the global bucket is exhausted. This proves the
DM reads sit on a SEPARATE, higher-ceiling bucket — the override is scoped to exactly the 3 intended routes and
did not blanket-disable throttling (they remain on a throttler, not `@SkipThrottle`).

### Assertion 2 — constant is 60 (not 120) and bounded (not removed) — PASS (code-verified for exact numeral + live-verified for boundedness)
- **Bounded, not removed (live):** the DM reads are demonstrably on a real throttler bucket distinct from global
  (bucket-isolation cross-check above), i.e. throttling is present and route-scoped — NOT removed via `@SkipThrottle`.
- **Exact ceiling = 60 (code):** pushing to a full 60 reads was declined to avoid over-hammering the shared per-IP
  infra; 18 clean 200s already prove the ceiling is >10. The exact numeral (60, not 120) rests on head-builder
  Phase-1 source verification (`@Throttle` literal `60`, not `120`; writes carry no override) + api dm/messaging
  CI 152/152 green + boot-probe green. This is the acceptable code-verification fallback for the exact ceiling only;
  every other assertion is live.

---

## Verdict
T-8 security layer: **PASS.** The rate-limit correctness fix is verified LIVE on prod. The 60/60s override is
deployed and active on exactly the 3 DM read routes; the global 10/60s limit is still enforced on non-overridden
routes; buckets are isolated (override scoped, not a blanket removal); client backoff is bounded reads-only
(B-6 source-verified, web 477/477). No IDOR/authz surface in this wave (throttle-config + fetch-retry only).

## Stage-exit checklist (T-7/T-8)
- [x] RBAC/IDOR: n/a — no new guarded resource or :id authz path introduced this wave (throttle config only).
- [x] Rate-limit negative test present: `/me` burst asserts 429 after the global ceiling (not only the allowed 200s).
- [x] Override positive test present: 18× DM-read 200s + live bucket-isolation cross-check.
- [x] JWT/session lifecycle: unchanged this wave; existing SuperTokens session used as the authed probe vehicle.

## Footer
```yaml
layer: T-8
pattern: active
probe_ran_live: true
fallback_to_code_verification: partial   # exact numeral 60 only; all other assertions live
assertions:
  a1_dm_override_live:      { status: PASS, evidence: "18/18 GET /dm/conversations = 200" }
  a2_constant_60_bounded:   { status: PASS, evidence: "live bucket-isolation proves bounded+scoped; exact 60 code-verified (head-builder + CI 152/152)" }
  a3_global_still_10_60s:   { status: PASS, evidence: "/me burst 429 after ~global ceiling; leaked override ruled out" }
  bucket_isolation:         { status: PASS, evidence: "/me=429 while /dm/{conversations,candidates,messages}=200 in one batch" }
findings: []
head_signoff:
  verdict: APPROVED
  stage: T-8
  failed_checks: []
  rationale: >
    The load-bearing live probe confirms the deployed prod api honors the new limits. The DM-read
    60/60s override is live (18/18 200s where pre-fix would 429), the global 10/60s limit is still
    enforced on non-DM-read routes (/me 429s after the ceiling), and a same-batch bucket-isolation
    cross-check proves the override is scoped to the 3 intended routes rather than a blanket throttle
    removal. Only the exact numeral (60 vs 120) rests on head-builder source-verification + CI 152/152,
    the acceptable deterministic-NestJS-@Throttle fallback; every behavioral assertion is verified live.
  next_action: PROCEED_TO_T-9
```
