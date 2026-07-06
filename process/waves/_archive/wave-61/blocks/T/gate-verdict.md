# Wave 61 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-61/blocks/T/review-artifacts.md + findings-aggregate.md + T-8-security.md live probe
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The T-block is honest and complete for a rate-limit-correctness fix (throttle-config + client fetch-retry,
merge e0e842e, api+web SUCCESS). The load-bearing layer — T-8 security — was verified LIVE against deployed
prod, not by assertion-on-green: 18/18 `GET /dm/conversations` returned 200 (pre-fix would 429 after ~10,
proving the 60/60s override is deployed and active); a non-overridden authed GET (`/me`) 429'd after the global
ceiling (proving the strict 10/60s limit is still enforced and did not leak); and a same-batch bucket-isolation
cross-check showed all three overridden DM reads returning 200 at the exact moment `/me` was 429'ing (proving the
override is scoped to the 3 intended routes, not a blanket `@SkipThrottle` removal). Only the exact numeral
(60 vs 120) rests on head-builder source-verification plus api CI 152/152 — the acceptable deterministic-NestJS-
`@Throttle` fallback for a single literal; every behavioral assertion is live. T-1 (lint/typecheck SUCCESS) and
T-2 (web 477/477 incl. 10 retryOn429 tests + api dm/messaging 152/152) are CI-green. The skips (T-3 contract,
T-4 integration, T-5 e2e, T-6 layout, T-7 perf) are defensible and correctly reasoned: no request/response SHAPE
change (same DTOs), no schema/service-boundary change (decorator on existing routes, boot-probe green), no
user-visible journey change (backoff invisible in normal use, no new flow), no render/layout change (client is a
fetch-retry wrapper), and no perf-heavy surface (retry is bounded, reads-only). B-6 independently source-verified
the production-bug surface: double-send CLOSED (retry wraps only the 3 idempotent GETs, POSTs unwrapped),
retry-storm CLOSED (maxAttempts 4, 10s cap, Retry-After floored with negative-date guard), throttle-misscope
CLOSED (exactly 3 GET reads overridden, writes keep global, no @SkipThrottle). Journey regen is correctly skipped
(Action 2): design_gap_flag false, frontend change touches no route/screen surface, canonical journey map remains
the prior wave's. No findings at any layer. This is contract-correct ~2/10-scope M8-tail drainage — not
REWORK-worthy on scope size, and the throttle is verified working live.

## Rework instructions
(none — APPROVED)

## Escalation
(none — APPROVED)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
