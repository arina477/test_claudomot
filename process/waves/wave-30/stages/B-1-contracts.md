# Wave 30 — B-1 Contracts (SKIPPED)
No shared contract surface: the reminder cron is internal (no HTTP endpoint), and `EmailService.sendAssignmentReminder`'s param is an inline TS type (no `@studyhall/shared` type / Zod / OpenAPI). The new `assignment_reminder` table is B-0 schema, not a contract-package change.
```yaml
skipped: true
contracts_authored: []
fast_path_approved: false   # B-3 also skipped (backend-only); no B-2∥B-3 race
deviations: []
```
