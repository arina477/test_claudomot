# W36 T-4 Integration (ci-verified) — PASS — LOAD-BEARING
The wave's success criterion. C-1 pulled the CI test-job log (84845085352) and confirmed the two new real-PG integration specs PROVABLY EXECUTED against the postgres:16 service (DATABASE_URL_TEST reached vitest, SKIP=false):
- `privacy-visibility-authz.spec.ts` — **5 tests ran, 0 skipped** (roster nobody-hiding + caller-sees-self + everyone/server-members visible; real-DB write proof + before/after roster delta).
- `account-data-export-idor.spec.ts` — **7 tests ran, 0 skipped** (self-scoping; real-DB write proof).
- Integration run total: 11 spec files passed. **No `SKIPPED: DATABASE_URL_TEST` decoy fired.** The wave-17/24 false-green class did NOT occur — the durable authz/IDOR regression coverage is real, not decorative. `mask_mode_signoff: PASS`.
