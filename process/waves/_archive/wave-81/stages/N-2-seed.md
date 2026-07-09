n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 0e58af8e-efed-43cb-b3eb-f1b962066c51"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 0e58af8e-efed-43cb-b3eb-f1b962066c51
seed_task_title: "Fix DM auth-guard race that bounces to home on a transient 401"
bundled_sibling_ids: []
claimed_task_ids:
  - 0e58af8e-efed-43cb-b3eb-f1b962066c51
active_milestone_id: null
queue_exhausted: false
validation_failed: false
note: >
  Seed selected as a priority pick from the 36-deep unassigned bug/hardening queue
  (NOT strict FIFO — authorized under the founder's bug-fix directive). Pick rationale:
  0e58af8e is a genuine USER-FACING bug — entering the DM view shortly after login
  intermittently bounces the SPA to "/" on a transient 401; observed LIVE across both
  testers (wave-79 T-5 F-T5-1 + V-1 jenny corroboration). Chosen over 1f48f4db
  (server-side senderKeyRef validation), which is LOW-risk defense-in-depth already
  failing-closed at the recipient client — a real user-facing bounce beats low-risk
  hardening polish. Bundle-of-1 (zero siblings), which is valid.
  DB validation (SELECT id,status,wave_id,milestone_id,parent_task_id):
  status='todo', wave_id IS NULL, milestone_id IS NULL (expected — roadmap terminal,
  not an orphan-loss condition), parent_task_id IS NULL. B-0 of wave-82 claims it fresh.
  Do NOT let this seed acquire wave-81's wave_id (recorded stranding hazard).
  head-next (a9661d7f42b03b243) gated N-2 APPROVED.
