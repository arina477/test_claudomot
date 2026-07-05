# T-8 — Security (wave-50)

**Pattern:** B (active). **auto_promoted: true** — wave adds a state-changing PATCH /config endpoint on the membership-gated auth boundary. Applicable subset: authorization/IDOR, idle-guard, rate-limit, secret-grep. (No auth-flow/session-lifecycle change → those probes N/A.)

## Probe results (penetration-tester a8ef3e941bd5f9e83, live prod)
**Is the config endpoint IDOR-safe + idle-guarded in production? YES. 0 findings, all severities.**

| Probe | Result |
|---|---|
| Authenticated non-member IDOR (foreign/nonexistent serverId) | **403 ×3, no mutation** (assertMember; GET /servers is membership-scoped → no enumeration oracle) |
| Own-server positive control (member, idle) | 200, durations updated |
| **Idle-only guard (server-side backstop)** | **409 on running AND paused** — the UI removes Apply while running, but the raw endpoint still 409s → client lock bypassable, server guard NOT |
| Validation + injection | 400 on all bad inputs (200/0/negative/huge/non-integer/missing); **no mass-assignment** (injected serverId/updated_by ignored — route serverId + session userId authoritative) |
| Anon + CSRF | 401 (anon / forged token / cookie-only) — SuperTokens header/bearer mode |
| Rate limit | 429 ThrottlerException present (respected backoff) |
| Secret grep (wave-50 diff, commit 34b4b83) | CLEAN |

## Findings (→ V-2)
None. Cleanup: `ad62cd12` left idle @ 25/5.

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [idor_authz, idle_guard, rate_limit, secret_grep]
csrf_results: ["non-member IDOR 403 (no mutation); anon/forged/cookie-only 401; no mass-assignment"]
idle_guard_results: ["409 on running + paused — server-side, unbypassable by client"]
rate_limit_results: ["429 ThrottlerException present"]
secret_grep_findings: []
fix_up_cycles: 0
findings: []
```
