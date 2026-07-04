# Wave 44 — P-1 Decompose

## Maximum size rubric
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~12–20 (ClassCalendar/SessionForm/SessionDetail responsive+a11y; AssignmentCard/SubmissionsRoster + return positioning; MemberListPanel padding; assignments.controller stale comment; scheduling shared schema + service DTO; unit + E2E test files; fixture-B re-provision) | > 60 | no |
| New primitives | ~0 net-new (all edits to shipped surfaces + test additions; the only "new" is test specs + a couple DTO fields) | > 60 | no |
| Estimated net LOC | ~900–1,400 (polish edits + DTO fields + unit tests + 1 E2E + fixture-B fix) | > 5,000 | no |
| Stage-4 working set | small (~100K) | > 350K | no |

**Max verdict:** not tripped.

## Wave type
`claimed_task_ids = [8e54799a (seed), 8828484f, ca43eb12, 683fec9b, 8d971bc2, 0308cdf1]` → length **6** → **multi-spec**.

## Minimum floor
- multi-spec floor: net LOC `> 2,500` OR `claimed_task_ids.length >= 6`.
- LOC ~900–1,400 (below 2,500) BUT **length = 6 → floor MET via the `>= 6` condition** (whichever first). No floor-merge. (A debt-clearing bundle of 6 small items — legitimately above floor by count.)

**Verdict:** PROCEED (multi-spec, no split, floor met via length≥6).

## Blocked-dependency handling (P-0 flags — carried to P-3/B, not a split)
- **ca43eb12** (delete-any 2-client E2E): depends on fixture-B. B-block re-provisions fixture-B first (resolves the now-un-stranded c50f3040), THEN authors the E2E. If fixture-B re-provision proves infeasible in B, ca43eb12's E2E is deferred-in-task (backend already proven wave-41 T-4/T-8) and the task partially completes (the affordance-hidden-for-non-mod verification via source).
- **8d971bc2** (assignment test coverage): the UNIT half + text-only submission coverage is buildable now; the attachment-presign INTEGRATION AC is deferred-in-task (CI test env lacks Tigris/S3 creds).

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Rationale: ALL 6 items are polish/coverage on ALREADY-SHIPPED + ALREADY-DESIGNED surfaces (class-scheduling [design/class-scheduling.html], assignment-submissions [design/assignment-submissions.html], member-moderation [design/member-moderation.html]). The T6-F1 responsive fix + a11y + padding + DTO + tests introduce NO new UI surface needing a mockup — they correct/extend existing adopted designs. **D-block SKIPS → P-4 hands off directly to B.**

```yaml
wave_type: multi-spec
verdict: PROCEED
floor_merge_attempt: 0
design_gap_flag: false
```
