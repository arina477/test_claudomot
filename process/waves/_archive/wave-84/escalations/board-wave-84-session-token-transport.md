# BOARD — wave-84-session-token-transport

**Convened:** wave-84 P-0 (both reframe reviewers ESCALATE/route-to-BOARD; Tier-3 security-posture decision, automatic mode, 6+/7 strict threshold)

## Decision
For StudyHall's cross-SITE SPA (web-production-bce1a8.up.railway.app ≠ api-production-b93e.up.railway.app — both under the Public-Suffix-List domain up.railway.app, so they are different SITES not just origins), how should session tokens be transported?

- **Option A — switch to httpOnly cookies:** set `tokenTransferMethod:'cookie'` on both Session.init() (api + web). Closes the JS-readable `st-access-token`/`st-refresh-token` XSS-exfiltration surface (MEDIUM). BUT forces cross-SITE `SameSite=None; Secure` cookies, which Safari ITP blocks outright and Chrome's third-party-cookie deprecation degrades → auth-RELIABILITY risk (login breaks for real users).
- **Option B — keep header transport + document + compensate:** keep the current header mode (SuperTokens' OWN recommended transport for different-domain frontend/backend), formally record it in product-decisions.md as an accepted cross-origin posture, and add cheap compensating XSS controls: enable CSP (currently `contentSecurityPolicy:false` post-wave-83) + short access-token TTL + refresh rotation.

## P-0 reviewer inputs (both favor B)
- problem-framer: ESCALATE — Option A is a symptom-layer fix trading MEDIUM XSS for HIGH auth-reliability risk; header mode is architecturally correct for cross-origin SPA; the real XSS fix is CSP. "design intent: httpOnly cookies" premise is questionable given the deliberate different-origin topology.
- ceo-reviewer: SCOPE-REDUCTION + BOARD — Option A is "3/10 that looks like 9/10"; disciplined 9/10 = keep header + document + compensate. Zero-user self-use MVP today.

## Votes
<7 member votes appended below>

## CONSOLIDATED DECISION: Option B (7/7 unanimous — Tier-3 6+/7 strict CLEARED)

| Member | Vote | Key point |
|---|---|---|
| strategist | APPROVE B | Login-reliability is upstream of every activation/retention loop; A risks the beachhead cohort for a theoretical XSS surface |
| industry-expert | APPROVE B | SuperTokens recommends header for different-domain; cross-site SameSite=None is a post-3p-cookie antipattern; up.railway.app is Public Suffix so cookies can't span hosts |
| realist | APPROVE B | A's break mode is FACT (documented browser behavior); B's risk is theoretical + provable/reversible now |
| user-advocate | APPROVE B | Safari-heavy student base; A silently breaks login persistence on the daily-use path |
| risk-officer | APPROVE B | A = silent, per-browser, unobservable auth failure (no monitoring); B reversible + vendor-recommended |
| counter-thinker | APPROVE B | Steel-manned A via custom-domain/proxy, but honest call: B is a reversible two-way-door at zero users |
| founder-proxy | APPROVE B | STRONG precedent — product-decisions line 73 item (6) JWT-cross-origin-fallback + item (10) SameSite=Lax = exactly B's posture; A reverses it |

**Outcome:** Option B — keep header token transport (SuperTokens-recommended for different-domain SPA), explicitly document the accepted cross-origin posture, AND ship compensating XSS controls.
**BINDING conditions (unanimous, ship-blocking — B degrades to "document + do nothing" without them):**
1. Enable a cross-origin-SAFE CSP (explicit policy; NOT helmet's default which wave-83 disabled — must allow the api origin in connect-src + the app's own script/style; T-8 must prove the SPA + cross-origin api + WS still work).
2. Short access-token TTL (SuperTokens accessTokenValidity).
3. Refresh rotation confirmed enforced.
4. Record the config-drift (docs assume shared parent domain `.studyhall.up.railway.app` NOT deployed — services are on unshared Railway subdomains) + a MIGRATION TRIGGER: revisit httpOnly-via-custom-domain/proxy BEFORE GA / first real external users.
**Dissents:** none blocking; all 7 stressed the compensating controls (esp. CSP) are load-bearing, not follow-ups.
