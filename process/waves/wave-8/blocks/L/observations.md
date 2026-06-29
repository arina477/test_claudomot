# Wave-8 L-block observations — candidate principles (L-2 vets for promotion)

Append-only candidate pool. L-2 distill + karen decide which (if any, max 1/file/wave) get promoted to the numbered Rules section of the matching `*-PRINCIPLES.md`. Wave-specific until a second wave confirms.

## C-block (CI/CD) — head-ci-cd deploy-verification reasoning + lessons

### Deploy-verification reasoning (this wave)
- Railway services here are CLI-uploaded (`source.repo` null) not GitHub-auto-deploy: a merge to main does NOT trigger a deploy. The pre-merge SUCCESS deployments were stale; only an explicit `railway up` from main HEAD ships the new code. Always confirm source-type before assuming auto-deploy.
- Verified deploy via the authoritative Railway `deployments` GraphQL status (SUCCESS) AND confirmed the prior deployment flipped to REMOVED, then health 200 — three independent signals that the NEW revision serves, not a /healthz that could answer from the old process.
- Migration applied to prod via the public TCP proxy (`*.proxy.rlwy.net`) BEFORE the new code deployed; `drizzle.config.ts` reads `DATABASE_URL_UNPOOLED ?? DATABASE_URL`, so both were set to the proxy URL for the migrate command.

### Rollback lesson (candidate)
- After `railway up`, the prior good deployment immediately goes REMOVED, so "roll back to the previous deployment id" is not directly available; the reachable rollback is re-deploying the prior commit. Capture the prior commit SHA before cutover, not just the prior deployment id.

### Backfill lesson (candidate)
- A nullable new column added by migration plus app-side set-on-create means existing rows stay NULL but degrade gracefully (permanent link absent) rather than crash; backfill is only needed when an existing row must have the value. Here prod had 0 servers so backfill was a no-op. Check the row count before assuming backfill work exists.

### Fixture gap (carry-forward, not a rule)
- No persistent email-verified prod fixture exists, so authed-join could not be live-probed; covered by the 179-test suite. command-center/testing/test-accounts.md should be filled with one verified Student Member fixture so future C-2 / T-5 / T-8 can exercise authed paths live.

### Candidate rule phrasings (for karen, if a 2nd wave confirms)
- Verify Railway deploys via the deployments GraphQL status plus prior-deployment REMOVED, never health alone.
  Why: A health 200 can answer from the old process before the new revision serves.
- Capture the prior commit SHA before cutover when the platform removes the prior deployment on deploy.
  Why: A removed prior deployment cannot be rolled back to by id; only the prior commit is redeployable.
