# L-2 Karen Rule-Quality Vet — wave-19

**Candidate:** obs-1 → CI-PRINCIPLES rule 3 (CI false-green: `gh run watch --exit-status` masks per-job failure).

## VERDICT: APPROVE-PROMOTION

Final exact rule text (format-verified, numbered 3):

```
3. Gate merge on per-job conclusions from `gh run view --json jobs`; never on `gh run watch --exit-status` alone.
   Why: The watch tool reflects the last-streamed job state, not the aggregate required-job result.
```

## Criteria

**1. Recurrence ≥2 waves — SAME class CONFIRMED.**
- wave-19 (`C-1-pr-ci-merge.md:25,73`): `gh run watch 28465263636 --exit-status` exit 0; per-job conclusions via `gh run view --json jobs` = `lint: failure` + `test: failure`. Trusting watch exit would have merged a red build.
- wave-11 (`_archive/wave-11/blocks/L/observations.md` obs-1, lines 9-19): `gh run watch --exit-status` exit 0 on run 28410747924 while suite conclusion = failure and `secret-scan` FAILED; explicitly "the tool reflects the exit status of the last-streamed job [e2e, passing], not the aggregate run conclusion."
- Identical mechanism in both: watch exit 0 reflecting last-streamed job; aggregate required-job result is failure; per-job conclusions authoritative. Two distinct waves, two distinct run IDs.
- Conflation guard: wave-17 (Turbo strict-env strips DATABASE_URL_TEST → suite silently skips exit 0) is a mechanistically DISTINCT false-green (skip-suppression, watch tool not the agent). Correctly excluded by the synthesizer. The C-1 artifact's loose "3rd instance (waves 17/18)" prose (line 73) is superseded by observations.md, which correctly narrows the rule to the watch-exit class = w11 + w19 only. Promotion is scoped to the narrowed class. Recurrence holds on exactly the two same-class instances.

**2. Format — PASS.** Rule line 92 chars (≤120); why line 90 chars (≤100, recount — observations.md's "75" miscount is immaterial since both readings are within limit); exactly 2 non-empty lines; ends in periods; no forbidden tokens (backtick commands are not parentheticals); sequential (file has 1-2, candidate = 3); falsifiable (checkable at every C-1: was the gate derived from per-job conclusions or watch exit alone?).

**3. Non-dup — PASS.** Rule 1 = deploy-state-endpoint vs /health; rule 2 = new-route 404-flip after deploy-state SUCCESS. Both are deploy-verification axis. Candidate is the PR-CI merge-gate tooling axis (per-job conclusions vs watch exit). Genuinely new. No near-dup.

**4. Actionable + correct — PASS.** Concrete, mechanically followable directive (read `gh run view --json jobs` per-job conclusions; never trust `gh run watch --exit-status` alone). Technically correct: `gh run watch --exit-status` exit reflects streaming/last-completed job, not aggregate run conclusion — independently corroborated in both wave artifacts.

## Disposition
All four criteria hold. APPROVE-PROMOTION as CI-PRINCIPLES rule 3, conditional on head-ci-cd domain sign-off per the per-file cap (max 1/wave; this is the only CI-PRINCIPLES promotion this wave — obs-5 correctly HELD as single-wave). Promote under the existing `## Rules` section as rule 3.

Note (out of scope for this vet, flagged): obs-4 (principles-file bypass, 5th recurrence) requires reverting the unauthorized "L-2 promotion candidates" section from VERIFY-PRINCIPLES.md before L-block closes; the rule-3 promotion edit to CI-PRINCIPLES.md must be the only principles-file write this L-block.
