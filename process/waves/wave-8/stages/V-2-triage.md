# Wave 8 — V-2 Triage
Both APPROVE. No security/correctness blocking. 2 spec-completeness drifts + 3 T-9 deferrals.
| Finding | Sev | Bucket | Disposition |
|---|---|---|---|
| 8a migration no backfill (invite_code NULL on pre-0004 servers) | Medium | non-blocking | MOOT in prod (0 servers; new servers self-gen at creation). Follow-up: add backfill UPDATE to a future migration IF any NULL-code servers exist. Not a live break. |
| 8b share modal mints ad-hoc not permanent default | Low | non-blocking | follow-up: default InviteShareModal to servers.invite_code (the shipped permanent code); stops ad-hoc row accumulation + uses the two-tier feature. Small react fix → next M2 bundle / polish. |
| no verified prod fixture / revoked-no-endpoint / no-/invite-e2e | T-9 info+sig | non-blocking | tracked (4a2ad286 + future bundle + e2e gap) |
```yaml
findings_blocking: []
fast_fix_queue: []   # 8a/8b non-blocking → follow-up tasks, not this-wave fast-fix (feature works live + secure); head-verifier confirms
