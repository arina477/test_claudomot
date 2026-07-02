# Wave 37 — V-1 Summary
Both reviewers ran independently vs live prod + merged main. Both APPROVE.
## Karen (source-claim) → APPROVE
All 7 claim clusters TRUE: 10 files + migrations 0015/0016 on main; notifications table + index + 2 partial-uniques; routes live (GET/PATCH/POST 401, old POST /:id/read → 404 = HIGH-1 fix); bundle serves 86b7323 (markers present); B-6 HIGH fixes landed (api.ts PATCH, HeaderBell reload-on-open, controller.spec method-drift); @OnEvent persist + no-self-notify + edit-dedup. No undocumented fakery. Note: CLAUDOMAT_DB_URL = brain DB not app DB → prod-migration inferred from live-endpoint behavior + C-2's authoritative index verification (consistent).
## jenny (semantic-spec) → APPROVE
All 3 specs' INTENT confirmed LIVE (2 fixtures): persist-on-mention durable+enriched cross-session, no self-notify, edit-dedup (twice-edited → 1 row); owner-404 (B→A's notif 404, nonexistent 404, unauth 401, owner 200, idempotent); web center (bell SoT count, mentions-only live socket, §113 states, click-marks-read, PATCH/POST verbs correct). All 5 bindings honored. **Reminder "gap" reframed: createForReminder persists the in-app row BEFORE the email send → the durable reminder notification is created even without Resend creds; only LIVE-PUSH is the documented non-goal.** 0 drift, 0 material gap.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
karen_findings_count: 0
jenny_findings_count: 0
spec_drift_count: 0
spec_gap_count: 0
```
