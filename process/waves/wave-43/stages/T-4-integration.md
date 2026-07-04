# Wave 43 — T-4 Integration (active — specs authored + executed in CI)

CI runs real-PG integration; scheduling specs authored at T-4 (not in B-block) → Pattern B active.

- **Authored:** `apps/api/test/integration/scheduled-sessions.integration.spec.ts` (22 cases, matches the assignment-submissions.integration harness). test-automator (commit a5ef4d1; biome clean pre-push this time — wave-42 T4-F2 lesson applied).
- **First CI run (28693016290):** 21/22 PASS, 1 FAIL — "create weekly with recurrenceUntil before startsAt → 400". Root cause (a REAL defense-in-depth gap the spec caught): the test calls createSession directly (bypassing the controller Zod parse); createSession had a defensive endsAt>startsAt guard but NO defensive weekly-recurrenceUntil>=startsAt guard (updateSession already had both from B-6 H1). Production HTTP path was already correct (Zod refine rejects it at the controller 400) — this is service-level defense-in-depth only.
- **Fix (e7f1f7a, node-specialist):** added the mirror weekly-recurrenceUntil guard in createSession. Redeployed api to e7f1f7a (SUCCESS, commit verified) so the deployed artifact == verified main.
- **Re-run CI (28693093402) SUCCESS — all 22 scheduling cases PASS real-PG:** create happy + non-organizer→403 + validation (ends<=starts→400, weekly-until<starts→400) + update happy + B-6 H1 single-field-PATCH bypass→400 (both directions) + authz/IDOR (non-organizer update/delete→403, serverId derived, softDelete excludes) + get (member 200 / non-member 403 / unknown 404) + list ordering + weekly recurrence expansion (correct occurrence count, shared base id, distinct startsAt, capped at recurrence_until, 90d window cap) + none-once + no-reminders/RSVP/ICS.
- **Boundaries covered:** migration 0020 schema exercised; all 5 service methods + recurrence expansion real-PG-verified; authz + IDOR + validation + the B-6 H1/M2 hardening.

```yaml
test_pattern: active
skipped: false
boundaries_audited: [scheduled_sessions schema, createSession, updateSession, softDeleteSession, getSession, listSessionsForServer+recurrence]
ci_evidence: ["run 28693093402 SUCCESS — 22 scheduling integration cases executed real-PG + passed"]
active_run_output: "22/22 pass in CI (after createSession defensive guard fix e7f1f7a)"
infrastructure_gap_recorded: false
findings:
  - {severity: low, boundary: createSession, description: "service-level defensive weekly-recurrenceUntil guard was missing (HTTP path already Zod-protected); added e7f1f7a + integration-verified. Caught by T-4."}
```
