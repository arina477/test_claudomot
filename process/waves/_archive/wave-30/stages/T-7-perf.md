# T-7 — Perf (wave-30 M5 reminders) — SKIPPED

## Skip decision
**SKIPPED.** Per dispatcher skip rule (T-7 fires only on heavy waves / perf-budget-at-risk).

wave_type=backend, not heavy. The cron runs once per hour and its work is bounded by a tight window filter (`due_date > now() AND due_date <= now()+24h AND is_deleted=false`), so it scans only the small set of imminently-due assignments, then one recipient query + one INSERT-RETURNING per (assignment × non-done member). B-6 already resolved the N+1 (due_date threaded from the window query into `sendReminderIfNew`, eliminating the per-member re-query). No client bundle change (web untouched). No perf budget at risk.

```yaml
test_pattern: skipped
skipped: true
skip_reason: "Not heavy — hourly cron over a tight-window-filtered tiny dataset; N+1 already resolved at B-6; no bundle change (web untouched)."
findings: []
