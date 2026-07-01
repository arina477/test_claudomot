# Wave 27 — B-2 Backend (Spec A proof)
**Specialist:** postgres-pro. **Commit:** ff4126b. `getServerIdsForUser` logic UNCHANGED (the index is transparent — only the access path changes; getCoMemberUserIds untouched, SELECT DISTINCT no-op honored).
**Proof test:** `apps/api/test/integration/presence-index-scan.spec.ts` (real-PG, pg-harness, `./pg-harness` first CF-2, describe.skipIf(!DATABASE_URL_TEST) fail-loud):
- Case 1 (AC2): `EXPLAIN (FORMAT TEXT) SELECT server_id FROM server_members WHERE user_id=$1` (via harnessQuery, separate connection) → asserts plan matches /Index Scan/, contains `server_members_user_id_idx`, NOT /Seq Scan on server_members/.
- Case 2 (AC3, behavior-preserving): USER_X in 2 servers / USER_Y in 1 / USER_Z in 0 → getServerIdsForUser returns exact sets.
```yaml
skipped: false
files_implemented: [apps/api/test/integration/presence-index-scan.spec.ts]
findings: []
```
