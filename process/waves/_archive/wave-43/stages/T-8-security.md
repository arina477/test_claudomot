# Wave 43 — T-8 Security (active — live authz/IDOR probes)

wave_type auto-promoted to `auth` (organizer/member gates + IDOR derivation). Live vs api e7f1f7a.

## Overall: CLEAN — 0 findings
1. **Unauthenticated → 401** all 5 endpoints, no leak.
2. **IDOR:** random valid-UUID → 404 (clean, no stack, no foreign data) GET/PATCH/DELETE; **serverId-smuggle via PATCH body → foreign serverId stripped by Zod whitelist, org gate uses row's server_id** (source-confirmed: :id routes fetch row → 404 if unknown → assertOrganizer/assertMember(userId, row.server_id)).
3. **Bad-UUID :id → 400** (NOT 500) — the known-deferred M3 (bad-UUID→500) does NOT manifest on scheduling routes; they 400 cleanly. M3 noted as documented deferral, not a wave-43 finding.
4. **Validation:** endsAt<=startsAt → 400; weekly recurrenceUntil<startsAt → 400 (B-6/T-4 guards live on e7f1f7a). No 500.
5. **Recurrence window abuse:** 5-year window → only ~90 days of occurrences (5.6KB/0.11s). **90-day cap holds; bounded, no DoS.**
6. **Rate limit:** 6×201 then 54×429 (ThrottlerException, Retry-After:47), no 500/bypass/leak.
7. **Session/cookie:** SuperTokens header-based transfer (no Set-Cookie); not wave-43-introduced; informational.
8. **No leak:** response fields scheduling/organizer only; zero reminder/rsvp/attend/grade/notif hits.
9. **Secret-grep (diff):** clean; CI gitleaks green.
Two-user non-organizer/non-member 403 negatives cited from T-4 real-PG (run 28693093402).

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [csrf_state_changing, rate_limit, secret_grep, idor_authz]
rate_limit_results: ["POST create past limit → 429 Retry-After:47, no leak"]
secret_grep_findings: []
fix_up_cycles: 0
findings: []
note: "bad-UUID→400 on scheduling routes (better than known-deferred M3 predicted); recurrence 90d cap bounds the response (no DoS)"
```
