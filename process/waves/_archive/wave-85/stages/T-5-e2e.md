# Wave 85 — T-5 E2E (LIVE, deployed bundle index-DbePiYZE.js)
```yaml
test_pattern: active
skipped: false
assignments_surface: "server 'M3 Verify ...' Assignments channel; input[data-testid=status-toggle] in article[data-testid=assignment-card] (tester created+deleted a probe assignment)"
happy_path_toggle: PASS      # todo<->done optimistic flip persists (PUT /status 200), no error toast on success, toggled back clean
forced_failure_toast: PASS   # fetch-override rejecting PUT .../status: VISIBLE red-bordered toast (border rgb(239,68,68), "Couldn't update assignment. Please try again.", bottom, ~360x66, persists >1s then auto-dismiss)
forced_failure_revert: PASS  # status REVERTED to PRIOR value (todo->todo, NOT stuck-flipped, NOT wrong-direction) — the snapshot-restore fix works live
sr_announcement: PASS        # sr-only aria-live=polite carries the same message (announce-once)
console: "only expected — 6x intentional [AssignmentCard] status toggle failed (guarded catch); 1 transient 401 (token race, delete succeeded 204); benign pre-existing PWA icon 404"
findings: []
```
The wave-85 fix is verified LIVE on the deployed bundle: prior-status restore + visible red error toast + SR announcement all behave as specified. Prod left as found (probe deleted).
