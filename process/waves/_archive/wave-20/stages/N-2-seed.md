# N-2 — Seed (wave-20 → wave-21 bundle)

Mode: automatic. Gated by head-next.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: c1dbee64-ca16-43d4-aef3-2c1bd1377614"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: c1dbee64-ca16-43d4-aef3-2c1bd1377614
seed_task_title: "Derive live connection state and plumb it into the app shell"
bundled_sibling_ids:
  - 94e41695-8326-4807-9e34-a85c55c7288f   # Loop the reconnect catch-up so multi-page offline windows fully drain
  - 2fe6b517-825c-4ac6-b2fe-01896be15915   # Test the live connection-state transitions and multi-page catch-up drain
claimed_task_ids:
  - c1dbee64-ca16-43d4-aef3-2c1bd1377614
  - 94e41695-8326-4807-9e34-a85c55c7288f
  - 2fe6b517-825c-4ac6-b2fe-01896be15915
active_milestone_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
queue_exhausted: false
validation_failed: false
note: >-
  Bundle picked = the freshly-authored M4 2nd-wave bundle (NOT a re-homed M3 tech-debt
  candidate). Validation re-confirmed against DB: seed parent_task_id IS NULL; both siblings
  parent_task_id = seed.id; all status=todo, wave_id=NULL, milestone_id=M4. Dependency
  sequencing sound: seed (live connection-state derivation) -> catch-up loop -> tests last.
  Est ~1800-2600 net LOC, files well under 60, concentrated in apps/web/src/shell +
  features/sync. design_gap qualified (component already designed; likely NO D-block —
  wave-21 P-block decides).
```
