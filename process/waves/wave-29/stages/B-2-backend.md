# Wave 29 — B-2 Backend
node-specialist applied the LOCKED `||`-chain fix at both sites + unit tests.
- servers.service.ts:249 → `r.displayName || r.email.split('@')[0] || r.userId`.
- presence.gateway.ts:125 → `userRow?.display_name || userRow?.email?.split('@')[0] || userId` (`?.` preserved).
- 5 new unit tests (servers.service.spec: 4 — empty-local-part→userId, stored-empty-display_name→local-part, happy-path×2; presence.gateway.spec: 1 — empty-local-part→userId). 407 pass (was 402). biome clean. Commit c6e8491. No deviation.
```yaml
skipped: false
specialists_spawned: [node-specialist]
files_implemented: [servers.service.ts, presence.gateway.ts, servers.service.spec.ts, presence.gateway.spec.ts]
deviations: []
simplify_applied: true
```
→ B-4.
