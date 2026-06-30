
## Recurring process issue — automated CI agent keeps editing the engineering-rules file out of turn (3rd time)
**What:** The CI/deploy agent (head-ci-cd) again added rules to the shared engineering-principles file during the deploy step (waves 9, 12, and now 17). Principle changes are supposed to happen only in the dedicated end-of-wave "learn" step, where they're vetted. Each time it's been reverted with no harm to the shipped work, but the behavior keeps recurring and an observation-only nudge hasn't stopped it.
**Impact:** Low (caught + reverted each time; no bad rule shipped). But it's wasted cycles + a discipline gap.
**Recommendation:** Add a mechanical guard — a check at the deploy-step exit that rejects any edit to the principles files outside the learn step (a one-line git-diff gate), so it's prevented by construction rather than by repeated cleanup. This is a small framework/agent-card tightening. Surfaced for awareness; the loop continues meanwhile.
