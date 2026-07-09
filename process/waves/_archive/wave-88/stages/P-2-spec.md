# Wave 88 — P-2 Spec (pointer)

**Source of truth:** `tasks` row `1f48f4db-451f-44a4-b7d4-abb1572ea7b5` `.description` (YAML head + `---` + prose). Convenience copy.

**wave_type:** single-spec · **claimed_task_ids:** [1f48f4db] · **design_gap_flag:** false · **SECURITY wave** (T-8 + P-4 security-tightened gate)

## Acceptance criteria (copy)
1. Encrypted DM send, senderKeyRef == author's registered key → succeeds unchanged (stored + dm.message emitted).
2. Encrypted DM send, senderKeyRef != registered key → REJECTED 4xx (400 pref), no insert, no emit.
3. Encrypted DM send, author has NO registered key (getKeyFor null) → SUCCEEDS (fail-OPEN).
4. senderKeyRef null/absent (non-encrypted) → no validation, unchanged.
5. Send/write path ONLY — read/list never re-validated (historical messages unaffected).
6. Server-blind preserved — public-key-string comparison only.

## Scope guard
Server-side defense-in-depth on `dm.service.ts sendMessage`; call `EncryptionKeyService.getKeyFor(authorId)`; reject on mismatch, fail-open on null. NO client/schema/migration change. Fail-open is correctness-critical. T-8 negative test: post-rotation send with the current key NOT rejected.
