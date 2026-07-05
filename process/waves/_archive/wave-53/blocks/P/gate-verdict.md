# Wave 53 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-53/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-53 drains a penetration-tester-verified (wave-52 T-8 F-1) info-disclosure straggler on the shipped study-room realtime surface, and every load-bearing claim in the spec and plan checks out against the actual code (verified by Read, not inference). Framing is cause-not-symptom: the four gateway parsers (lines 522-562) genuinely validate `serverId` as string+non-empty but NOT UUID-format, so a malformed id reaches the uuid cast in `assertMember` (service:169-177) and the raw Drizzle error is forwarded verbatim at the catch (gateway:371-373) — the fix at the parse layer is the correct root-cause layer, with catch-block hardening as defense-in-depth. The reusable-guard-now / app-wide-sweep-deferred split (sibling c52a7a52, top-level M8 seed, correctly parented NULL so it stays N-2-seedable) is sound: the sweep is unbounded (unknown site count, needs an audit) and clearly exceeds one clean PR, so both ceo-reviewer's guardrail and mvp-thinner's THIN converge on deferring it. The single-spec floor waiver (obs-B 4th instance, PRODUCT rule 5 promoted wave-52) is correctly applied — a genuine security fix with zero valid merge candidate, not a wasteful greenfield micro-wave. The 6 ACs are falsifiable and observable: the no-leak assertions explicitly name what must be ABSENT (Postgres/Drizzle error text, SQL query text, table/column names, echoed userId — AC1), the denial is asserted separately (AC2), and all non-happy states are covered — ForbiddenException passthrough kept un-genericized (AC3, real: service throws the exact quoted message and the gateway forwards err.message today), unknown-error → generic + server-side log (AC4), and missing/empty/non-string serverId falls to the existing "serverId required" branch (edge-cases block). Prior-art reuse is real: `isInvalidTextRepresentation` exists in pg-error-utils.ts with the documented cause-walk, and `z.string().uuid()` is the established convention in presence.ts + rbac.ts (rbac.ts:23 even validates `serverId: z.string().uuid()`). Every AC maps to a file-level step in P-3, specialist routing (websocket-engineer, AGENTS.md:85) is valid, and no schema/deps/UI are introduced (design_gap_flag false, correctly → B-block, skip D). The one mechanical detail (gateway must add the `ForbiddenException` import) is a trivial B-3 builder concern, not a spec gap.

## Security-scope tightened gate assessment
`wave_touches` = {WS-auth-guarded error-handling + input-validation on the /study-room gateway}. This intersects **sessions/auth** in the sense that the surface sits behind `installWsAuthMiddleware` + `assertMember`, and the finding is a security finding — so the security-scope-tightened gate correctly ARMS (T-8 Security re-verify + the ≥2-Phase-2-iteration rule are in scope). Note it does not touch payments, csrf, rate-limit, or user-creation, and — critically — the finding is info-disclosure ONLY, not auth bypass (request stays fully DENIED; leaked id is the caller's own session). The tightened rule's second-Phase-2-iteration trigger only *bites* on a Phase-2 BLOCK carrying >2 medium-or-higher findings; it does not force rework absent that condition. The arming is correct and the fix is a net hardening of an auth-adjacent surface with no new attack surface introduced.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

# Wave 53 — P-4 Verdict (Phase 2 merge)

**Phase:** 2 (Karen + jenny + Gemini merged)
**Attempt:** 1
**Merged by:** orchestrator (records independent reviewer statuses; does not arbitrate)

## Per-reviewer status

| Reviewer | Verdict | Notes |
|---|---|---|
| **karen** | **APPROVE** | All 6 load-bearing claims VERIFIED against real code: (1) 7 catch blocks forward raw err.message @ 196/220/372/399/421/443/465; (2) parsers check type+non-empty but NOT UUID format @522-569; (3) assertMember uuid cast @service:169-174; (4) prior art real — isInvalidTextRepresentation @pg-error-utils.ts + z.string().uuid() convention (presence.ts/rbac.ts); (5) websocket-engineer @AGENTS.md:85; (6) no schema/migration (git diff clean, uuid.util absent = correct pre-build). No antipattern matched (no symptom-scrub, no wrong-layer, no gold-plating — sweep correctly split). Cosmetic: subscribe-catch cited as 371/372 interchangeably (same block). |
| **jenny** | **APPROVE** | No drift. All spec items MATCH prior decisions or are net-new with no conflict. Load-bearing disambiguation: the wave-40:510 REFRAME forbids ParseUUIDPipe + UUID-validating opaque-text ids (users.id). Wave-53 clears BOTH — it uses an isUuid() boundary check (NOT ParseUUIDPipe) and guards serverId (a REAL uuid column, server_members.server_id), never userId (session-derived, opaque-text, untouched). Sibling c52a7a52 top-level-seed disposition matches the M8 hardening-tail pattern. No /study-room flow depends on the raw error text (the raw text IS the finding). |
| **Gemini** | **UNAVAILABLE** | Helper exit=3, review file begins `UNAVAILABLE: HTTP 429`. Degradable per P-4 gate semantics — does NOT block; gate proceeds on Karen + jenny. |

## Merged Phase-2 outcome: PASS
Karen APPROVE + jenny APPROVE; Gemini UNAVAILABLE (degrades, not a block). No material CONCERN to triage. Security-scope tightened gate armed but not tripped (no Phase-2 BLOCK). **P-block gate PASSED.**

## B-block carries (non-blocking watch-items surfaced at the gate)
1. **jenny (B-6 watch):** the isUuid() guard MUST apply to serverId only — do NOT extend it to any userId / opaque-text field, or it re-trips the wave-40:510 anti-opaque-text-UUID precedent. Plan already scopes it correctly (P-3 L10/L16/L21); enforce at B-6 review.
2. **head-product:** gateway must add the `ForbiddenException` import for the defense-#2 catch-block passthrough (mechanical B-3 detail).
3. roomId is an in-memory Map key (not DB-cast) → already leak-safe; guard MAY validate it for consistency but it is not the leak source (do not over-invest).

## Footer
- verdict_complete: true
- phase2_pass: true
- gate_result: PASSED → design_gap_flag false → B-0 (skip D-block)
