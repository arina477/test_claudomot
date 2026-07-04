# Wave 43 — B-1 Contracts

typescript-pro authored `packages/shared/src/scheduling.ts` + index exports:
- ScheduledSessionSchema/ScheduledSession (incl. resolved organizer identity, recurrence enum none|weekly, recurrenceUntil nullable).
- CreateScheduledSessionSchema/Input (title 1..200, +.refine endsAt>startsAt + weekly recurrenceUntil>=startsAt).
- UpdateScheduledSessionSchema/Input (partial + same conditional refines).
- ScheduledSessionListResponseSchema {sessions:[...]}.
recurrence CLOSED z.enum(['none','weekly']); NO reminders/RSVP/timezone/ICS. Date-parse refines, no date lib. Shared typecheck clean. Deviation: none.

```yaml
skipped: false
contracts_authored: [packages/shared/src/scheduling.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
