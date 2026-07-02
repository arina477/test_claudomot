# V-1 Source-Claim Verification (Karen) — wave-36 M7 test-hardening

**Verdict: APPROVE**

**Scope:** Verify the wave's load-bearing claims are TRUE against merged main (be1bbab, confirmed ancestor of HEAD 97240bc) + live prod. This wave's deliverable is TESTS — so the load-bearing claim is that they EXIST + actually RAN (not skipped, not mocked-the-SUT). Independently re-derived from source + the real CI log (run 28611576359, job 84845085352), not trusted from the recorded evidence alone.

---

## Findings (claim + verifying/contradicting evidence)

### F1 — Test files exist at claimed paths on main — TRUE
All six claimed files present in the merged tree:
- `apps/api/test/integration/privacy-visibility-authz.spec.ts` (7994 B)
- `apps/api/test/integration/account-data-export-idor.spec.ts` (8894 B)
- `apps/api/src/privacy/privacy.controller.spec.ts` (10799 B)
- `apps/api/src/privacy/privacy.service.spec.ts` (11890 B)
- `apps/api/src/privacy/account-data.service.spec.ts` (8205 B)
- `apps/web/src/pages/SettingsPrivacyPage.test.tsx` (820 B)
No claimed-but-absent file. **Severity: N/A (pass).**

### F2 — The integration tests ACTUALLY RAN in CI, 0 skipped (THE load-bearing claim) — TRUE
Independently pulled the real CI log for job `84845085352` (run `28611576359`) via `gh run view --log`. The recorded C-1/T-4 evidence is REAL, not fabricated — every specific claim reproduces:
- `pnpm test:ci` = `vitest run --reporter=verbose && vitest run --config vitest.integration.config.ts` — the second (integration) command ran (log line 18:09:44).
- `DATABASE_URL_TEST` reached the test job env (`***localhost:5432/studyhall_test`, present at every step) → `SKIP=false`.
- `account-data-export-idor.spec.ts`: **7 `✓` PASS lines, 0 skip lines** (grep count = 7). Includes `sanity: users table has 2 real rows after seed` + `IDOR structural proof`.
- `privacy-visibility-authz.spec.ts`: **5 `✓` PASS lines, 0 skip lines** (grep count = 5). Includes `sanity: server_members has 2 real rows after seed` + `roster length for B drops from 2 ... to 1 (provable before/after delta)`.
- Integration-run summary (after the `&&`): `Test Files 11 passed (11)` / `Tests 51 passed (51)`.
- **Skip-decoy check:** zero `SKIPPED: DATABASE_URL_TEST` / `it.skip` markers fired for either spec in the log. The wave-17/24 false-green class (silent `skipIf` when DATABASE_URL_TEST never reaches vitest) did NOT occur.
**Severity: N/A (pass) — the wave's core claim holds under independent re-verification.**

### F3 — No mock-the-SUT — TRUE
Neither integration spec contains `vi.mock` on the system under test.
- `privacy-visibility-authz.spec.ts:32` imports the REAL `ServersService`; `:18` imports the REAL `./pg-harness` (first import, per CF-2). Test body (`:96`) calls `sut.listServerMembers(USER_B_ID, SERVER_ID)` — the real DB query at `servers.service.ts:253` — and asserts on real roster filtering against seeded rows.
- `account-data-export-idor.spec.ts:34` imports the REAL `AccountDataService`; `:21` imports real `./pg-harness`.
- The `new ServersService({} as never)` stub only stubs the unused `rbacService` dep (documented `:54-56`, mirrors sibling `servers-member-gate.spec.ts`); the DB path is exercised for real. `AccountDataService` has no deps and is instantiated directly (`:58`). **This is NOT mock-the-SUT.** **Severity: N/A (pass).**

### F4 — B-6 fixups landed — TRUE
- `scrubPii` is exported from `apps/api/src/instrument.ts:7` (`export const scrubPii`) and used as `beforeSend` at `:50`. `privacy.service.spec.ts:31` imports it (`import { scrubPii } from '../instrument'`) — REAL function exercised, not replicated (7 scrubPii contract tests, `:214-300`).
- Controller session-scoping tests exist for BOTH endpoints: `privacy.controller.spec.ts:203` `getAccountData derives userId from session (not body/query) — structural IDOR proof` and `:231` the mirror for `exportAccountData`; both assert the service is called with the session userId. **Severity: N/A (pass).**

### F5 — Live prod changes — TRUE
- Served (deployed) `/privacy` bundle `assets/index-BDKrrUxG.js` renders `Last updated: 2026`; no `Last updated: 2024` present. Source `PrivacyPage.tsx:40` + `TermsPage.tsx:40` both `2026`. (b7feab30 verified LIVE, not just in source.)
- api `GET /health` → HTTP 200.
- api `GET /profile/privacy` (unauth) → HTTP 401 — the authz boundary the tests protect is still enforced live, unchanged. **Severity: N/A (pass).**

### F6 — Trivial sibling commits done, not faked; antipattern scan — CLEAN
- 73e96a9d (docs re-scope): `command-center/product/product-decisions.md:447-450` records the empty/error/loading-states requirement re-scoped OFF the non-existent notifications surface, with basis (wave-35 V-1 F1) + forward trigger. Real docs change, no code. Done.
- b7feab30 (date): verified live above.
- **Decorative/claimed-but-fake test scan:** none. All ACs map to executing tests — integration (F2), unit `toUiVisibility` total-over-enum (`SettingsPrivacyPage.test.tsx`), `updatePrivacy` persists both columns (`privacy.service.spec.ts:138`), enum-400 controller contract (`privacy.controller.spec.ts:88-129`), scrubPii scrub (`:215-247`). No deferred-but-undocumented AC found. **Severity: N/A (pass).**

---

## Bottom line
Every load-bearing claim is independently verified TRUE against merged main + the raw CI log + live prod. The 12 real-Postgres regression tests (7 IDOR + 5 roster-visibility) provably executed with 0 skipped and 0 mock-the-SUT — the durable authz/IDOR coverage is real, not decorative. The two trivial siblings are done and live. No fabrication, no test-theater, no undocumented deferral.

**VERDICT: APPROVE**
