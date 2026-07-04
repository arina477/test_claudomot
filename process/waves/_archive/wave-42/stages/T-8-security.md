# Wave 42 — T-8 Security (active — live authz/IDOR probes)

wave_type auto-promoted to `auth` (RBAC authz boundary: member/organizer gates + IDOR server-derivation + member-presign). Applicable probes: csrf/state-changing-endpoints, rate_limit, secret_grep, + IDOR/authz (the meat). Auth-smoke + session-lifecycle skipped (no auth-flow change).

## Overall: CLEAN — 0 Critical / 0 High / 0 Medium / 0 Low
Live vs https://api-production-b93e.up.railway.app (2 test assignments created + soft-deleted, cleanup 204/204):
1. **Unauthenticated → 401** all four new endpoints (submit/presign/roster/return), no data leak (not 404/200/500).
2. **IDOR / server-scope:** submit to nonexistent valid-UUID assignment → 404 (no 500 stack); **anti-spoof attachment key — other-server key / path-traversal / subpath-injection all rejected 400**, S3 NoSuchKey→400 not 500; scope regex built from the assignment row's real server_id, never a client value. Cross-assignment return → 400 "Submission does not belong to this assignment"; nonexistent submission → 404; legit return → 200.
3. **Bad-UUID :id/:submissionId → 400** (global 22P02 filter), no 500.
4. **Rate limit → 429** (global throttler 10/60s), Retry-After:60, generic body no internal-state leak.
5. **Cookie/session:** sAccessToken + sRefreshToken HttpOnly; Secure; SameSite=None; refresh path-scoped to /auth/session/refresh. No regression.
6. **No grade leak:** DTOs + live responses carry only submission metadata + submitter profile; source grep 0 grade/score/points/rubric.
7. **Secret grep (diff):** 0 matches; CI gitleaks green.

**Single-account limitation (noted, NOT a gap):** two-user 403 negatives (non-member submit, non-organizer list/return) can't run live (fixture B broken, A owns everything) — real-PG-proven at T-4 (assignment-submissions.integration.spec cases 292/329/392 + rbac-assignments-authz.spec:131).

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [csrf_state_changing, rate_limit, secret_grep, idor_authz]
auth_smoke: null
csrf_results: ["cookies HttpOnly+Secure+SameSite=None on signin; state-changing endpoints all auth-guarded (401 unauth)"]
session_results: null
rate_limit_results: ["POST submit past 10/60s → 429 Retry-After:60, no state leak"]
secret_grep_findings: []
fix_up_cycles: 0
findings: []
