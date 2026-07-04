# Wave 47 — B-2 Backend
node-specialist: apps/api/src/dm/dm.service.ts getDmCandidates(callerId) + dm.controller.ts DmCandidatesController @Controller('dm') GET candidates + dm.module.ts registration. Two-step query (caller's server_ids → co-members DISTINCT ON users.id, who_can_dm != 'nobody', self-excluded, order displayName) mirroring presence.service getCoMemberUserIds; DTO {userId, displayName, avatarUrl}. 6 tests (co-members/self-excl/nobody-excl/dedup/no-servers/no-co-members); 611 total pass. biome 0 errors (1 pre-existing warn), tsc clean.
Deviations: separate DmCandidatesController @Controller('dm') (avoids restructuring @Controller('dm/conversations') — no route collision, /dm/candidates distinct); two-select (single round-trip, presence pattern). None material.
```yaml
skipped: false
files: [apps/api/src/dm/dm.service.ts, dm.controller.ts, dm.module.ts, dm.service.spec.ts]
tests: {new: 6, total: 611}
typecheck: clean
biome: "0 errors"
```
