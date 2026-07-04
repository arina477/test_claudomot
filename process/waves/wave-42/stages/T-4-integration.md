# Wave 42 — T-4 Integration (active — specs authored + executed in CI)

CI runs real-PG integration (test:ci + DATABASE_URL_TEST) but the B-block didn't author submission specs → T-4 authored them (Pattern B active).

- **Authored:** `apps/api/test/integration/assignment-submissions.integration.spec.ts` (14 cases, matches the wave-41 moderation.integration.spec harness: skipIf(!DATABASE_URL_TEST), real-PG setup/teardown, harnessQuery DB assertions). test-automator (commit c3f7449 + biome-fix c986044).
- **Executed in CI (run 28689560816 SUCCESS — real Postgres, NOT skipped):**
  1. submit happy path (row in DB + mySubmission on getAssignment) ✓
  2. idempotent resubmit (no duplicate row) ✓
  3. resubmit clears return (returned_at + organizer_comment nulled after resubmit) ✓
  4. submit empty text → 400 ✓ / 5. empty-string → 400 ✓
  6. non-member submit → 403, serverId derived from assignment row (IDOR-safe) ✓
  7. organizer roster (submitter identity, no grade/score) ✓ / 8. plain member roster → 403 ✓ / 9. empty assignment → 200 empty ✓
  10. organizer return sets returned_at+comment ✓ / 11. cross-assignment guard → 400 ✓ / 12. non-organizer return → 403 ✓ / 13. return unknown submissionId → 404 ✓
  14. no grade/score field in DTO or roster ✓
- **Boundaries covered:** migration 0019 schema (assignment_submissions) exercised by real inserts/selects; submit/list/return service methods invoked with real DB; authz gates + IDOR + idempotency + cross-assignment guard all real-PG-verified.
- **Finding (T4-F1, LOW):** attachment presign paths not integration-covered (need live S3 creds unavailable in the service-only CI test env); text-only submissions fully exercise the state machine + authz. Attachment auth verified separately at T-8 live.
- **Process note (T4-F2, LOW → L-2):** the spec initially failed CI at biome lint (test-automator ran tsc but not `pnpm lint` before push) — same "run biome ci locally before push" lesson; fixed in one cycle.

```yaml
test_pattern: active
skipped: false
boundaries_audited: [assignment_submissions schema, submitAssignment, presignSubmissionAttachment(text-only), listSubmissions, returnSubmission, mySubmission on getAssignment]
ci_evidence: ["run 28689560816 SUCCESS — 14 submission integration cases executed real-PG + passed"]
active_run_output: "14/14 pass in CI"
infrastructure_gap_recorded: false
findings:
  - {severity: low, boundary: "submission attachment presign", description: "attachment path not integration-covered (no S3 creds in CI test env); verified live at T-8"}
  - {severity: low, boundary: "process", description: "spec initially failed CI biome lint (tsc-only local check); L-2 candidate — biome ci before pushing test files"}
```
