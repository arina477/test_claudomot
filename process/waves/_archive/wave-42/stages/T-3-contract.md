# Wave 42 — T-3 Contract (ci-verified, Pattern A)

Contracts authored at B-1 are project-internal Zod/shared types (packages/shared/src/assignments.ts) — Pattern A; CI typecheck + build validate shapes server↔client.

- **CI evidence:** run 28689110054 typecheck + build green on merge → shared Zod compiles; api service + web client both consume the same source (AssignmentSubmissionSchema, SubmitAssignmentSchema, presign/list/return schemas, AssignmentSchema.mySubmission). No server↔client shape drift (the same repo-wide typecheck that caught the B-6 submission-`id` drift is green post-fix).
- **Coverage audit:** each schema is consumed (service Zod-parses request bodies; frontend types responses). **Observation (T3-F1, LOW):** the negative-case for SubmitAssignmentSchema.refine (reject empty text AND no attachment → 400) is exercised at the API boundary but a dedicated contract/integration assertion for it is added at T-4. Covered downstream.

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [AssignmentSubmissionSchema, SubmitAssignmentSchema, AssignmentSubmissionPresignResponseSchema, AssignmentSubmissionRosterRowSchema, AssignmentSubmissionsListResponseSchema, ReturnSubmissionSchema, AssignmentSchema.mySubmission]
ci_evidence: ["run 28689110054 typecheck+build green on merge 07ebda95"]
active_probe_results: []
infrastructure_gap_recorded: false
findings:
  - {severity: low, contract: SubmitAssignmentSchema.refine, description: "text-or-attachment negative case asserted at T-4 integration, not a standalone contract test"}
```
