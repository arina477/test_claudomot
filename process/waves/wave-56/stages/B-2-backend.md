# B-2 — Backend (wave-56)
Specialist node-specialist. Commit 577c452.
- `DM_CANDIDATES_LIMIT = 500` exported (dm.service.ts).
- `getDmCandidates(callerId, limit=DM_CANDIDATES_LIMIT)` — injectable cap. Controller (dm.controller.ts:171) UNCHANGED — `getDmCandidates(callerId)` uses the default 500 (production behavior unchanged).
- `.limit(limit)` after `.orderBy` (dm.service.ts) — bounds the fetch.
- Test case (d): inject cap=2 with 3 eligible co-members → assert length ≤2 (NON-VACUOUS — the LIMIT must bite at DB level; absent .limit, PG returns 3 → fail); default-cap call → all 3 (MVP unchanged). Satisfies the P-4/B-6 injectable-cap watch.
- UNCHANGED: controller call, DmCandidate DTO, who_can_dm predicate, schema.
tsc clean, biome clean. Integration case (d) runs on CI (no local PG).
```yaml
skipped: false
specialists_spawned: [node-specialist]
files_implemented: [apps/api/src/dm/dm.service.ts, apps/api/test/integration/dm-candidates.spec.ts]
deviations: []
```
