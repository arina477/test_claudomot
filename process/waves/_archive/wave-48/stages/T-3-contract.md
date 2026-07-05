# T-3 — Contract (wave-48)

**Pattern:** A — Verified-via-CI / light. Skip-adjacent: no NEW API/SDK contract surface.

## Skip / light rationale
This is a TEST-ONLY wave. The `GET /dm/candidates` endpoint, its request/response DTOs, and the `who_can_dm` enum contract are ALL UNCHANGED — they shipped and were contract-tested at wave-46/47. The new spec verifies EXISTING behavior of the service query behind that endpoint; it introduces no new Zod schema, no new typed error code, no new route, no SDK boundary. The B-6 gate confirmed the branch touches only 2 test/harness files — zero production/DTO/schema change.

Therefore T-3 has no new contract to test. Recorded as light-verify (CI-verified: the contract the test relies on is unchanged and the existing contract tests remained green in the C-1 run — lint/typecheck/test all pass on the merge commit, confirming no contract drift).

## Action — CI evidence
C-1 run 28710662037: typecheck + full test suite green on merge commit. No DTO/schema diff (bypass grep + B-6 both confirm test-only). The existing `who_can_dm` union type is re-used honestly by the harness param (string-literal union, type-enforced at call sites — see T-1).

```yaml
test_pattern: ci-verified
skipped_light: true
skip_reason: "no new API/SDK/DTO/Zod contract surface; GET /dm/candidates + who_can_dm enum unchanged (shipped wave-46/47). Test verifies existing behavior."
ci_evidence:
  - "C-1 run 28710662037: typecheck + test green; no DTO/schema diff (B-6 + bypass grep confirm test-only)"
findings: []
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-3
  reviewers: {}
  failed_checks: []
  rationale: >
    No new contract surface: the DM-candidates endpoint, its DTOs, and the
    who_can_dm enum are all unchanged from wave-46/47. The wave adds test
    coverage of existing behavior only. The contract the new test depends on
    stayed green in CI (typecheck + test on the merge commit). Nothing to
    contract-test; light-verify recorded. No applicable check fails.
  next_action: PROCEED_TO_T-4
```
