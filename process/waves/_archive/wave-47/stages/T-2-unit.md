# Wave 47 — T-2 Unit

**Block:** T · **Stage:** T-2 · **Pattern:** A (verified-via-CI) · **Mode:** automatic

## Action 1 — CI evidence
C-1 `test` job (run 28708469137) ran the full vitest suite on the CI Postgres-backed runner and passed (1m23s) on merge commit 4db10675. Neither documented flake (server-roles.test.tsx cross-file act() flake; combined turbo local-parallel startup crash) fired.

## Action 2 — Coverage audit (per stage-exit checklist)

### Backend — apps/api/src/dm/dm.service.spec.ts (real return-value assertions, not mock-call trivia)
- **getDmCandidates (wave-47, 6 cases):** returns co-members with displayName+avatarUrl (asserts full DTO objects via toEqual); caller excluded; who_can_dm='nobody' excluded; dedup across servers; caller-in-no-servers → []; servers-but-no-co-members → []. Assertions check the RETURNED array shape/content, not call counts. GOOD.
- **who_can_dm enforcement:** transition-table-style — everyone→ok, nobody→403, server-members+shared→ok, server-members+no-share→403, mixed(one nobody)→whole-create 403. Asserts the typed exception (ForbiddenException instanceof), not just "threw". Meets § "typed error, not message" rule.
- **participant cap:** >10→400, exactly 10→ok, 1:1 with 2→ok, 1:1 with 3→400. Boundary table.
- **IDOR gate:** non-participant sendMessage/listMessages→404 NotFoundException (not 403 — non-leak preserved); participant→ok. Idempotency: duplicate key → same row, no re-insert, no fan-out emit.
- **find-or-create 1:1:** repeat 1:1 returns SAME id (no new tx); no prior → new tx; group DMs skip find-or-create; distinct targets → distinct convs.
- Happy AND error path present for every service method. Tier-adjacent (auth/privacy) branch coverage healthy.

### Frontend — apps/web/src/shell/dm.test.tsx
- StartDmPicker: loads from getDmCandidates (asserts getDmCandidates called, getServerMembers NOT) — proves the wave-47 source rewire.
- Empty state (AC4): candidates [] → "No one to message yet…" via getByText.
- Select→start end-to-end (AC3): click candidate → chip → confirm → onConfirm invoked.
- Self-exclusion (379978a4): caller absent from rendered list (queryByText('Me') null).
- Inline 403 error surfaced without closing.
- DmConversationList: renders OTHER participant name given currentUserId (the F7 self-id fix path); search filter; loading/empty/error/retry.
- Queries use getByRole('searchbox')/getByText for user-visible assertions; getByTestId used for click targets (list rows/chips) — acceptable where role query is ambiguous among repeated rows.

## Action 3 — Mutation sanity
A plausible real bug fails these: e.g. dropping `ne(alias.user_id, callerId)` would NOT be caught by the unit test alone (mock pre-filters). This is the KNOWN unit-layer boundary — the filter lives in the query the mock replaces. Routed to T-4 (real Postgres) + T-8 (live privacy fence) which DO exercise the actual WHERE clause. Flagged as a finding (non-blocking at T-2; the deferral is correct, not a gap).

```yaml
mask_mode_signoff: PASS
signoff_note: "Unit suite asserts user-observable returns + typed errors; candidate filters honestly deferred to T-4/T-8 (real DB) — documented, not hidden."
test_pattern: ci-verified
evidence:
  - "C-1 test job: run 28708469137 green (1m23s) full vitest on CI Postgres runner"
findings:
  - {severity: info, layer: T-2, location: "apps/api/src/dm/dm.service.spec.ts getDmCandidates suite", description: "self/nobody/dedup exclusions are proven by mocks returning pre-filtered rows — the actual WHERE clause (ne user_id / ne who_can_dm / DISTINCT ON) is NOT exercised at unit layer. Deferred to T-4 integration + T-8 security against real Postgres. Correct layering, tracked so T-4/T-8 must close it."}
```
