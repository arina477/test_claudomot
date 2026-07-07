# T-8 — Security (wave-69) [Pattern B — active, live prod]
wave_type includes auth (RBAC moderate_members + session-derived callerId + new state-changing endpoints). Applicable probes: authz (the 4 load-bearing paths), secret_grep (always), light session/header check. Live probe via penetration-tester (Fixture A + B sessions, prod api).

## THE 4 AUTHZ PATHS — ALL PROVEN LIVE (deployed revision 5fdd2bb)
| # | Path | Result | Evidence |
|---|---|---|---|
| 1 | no-IDOR (reporter_id from session) | PASS | POST /reports with spoofed reporter_id=HACKER-SPOOF-ID → 201; persisted reporter_id = A's real uid 21984eb2-... (spoof ignored) |
| 2 | moderate_members gate | PASS | owner A GET /servers/ad62cd12/reports → 200; non-mod B → 403 "moderate_members required" (both directions re-run live, not just cited) |
| 3 | rank-guard route-through | PASS | resolve {action:timeout} on an owner-rank target → 403 "Cannot moderate yourself"; report stayed open, no mute, no side effect |
| 4 | cross-server tamper guard | PASS | resolve with route serverId != report.target_server_id → 404 BEFORE any mutation; report still open |
Coverage nuance (probe 3): only moderate_members holder on the fixture is the owner → the reachable live branch is the self-guard; the distinct-moderator-vs-owner-rank branch is CI-integration-covered.

## Secret grep (Action 5, always)
git diff 20208a3..5fdd2bb secret-grep: 1 match, benign — a code comment "Tokens: all from design/DESIGN-SYSTEM.md" (design tokens, not credentials). ZERO secrets.

## Session / header (Action 3 light)
SuperTokens header-token mode (Bearer via st-access-token response headers, NOT Set-Cookie) → cookie SameSite/HttpOnly/Secure N/A this revision. CORS locked to single origin https://web-production-bce1a8.up.railway.app (not *), allow-credentials true. Error envelopes clean {message,error,statusCode}, no stack/DB leak.

## Findings
- INFO (non-blocking): rate-limit IS present on POST /reports + GET reports (x-ratelimit-limit 10/60s) — the P-block-noted "no rate limit" deferral does NOT reproduce on the deployed revision. Good.
- LOW (V-2, hardening): x-powered-by: Express exposed (minor fingerprinting; standard hardening strips it). Not wave-specific.

## Cleanup
Probe reports 1bbb0739 + 320f98b3 filed then DISMISSED (non-destructive); 0 probe reports remain open; no member timed out, no message deleted.

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [csrf_authz, session, secret_grep]
csrf_results: ["4/4 authz paths PROVEN LIVE: no-IDOR, moderate_members(A200/B403), rank-guard(403), cross-server(404)"]
session_results: ["SuperTokens header-token/Bearer mode; CORS single-origin+credentials; clean error envelopes"]
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: INFO, category: rate_limit, description: "rate limit present (10/60s) — deferred gap does not reproduce", remediation: none}
  - {severity: LOW, category: hardening, description: "x-powered-by: Express exposed", remediation: "strip header (not wave-specific) → V-2"}
```
