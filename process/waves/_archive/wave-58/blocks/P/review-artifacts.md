# Wave 58 — P-block review artifacts
**Block:** P · **Wave topic:** harden delete-any-message E2E — deterministic cross-client fan-out assertion (a1dda389) · **Gate:** P-4 · **Status:** gate-passed → B (D skipped)
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | done — PROCEED (minimal); design_gap false | done |
| P-1 | done — single-spec, floor override (obs-B 9th) | done |
| P-2 | done — spec in a1dda389.desc | done |
| P-3 | done — race-free hard assertion; test-automator | done |
| P-4 | done — head-product APPROVED; karen+jenny APPROVE, Gemini 429. PASSED. Carry: realtime-round-trip ready-gate + verify-it-gates |
- **Wave topic:** apps/web/e2e/delete-any-message.spec.ts:146-162 verifies cross-client realtime fan-out (message:deleted → client B) as a SOFT-CHECK (waits 8s, logs DELIVERED/NOT_DELIVERED, passes REGARDLESS via .catch + console.log, no expect gates it) — the single-client-realtime anti-pattern. In wave-45 T-5: NOT_DELIVERED_IN_WINDOW yet passed. Fix: deterministic assertion — await client B's channel-join ack before the delete, then hard-expect message:deleted receipt on B in a bounded retried window. Test-only, no production change (RBAC/IDOR portions of the spec already hard-asserted; backend fan-out proven at wave-41 T-4/T-8). wave-45 V-2 F2, medium test-debt.
- Short-circuit no-prior-spec. Milestone M8 (in_progress), backfilled. design_gap_flag FALSE (e2e test-only). UI/e2e wave → mvp-thinner spawns.
- claimed [a1dda389]. Autonomous mode. Note: M9-Monetization ACUTELY flagged for founder (non-pausing).
## Gate verdict log
<head-product P-4>
