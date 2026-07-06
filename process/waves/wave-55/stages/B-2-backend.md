# B-2 — Backend (wave-55)
Specialist: node-specialist. Added case (c) to apps/api/test/integration/dm-candidates.spec.ts: positive (who_can_dm='server-members' co-member in shared server → INCLUDED) + negative (disjoint 'server-members' user → EXCLUDED, the load-bearing fence) + self-exclusion guard. Fresh non-colliding fixtures; reused insertFixtureUser/Server/Membership. ONLY the spec file touched — zero production/schema change. Deviation: none. tsc clean, biome clean. Integration run defers to C-1 CI (no local PG; describe.skipIf guard).
```yaml
skipped: false
specialists_spawned: [node-specialist]
files_implemented: [apps/api/test/integration/dm-candidates.spec.ts]
deviations: []
simplify_applied: true
```
