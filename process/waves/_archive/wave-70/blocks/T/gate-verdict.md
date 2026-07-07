# Wave 70 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-block gate)
**Reviewed against:** process/waves/wave-70/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

The M14 Block suite is honest and its coverage is adequate to the wave's risk surface; the load-bearing T-8 launch-gate safety proof is genuinely backed live, not coverage theater. The DM HIDE "no leak on any path" claim is proven — not asserted — by a penetration-tester probe that signed in TWO real fixtures (A `21984eb2…`, B `da74148e…`) against the deployed prod API with captured session tokens, then exercised all five HIDE seams (createConversation, sendMessage, getDmCandidates, listConversations, listMessages) **bidirectionally** with real HTTP status codes (403/exclude/hide) and real block/conversation IDs, and demonstrated unblock-restore live with a captured restore-message id (`6f6d7a9f…`). no-IDOR is proven the right way — a spoofed `blocker_id` in the POST body was ignored and the persisted row carried A's session-derived id — not merely "an allowed user got 201." The 403-on-block-seam vs 404-on-genuine-non-participant distinction is correctly reasoned rather than papered over. T-4, the authoritative integration gate, RAN against real postgres:16 (migration 0026 applied by the harness, NOT mocked) covering the same 19 cases + 5 bidirectional HIDE seams — so the DB/SQL/transaction layer is exercised, not stubbed. On the T-6 honesty question: the standalone T-6 agent's infra drop after 6 desktop captures is disclosed openly, and the interrupted mobile/token checks are legitimately cross-covered — I independently opened t5-bottomsheet-mobile.png and confirmed a real <640px bottom-sheet (viewport-bottom-anchored, full-width, grab handle, red danger confirm above ghost cancel, consequence copy), and 05-block-dialog-1440.png confirms the desktop modal + danger token; this is real verification from an independent live run + the D-3 gate, not a gap dressed up. Findings are surfaced with evidence and root cause and correctly deferred to V-2 for blocking classification: FINDING-1 (MAJOR member-row does not reflect blocked state — server + settings truth correct, honest "not a hard FAIL" reasoning) and FINDING-2 (LOW UUID enrichment gap). No flaky-retry masking (0 flakes across ≥2× runs), no single-client realtime shortcut (block is request/response; HIDE proven with two separate authenticated identities), no mock-the-system-under-test, no green-by-suppression. T-1's 15 diff bypasses are all confirmed test-mock casts with zero production `any`/ts-ignore, and the T-7 perf skip is justified (index-backed block reads, bounded per-seam checks, no perf-sensitive surface). The suite proves user-observable outcomes at every claimed layer.

## Escalation
N/A

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
