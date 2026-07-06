# B-6 Phase 2 — production-bug review (wave-61)
Scope: diff main...wave-61-dm-throttle (3771e5c B-2 + 7b8c923 B-3). Real production-bug surface (shared request()
error path + retry helper) — enumerated each pattern + its coverage:
- **Double-send on retry** (write retried on 429 → duplicate message): CLOSED — retryOn429 wraps ONLY the 3 idempotent GET reads; sendDmMessage/createDmConversation POSTs call request() directly, unwrapped (head-builder source-verified).
- **Unbounded retry / retry storm**: CLOSED — maxAttempts 4 (1+3), hard throw on exhaustion, 10s delay cap; Retry-After honored as a floor with negative-date guard.
- **Error-handling regression** (HttpError extends Error, thrown by shared request()/requestNoContent()): CLOSED — non-429 message/throw semantics identical; all `instanceof Error`/`.message` callers unaffected; FULL web suite 477/477 + api 152/152 green (empirical).
- **Throttle mis-scope** (writes accidentally loosened / route un-throttled): CLOSED — exactly 3 GET reads get @Throttle(60/60s); writes keep global 10/60s; no @SkipThrottle added.
- Null access / off-by-one / unsafe cast: n/a (decorator + typed retry wrapper).
Findings: none (critical/high: 0). Full multi-agent /review workflow deemed disproportionate given head-builder Phase-1
source-verified each production-bug pattern + the 477+152 full-suite evidence. T-8 will live-verify the throttle limits.
