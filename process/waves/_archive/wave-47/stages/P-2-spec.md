# Wave 47 — P-2 Spec (pointer)
Spec contract in `tasks.description` of seed `10967558`. wave_type: **multi-spec** (2 blocks). design_gap_flag: **false**. claimed: [10967558, 379978a4].
- **10967558**: GET /dm/candidates (server co-members, who_can_dm-filtered, self+nobody-excluded, deduped) + StartDmPicker source rewire (dm/candidates, not servers/:id/members) + remove DmHome server-gate → DMs STARTABLE (cures F-A). Scope-fenced: co-members only, no directory/typeahead.
- **379978a4**: client self-id = true opaque users.id (not username) → self-exclusion + optimistic author correct (cures wave-46 F7 "Unknown user").
```yaml
p_stage_verdict: COMPLETE
spec_location: "tasks.description of 10967558"
wave_type: multi-spec
design_gap_flag: false
claimed_task_ids: [10967558-f27f-4f47-81be-5b5e5d878259, 379978a4-0497-449f-8807-4cffe53d1436]
```
