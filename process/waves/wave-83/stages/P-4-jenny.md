# P-4 Phase-2 Drift Verification — wave-83 (jenny)

**Wave:** API security-headers hardening (config-only) — helmet safe flat headers + X-Powered-By removal + CSP/CORP/COEP explicitly fenced OFF + generic NestJS ThrottlerGuard 429 body.
**Task:** 875b97f4-bbae-4f1d-99b8-f1f26a876a3f
**Inputs cross-referenced:** task spec (DB), `process/waves/wave-83/stages/P-3-plan.md`, `command-center/product/product-decisions.md`, `command-center/artifacts/user-journey-map.md`, and the actual codebase (`apps/api/src/main.ts` + the 4 Socket.IO gateways).

## Verdict: **APPROVE**

All spec items MATCH prior decisions; no blocking drift. One non-blocking spec GAP flagged (Socket.IO/WS not mentioned) — informational, not a rework blocker because live code proves it is not a breakage surface.

---

## Per-spec-item drift table

| Spec item (AC) | MATCHES / DRIFTS | Grounding |
|---|---|---|
| AC1 HSTS 15552000 + includeSubDomains, NO preload | MATCHES | New defense-in-depth header; no prior decision on HSTS. Reversibility (no preload) is consistent with the founder bug-fix-phase caution. No conflict. |
| AC2 X-Content-Type-Options: nosniff | MATCHES | Additive header, no prior contradicting decision. |
| AC3 X-Frame-Options: DENY | MATCHES | API serves JSON only (no embeddable UI); DENY does not conflict with any journey/embedding decision. |
| AC4 Referrer-Policy strict | MATCHES | Additive; no prior decision. |
| AC5 remove X-Powered-By | MATCHES | Fingerprint hygiene; closes wave-23 T-8 finding F23-T-8c/d (spec cites it). No conflict. |
| AC6 fence OFF CSP / CORP / COEP | **MATCHES (load-bearing)** | Directly consistent with the canonical cross-origin architecture: product-decisions L73 resolved-decision **#10** (`session cookie SameSite=Lax`) + the deployed split origins (web-production-bce1a8 vs api-production-b93e). `main.ts` `enableCors({ origin: WEB_ORIGIN, credentials: true, allowedHeaders: [...supertokens.getAllCORSHeaders()] })` confirms the credentialed cross-origin SuperTokens flow is real and load-bearing. helmet's default CORP `same-origin` / COEP would break exactly this. Fencing them OFF PRESERVES the established architecture — it is drift-AVOIDANCE, not drift. |
| AC7 generic ThrottlerGuard 429 body (drop "ThrottlerException", keep 429 + Retry-After) | MATCHES | Closes the open wave-23 finding; no prior decision mandates the class-name leak. |
| AC8 deployed web→api credentialed flow still works after helmet | **MATCHES (correct load-bearing constraint)** | This IS the right constraint. Verified against real code: cross-origin credentialed auth is SuperTokens session cookie (SameSite=Lax, decision #10) over `credentials: true` CORS with `getAllCORSHeaders()` allow-listed. Preserving it is correctly the wave's hard guardrail; T-8 deployed proof is correctly mandated. |
| AC9 leave Express authRateLimiter 429 untouched | MATCHES | `main.ts` `authRateLimiter` already emits a generic body (`error: 'Too Many Requests'`, no class name) — confirmed in source (lines ~55-60). Spec correctly says do-not-double-fix. No regression risk. |

**Plan (P-3):** middleware-ordering constraint (helmet must not clobber existing CORS + SuperTokens order; specialist = supertokens-integration) MATCHES the real `main.ts` bootstrap sequence (`initSuperTokens` → `NestFactory.create` → `useWebSocketAdapter` → `enableCors`). No drift.

---

## Journey-map check (item 2)

No drift. `user-journey-map.md` shows every prior config/backend-only wave (e.g. wave-27, wave-29, wave-30) as **annotation-only, "NO new route/screen/endpoint"** regens. This wave touches only response headers + a 429 envelope body — zero user-visible surface, no route/screen/endpoint/schema change. The wave correctly claims NO journey change; a journey/route claim here WOULD be drift, and neither spec nor plan makes one. Consistent.

---

## Spec-gap detection (item 4) — NON-BLOCKING

**GAP (informational, not rework):** The spec and plan scope helmet strictly to `apps/api/src/main.ts` HTTP responses and do NOT mention **Socket.IO / WS upgrade requests**, even though StudyHall runs 4 live Socket.IO namespaces (`/messaging`, `/presence`, `/study-timer`, `/study-room`) that share the same API origin and carry the same credentialed SuperTokens WS-upgrade auth (product-decisions L73 resolved-decision **#6**: "WS/LiveKit auth = SuperTokens session cookie on upgrade").

**Why it is NOT a breakage and NOT a blocker (verified in code):** each gateway declares its **own** `@WebSocketGateway({ cors: { origin: WEB_ORIGIN, credentials: true } })` block — the WS handshake CORS is handled by the engine.io/`IoAdapter` layer, **independent** of the Express middleware stack where helmet registers. Express-level helmet middleware does not run on the WS upgrade path, so it cannot inject CORP/COEP onto handshakes or strip the gateway CORS headers. The fenced-off CORP/COEP therefore do not touch WS regardless. So there is no drift against decision #6 and no functional risk.

**Recommendation (carry to T-8, non-blocking):** T-8's deployed cross-origin proof should include at least one authed **Socket.IO** connection (e.g. `/messaging` or `/presence`) post-helmet, to empirically confirm the WS handshake is unaffected — since "helmet silently breaks a cross-origin path" is the named failure mode and WS is the second credentialed cross-origin surface the spec's AC8 (HTTP-only) does not cover. The spec should note Socket.IO explicitly so verification does not miss it. This is a spec-completeness note, not a code/plan drift.

---

## Summary

- **Verdict: APPROVE.** All 9 ACs + the plan MATCH prior decisions.
- The load-bearing CSP/CORP/COEP fence (AC6) and the preserve-cross-origin-flow constraint (AC8) are correctly consistent with the established CORS + SuperTokens SameSite=Lax cross-origin architecture (product-decisions L73 #6 + #10) and the real deployed split origins.
- No blocking drift. No conflicting prior decision.
- **One non-blocking GAP:** spec omits Socket.IO/WS. Live code proves helmet (Express middleware) cannot affect the engine.io WS-handshake CORS path, so it is not a breakage — but T-8 should add a post-helmet authed Socket.IO cross-origin check and the spec should name WS explicitly.
