# Wave 85 — B-3 Frontend (react-specialist)
```yaml
files: [apps/web/src/shell/AssignmentCard.tsx (handleToggle + local StatusErrorToast), apps/web/src/shell/assignments.test.tsx (updated the existing failing-toggle test)]
snapshot_restore: "const prev = assignment.myStatus captured before optimistic flip; catch restores prev (removed the assume-opposite). Deps [assignment.id, assignment.myStatus, onStatusChange, announce] — no stale closure."
visible_toast: "local StatusErrorToast (aria-hidden, #ef4444, WarningCircleIcon, 3500ms) mirroring ReportDialog Toast visual; wired ONLY into AssignmentCard (shared extraction across 9 sites = spun-out 3b878f96)."
a11y_double_announce: "toast aria-hidden=true (visual only); onAnnounce sr-only owns AT — announced EXACTLY ONCE."
tests: "updated existing assignments.test.tsx (no new file): (1) real-prop-wiring restore, (2) rapid double-toggle race (each toggle restores its OWN captured prior + announce once per failure), (3) visible toast + announce-once. TEST-HONESTY verified: 2/3 FAIL on the old assume-opposite/console-only code (announce + toast surfaces), PASS on fix."
honest_note: "status is binary => revert VALUE identical between assume-opposite and snapshot-restore per call; genuine improvements = visible error surface + a11y announce (was console-only) + per-invocation race-safety + correct-by-construction code."
results: "web test 787 pass; tsc clean; biome clean; /simplify no-change"
commit: 64c3b3eb
deviations: none
```
