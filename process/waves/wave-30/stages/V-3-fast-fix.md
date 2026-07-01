# Wave 30 — V-3 Fast-fix

**Phase 1 verdict:** APPROVED (fresh head-verifier spawn). See `blocks/V/gate-verdict.md`.

## Phase 1 — Gate review

Independent re-verification of both reviewers' load-bearing claims against the deployed source (probe on the reviewer false-negative anti-pattern, mandatory for a clean verdict on a correctness-critical unattended cron):

- **LEFT-JOIN done-exclusion** — `reminder-scan.service.ts:162-175`: genuine `leftJoin` + `IS DISTINCT FROM 'done'`. NULL/no-status → reminded; 'todo' → reminded; 'done' → excluded. Correct. HOLDS.
- **Send-once (TOCTOU-safe)** — `:240-268`: `INSERT ... onConflictDoNothing().returning({id})`, email gated on `inserted.length > 0`, against real `UNIQUE(assignment_id,user_id)` (schema `assignment-reminder.ts:31`). HOLDS.
- **Window guard** — `:71-75`: `gt(due_date, now())` + `lte(..., now()+24h)` + `is_deleted=false`, DB-native UTC. HOLDS.
- **Test is a real discriminator, not theater** — T-4 case (a) seeds membership-without-status member, asserts a real `assignment_reminder` DB row (`reminder-scan.spec.ts:141,174`) — fails under inner join. Case (c) double-scan asserts row-count + email-count unchanged. Both real-PG mutation-killers.
- **M5 metric MET beyond code-presence** — send-decision surface real-PG proven; module boots on serving revision (C-2). "Members get a reminder before it is due" delivered.

## Phase 2 — Fast-fix queue

V-2 `fast_fix_queue` is EMPTY. Phase 2 SKIPPED. No fast-fix rounds run.

- F30-T4-a (email render integration-stubbed) — noise / suppress (unit-covered T-2). Not a defect.
- F30-T8-a (cron no HTTP surface) — noise / suppress (structurally inapplicable). Not a defect.
- 4905dc3a (at-least-once retry) — already-filed B-6 follow-up; spec-consistent at-most-once design (AC3 prioritizes no-double-send). Do NOT re-file.

## Carry to N-block

M5 success metric is MET by this wave (its sole unbuilt scope item — the reminder loop — ships live). M5 is **closeable AFTER N-block disposes M5's 6 open non-metric `todo` tasks** (3ad35a42 optimistic-toggle revert, 4b397de0 IDOR-assertion test-debt, 6f257c82 rowToDto N+1 perf-debt, 72cb6ebb stale manage_channels docs-debt, 226c7e42 CI executed-count hardening, fdb444fc presence DM/mention/hover extension). Disposition (close / re-home to a debt milestone / defer) is an N-block call, not a V-gate call — metric-MET and mechanically-closeable are distinct.

```yaml
phase1_head_verifier_verdict: APPROVED
skipped: true                         # Phase 2 queue empty
queue_items_processed: 0
queue_items_fixed: 0
queue_items_moved_to_b_re_entry: []
fast_fix_rounds: 0
loc_per_fix: []
re_verification:
  karen: APPROVE                      # V-1 (no fast-fix commit to re-verify)
  jenny: APPROVE                      # V-1 (no fast-fix commit to re-verify)
cap_escalation: false
escalation_destination: "none"
```
