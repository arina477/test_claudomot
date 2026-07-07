# T-2 — Unit (wave-69) [Pattern A — CI-verified]
CI `test` job (run 28832468543) green: apps/api 764 unit + apps/web 633 (618 + 15 new moderation-reports.test.tsx). New coverage: ReportDialog (submit/validation/double-submit-disabled/error), ReportInbox (action→resolve/row-leaves/moderator-gate/error), affordance wiring (rule-12 through-parent).
Coverage audit: report dialog + inbox + affordances covered; backend service unit-covered + integration (T-4). No coverage theater — the moderation tests assert behavior through real parent callers.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job run 28832468543 green (api 764 + web 633 unit)"]
findings: []
```
