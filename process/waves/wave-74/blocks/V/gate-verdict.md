# Wave 74 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, Phase 1 gate)
**Reviewed against:** process/waves/wave-74/blocks/V/review-artifacts.md (+ V-1-karen.md, V-1-jenny.md, V-1-summary.md, V-2-triage.md)
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both reviewers legitimately APPROVE and both APPROVEs are deployed-state-evidenced, not paraphrased — I independently re-verified the load-bearing claims against the deployed tree at commit **d79dd18** (`git show d79dd18:<path>`) and live prod (`/health` → HTTP 200), rather than accepting the reviewers at face value. Confirmed live: (1) `TIER_CAPS.free.maxServersPerOwner = 100_000` with the 646-owner non-restriction rationale; (2) `EntitlementsService` is strictly SELECT-only (zero insert/update/delete in the deployed service); (3) the `createServer` gate is real and pre-insert (`servers.service.ts:84` throws `ForbiddenException` when `currentServerCount >= caps.maxServersPerOwner`); (4) the binding verify-gate test's two THROW assertions use cap=0 and cap=1 — **independent of the placeholder value** — so raising free to 100_000 did NOT weaken the load-bearing throw paths (no `.skip`/`.only`/`xit`); (5) the Stripe/price fence is airtight (the only matches are exclusion-list comments; zero functional fields); (6) module wiring is acyclic (one-way ServersModule→EntitlementsModule) and the live 200 proves a clean DI boot; (7) no substrate drift since d79dd18 (only docs commits on top → deployed = reviewed tree). The in-wave free-cap regression (initial cap=100 blocked the 646-server fixture owner) was **genuinely resolved, not papered over**: the fix raised the placeholder to 100_000 in production code (not by loosening a test or assertion), and T-5 re-ran the authed create-server e2e GREEN on d79dd18; the non-restriction claim is arithmetically sound (646 < 100_000).

V-2 triage is honest: no load-bearing finding was downgraded. The lone blocking-eligible candidate — the createServer read-then-insert **TOCTOU** (count-and-check at `servers.service.ts:82-88` runs strictly before the `db.transaction` at :91) — is a genuine defect *shape* but is **unreachable as a defect at cap=100_000** (a concurrent race can add at most a handful of servers to a ~646-max owner, never approaching 100_000). It is correctly classified LOW/non-blocking and deferred to the real-charging M9 slice where low caps make it reachable; I confirmed via the DB that the M9 follow-up hardening task(s) were actually persisted (2 open matching rows under milestone `3e507bc0…`), so the finding was routed, not dropped. The one remaining item is the stale `=100` doc-comment at `servers.service.ts:79` — cosmetic, runtime value is correctly 100_000, correctly routed to L-1 tidy (noise, not a finding to fix in-block). 0 blocking is correct; no finding that should block was suppressed; no green-by-suppression. Fast-fix queue is empty → Phase 2 skipped. V-block exits to L.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
