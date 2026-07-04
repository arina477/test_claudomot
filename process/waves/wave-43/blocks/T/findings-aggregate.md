# Wave 43 — T-block findings aggregate

## T-2 (unit)
- [LOW] T2-F1 — no dedicated unit tests for new scheduling service methods (esp. recurrence expansion); covered at T-4/T-8.
## T-3 (contract)
- [LOW] T3-F1 — Create/Update refine + .datetime() negative cases asserted at T-4, not standalone contract tests.

## T-4 (integration)
- 22/22 scheduling real-PG cases PASS in CI (run 28693093402). Recurrence expansion + authz + IDOR + validation all verified.
- [LOW→resolved] T4-F1 — createSession lacked a service-level defensive weekly-recurrenceUntil guard (HTTP already Zod-protected); T-4 caught it, fixed e7f1f7a, api redeployed. Resolved this wave.
