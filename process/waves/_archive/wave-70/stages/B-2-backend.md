# B-2 — Backend (wave-70)
Specialist: backend-developer. BlockModule (spec A) + DM HIDE predicate.
## Files
- CREATE apps/api/src/blocks/{blocks.service.ts, blocks.controller.ts, blocks.module.ts}. createBlock (self-block→400, exists→404, idempotent onConflictDoNothing), removeBlock (204 no-op), listBlocks (own only, no IDOR), isBlockedBetween(a,b) bidirectional OR (index-backed).
- Controller @UseGuards(AuthGuard); blocker_id ALWAYS req.session.getUserId() (:75/91/104) — no IDOR. Zod-validated body.
- MODIFY apps/api/src/dm/dm.service.ts — DM HIDE at 5 seams: createConversation isBlockedBetween→403 (:261), sendMessage→403 (:510), getDmCandidates NOT-EXISTS exclude (:730), listConversations blockedConvIds filter (:502-545, batch query no N+1), listMessages→403 (:688, direct-URL bypass guard). Bidirectional; enforceWhoCanDm + isParticipant intact.
- MODIFY app.module (register BlocksModule), dm.module (import BlocksModule — DI BlocksModule→DmModule, no circular; BlocksService independent of DmService), dm.service.spec + dm-candidates.spec (mock wiring).
- CREATE apps/api/test/integration/blocks.integration.spec.ts — 19 LIVE-DB cases.
## Group-DM (P-4 5a): block applied vs EVERY participant (seams 1/2/4/5) — safe, no crash. Per-message-author group filtering = documented follow-on (non-trivial).
## Verify: apps/api typecheck clean; biome clean; unit 764/764. Integration → CI (real PG).
## Deviations: none.
```yaml
skipped: false
specialists_spawned: [backend-developer]
files_implemented: [apps/api/src/blocks/blocks.service.ts, blocks.controller.ts, blocks.module.ts, apps/api/src/app.module.ts, apps/api/src/dm/dm.module.ts, dm.service.ts, apps/api/test/integration/blocks.integration.spec.ts]
deviations: []
simplify_applied: true
commit_sha: TBD
```
