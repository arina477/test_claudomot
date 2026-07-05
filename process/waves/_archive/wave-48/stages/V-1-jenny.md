# V-1 — jenny (semantic-spec verifier) — wave-48

**Wave:** 48 — DM candidate privacy negative-case integration test (TEST-COVERAGE hardening).
**Task:** 03ccf636 (spec-contract source of truth).
**Axis:** semantic-spec compliance — does the DELIVERED coverage genuinely satisfy the ACs (not just file-exists). Source-claim truth is Karen's axis (independent).
**Live-UI walkthrough:** not applicable — wave ships NO user-facing change (merge diff = 2 test files; deploy confirmed no-op).

## Verdict: **APPROVE**

All four acceptance criteria are semantically met; the wave's core "closes the never-live-proven counter-example gap" claim holds against the real SUT query. 0 blocking findings, 1 non-blocking spec-gap (already logged by T-block), 0 spec-drift.

Evidence base: the SUT `getDmCandidates` (`apps/api/src/dm/dm.service.ts:677-721`), the two assertions (`apps/api/test/integration/dm-candidates.spec.ts:93-151`), the harness param (`apps/api/test/integration/pg-harness.ts:100-112`), and the CI-green proof (`C-1-pr-ci-merge.md:44-52` — both assertions ✓ at 60ms/49ms real-PG, integration pass 17/17).

---

## Finding-by-finding

### F1 — AC1 (nobody exclusion) semantically met — **APPROVE** (no drift)

- **Spec AC1:** "given the caller shares a server with user X, and X.who_can_dm='nobody', getDmCandidates(caller) does NOT include X … EXERCISES the real `ne(users.who_can_dm,'nobody')` WHERE clause … NOT a pre-filtering mock."
- **Delivered (`dm-candidates.spec.ts:93-117`):** Topology puts CALLER, USER_X_NOBODY (`who_can_dm='nobody'`), and USER_Y_EVERYONE (`who_can_dm='everyone'`) all as members of the SAME `SERVER_S` (`:99-103`). Assertions: `ids` contains USER_Y_EVERYONE (`:110`), NOT USER_X_NOBODY (`:113`), NOT CALLER (`:116`).
- **Semantic check — is exclusion BY the policy, not by isolation?** YES. All three users are inserted into SERVER_S via `insertFixtureMembership` (`:101-103`), and CALLER is a member (`:101`). So the `inArray(callerServerIds)` scope (`dm.service.ts:704`) INCLUDES X — X passes the co-membership gate. The everyone-user Y being returned (`:110`) is the load-bearing control: it proves the query DOES surface co-members in SERVER_S in general, so X's absence can ONLY be attributed to `ne(users.who_can_dm,'nobody')` at `dm.service.ts:706`. This genuinely exercises the real WHERE predicate against committed rows — X exists in Postgres with `who_can_dm='nobody'` and is filtered by the SQL, not by test-side pre-filtering.
- **Edge-case coverage:** matches spec edge-case "caller SHARES a server with the nobody-member → still excluded (exclusion is by who_can_dm, not by co-membership)" exactly.
- **Label:** compliant. No drift.

### F2 — AC2 (negative isolation) semantically met — **APPROVE** (no drift)

- **Spec AC2:** "given a user Y who is a member of a server the caller does NOT belong to (disjoint), getDmCandidates(caller) does NOT include Y … exercises the `inArray(caller's server ids)` scope against real data."
- **Delivered (`dm-candidates.spec.ts:130-151`):** CALLER is a member of SERVER_S only (`:139`); USER_Z_DISJOINT is a member of SERVER_T only (`:140`); the two servers are distinct (`:135-136`) and share no member. Assertions: `ids` does NOT contain USER_Z_DISJOINT (`:147`) AND `candidates` length is 0 (`:150`).
- **Semantic check — does it exercise the inArray scope?** YES. At `dm.service.ts:679-686`, `callerServerIds = [SERVER_S]`. Z is only in SERVER_T, so the `inArray(alias.server_id, callerServerIds)` predicate at `:704` filters Z out because no `server_members` row for Z has `server_id = SERVER_S`. This is the real scope predicate evaluated against real disjoint rows. The `toHaveLength(0)` assertion (`:150`) is a strictly stronger check than `not.toContain` — it proves no OTHER row leaks either, confirming the scope is exercised (and not, e.g., a query that returned Z-plus-noise that happened to omit Z).
- **Note on code path:** with a single caller server and no co-members, the query at `:692-709` returns zero rows — the early-return at `:684` does NOT fire here (CALLER has 1 server), so the full JOIN + `inArray` path is genuinely walked. Good: this hits the intended predicate, not the empty-servers short-circuit.
- **Edge-case coverage:** matches spec edge-case "disjoint user shares NO server with caller → hidden (isolation)".
- **Label:** compliant. No drift.

### F3 — AC3 (harness param, backward-compat) — **APPROVE** (no drift)

- **Spec AC3:** "insertFixtureUser accepts a who_can_dm value (param with a sensible 'everyone' default) … Backward-compatible (existing callers unaffected)."
- **Delivered (`pg-harness.ts:100-112`):** Signature `insertFixtureUser(id, email, username?, whoCanDm: 'everyone'|'server-members'|'nobody' = 'everyone')`. The 4th param is optional with default `'everyone'`, matching the DB column default (documented `:96-98`). The INSERT binds `who_can_dm = $4` (`:108-111`).
- **Semantic check — backward-compat:** YES. The new param is appended in 4th position with a default, so all existing 2- and 3-arg callers are unaffected. Confirmed by the spec's own callers: `dm-candidates.spec.ts:95` (`insertFixtureUser(CALLER, email)` — 2-arg), `:132-133` (2-arg) both compile and resolve `whoCanDm='everyone'`. The nobody-set fixture is created via `:96` (`insertFixtureUser(USER_X_NOBODY, email, undefined, 'nobody')`), threading `undefined` for username to reach the 4th param — correct.
- **Type safety:** the union type `'everyone'|'server-members'|'nobody'` matches the DB enum, so an invalid value cannot be passed. Good.
- **Label:** compliant. No drift.

### F4 — AC4 (runs + passes in CI; positive-case retained) — **APPROVE** (no drift)

- **Spec AC4:** "Both assertions run against the real getDmCandidates/DB (integration layer) and pass in CI. Existing positive-case coverage (co-member included, self-excluded) is retained/unaffected."
- **Delivered — runs GREEN in CI:** `C-1-pr-ci-merge.md:44-52` shows both assertions ✓ with real-PG timings (60ms / 49ms — non-zero = real round-trips, not 0ms mock/skip), and the integration pass reports `Test Files 17 passed (17)`. The `describe.skipIf(SKIP)` guard (`dm-candidates.spec.ts:62`) did NOT fire — CI sets `DATABASE_URL_TEST` (`C-1:40`), confirmed by no skip line in the test-job log (`C-1:50`). Real integration layer: SUT is imported AFTER the CF-2 harness side-effect import (`dm-candidates.spec.ts:25` before `:38`), so `getDmCandidates` resolves the lazy `db` singleton to the test DB (`pg-harness.ts:17-21`). The SUT is the REAL `DmService` (`:38`, `:72`), invoked directly (`:105`, `:142`) — not stubbed.
- **Delivered — positive-case retained:** assertion (a) itself carries the positive control (everyone-user INCLUDED, `:110`) and self-exclusion (`:116`), so the "co-member included / self-excluded" coverage the spec asks to retain is present INSIDE this wave's diff. The wave adds coverage without removing prior positive-case coverage (diff is additive: two test files, no deletions per `C-1:62`).
- **Label:** compliant. No drift.

### F5 — Coverage is REAL (wave core claim) — **APPROVE** (no drift; 1 non-blocking spec-gap)

- **Wave intent:** "closes the two never-live-proven COUNTER-EXAMPLE controls (nobody-member excluded; disjoint non-co-member hidden) against a REAL query … regression protection on a privacy boundary. Applies test-writing §26 (prove query filters against a real DB, not a pre-filtering mock)."
- **Does the claim hold?** YES. Both counter-examples are now exercised against a real Postgres query:
  - The nobody-exclusion (F1) is proven live because the everyone-control (Y) is returned from the SAME shared server, isolating the `ne(who_can_dm,'nobody')` predicate as the sole cause of X's absence. A pre-filtering mock could not produce this differential (co-member-returned vs nobody-filtered) from real committed rows.
  - The disjoint-isolation (F2) is proven live because Z is a real committed `server_members` row in a server outside `callerServerIds`, filtered by the real `inArray` predicate; the `toHaveLength(0)` assertion forecloses accidental leakage.
  - §26 compliance: the filters are proven against a real DB (migrations applied `pg-harness.ts:56-57`, real Pool `:53`, truncate-per-case isolation `:79-81`), not a mock that pre-removes rows before the query. The SUT's own WHERE clause does the filtering.
- **spec-drift vs spec-gap distinction:**
  - **No spec-drift** — the delivered tests do exactly what the ACs describe; topologies, predicates, and assertions align 1:1 with the stated intent.
  - **One spec-gap (non-blocking, already logged):** the `who_can_dm='server-members'` enum value is NOT exercised at integration (T-block finding #1, `findings-aggregate.md:7`, severity LOW). The spec's controls cover `'nobody'` (excluded) and `'everyone'` (included) but leave `'server-members'` — the third enum value, which the SUT comment (`dm.service.ts:662`) documents as INCLUDED — unproven at this layer. This is a spec-GAP (the spec left it unanticipated for this wave), NOT spec-drift (nothing the spec asked for is missing). It does not weaken any AC: the spec's ACs are fully satisfied. Correctly filed by T-block as a future positive-control follow-up; the value's fence is already covered by unit tests + wave-47 T-8 pen-test. Non-blocking for V-1 approval.

---

## Summary

| AC | Verdict | Drift/Gap |
|---|---|---|
| AC1 — nobody exclusion (real `ne` predicate) | APPROVE | none |
| AC2 — negative isolation (real `inArray` scope) | APPROVE | none |
| AC3 — harness param + backward-compat | APPROVE | none |
| AC4 — runs GREEN in CI; positive-case retained | APPROVE | none |
| Core claim — coverage is REAL (§26) | APPROVE | 1 non-blocking spec-gap (server-members value, already logged LOW) |

**Semantic-spec verdict: APPROVE.** The delivered coverage genuinely satisfies every acceptance criterion. The two counter-example privacy controls are now exercised against a real Postgres query with a differential (everyone-included / nobody-excluded, co-member-scope / disjoint-hidden) that a pre-filtering mock could not fake. No spec-drift. One pre-existing, non-blocking spec-gap (`server-members` value) is correctly deferred by the T-block.
