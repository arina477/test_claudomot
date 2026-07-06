# Wave 54 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-54/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The reframe is factually sound and I verified its load-bearing premise directly in code, not on the sub-agents' word. The seed's "app-wide UUID sweep to close info-disclosure leaks" assumed other Socket.IO gateways leak raw DB errors on malformed ids the way the wave-53 study-room site did. That is false: `study-timer.gateway.ts:187` and `messaging.gateway.ts:132` both use bare `} catch {` blocks (no error binding at all) and emit hard-coded literal strings — they are structurally incapable of forwarding `err.message`; presence rejects malformed ids via Zod `.uuid()` pre-DB and its two error-binding catches log server-side then disconnect/no-op without emitting the error to the client; study-room carries the wave-53 `safeErrorMessage` fix at 7 sites; and a repo-wide grep for the leak signature (err.message emitted to a client) returns zero matches outside the fixed study-room. The info-disclosure class is genuinely already closed — zero remaining leaking sites — so the sweep as a leak-fix would have been validation theater, and the orchestrator correctly refused to build it (no isUuid-B, no shared WS-filter, no REST changes). What survives is a regression-lock: the catches are safe-by-construction but untested, so a future refactor silently reintroducing `err.message` forwarding would go uncaught. Locking that closed with a per-gateway negative test is genuine, if modest, durable value that traces to the live bet's named privacy-posture differentiator (`ad1a3685`), and folding in the wave-53 V-2 canonical-error-string spec-gap is a legitimate byproduct. Deferring 344eabde (a genuinely-untested `who_can_dm='server-members'` privacy control) to N-1 rather than bundling a distinct DM-REST surface into a WS-gateway wave is the correct anti-grab-bag call. The 6 ACs are each falsifiable — the leak-token-absence assertions name concrete forbidden tokens (Postgres/Drizzle/SQL/table/column/query/userId) plus still-denied and canonical-string checks — the plan maps every AC to a step with a single cohesive specialist (websocket-engineer), non-goals are fenced explicitly, and the sub-floor override-ship is correctly resolved by rule (PRODUCT rule 5: mvp-thinner floor-blocked with zero valid split candidate, no BOARD). This is a "bug that doesn't matter" avoided and a real regression-lock retained — worth a wave, thin but honestly scoped.

## Stage-exit checks (Phase 1 walk)

**P-0 Frame**
- [x] Problem names a concrete user job / root cause — reframed from a false symptom (assumed leaks) to the real, verified state (class closed; untested). Root-cause-correct.
- [x] Maps to exactly one live bet — `ad1a3685` (privacy posture as the Discord differentiator) + milestone M8 `84e17739` (in_progress), both cited.
- [x] Falsifiable — observable signal: a malformed non-UUID id yields a generic response with named leak-tokens absent and still-denied; a refactor forwarding err.message fails the lock.
- [x] problem-framer (REFRAME) + ceo-reviewer (SCOPE-REDUCTION) present and reconciled; not silently overridden — mvp-thinner (OK/floor-blocked) also present.

**P-1 Decompose**
- [x] One seed, no siblings that must ship together; cross-surface 344eabde correctly excluded, not bundled.
- [x] Every AC mvp-critical or re-classified — B (isUuid) dropped by both reviewers, not smuggled in.
- [x] No dependency on an unbuilt out-of-bundle task.

**P-2 Spec**
- [x] 6 ACs enumerated, each independently verifiable (leak-token-absence, still-denied, canonical-string, no-regression).
- [x] Edge cases enumerated (timer non-UUID, messaging non-UUID, presence Zod-rejected, valid-UUID non-member not genericized away). No user-facing UI surface (test + constant only) so empty/loading/error/offline states N/A — design_gap_flag false is correct.
- [x] Non-goals explicit (no isUuid-B, no WS-filter, no REST).
- [x] Security-adjacent surface flagged for T-8 (class-stays-closed); wave_touches is info-disclosure hardening, NOT auth/payments/sessions/CSRF/rate-limit/user-creation — the Phase-2 security second-iteration rule is not forced.
- [x] Spec contract embedded as fenced YAML head in the primary task's `tasks.description` (verified via psql).

**P-3 Plan**
- [x] Reuses established mechanism (wave-53 safeErrorMessage/isUuid stay; one shared constant), invents no parallel path.
- [x] No unneeded infra — no schema, migration, endpoint, or dep beyond one string constant.
- [x] Each step maps to a bundle task + observable artifact (spec regressions + full suite run).

**Security-scope tightened gate**
- [x] Assessed: this is a security-adjacent regression-lock; the tests ARE the T-8 evidence. The tightened gate applies at T-8/P-4 Phase-2 but the second-mandatory-iteration trigger (auth/payments/sessions/csrf/rate-limit/user-creation ∩ wave_touches) does not fire — info-disclosure hardening is out of that set. No block.

## Non-blocking note (carry to Phase 2 / B-block, not a REWORK)
- AC5 phrasing ("used across WS gateway rejection catches") reads broader than the plan's correct scope-guard (only the unknown/cast-failure generic path is standardized; distinct authz-denial messages like "Forbidden: not a member…" stay as-is). Spec edge-cases and plan §Architecture-deltas are internally consistent on this, so it is not ambiguous to the builder — flag only so karen/jenny confirm the constant swap does not touch the authz-denial literals.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

# Wave 54 — P-4 Verdict (Phase 2 merge)

**Phase:** 2 (Karen + jenny + Gemini) · **Attempt:** 1 · merged by orchestrator (records independent statuses)

| Reviewer | Verdict | Notes |
|---|---|---|
| **karen** | **APPROVE** | 7/7 claims VERIFIED. Reframe premise factually correct — study-timer:187 + messaging:131 are bare `catch{}` emitting literals (cannot forward err.message); presence Zod `.uuid()` pre-DB; study-room's only err.message path is HttpException-gated (wave-53 fix); repo-wide grep = no other gateway leaks; REST global filter at main.ts:121. Scope-guard confirmed (canonical swap touches only the unknown/cast-failure generic path, not authz literals). websocket-engineer in AGENTS.md; no schema. No antipattern (the reframe IS the correct refusal of validation theater). |
| **jenny** | **APPROVE** | 4/4 drift checks MATCH. Spec/plan faithful to the [2026-07-06] REFRAME decision; canonical-string swap is journey-invisible (no flow depends on the literal text); **authz-denial semantics preserved by construction** — generic (`catch{}`) and denial (`if !member`) are SEPARATE branches (study-timer :189 vs :196; messaging :133 vs :138), plan scope-guards the denial literals explicitly; 344eabde correctly deferred to wave-55 N-1 (anti-cross-surface-bundling). |
| **Gemini** | **UNAVAILABLE** | exit=3, `UNAVAILABLE: HTTP 429`. Degrades — does not block. |

## Merged Phase-2 outcome: PASS
Karen + jenny APPROVE; Gemini UNAVAILABLE (degrades). Security-scope tightened gate armed but not tripped. **P-block gate PASSED.**

## B-block carries (enforce at B-6 / V-block)
1. **karen + jenny (B-6 + V):** swap ONLY the in-`catch` generic literals (study-timer.gateway.ts:189 `'Internal error checking membership'`, messaging.gateway.ts:133 `'Internal error checking channel access'`) to the canonical constant. Leave the ADJACENT authz-denial `Forbidden:` literals (study-timer :196, messaging :138) UNCHANGED.
2. **V-block/T-8 assert:** a valid-UUID non-member still receives the specific denial ("not a member" / "cannot view channel"), NOT the generic constant.
3. Keep wave-53's `safeErrorMessage` + isUuid guard in study-room untouched (only align its generic fallback to the constant).

## Footer
- verdict_complete: true
- phase2_pass: true
- gate_result: PASSED → design_gap_flag false → B-0 (skip D)
