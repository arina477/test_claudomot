# Wave 61 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-61/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The wave fixes a real, correctly-framed read-path bug, not the wrong problem: I confirmed in code that there is ONE global throttler (app.module.ts:30-35 — `ThrottlerModule.forRoot([{ttl:60_000, limit:10}])` behind `APP_GUARD` ThrottlerGuard, lines 60-63), and that all three DM read routes in dm.controller.ts (`@Get()` conversations ~:87, `@Get(':id/messages')` ~:130, `@Get('candidates')` ~:166 on the separate DmCandidatesController) carry NO `@Throttle` override — so a page-load burst of concurrent DM reads trivially exhausts the shared 10/60s per-IP budget and 429s legitimate traffic. The seed's original "two buckets to align" premise was wrong; the P-0 problem-framer REFRAME→round-2 PROCEED correctly re-grounded it to a per-route-override fix, and the corrected cause holds against the code. The fix is minimal and architecture-consistent: a bounded per-route `@Throttle({default:{limit:60,ttl:60_000}})` (a single hardcoded constant — NOT a new configurable knob, satisfying antipattern #6), applied reads-only, following the exact verified precedent at users.controller.ts:62 (`@Throttle({default:{limit:120,ttl:60_000}})`). On security scrutiny (rate-limit surface), the direction is SAFE and appropriately conservative: the change loosens an over-tight READ limit but retains a finite per-IP cap (60/60s), preserves the global 10/60s default on every other route, leaves DM WRITE/POST routes unchanged, and — critically — the rejected alternative (raising the GLOBAL limit) is explicitly noted in P-3 as an abuse-surface widening, so the narrower per-route override is the correct choice; 60/60s (6x default) is justified by the concrete three-read burst pattern and is neither reckless-loose nor too tight. The client backoff is bounded (fixed max attempts + delay cap, never infinite), honors Retry-After, and is explicitly NOT applied to DM writes. All five ACs are falsifiable (throttle-limit value, 429-under-burst behavior, per-IP cap retention, write-route unchanged, bounded-retry) and testable at T-8. The floor-waiver (single-task, ~40 LOC, cited wave-16/21/50 exemption lineage for a real correctness fix reusing shipped infra) and scope-fence (all three P-0 reviewers PROCEED/HOLD-SCOPE/OK, no adjacent unbuilt M8 scope pulled in) are sound. This is contract-correct ~2/10-value last-M8-tail drainage with no spec or security defect; per gate direction I do not REWORK for scope size. design_gap_flag=false is correct (backend throttle config + client fetch-retry, no UI surface) → hands to B-block.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini (merged) — GATE PASSED (security-scope-tightened gate: no BLOCK, no 2nd pass forced)
- **karen (a7d0d4658549c1039): APPROVE** — 6/6 claims VERIFIED against source. ONE global throttler (app.module.ts:30-35,60-63); 3 DM read routes (dm.controller.ts:87/130/166) have NO override; DM writes (:64/:106) untouched; users.controller.ts:62 @Throttle(120/60s) precedent real; client DM reads via shared request<> helper (api.ts:58-71,719/737/751) with NO existing 429 handling; Throttle importable. Non-blocking: 60/60s is deliberately HALF the users 120/60s precedent (=6x global) — T-8 confirm the constant is 60 not 120.
- **jenny (aa10ee4404cb3c2db): APPROVE** — all 5 items MATCH. No conflicting rate-limit policy (only prior = wave-4/5 login throttle, orthogonal); 60/60s conservative (half a shipped precedent); reads-only+bounded = safety-preserving (writes+others keep 10/60s, finite cap retained, unsafe raise-global alternative rejected); no config-knob drift; no journey delta; fixing 874bd233 (present correctness bug) correctly distinguished from deferred 999a14d1 (scale-ahead). Security-sane: GET-only, participant-gated, finite cap.
- **T-8 carry-forward (both reviewers):** live-verify (a) DM writes still 10/60s, (b) DM reads accept 60/60s, (c) constant is 60 not 120, (d) no route left un-throttled after the edit.
- **Gemini:** see P-4-gemini-review.md (UNAVAILABLE=degradable non-block).
GATE PASSED → design_gap_flag=false → B-0.
