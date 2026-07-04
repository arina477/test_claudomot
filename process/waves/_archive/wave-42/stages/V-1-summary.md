# Wave 42 — V-1 Reviews summary

Independent Karen + jenny (no shared context) vs deployed LIVE state (merge 07ebda95; api 035be230 + web ef4fc034).

## Karen — source-claim: **APPROVE** (8/8 claim groups, 0 contradictions)
Migration 0019 real + prod-applied (to_regclass verified; live routes 401 not 500-on-missing-table). Backend submitAssignment idempotent-upsert + return-clear, returnSubmission cross-assignment guard, assertMember/assertOrganizer gates, mySubmission embed — all present; 4 routes registered, member-presign before /assignments/:id. Shared AssignmentSubmissionSchema.id + refine + mySubmission exported. Frontend StudentSubmitForm/OwnSubmissionCard/isOrganizer + role=dialog focus-trap + aria-live + 4 api.ts helpers present. Live: 4 routes 401 unauth, /health 200, bogus 404 (real guard discrimination). Web serves index-BCqGLUBX.js containing submission UI. T-4: 14 real it() cases, CI 28689560816 success with real ms timings (not decorative/skipped). Deferrals (student-submit-button UI E2E c50f3040; attachment-presign integration T4-F1) disclosed + tracked.

## jenny — semantic-spec: **APPROVE** (0 drift; 3 notes)
0 spec drift. Every AC intent holds LIVE: member submit→200 w/ id; idempotent upsert (same id, count stays 1); mySubmission on DTO (null when absent); member-gated presign w/ server-derived anti-spoof; organizer roster w/ submitter identity + resolved attachment URL; return sets returnedAt+comment; NO grade/score anywhere. Critical edge verified: resubmit-after-return CLEARS returned_at+organizer_comment. Empty-submit 400 (all 3 variants), cross-assignment return 400, unknown 404, text>5000/comment>2000 400, null-comment allowed. Journey browser-verified: educator roster → Return dialog (acknowledgement-only, no grade) → row flips green RETURNED (0/1→1/1), sibling stays Awaiting. Student "Your Work" form correctly absent for A (intended isOrganizer gate, spec-conformant). Env gap (fixture B broken → no live non-member session) covered by T-4 real-PG (cases 6/8/12 passed).
- **V1-F1 (jenny→Karen-lane, cosmetic):** `assignments.controller.ts:53` comment says `manage_channels` but the running code uses `manage_assignments` (stale comment; Karen-verified the actual can() string is manage_assignments). Doc-only.

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 3
spec_drift_count: 0
spec_gap_count: 0
jenny_false_positives_documented: 0
findings:
  - {id: V1-F1, src: jenny, sev: cosmetic, kind: stale-comment, scope: in-scope, area: backend, file: "apps/api/src/assignments/assignments.controller.ts:53 (+ service:56)", desc: "comment says manage_channels; code uses manage_assignments. Doc-only cosmetic.", route: V-3-fast-fix-or-debt}
  - {id: V1-F2, src: jenny, sev: env, kind: fixture, scope: in-scope, desc: "fixture B broken → no live non-member session; 403 negatives covered by T-4 real-PG. Tracked task c50f3040.", route: existing-task}
  - {id: V1-F3, src: karen+jenny, sev: none, kind: deferrals-disclosed, desc: "student-submit-button UI E2E + attachment-presign integration deferrals genuinely disclosed", route: none}
```
