# V-1 jenny — semantic spec verification (wave-88)

**Agent:** jenny (Senior SW Engineering Auditor — spec-compliance)
**Wave:** wave-88 — server-side senderKeyRef validation on encrypted DM send (defense-in-depth)
**Target:** DEPLOYED api `https://api-production-b93e.up.railway.app` (merge `d0646058`, live per C-2)
**Authoritative spec:** `tasks.id=1f48f4db-451f-44a4-b7d4-abb1572ea7b5` (DB row, YAML head + prose)
**Method:** deployed/shipped code inspection (HEAD == merge d0646058) + integration evidence (PR #109) + /health probe. No live authed send (behavior CI-proven vs Postgres).

## VERDICT: **APPROVE**

All 6 acceptance criteria + both edge/semantic questions verified against shipped behavior. Zero spec drift. One benign, provably-equivalent implementation-vs-spec-prose divergence in the gate predicate (see §Notes) — not a drift, not a gap.

---

## Evidence by AC

**Shipped code:** `apps/api/src/dm/dm.service.ts` `sendMessage` — HEAD matches merge `d0646058`. Validation block sits after the IDOR gate (:614) and Block gate (:635), and **before** the INSERT (:665) and the `dm.message` emit (:725). Ordering is exactly per spec `internal:` note.

Gate predicate: `const isEncrypted = input.ciphertext !== undefined;` then
```
if (isEncrypted) {
  const [registeredKey] = await db.select({publicKey: user_encryption_keys.public_key})
    .from(user_encryption_keys).where(eq(user_encryption_keys.user_id, callerId)).limit(1);
  if (registeredKey && registeredKey.publicKey !== input.senderKeyRef) {
    throw new BadRequestException('senderKeyRef does not match your registered encryption key');
  }
}
```

- **AC1 (match → accept, unchanged):** MATCH falls through to the normal INSERT + emit; encrypted insertValues (content null, ciphertext/sender_key_ref/envelope_version set) unchanged. Integration test `registered key MATCHING senderKeyRef → row stored` asserts `dto.senderKeyRef===KEY_A` and `n=1` row. **PASS.**
- **AC2 (mismatch → 4xx, no-insert, no-emit):** `throw new BadRequestException(...)` (HTTP 400) fires BEFORE the insert and the `if (isNewInsert)` emit block → no row, no event structurally guaranteed. Message string matches spec verbatim. Integration test `MISMATCHING → rejected, no row stored` asserts `rejects.toBeInstanceOf(BadRequestException)` and `n=0`. **PASS.**
- **AC3 (no registered key → SUCCEEDS, fail-OPEN):** guard is `if (registeredKey && ...)` — `registeredKey` undefined (empty select) short-circuits, no throw, send proceeds. Integration test `sender with NO registered key → send SUCCEEDS (fail-open)` asserts `dto.ciphertext==='CT_NOKEY'` and `n=1`. **PASS — critical AC confirmed; keyless senders / register-then-send race not broken.**
- **AC4 (senderKeyRef null/absent → no validation):** validation is gated on `isEncrypted` (ciphertext present). Non-encrypted (plaintext) path never enters the block. See §Notes for the ciphertext-vs-senderKeyRef equivalence proof. Plaintext-path integration tests store `content` set / `ciphertext null` unchanged. **PASS.**
- **AC5 (write-path only):** validation lives solely inside `sendMessage`. `listMessages` (:744+) and the conversation-list path carry NO re-validation. Historical rows untouched. **PASS.**
- **AC6 (server-blind preserved):** comparison is `registeredKey.publicKey !== input.senderKeyRef` — two public-key strings. `user_encryption_keys.public_key` is public material (notNull, UNIQUE(user_id)); `senderKeyRef` is the sender's base64 SPKI public key (wave-79 dm-crypto model). No plaintext, private key, or ciphertext interior is read (the select projects `public_key` only). server-blind public-vs-public string comparison intact. **PASS.**

## Edge / semantic (Q6)

- **wave-79 DM-crypto model consistency:** `user_encryption_keys UNIQUE(user_id)` + upsert-replace rotation ⇒ single-valued current key. `getKeyFor`/direct select returns the NEW key post-rotation.
- **Stale-client-after-rotation 400:** a send asserting the OLD key after rotation is correctly rejected — the client re-registers on rotation, so a legitimate current client always asserts the current key. Integration test `post-rotation (T-8)` proves: send with rotated KEY_B is ACCEPTED (`n=1`), send with stale KEY_A is REJECTED (`BadRequestException`). Consistent with the model, not a dead-end.
- **F-T8-2 closure:** the wave-79 T-8 finding (server writes senderKeyRef verbatim with no validation) is closed as intended — server now enforces sender==registered on the write path as defense-in-depth atop the recipient's existing fail-closed check (wave-79 F2). Retired per T-block (commit e439eb40). **No spec drift; no spec gap.**

## Journey continuity (Q7)

The DM send flow introduces **no dead-end for a legitimate sender**: a legitimate sender transmits its own registered public key as `senderKeyRef` → MATCH → accept. The only rejection paths are (a) a spoofed/mismatched key (the attack this closes) and (b) a stale post-rotation client (self-heals on re-register). Keyless senders fail-open. No broken state.

## Integration + deploy evidence

- PR #109 merged `d0646058` (2026-07-09). CI rollup: lint / typecheck / test / build / secret-scan / boot-probe all **SUCCESS**. The 4 senderKeyRef cases + rotation edge run green in the `test` job against real Postgres (`apps/api/test/integration/dm-encryption.integration.spec.ts` → `describe('encrypted send senderKeyRef re-validation (wave-88 B-2)')`).
- **e2e check = FAILURE, confirmed NOT a regression:** the failing test is `apps/web/e2e/delete-any-message.spec.ts` — a moderator message-delete Socket.IO fan-out / sign-in flake (pre-existing, documented in wave-87 T-block + wave-88 C-block as the "e2e sign-in flake"). It exercises the delete/moderation realtime path, which this write-path-only DM-send change does not touch. Not DM-encryption, not senderKeyRef.
- Deployed `/health` → `200 {"status":"ok","service":"studyhall-api","version":"0.0.1"}`. Live.

## Notes — spec-prose vs implementation predicate (benign, provably equivalent)

Spec `internal:` prose says "when `input.senderKeyRef != null`". Implementation gates on `isEncrypted = input.ciphertext !== undefined`. These are **provably equivalent** given `SendDmMessageSchema` (`packages/shared/src/dm.ts`), which enforces a strict XOR at the request boundary via two refinements:
1. content XOR ciphertext (exactly one present);
2. `if ciphertext present → senderKeyRef AND envelopeVersion MUST both be present` (:160-174); and `senderKeyRef` cannot arrive without `ciphertext` (the content-XOR-ciphertext rule forbids a content+senderKeyRef body, and a bare senderKeyRef without either content or ciphertext fails the content-XOR-ciphertext "never neither" clause).

⇒ `ciphertext present ⟺ senderKeyRef present` at the validated boundary. Gating on `isEncrypted` is therefore identical in behavior to gating on `senderKeyRef != null`, and additionally guarantees `senderKeyRef` is defined whenever the block runs (no null-deref). Classified **not-a-drift**: implementation is stricter-provenance and semantically identical to spec intent.

## Summary
APPROVE — all 6 ACs + rotation edge + F-T8-2 closure verified against deployed code and green Postgres integration evidence; server-blind + fail-open preserved; the sole e2e failure is the documented pre-existing delete-flow flake, unrelated to this write-path change.
