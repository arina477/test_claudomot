# Wave 88 — V-3 Fast-fix gate verdict (Phase-1)

**Agent:** head-verifier (fresh context) · **Attempt:** 1 · **Stage:** V-3 (block-exit)
**Wave topic:** Server-side DM `senderKeyRef` validation on the encrypted send path (defense-in-depth; reject mismatch, fail-open when no registered key). SECURITY wave.
**Shipped:** live api deployment `d0646058` (PR #109, merged to `main`); `/health` 200.
**Verification basis:** independent re-derivation of the security-critical claims against shipped source (`git diff d0646058..HEAD` on dm source + specs = EMPTY, so working tree == merge), the live branch-protection required-check set, and the live PR #109 check states — not acceptance of the reviewer APPROVEs at face value.

---

## Verdict: **APPROVED** → PROCEED_TO_L1

One-line: APPROVED — all 6 ACs demonstrably met on shipped code (fail-open guarded, server-blind projection intact, post-rotation case genuinely executed vs real Postgres in the required CI `test` job); the sole red check (`e2e`) is non-required, pre-existing, and provably unrelated to a write-path-only DM change.

---

## Independent security re-verification (not reviewer-trust)

### Fail-open — RE-DERIVED from shipped source (`dm.service.ts:656-665`)
Guard is `if (registeredKey && registeredKey.publicKey !== input.senderKeyRef)`. `const [registeredKey]` destructures `undefined` when the select returns `[]` (no key row) → short-circuits false → no throw → send proceeds. Fail-OPEN for keyless senders and the register-then-send race is structurally guaranteed, not asserted. **PASS (critical AC3).**

### Server-blind — RE-DERIVED from shipped source
Projection is `.select({ publicKey: user_encryption_keys.public_key })` — public material only. Comparison is `registeredKey.publicKey !== input.senderKeyRef` (public-vs-public string). No ciphertext, no private key, no envelope interior read. server-blind preserved. **PASS (AC6).**

### Throw ordering — RE-DERIVED
`BadRequestException` fires inside the `if (isEncrypted)` block, BEFORE `db.insert(dm_messages)` (:666+) and BEFORE the `if (isNewInsert)` `eventEmitter.emit('dm.message', …)` (:725+). Mismatch → no row, no fan-out, structurally. **PASS (AC2).**

### Post-rotation integration case GENUINELY EXECUTED (the key security-honesty question)
- Case exists and is load-bearing (`dm-encryption.integration.spec.ts:499`): upserts KEY_A then KEY_B, asserts via `harnessQuery` (separate real-Postgres connection) exactly one key row = KEY_B, sends with KEY_B → ACCEPTED + real row persisted, sends with stale KEY_A → `rejects.toBeInstanceOf(BadRequestException)`. Exercises the wave-79 rotation model against real DB.
- Not skipped in CI: the block is `describe.skipIf(SKIP)` with `SKIP = !process.env.DATABASE_URL_TEST`. The required CI `test` job (`.github/workflows/ci.yml`) provisions a `postgres:16` service AND sets `DATABASE_URL_TEST=postgres://test:test@localhost:5432/studyhall_test`; `test:ci` runs `vitest run … && vitest run --config vitest.integration.config.ts`. So `SKIP=false` → the integration suite (incl. post-rotation) RAN. Karen's "executed, not skipped" claim independently confirmed. **PASS.**

### XOR equivalence (jenny's AC4 basis) — RE-DERIVED from `packages/shared/src/dm.ts`
Two refinements: `hasContent !== hasCiphertext` (content XOR ciphertext) + `ciphertext present ⟹ senderKeyRef AND envelopeVersion present`. ⟹ `ciphertext present ⟺ senderKeyRef present` at the validated boundary. Gating on `isEncrypted` is provably equivalent to spec-prose "senderKeyRef != null" and strictly guarantees no null-deref. **Not a drift.** **PASS (AC4).**

### AC1 (match→accept) / AC5 (write-path only)
AC1: MATCH falls through to the normal encrypted INSERT (content null; ciphertext/sender_key_ref/envelope_version set) — integration `MATCHING → row stored` green. AC5: validation lives solely in `sendMessage`; `listMessages` + conversation-list carry no re-validation; historical rows untouched. **PASS.**

---

## Reviewer soundness (probe of the "clean" verdicts on a SECURITY change)
- **Karen APPROVE — sound.** Every load-bearing claim (validation block, fail-open guard, no circular dep, deploy hash, integration-ran-in-CI, antipattern-free) independently reproduced. The e2e anomaly she surfaced is correctly flagged non-falsifying.
- **jenny APPROVE — sound.** All 6 ACs + rotation edge + F-T8-2 closure verified against shipped code; the one "benign non-drift" (isEncrypted vs senderKeyRef gate) is genuinely provably-equivalent per the schema. Zero drift confirmed.
- No reviewer false-negative: both non-trivial APPROVEs were spot-checked against source, not rubber-stamped.

---

## V-2 triage correctness (2 findings, 0 blocking) — CONFIRMED
- **`e2e` red check — correctly NON-BLOCKING.** Live branch-protection required set = `[lint, typecheck, test, build, secret-scan, boot-probe]` (verified via API); `e2e` is NOT in it. Live PR #109 checks: required `test`=pass, only `e2e`=fail — merge legitimate. Failing spec is `delete-any-message.spec.ts` (moderation delete realtime path); grep confirms NO e2e spec references `senderKeyRef`/`dm.service`/encrypted send. It is a documented pre-existing single-client-realtime soft-check gap tracked since wave-44/45 (product-decisions + journey-map). A write-path-only DM-send change cannot regress it. Not re-filed (would duplicate) — correct.
- **Client-handling item — correctly NON-BLOCKING.** Mismatch-400 already surfaces as a VISIBLE failed-send (not silent); auto-re-register is a marginal UX enhancement for a rare trigger (stale client post key rotation). Not a security defect. Noted, not filed — correct against a thinning backlog.

---

## Anti-pattern sweep (SECURITY rigor)
- Acceptance-by-assertion: **none** — ACs re-derived from shipped source + real-DB integration, not from green suite alone.
- Spec drift: **none** — jenny cross-referenced spec/journey-map/decisions; the one implementation-vs-prose gate difference is provably equivalent.
- Reviewer false-negative: **none** — both clean verdicts probed against source.
- Green-by-suppression: **none** — no test weakened/disabled; the required `test` job (incl. real-Postgres integration + post-rotation) is genuinely green; the red check is non-required and unrelated, NOT suppressed to force green.
- Severity flattening / spec-gap patching / runaway fix loop: **n/a** — 0 blocking findings, empty fast-fix queue (0 cycles), F-T8-2 closed as intended (not guessed).

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: V-3
  attempt: 1
  security_wave: true
  reviewers: { karen: APPROVE, jenny: APPROVE }
  fast_fix_iterations: 0
  findings_blocking: 0
  findings_non_blocking: 2   # e2e non-required pre-existing flake; client auto-re-register enhancement
  spec_drift_count: 0
  spec_gap_count: 0
  independent_reverification:
    fail_open: PASS-rederived-from-source
    server_blind: PASS-rederived-from-source
    throw_before_insert_and_emit: PASS-rederived-from-source
    post_rotation_case_executed_in_ci: PASS-confirmed-not-skipped
    xor_equivalence: PASS-rederived-from-schema
    required_check_set_verified: [lint, typecheck, test, build, secret-scan, boot-probe]
    e2e_unrelated_to_change: PASS-grep-confirmed
  failed_checks: []
  rationale: >
    All 6 acceptance criteria are demonstrably met on the SHIPPED code (working tree == merge d0646058),
    not merely green in the suite: fail-open is structurally guarded, the server-blind public-vs-public
    comparison touches no private material, the throw precedes both INSERT and fan-out, and the wave-79
    post-rotation model is proven against real Postgres in the REQUIRED CI test job (the skipIf guard
    evaluated false — the integration suite genuinely ran). Both reviewer APPROVEs were probed against
    source and hold. The sole red check (e2e) is non-required per live branch protection, pre-existing
    (tracked since wave-44/45), and provably unrelated to a write-path-only DM change — a correct
    non-blocking triage, not green-by-suppression. Client-handling item is a marginal UX enhancement,
    correctly non-blocking. No acceptance-by-assertion, no spec drift, no suppression on a SECURITY change.
  next_action: PROCEED_TO_L1
```
