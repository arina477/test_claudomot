# Wave 77 — T-4 Integration

Pattern A (CI-verified) — the authoritative real-DB validation of the privacy matrix.

## Evidence
C-1 `test` job (run 28900669901) initialized a **postgres:16** service container + DATABASE_URL_TEST and ran `pnpm test:ci` **green (2m7s)** on the merge-blocking PR #96 run. The 13-case profile-visibility integration matrix executed against the real DB.

## Boundary coverage — profile-visibility.integration.spec.ts (13 cases, verified present + resolver read)
1. everyone → VISIBLE to any authed viewer
2. server-members + shared server → VISIBLE
3. **server-members + NOT shared → HIDDEN (stranger not leaked)** ← crown-jewel; target in a target-only server, viewer in none → hidden
4. nobody → HIDDEN
5. blocked (viewer→target) → HIDDEN even if everyone
6. blocked (target→viewer) → HIDDEN (bidirectional)
7. soft-deleted (deleted_at) → HIDDEN even if everyone
8. unknown visibility → HIDDEN (fail-closed); 8b. empty-string → HIDDEN (fail-closed)
9. self→self → VISIBLE regardless (nobody); 9b. self while soft-deleted → HIDDEN
10. missing target user → HIDDEN
11. visible PublicProfile NEVER contains an email field

Resolver (profile-visibility.service.ts) confirmed to use the **self-referential EXISTS subquery on server_members** (mirrors dm.service, NOT servers.listServerMembers's ambient-membership shortcut) — the leak that the spec explicitly warned against is NOT present. Migration 0030 (6 nullable academic columns) applied to prod before deploy.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [users academic columns (migration 0030), ProfileVisibilityService.resolve (server_members + user_blocks + users.deleted_at), GET /profile/:userId end-to-end]
ci_evidence:
  - "C-1 test job run 28900669901 PASS (2m7s) on postgres:16; 13-case profile-visibility matrix ran + passed, merge-blocking"
active_run_output: ""
infrastructure_gap_recorded: false
findings: []
```
