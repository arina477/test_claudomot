# Wave 41 — T-9 Journey (gate)
## Phase 1 — head-tester: APPROVED
Moderation authz proven honestly at 2 layers (T-4 real-PG + T-8 live pen-test): both rank guards, both mute paths, non-mod 403, IDOR — concrete behavioral outcomes, not asserted. delete-any UI deferral acceptable (backend triple-proven; fan-out reuses shipped deleteMessage path). T-7 skip correct. Not false-green.
## Phase 2 — journey regen (ui+auth wave; shell-affordance additions to existing pages → targeted annotation, not full crawl; T-5/T-8 live-verified the affordances)
- Added wave-41 annotation: M8 educator role + light moderation LIVE (moderate_members perm, timeout+delete-any, rank guards, member-roster moderation UI). Version 0.27 → 0.28.
```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_note: "ui+auth wave; shell-affordance additions to page-13 Roles + page-9 roster → targeted annotation (T-5/T-8 live-verified the affordances, not a full re-crawl)"
regen_diff: {routes_added: [], routes_removed: [], coverage_gaps: ["delete-any UI E2E (V-2 follow-up)"]}
findings: []
```
