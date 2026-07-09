# Wave 83 — P-4 Block-Exit Gate Verdict (Phase 1)

**Gate:** P-4 (Product block exit)
**Reviewer:** head-product (fresh independent review — not a rubber-stamp)
**Wave:** 83 — API security-headers hardening (helmet SAFE flat headers + x-powered-by removal + generic ThrottlerGuard 429 body)
**Mode during P-block:** automatic
**Verdict:** **APPROVED**

---

## Independent verification performed (not taken on trust)

| Claim under review | How verified | Result |
|---|---|---|
| ParseUUIDPipe premise evaporated (already fixed wave-33/40 + regression-locked) | Read source: `apps/api/test/integration/malformed-uuid-params.spec.ts` EXISTS; `SupertokensExceptionFilter` wired at `main.ts:121`; `22P02`→400 handling in `apps/api/src/auth/pg-error-utils.ts` | CONFIRMED — the malformed-uuid→500 class is genuinely closed + regression-locked. Drop was correct. |
| Security-headers premise is live | Read `apps/api/src/main.ts`: NO helmet / HSTS / hidePoweredBy wiring present | CONFIRMED — premise live and unfixed. |
| main.ts owns credentialed CORS + SuperTokens middleware order | Read `main.ts`: `enableCors({ credentials:true, allowedHeaders:[...getAllCORSHeaders()] })` + explicit `supertokens.init()` ordering guarantees + comment-documented middleware sequence | CONFIRMED — the AC8 clobber risk is real; supertokens-integration ownership is correct. |
| Throttler present, version | `apps/api/package.json`: `@nestjs/throttler: ^6.5.0`; `ThrottlerGuard` as `APP_GUARD` in `app.module.ts` | CONFIRMED — v6 (not v5/v7). Reinforces the SDK-version-verify checklist necessity. |
| DB spec = pointer copy | `SELECT description` on `875b97f4…` | CONFIRMED — DB is source of truth, richer than pointer (edge-cases + SDK config block + contracts). 9 ACs match. |

---

## Judgment against the six gate questions

### 1. Framing soundness — SOUND
Dropping the ParseUUIDPipe seed as an evaporated premise is the correct call, and independently verified: the regression-lock spec + exception filter + pg-error-utils all exist in-tree. Re-seeding as ParseUUIDPipe would have been actively harmful (would 400 opaque-text SuperTokens ids — a rejected convention). The re-seeded security-headers wave is well-framed: premise live-verified (x-powered-by present, no HSTS), problem stated at symptom AND cause level (fingerprint-hygiene + framework-class leak), correctly classified as LOW/no-exploit defense-in-depth in the founder's bug-fix phase. P-0 ran both mandated reviewers (problem-framer PROCEED + ceo-reviewer SELECTIVE-EXPANSION) and mediated them as complementary — legitimate, not a spawn skip.

### 2. Floor-waive legitimacy — LEGITIMATE (correct PRODUCT-5 application, not process-dodging)
Single-spec floor (1,500 LOC) trips at ~150 LOC. The waive is justified because RESCOPE-AUTO-MERGE is genuinely un-runnable: roadmap is 14/14 complete, no `in_progress`/`todo` milestone exists to author expansion siblings from. There is no valid merge candidate — bundling unrelated security tasks (e.g. the httpOnly-cookie 9535895f soft-note) would contradict the P-0 CSP/CORP fence and raise blast radius, exactly what the floor is NOT meant to force. This is the "feature with no valid split is exempt" branch of PRODUCT-5, not a convenience dodge. The wave is at its natural coherent size: the flat-safe-headers baseline is the minimal slice that isn't under-shipping (HSTS-only) or over-reaching (bespoke CSP). No BOARD required (floor-waive with no split candidate is escalation-exempt).

### 3. Spec quality — STRONG; all 9 ACs falsifiable + observable
Each AC is a checkable predicate against live HTTP responses: header present with exact value (AC1-4), header absent (AC5-6), 429 body string-absence + status + Retry-After (AC7), cross-origin credentialed flow succeeds (AC8), untouched path unchanged (AC9). AC8 is correctly identified as LOAD-BEARING and is the highest-risk item — it is the failure-mode guard for the entire change (helmet silently breaking the SPA's cross-origin fetch). It is testable at T-8 and the spec correctly demands the proof be against DEPLOYED state (a green unit test is explicitly called insufficient), naming the concrete web origin `web-production-bce1a8`. The edge-cases block (preflight OPTIONS, unauthed/error responses carrying headers, http-dev HSTS harmlessness, authRateLimiter untouched, helmet-vs-CORS ordering) closes the non-happy-path gaps. This is a well-constructed spec.

### 4. Plan soundness — SOUND
Routing B-3 to `supertokens-integration` is correct and evidence-backed: main.ts is the file with the credentialed-CORS + SuperTokens ordering contract, and that agent authored/owns it (used successfully wave-82). A generic backend edit here is exactly the clobber risk AC8 guards. The CSP/CORP/COEP fence is explicit in BOTH spec (AC6 + SDK config `contentSecurityPolicy:false` etc.) and plan (architecture-delta + failure-domain note). The SDK pre-build checklist is present and correctly insists on verifying option names against the INSTALLED helmet major (v7→v8 renamed `xFrameOptions`) rather than coding to an assumed API — reinforced by my finding that throttler is v6 (not the version some snippets assume), so version-drift discipline matters here. The edge-HSTS-at-Railway alternative is considered and rejected with a valid reason (not in-repo/testable, wouldn't fix x-powered-by or the 429 body). Self-consistency sweep maps all 9 ACs to steps.

Minor, non-blocking: the plan pins helmet `^8` while throttler is `^6`; B-3 must resolve the actual installed helmet version at build (the checklist already mandates this) — no rework needed.

### 5. Scope discipline — CLEAN
The selective-expansion (flat headers beyond HSTS) is justified and correctly bounded: helmet is added anyway for HSTS, so the on-by-default flat headers are zero-marginal-cost, and HSTS-only would be a 3/10 slice of a same-cost 9/10 outcome. The bound is hard and explicit: NO bespoke CSP/CORP/COEP (would break cross-origin). No gold-plating (no invented CSP policy, no touching the already-clean Express authRateLimiter path — AC9 explicitly fences that off to avoid a double-fix). No under-scoping (x-powered-by + 429 body are both in the original seed and retained). Altitude is right.

### 6. Security-scope note for Phase 2 — ON RADAR
This wave touches rate-limit (ThrottlerGuard) and is CORS/session-adjacent (helmet ordering vs SuperTokens credentialed CORS), so it falls under the security-scope-tightened gate's domain. Flagging for Phase 2: if the T-block / V-block surfaces >2 medium findings on a BLOCK and the fix loop runs ≥2 Phase-2 iterations, the security-scope-tightened gate at P-4 § "Security-scope tightened gate" applies and Phase 2 should tighten accordingly. The single highest-leverage watch item is AC8 (deployed cross-origin credentialed flow) — a helmet CORP/COEP leak or a middleware-ordering regression there is the medium-or-higher finding most likely to appear.

---

## Rework instructions
None (APPROVED).

## Escalations
None carried, none raised.

---

```yaml
verdict: APPROVED
verdict_complete: true
rework_attempt_cap_remaining: 3   # attempt 1 of 3
phase: 1
security_scope_tightened_gate_on_radar: true   # rate-limit + CORS/session-adjacent; watch AC8 in Phase 2
floor_waived_reviewed: true                     # PRODUCT-5 application confirmed legitimate
mandatory_spawns_verified: [problem-framer, ceo-reviewer]   # both ran at P-0; complementary mediation, not a skip
```

---

## Phase 2 — Karen + jenny + Gemini (merged)

**Verdict: APPROVED** (gate passes — Karen APPROVE + jenny APPROVE; Gemini UNAVAILABLE/degraded).

- **karen: APPROVE** — all 6 load-bearing claim clusters VERIFIED at file:line. CORS+SuperTokens order (main.ts:111-115 enableCors credentials:true + getAllCORSHeaders; SuperTokens init :88, filter :119); no helmet wired (grep empty); @nestjs/throttler@6.5.0 APP_GUARD at app.module.ts:33-38,66-69 with default message "ThrottlerException: Too Many Requests"; Express authRateLimiter (main.ts:31-67) separate + already-generic (correctly untouched); helmet absent from package.json + lockfile; helmet v8 option-rename a real concern (SDK checklist correct); config-only accurate.
- **jenny: APPROVE** — all 9 ACs + plan MATCH prior decisions (#10 SameSite=Lax, #6 WS auth); the CSP/CORP/COEP fence is drift-AVOIDANCE (consistent with the real web≠api origin split); journey map no drift (zero user-visible surface). NON-BLOCKING GAP folded into spec: Socket.IO WS is the 2nd credentialed cross-origin surface — jenny confirmed in code helmet can't touch the WS handshake (per-gateway IoAdapter cors, independent of Express stack), so NO breakage; T-8 mandate added to prove an authed WS cross-origin connect still works post-helmet.
- **Gemini: UNAVAILABLE** — helper exit 3 (HTTP 429 rate-limit). Degrades per P-4 Action 3; does not block. Recorded in P-4-gemini-review.md.

**Security-scope note:** wave touches rate-limit + is CORS/session-adjacent. Phase-2 returned no BLOCK (0 medium+ findings), so the ≥2-Phase-2-iteration security-scope-tightened gate did NOT trigger. Single Phase-2 pass suffices.

## Footer (Phase 2)
- verdict_complete: true
- gate_result: APPROVED (Phase1 APPROVED + Phase2 Karen/jenny APPROVE + Gemini UNAVAILABLE)
