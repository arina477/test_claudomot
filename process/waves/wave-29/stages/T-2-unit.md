# Wave 29 — T-2 Unit

**Pattern:** A (Verified-via-CI). **Layer:** pure-function + module unit tests. **FIRE.**

## Action 1 — CI evidence
CI run 28536835436 `test` job (vs postgres:16): **api 407 passed**. The five new displayName-guard tests EXECUTED nonzero on fd03d27 (CI-rule-5 satisfied — not skipped/no-op). CI log lines confirm each by exact test name.

## Action 2 — Coverage audit (mutation-genuine — the core audit)
Modules touched: `servers.service.ts:249` + `presence.gateway.ts:125` (both `??`→`||` in the displayName fallback chain). Each maps to a return-value / state-change assertion, NOT a mock-call count.

servers.service.spec.ts (`ServersService.listServerMembers — displayName empty-fallback guard (wave-29)`, 4 tests):
- **`email:'@example.com'` + `display_name:null` → `.toBe('user-ghost')` AND `.not.toBe('')`** — `split('@')[0]===''`. Under OLD `??`: `null ?? '' ?? userId` → `''` (FAIL). Under NEW `||`: → userId (PASS). **Mutation-genuine.** (AC1)
- **`display_name:''` + `alice@example.com` → `.toBe('alice')`** — under OLD `??`: `'' ?? ...` → `''` (FAIL). Under NEW `||`: → 'alice' (PASS). **Mutation-genuine.** (AC1)
- `bob@studyhall.app` + null → `.toBe('bob')` — happy path unchanged. (AC2)
- `'Carol Jones'` non-null → `.toBe('Carol Jones')` — unchanged. (AC3)

presence.gateway.spec.ts (`PresenceGateway — handleConnection displayName empty-fallback guard (wave-29)`, 1 test):
- Invokes the REAL `handleConnection(socket)` with db-select mock `{display_name:null, email:'@example.com'}`, then asserts `socket.data.displayName` (real state change) `.toBe(USER_ID)` AND `.not.toBe('')`. Under OLD `??` → `''` (FAIL). **Mutation-genuine, exercises the SUT method end-to-end.** (AC1)

Verdict: NOT coverage theater. Both empty-fallback branches (empty email local-part; stored-empty display_name) would fail under the pre-fix `??`. Assertions are user-observable outputs, not `expect(mock).toHaveBeenCalled()`.

## Action 3 — Flake observation
B-5 `flakes_documented: []`; C-1 zero fix-up cycles, no rerun needed. No new flakes.

## Action 4 — Discipline note
Mutation-genuine empty-string-fallback tests (assert `.not.toBe('')` alongside the positive expectation) are a strong pattern — makes the `||`-vs-`??` distinction load-bearing in the test, not just the impl. Candidate note; single occurrence, no promotion.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: run 28536835436 green, api 407 passed vs postgres:16"
  - "5 new guard tests executed nonzero by exact name on fd03d27 (CI log)"
modules_audited: [servers.service.ts, presence.gateway.ts]
new_flakes: []
findings: []
```
