# Wave 35 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 gate)
**Reviewed against:** process/waves/wave-35/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The wave's core promise — ENFORCED (not cosmetic) profile privacy plus IDOR-safe data export — is proven **live** at the strongest available layer. T-8 (load-bearing) reproduced both CRITICAL negative-paths against prod with two distinct verified fixtures (A+B, co-members of server ad62cd12): profile-visibility roster hiding is server-side enforced (`nobody` → A ABSENT from co-member B's roster while A still sees self; `server-members` → co-member-visible; `everyone` → restored), and data-export is structurally session-scoped (`?userId=<B>` silently ignored on both `/profile/data` and `/profile/data/export`). Auth boundary (401 unauth + malformed bearer, control 404), enum validation (400 zod error, no bad write, stored value unchanged), and email-PII-absent-from-roster all PASS — 0 CRITICAL/HIGH. T-5 e2e (6/6 flows) confirms the honest Visible/Hidden control persists across reload, who-can-DM is a genuinely-disabled affordance (0 enabled inputs, aria-disabled), download yields self-only JSON, and /privacy + /terms public stubs render 200. T-6 shows no layout regressions on dark theme at 1280/390. On the coverage question: the wave added NO dedicated automated tests for the new privacy endpoints (MEDIUM, tracked). I judge this **honest debt, not a gate-blocker** — the gap is explicitly surfaced in findings-aggregate (the opposite of coverage theater / false-green), the user-observable security behavior is proven at the highest-fidelity layer (live prod reproduction, not mock-count assertions), and T-block does not adjudicate which findings block — V-2 does. The suite tells the truth about what it proves and what it does not; that is precisely the T-9 bar. Honest N/A calls (notifications-panel surface does not exist → states AC N/A) and the LOW pre-existing "Last updated 2024" cosmetic are documented, not silently skipped. No fabricated evidence detected; every PASS cites a concrete live probe or CI run.

## Coverage-honesty ledger
| Layer | Claim | Evidence quality | Verdict |
|---|---|---|---|
| T-1 static | 0 TS bypasses | CI green on merge 0c71585 | adequate |
| T-2 unit | CI 326/327; no NEW privacy tests | honest gap flagged → V-2 | adequate-with-tracked-debt |
| T-3 contract | new privacy endpoints untested | honest gap flagged → V-2 | adequate-with-tracked-debt |
| T-4 integration | migration+services; new endpoints untested | honest gap flagged → V-2 | adequate-with-tracked-debt |
| T-5 e2e | 6/6 live PASS | live bundled-chromium probes + screenshots | solid |
| T-6 layout | no regressions | live diff 1280/390, token check | solid |
| T-8 security | 0 CRIT/HIGH; 2 CRITICAL negative-paths reproduced live | two-fixture live prod reproduction | LOAD-BEARING, solid |

## Coverage gap disposition (MEDIUM, no dedicated privacy tests)
- NOT REWORK. The security behavior is live-proven; the gap is a *regression-test* absence, which is exactly V-2's classification job (likely `bug-test` / accepted-debt with a follow-up test task candidate). Forcing a test task at T-9 would pre-empt V-2 and is not warranted when the user-observable outcome is proven at the live layer. Consistent with prior-wave precedent (e.g., 02fa8011 real-PG tier carried across waves as tracked debt, never a gate-block, when live/CI proof existed).

## Escalation
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
