# P-0 ceo-reviewer — wave-82 (strategic-value + ambition lens, BOARD seat)

**Task:** 0e58af8e — DM-view post-login transient-401 bounce-to-home
**Reviewer role:** CEO/founder-mode strategic-value + ambition. Answers "is this worth doing, ambitious enough or too ambitious?" — NOT "is the problem framed right?" (problem-framer's lane).

## Verdict: SELECTIVE-EXPANSION → global api-client refresh-and-retry (PROCEED with scope set at the cause layer)

Worth doing: unambiguous PROCEED. Scope: expand the FIX from the DM symptom to the api-client cause layer, but hold the line THERE — no auth redesign.

## Reasoning

This is a clear PROCEED on value, and the ambition call resolves to the cause layer, not the symptom. On value: a real, LIVE, reproduced-across-two-testers bug on a core surface — a student who opens DMs seconds after login gets kicked to home. That is a first-session trust wound on an offline-first product whose entire pitch is resilience under flaky conditions; a transient token blip masquerading as "you're logged out" is exactly the failure the brand promises not to make. Founder is in a directed bug-fix phase and named this bug — no strategic ambiguity to escalate. On ambition: I verified the root cause is genuinely global, not DM-local. Every authed call in the SPA funnels through one `request`/`requestNoContent` helper in `apps/web/src/auth/api.ts` (~60 typed methods, used across 30+ shell modules), and that helper throws `HttpError(401)` immediately with no SuperTokens refresh-and-retry. A DM-only patch would leave the identical bounce latent behind messages, servers, assignments, timers, notifications — any route that happens to be the first call after a stale-token window. Patching the symptom while knowingly leaving the cause armed is the more expensive choice, not the cheaper one. The correct-and-bounded fix is a single refresh-and-retry seam in that helper: on a 401, attempt one SuperTokens session refresh, retry the original request once, and only surface unauthenticated if the refresh itself fails. There is a strong in-repo precedent for this exact shape — `retryOn429` already wraps reads with bounded backoff at this layer — so this is a known, proven pattern extended one status code over, not new architecture. That precedent is also the ceiling: this stays "resilient 401 refresh-and-retry, once, bounded," and must NOT drift into token-lifecycle redesign, a global fetch-client rewrite, proactive refresh scheduling, retry policy for other status classes, or any unrelated auth backlog. One seam, one refresh, one retry.

## Key correctness guard (must carry into P-2 spec / T-8 security)

A GENUINE 401 (truly logged out — refresh token expired/revoked) MUST still route to login. The fix distinguishes *transient* 401 (refresh succeeds → retry → success) from *real* 401 (refresh fails → propagate unauthenticated → login redirect). The refresh-and-retry must be **single-shot and bounded** — one refresh attempt, one retry — so a hard-401 cannot loop, and a real logout is never masked or delayed behind silent retries. This is the load-bearing guard: the whole value of the fix is contingent on it not swallowing legitimate logouts.

## Scope guardrails (do NOT expand into)

- No auth-system redesign, token-lifecycle rework, or proactive/scheduled refresh.
- No global fetch-client rewrite — reuse the existing `request` seam and the `retryOn429` pattern.
- No refresh-and-retry for non-401 status classes; no unrelated auth backlog pulled in.
- Concurrent-401 stampede (many in-flight calls all 401 at once) should be handled simply — a single shared in-flight refresh is the sensible bound — but do not gold-plate this into a full request-queue/mutex subsystem beyond what SuperTokens' own client already provides.

## BOARD signal
- **Strategic value:** HIGH (core-surface trust bug, founder-directed, live-reproduced).
- **Ambition:** correct at cause layer (global api-client), explicitly capped below auth-redesign.
- **Vote:** PROCEED / APPROVE — scope = global api-client 401 refresh-and-retry, single-shot, with the genuine-logout guard as a hard spec requirement.
