# Wave 87 — T-block findings aggregate

| # | Severity | Layer | Finding | Blocking? |
|---|---|---|---|---|
| 1 | low | T-5/e2e | Pre-existing non-required e2e sign-in visibility timeout flake (delete-any-message.spec.ts:53, rule-11 class). Unrelated to wave-87; failed on #107 + #108 but e2e is not branch-protection-required. | non-blocking |
| 2 | info | B-6/analytics | educator-analytics.service.ts:104-113 "No role" synthetic bucket empties as new joins carry the default role. Non-breaking (breakdown still reconciles to memberCount); correct consequence of the invariant. | non-blocking |

Both are V-2 inputs. No critical/high findings. Wave behavior verified at unit (828) + integration (#108 Postgres 4/4) + deploy (/health 200).
