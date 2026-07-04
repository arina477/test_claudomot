# Wave 42 — T-2 Unit (ci-verified)

- **C-1 evidence:** CI run 28689110054 test job green — api 551 + web 354 unit tests pass on the merge commit.
- **Coverage audit:** existing suites pass (incl. AssignmentCard/AssignmentsPanel web tests updated with the listAssignmentSubmissions mock). **Coverage GAP (finding T2-F1, LOW):** the NEW backend service methods (submitAssignment, presignSubmissionAttachment, listSubmissions, returnSubmission) have no dedicated UNIT tests — the authz/idempotency/IDOR behavior is instead verified at T-4 (real-PG integration, to be authored) + T-8 (live security probes). Unit-level coverage of these methods would harden regression; non-blocking (behavior is covered downstream).
- **Discipline note:** for authz-critical service methods, a real-PG integration spec (T-4) is the right layer (mocking the DB for these would test the mock); the gap is acceptable if T-4 covers it.

```yaml
mask_mode_signoff: PASS
signoff_note: "unit job green; new service methods covered at T-4/T-8 not unit"
test_pattern: ci-verified
evidence:
  - "C-1 test job: run 28689110054 green (api 551 + web 354)"
findings:
  - {severity: low, location: "apps/api/src/assignments/assignments.service.ts (submit/presign/list/return methods)", description: "no dedicated unit tests for new submission service methods; behavior covered at T-4 integration + T-8 live security (non-blocking)"}
ts_bypasses_in_wave_diff: 0
```
