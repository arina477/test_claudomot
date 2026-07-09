# Wave 88 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-88/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

The defense-in-depth senderKeyRef check is implemented correctly and in the right place. Verified against the actual diff (`dm.service.ts` +18 lines, `1d10fa58..aadd5a08`), not the deliverable prose:

- **Placement is correct.** The check sits inside the `if (isEncrypted)` branch, AFTER the IDOR/participant gate (404, line 617) and the block-relation gate (403, line 633), and BEFORE the `dm_messages` insert (line 686). The `throw` precedes the insert, so a rejected send produces no row and no `dm.message` emit — confirmed by both the AC2 unit assertion (`mockInsert not called`, `emitter.emit not called`) and the real-Postgres mismatch test (`count(*) = 0` over a separate harness connection).
- **Fail-OPEN is correct.** `const [registeredKey] = ...limit(1)` yields `undefined` when no key row exists; the throw is gated on `registeredKey && registeredKey.publicKey !== input.senderKeyRef`, so a keyless sender (and the register-then-send race) passes through. AC3 unit + the no-key integration test both prove acceptance + storage.
- **Write-path-only.** The diff touches exactly one production symbol (`sendMessage`) plus one import (`user_encryption_keys`). No read/list method changed; AC5 unit test asserts `listMessages` performs no key select (exactly 3 selects, no rejection). Historical stored messages are never re-validated.
- **Server-blindness preserved.** The comparison is a `!==` on two public-key strings — `input.senderKeyRef` (the sender's base64 SPKI public key per the shared schema) vs `user_encryption_keys.public_key` (public material). The select projects `{ publicKey }` only; no ciphertext, plaintext, or private material is read or touched.
- **`callerId` is not spoofable.** It is session-derived at the controller (`req.session.getUserId()`, dm.controller.ts:125), never client-supplied. The key lookup keys on `callerId`, so an attacker cannot present another user's `senderKeyRef` — the registered key resolved is always the authenticated sender's.
- **No bypass.** The shared `SendDmMessageSchema.superRefine` enforces (a) content-XOR-ciphertext (never neither/both) and (b) that a present `ciphertext` MUST be accompanied by `senderKeyRef` + `envelopeVersion`. So `isEncrypted === true` guarantees a non-empty `senderKeyRef` reaches the check; there is no path that persists `sender_key_ref` while skipping the `isEncrypted` guard (the insert's encrypted branch is the identical condition). The Drizzle `eq()` is parameterized — no SQL injection surface.
- **Tests are real tripwires.** Load-bearing claim confirmed by inspection: reverting the production throw leaves AC1/AC3/AC4/AC5 (all expect success) green and fails ONLY AC2 (which requires the throw). The post-rotation integration test is genuine: it upserts KEY_A then KEY_B, asserts a single key row equal to KEY_B, proves a send with the CURRENT KEY_B is accepted + stored, and proves a stale-KEY_A send is rejected — a legitimate rotate-then-send is NOT rejected, exactly per the spec's rotation-antipattern reframe.
- **No deviation / no gold-plating.** Scope is the three planned files only. The inline read-only select (vs injecting EncryptionKeyService) is the P-3/P-4-karen-corrected path that avoids the DmModule⇄ProfileModule cycle; it is a deliberate, documented deviation from the spec's prose note, and is the lower-risk choice. B-4 repo typecheck confirms no circular dep; 833 unit green; build exit 0.

One non-blocking note carried forward from P-4 (T-block scope, not B): the web client must surface the new mismatch-400 as re-register+retry rather than a silent drop (T-8 carry-forward). This does not affect the server-side gate verdict.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
