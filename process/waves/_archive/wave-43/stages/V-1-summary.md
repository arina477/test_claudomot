# Wave 43 — V-1 Reviews summary

Independent Karen + jenny (no shared context) vs deployed LIVE (api e7f1f7a + web 7b0bc478; PR #57).

## Karen — source-claim: **APPROVE** (0 blocking, 2 informational)
Migration 0020 (scheduled_sessions 12 cols + FKs + composite index) live. Backend: both createSession guards (endsAt + the e7f1f7a weekly-recurrenceUntil) + updateSession effective-value re-check + IDOR row-derived server_id. 5 routes registered + 401-guarded live (404 control confirms genuine guarding). Shared Zod .datetime()+refines exported. Frontend + full shell wiring present. api serves e7f1f7a (verified via Railway GraphQL), web index-C8KFLd6n.js contains scheduling UI. T-4 22 cases ran real-PG in CI 28693093402 (all ✓, 0 skipped/failed). Deferrals (student-read-only E2E, T6-F1, M3) disclosed. Notes: T-4 spec at HEAD not merge (correct wave ordering); web@7b0bc478 vs api@e7f1f7a (documented api-only redeploy).

## jenny — semantic-spec: **APPROVE** (0 critical/high; 1 Medium + 3 Low)
Every AC intent satisfied live: organizer one-off+weekly CRUD; compute-on-read weekly expansion (shared id, distinct startsAt, capped at recurrence_until AND 90d — verified 6-occ/84-day + 1-occ narrow); single-field PATCH cross-field validation both directions (B-6 H1); IDOR-safe serverId derivation (injected serverId ignored); soft-delete/404; closed-enum; continuous authoring→calendar→detail→edit/delete journey no dead-ends; NO RSVP/reminder/timezone/ICS/grade anywhere.
- **V1-F1 (Medium, drift, → V-2):** the ScheduledSession DTO omits the spec-listed createdAt/updatedAt (projection gap; no AC depends on it). Add them to the DTO OR amend P-2.
- **V1-F2 (Low, P-2 text):** POST returns 201 (not the spec's 200) — a HEALTHIER status, not a defect; fix the P-2 wording.
- Non-member/non-organizer 403 negatives not live-reproducible (fixture B broken) → deferred to T-4 real-PG.

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 4
spec_drift_count: 1
spec_gap_count: 0
jenny_false_positives_documented: 0
findings:
  - {id: V1-F1, src: jenny, sev: medium, kind: drift, scope: in-scope, desc: "ScheduledSession DTO omits spec createdAt/updatedAt (projection gap; no AC depends)", route: V-2}
  - {id: V1-F2, src: jenny, sev: low, kind: p2-text, desc: "POST 201 vs spec 200 (healthier status; P-2 wording fix)", route: noise}
  - {id: V1-F3, src: karen+jenny, sev: none, kind: deferrals-disclosed, desc: "student-read-only E2E + T6-F1 + M3 disclosed", route: none}
```
