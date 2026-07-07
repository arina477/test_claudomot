# P-1 Decompose — wave-69 (M14 moderation bundle #1)

## Maximum rubric (all four)
- Files touched: ~16-20 — api: reports schema+migration, reports service+controller, ModerationService/MessagesService integration for actioning, discover-unlist (servers.service updateServer already supports is_public=false), pg-harness integration test; web: report affordance/modal + owner report inbox surface + api client; + tests. Under 60.
- New primitives: ~8-10 — reports table (+target_type enum), POST /reports, GET owner reports inbox, report-action endpoint(s), student report modal, owner inbox surface, report-action reuse of ModerationService. Under 60.
- Est net LOC: ~2800 (report substrate+endpoints+authz ~600; action loop reusing ModerationService/deleteMessage ~500; report UI modal + owner inbox ~900; tests incl live-DB ~800). Under 5,000.
- Working set: moderate (api+web+design brief). Under 350K.
→ Max rubric: no threshold trips.

## Wave type + floor
- claimed_task_ids = [9f2bb017, d7250881, 96d5ed58] → length 3 → **wave_type: multi-spec**.
- Multi-spec floor: net LOC > 2,500 OR >= 6 specs. Est ~2,800 > 2,500 → **ABOVE FLOOR → PROCEED** (no override-ship needed; genuine substantive multi-spec feature).

## Verdict: PROCEED (above floor)
claimed_task_ids = [9f2bb017, d7250881, 96d5ed58]. floor_merge_attempt: 0 (not sub-floor).

## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "Student report affordance/modal: report a public server (on /discover listing) / a member / a message — new report-submission surface (reason picker + submit); reuses DS form primitives + modal chrome but the report flow/copy is a new surface"
  - "Owner report inbox: a new surface for a server owner/moderator to see incoming reports + take an action (timeout/message-delete/unlist/dismiss) — new list+action surface; prior art design/member-moderation.html (moderation) may partially cover the action UX; the report-inbox list is new"
```
→ Routes P → **D** → B (new report + inbox UI surfaces; safety-critical UX warrants a design brief; reuse member-moderation.html + DS primitives as prior art).

```yaml
wave_type: multi-spec
verdict: PROCEED (above floor)
floor_merge_attempt: 0
claimed_task_ids: [9f2bb017-fd19-464d-ab2b-c13ed75c04bb, d7250881-eb30-40fc-880a-95cf055c2425, 96d5ed58-ccc9-482a-a469-ec714edb7962]
design_gap_flag: true
