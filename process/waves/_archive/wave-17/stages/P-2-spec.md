# Wave 17 — P-2 Spec (pointer)
**Source of truth:** tasks.description of seed 25523fb0. single-spec. design_gap_flag false.
**claimed_task_ids:** [25523fb0]
## AC summary
- Real-PG (PGlite preferred / testcontainers) integration test for createServer using the ACTUAL db.transaction (not the stub).
- Force a mid-txn failure → assert NO orphan rows (servers/roles/server_members/categories/channels). + positive commit assertion (all rows present on success).
- Apply real migrations to a throwaway test DB; deterministic, isolated, anti-flake; green in CI + local.
- Harness is REUSABLE → enabler for 02fa8011 (real-PG tier). Floor-exempt test-infra.
