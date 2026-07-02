# Wave 37 — V-2 Triage
Inputs: T-findings (F37-T5-1, F37-T5-2) + B-6 INFO nit + Karen (0) + jenny (0). **0 blocking** (both APPROVE; owner-404 IDOR reproduced live + CI; no drift/fakery).
| Finding | Bucket | Disposition |
|---|---|---|
| F37-T5-1 reminder rows not live-exercisable | noise | NOT a gap — jenny confirmed the durable in-app reminder row persists before email send (created without Resend creds); only live-push is a documented NON-GOAL. No prod reminders currently exist to render, but the path is real-PG integration-tested + unit-covered. Suppress. |
| F37-T5-2 benign pre-auth 401 console error | noise | pre-session-hydration fetch 401s then 200s on hydrate — expected. Suppress. |
| B-6 INFO stale UnreadCountResponse doc comment (packages/shared/src/notifications.ts:64 references a non-existent /unread-count endpoint) | noise | trivial 1-line doc comment; no functional impact. Suppress (self-evident cleanup, not worth a task row). |
```yaml
findings_input_count: 3
findings_blocking: []
findings_non_blocking: []
findings_noise: [F37-T5-1 reminder-nongoal, F37-T5-2 preauth-401, B-6-doc-comment]
fast_fix_queue: []
b_block_re_entry_required: []
```
