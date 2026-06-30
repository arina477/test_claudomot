# Wave 17 — V-2 Triage
## Blocking (0) — fast-fix queue EMPTY
Both APPROVE; T-block 0 new findings. The rollback test is verified-real + ran 3/3 in CI vs real Postgres. No blocking.

## Non-blocking — dispositions
| id | source | summary | disposition |
|---|---|---|---|
| M1 | B-6/T | pg-harness CF-2 DATABASE_URL override no VITEST/NODE_ENV guard (safe — nest build excludes test/) | FOLD into 02fa8011 note (it reuses+extends the harness → add `if (process.env.VITEST)` guard then). No new task. |
| M2 | B-6/T | vitest.integration.config omits reflect-metadata (safe — spec bypasses Nest DI) | FOLD into 02fa8011 note (add before a DI-booting integration spec). |
| 02fa8011 | T-4 | real-PG integration tier (2-wave, V-3-flagged 3rd-recurrence) | **PARTIALLY MITIGATED: the reusable pg-harness.ts now exists.** Updated 02fa8011's description: becomes a thin consumer of pg-harness (+ add VITEST guard + reflect-metadata when extending). Recurrence pressure relieved. |
| 9 biome warnings | T-1 | pre-existing wave-14 noNonNull + ServerRolesPage suppressions | already tracked (task 4e994e96, wave-16 V-2). |
| L1-L3, SUT docstring | B-6/jenny | cosmetic | accepted non-blocking (noise). |

```yaml
findings_blocking: []
fast_fix_queue: []
b_block_re_entry_required: []
non_blocking_dispositions: [M1/M2→fold-into-02fa8011, 02fa8011→note-updated-partially-mitigated, 9-warnings→existing-task, rest→accepted]
```
