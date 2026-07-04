# Wave 43 — P-0 Frame

## Discover section
- **wave_db_id:** 9845e57d (wave_number 43)
- **Prior-work citation:** M8 slice 1 (educator role + moderation, wave-41) + slice 2 (assignment collect/return, wave-42) shipped. Assignments module (assertOrganizer=can(manage_assignments)/assertMember/soft-delete/rowToDto + AssignmentForm.tsx) is the prior art this slice mirrors.
- **Roadmap milestone:** M8 (84e17739), in_progress, H2, class=product-feature. wave milestone_id backfilled.
- **Spec-contract short-circuit verdict:** `no-prior-spec` (decomposer prose). Full P-1..P-3.
- **Product-decision resolutions:** none Tier-3 (reuses RBAC + assignments patterns; no money/security-regime). **Carry:** M8 `## Success metric` `_TBD by founder_` — re-surfaced non-blocking (escalated) at wave-42 N-1; safe for this founder-named core slice.

## Reframe section
- **Original framing:** M8 slice-3 class scheduling — seed 535bdb8c (scheduled_sessions entity + scheduling module + educator authoring UI) + siblings cdf81427 (calendar view) + 1216146e (session detail). CRUD only (no reminders/RSVP/timezone/ICS).
- **problem-framer verdict:** PROCEED (file P-0-problem-framer.md). Root-capability correct; authz reuse REAL (assignments.service.ts:68 can(manage_assignments); assertMember:81; soft-delete; IDOR serverId-from-row). manage_assignments is the CORRECT existing permission (rbac.service.ts:31-35 = closed 5-boolean set; a scheduling flag would be unwarranted schema+wiring with no consumer). The mirror is code-organization not schema-clone (due_date vs starts_at/ends_at+recurrence correctly a different schema — no over-forced reuse). Antipatterns #2/#4 avoided. **2 non-blocking flags → P-1/P-3:** (1) recurrence is the live rabbit-hole risk — hold "simple weekly" to a bounded closed-enum descriptor + recurrence_until, explicitly fence out RRULE/iCal/per-instance overrides; split to a sibling if sizing shows creep. (2) prefer single-row-plus-descriptor (compute occurrences on read) over materialized per-occurrence rows — P-3 approach call.
- **ceo-reviewer verdict:** PROCEED / HOLD-SCOPE (file P-0-ceo-review.md). Right thing (founder-named, dependency-ordered; a shared class calendar is a canonical coursework artifact Discord lacks). Right ambition (end-to-end on ship: educator authors → students see via calendar + detail; NOT inert backend-only). "Simple weekly recurring" is the right minimal recurrence (dropping to one-off-only would under-shoot; recurrence-engine would over-shoot). Fence (no reminders/RSVP/timezone/ICS) correct. Metric-TBD safe for this founder-directed core slice.
- **mvp-thinner verdict:** OK / `flag_metric_undefined: true` (file P-0-mvp-thinner.md). Can't thin against undefined metric (contract-barred). Non-binding note: "simple recurring" is the sole real split candidate; calendar view (read-side of scheduling) + session-detail view (edit/delete entry) are intrinsic, not deferrable.
- **Mediation outcome:** no ceo/mvp conflict (ceo HOLD-SCOPE, mvp OK). No re-spawn. All-PROCEED → P-1.
- **Sibling task IDs created:** none new (bundle authored by decomposer).
- **Disposition:** PROCEED (scope held; recurrence-boundedness + compute-on-read carried to P-1/P-3; recurrence-split available if P-1 sizing shows creep).

### Final framing (rest of P-block uses this)
**Wave-43 = M8 class scheduling: a scheduled_sessions entity (one-off + BOUNDED simple-weekly recurring) + scheduling module reusing the assignments authz pattern + educator authoring UI + student calendar view + session detail. CRUD only, NO reminders/RSVP/timezone/ICS. (multi-spec: seed 535bdb8c + siblings cdf81427, 1216146e)**
- P-1/P-3: bound recurrence to a closed enum + recurrence_until (fence out RRULE/iCal); prefer single-row+descriptor computed-on-read over materialized occurrence rows; split recurrence to a later sibling if sizing shows creep.
