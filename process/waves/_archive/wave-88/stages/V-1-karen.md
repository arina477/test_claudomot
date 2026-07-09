# V-1 — Karen source-claim verification (wave-88)

**Agent:** karen (fresh context)
**Scope:** Verify load-bearing claims for the server-side `senderKeyRef` validation fix against the DEPLOYED state.
**Merge commit:** `d06460582438a6145f906f1031461ea1accbb7e1` (PR #109, on `main`)
**Deployed api:** `https://api-production-b93e.up.railway.app` — deployment `b1d3d24c` (per C-2)
**Repo HEAD at verification:** `e439eb40` (later docs commit); `git diff d0646058..HEAD` on the dm source + integration spec is EMPTY, so the working tree matches the merge state for all verified files.

## Verdict: **APPROVE**

One-line: APPROVE — every load-bearing claim holds against source + live deploy; the only anomaly (a red `e2e` check) is a NON-required, non-blocking check and falsifies nothing.

---

## Findings (claim → evidence)

### Claim 1 — senderKeyRef validation inside the `if (isEncrypted)` branch — **VERIFIED**
`apps/api/src/dm/dm.service.ts:656-665`. Inside `if (isEncrypted)`:
```
const [registeredKey] = await db
  .select({ publicKey: user_encryption_keys.public_key })
  .from(user_encryption_keys)
  .where(eq(user_encryption_keys.user_id, callerId))
  .limit(1);
if (registeredKey && registeredKey.publicKey !== input.senderKeyRef) {
  throw new BadRequestException('senderKeyRef does not match your registered encryption key');
}
```
Column select (`publicKey: user_encryption_keys.public_key`), table/where (`user_encryption_keys` WHERE `user_id = callerId` LIMIT 1), and the `BadRequestException` on mismatch all match the claim verbatim. Severity: n/a (pass).

### Claim 2 — Fail-open when no registered key row — **VERIFIED**
`dm.service.ts:662`: the throw is guarded by `registeredKey &&`. Destructured `const [registeredKey]` is `undefined` when the select returns `[]` (no row), so the condition short-circuits false → no throw → send proceeds. Confirms fail-open for keyless senders / register-then-send race. Severity: n/a (pass).

### Claim 3 — No module rewiring / no circular dep — **VERIFIED**
`apps/api/src/dm/dm.module.ts:29-35`: `imports: [BlocksModule]` only. DmModule does NOT import ProfileModule (or any profile/encryption module). The fix is inline in `sendMessage` reading `user_encryption_keys` directly via `db` — no new DI edge, no new import in the service beyond the already-present `user_encryption_keys` schema import (`dm.service.ts:55`). No circular dependency introduced. Severity: n/a (pass).

### Claim 4 — Deploy serves the merge commit + /health 200 — **VERIFIED**
- C-2 deliverable (`process/waves/wave-88/stages/C-2-deploy-and-verify.md:38-50`): `verdict_source: railway`, deployment `b1d3d24c`, `status: SUCCESS`, `commit_hash: d06460582438a6...` with `commit_hash_confirmed_matches_target: true`; prior deployment `d907a6e0` (commit `1d2ef9df`) superseded to REMOVED.
- Live probe THIS session: `curl -fsS https://api-production-b93e.up.railway.app/health` → HTTP 200, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- `git rev-parse d0646058…` resolves to the full merge SHA; PR #109 `mergeCommit.oid == d06460582438a6...`. Deploy-hash reliance on C-2 is appropriate (no Railway API access here); the independent /health probe corroborates a live, healthy service. Severity: n/a (pass).

### Claim 5 — Tests real + merged; required `test` job passed; integration post-rotation case ran — **VERIFIED**
- Unit spec `apps/api/src/dm/dm.service.spec.ts` — 5 NEW cases in `describe('DmService — encrypted send senderKeyRef re-validation')` (lines 504-685): AC1 match→succeeds (536), AC2 mismatch→BadRequestException + no insert + no emit (570), AC3 no-key→fail-open succeeds (594), AC4 plaintext→no key select (621), AC5 listMessages→no re-validation (657).
- Integration spec `apps/api/test/integration/dm-encryption.integration.spec.ts` — 4 NEW cases in `describe('encrypted send senderKeyRef re-validation (wave-88 B-2)')` (line 421): MATCHING→row stored (425), MISMATCHING→rejected+no row (450), no-key→fail-open (475), and **post-rotation (T-8)** (499). The post-rotation case is real & load-bearing: it `upsertKey`s A then B, asserts a single row = KEY_B via `harnessQuery` (real Postgres), sends with KEY_B → ACCEPTED (row persisted), then sends with the STALE KEY_A → `rejects.toBeInstanceOf(BadRequestException)`.
- CI: PR #109 state MERGED. Required checks per `main` branch protection = `[lint, typecheck, test, build, secret-scan, boot-probe]` — all SUCCESS. The `test` job (`.github/workflows/ci.yml:35-53`) provisions a `postgres:16` service + sets `DATABASE_URL_TEST` + runs `pnpm test:ci`, which resolves to `vitest run … && vitest run --config vitest.integration.config.ts` (`apps/api/package.json:12`) — i.e. the integration suite RAN against real Postgres in CI (the spec's `SKIP`-when-`DATABASE_URL_TEST`-unset guard did NOT trigger). The post-rotation integration case therefore executed, not skipped. Severity: n/a (pass).

### Claim 6 — Antipattern catalog (fake tests / decorative assertions) — **VERIFIED (no antipatterns)**
Spot-check of the unit load-bearing case AC2 (`dm.service.spec.ts:570-591`): mocks a MISMATCHING registered key (`'DIFFERENT-registered-key'`) then asserts the send `rejects.toBeInstanceOf(BadRequestException)` AND `expect(mockInsert).not.toHaveBeenCalled()` AND `expect(emitter.emit).not.toHaveBeenCalled()`. These are behavioral, load-bearing assertions — reverting the throw at `dm.service.ts:662-664` would flip AC2 from throw→success, failing the `rejects` assertion and the no-insert/no-emit assertions (the mismatch case would insert + emit). Assertions are not decorative. The integration MISMATCHING + post-rotation cases add a real-DB "no row stored" check (`SELECT count(*) … WHERE ciphertext = …`), which mocks cannot fake. No claimed-but-fake tests, no coverage theater found. Severity: n/a (pass).

---

## Observations (non-blocking, not falsifying any claim)

- **`e2e` CI check = FAILURE on the merge commit.** It is NOT in `main`'s required-check set (branch protection: `lint/typecheck/test/build/secret-scan/boot-probe`), so it did not block the merge and does not contradict the "required `test` job passed" claim. However, a red Playwright `e2e` job is worth a downstream flag — recommend the V-block/T-block confirm whether this is a pre-existing flaky/env failure unrelated to the senderKeyRef change or a real regression. Out of scope for these six source claims; noted for triage awareness.
- Repo HEAD is `e439eb40` (a post-merge docs commit), not the merge commit itself — but the dm source + integration spec are byte-identical to the merge commit (empty diff), so source verification against the working tree is equivalent to verifying against `d0646058`.
