# Wave 28 — T-2 Unit

**Pattern A (CI-verified).** 402 unit tests green in CI test job (run 28532913181) against real Postgres 16 service.

## Action 1 — CI evidence
CI `test` job: `Test Files 21 passed`, `Tests 402 passed`. Rotate unit specs executed with per-test durations (verified in CI log, not merely "green").

## Action 2 — Coverage audit (rotate surface)
Modules touched: `apps/api/src/servers/servers.service.ts` (rotateInviteCode) + `servers.controller.ts` (route method).

**servers.service.spec.ts — ServersService.rotateInviteCode (4 cases, all executed in CI):**
- base64url shape (~22 chars) on success.
- NotFoundException (404) when server does not exist.
- ForbiddenException (403) when caller is not the owner (owner-ONLY, no creator path).
- **23505 retry (first collides, second succeeds) — captures the `.set()` code per attempt and asserts `capturedCodes[1] !== capturedCodes[0]`.** This is the B-6 test-honesty fix: it proves a NEW code is generated on retry (regeneration), NOT a mock-call-count assertion nor the collided code being reused. Passes the mutation-sanity bar — a bug that reused the collided code would fail this test.

**servers.controller.spec.ts — ServersController.rotateInviteCode (3 cases):**
- returns `{ invite_code }` and wires `req.session.getUserId()` -> service (asserts `toHaveBeenCalledWith('server-1','owner-1')` — session-derived callerId, no IDOR).
- propagates ForbiddenException (403) for non-owner.
- propagates NotFoundException (404) for non-existent server.

Every exported unit asserts a return value / thrown type / regenerated-code state change — no coverage theater. Error-path coverage present for both 403 and 404 (rule 11 MUST satisfied).

## Action 3 — Flake observation
0 failures, 0 flakes (B-5 + C-1). No new flakes.

## Deliverable
```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 unit-test job: run 28532913181 green, 402 tests (21 files)"
modules_audited: [servers.service.ts, servers.controller.ts]
new_flakes: []
findings: []
