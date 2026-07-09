# Wave 83 — T-8 Security (live)
```yaml
test_pattern: active
skipped: false
auto_promoted: false   # wave_type includes auth/infra (security headers, CORS, rate-limit)
applicable_probes: [security_headers, cors_survival, ws_cross_origin, rate_limit_body, secret_grep]
security_headers_live: PASS   # HSTS(15552000;includeSubDomains) + X-Frame-Options DENY + nosniff + Referrer-Policy strict present; x-powered-by ABSENT
fence_live: PASS              # CSP, CORP, COEP, COOP, Origin-Agent-Cluster ALL absent
cors_survival: PASS          # preflight + credentialed GET preserve ACAO(web)+ACAC:true (C-2 + T-8 reconfirm)
ws_cross_origin: PASS        # jenny P-4 gap CLOSED — all 4 Socket.IO namespaces (/messaging /presence /study-timer /study-room) authenticate + connect over cross-origin wss:// through hardened api; native upgrade readyState OPEN; app /messaging connected live
realtime_rest_e2e: PASS      # /me /dm/conversations /servers(800) /me/notifications /servers/{id} all 200, response.type=cors
rate_limit_429_body: PASS    # generic {statusCode:429,message:'Too Many Requests'}, no ThrottlerException (C-2)
secret_grep_findings: []
fix_up_cycles: 0
findings: []
```
The load-bearing risk (helmet breaking the cross-origin web->api flow) is DISPROVEN on deployed reality across BOTH credentialed surfaces: HTTP (REST + preflight) AND WebSocket (all 4 namespaces). Benign helmet defaults also present (x-dns-prefetch-control/x-download-options/x-permitted-cross-domain-policies/x-xss-protection) — harmless.
