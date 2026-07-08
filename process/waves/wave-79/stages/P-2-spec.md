# Wave 79 — P-2 Spec (pointer)

**Source of truth:** seed task **60bda5be** `tasks.description` (fenced YAML head + `---` + prose). Convenience pointer.

- **wave_type:** multi-spec (3 blocks — E2E chain)
- **claimed_task_ids:** [60bda5be (key registry), 491cb85d (server-blind envelope), 3fb88f44 (client crypto + honest indicator)]
- **design_gap_flag:** true (E2E status indicator)

## AC digest (for P-3/P-4)
### Block 1 — public-key registry (60bda5be)
- PUT /profile/encryption-key stores/rotates public material (never private); GET /profile/:userId/encryption-key gated by fail-closed visibility (who_can_dm) → 200 | uniform 404 (hidden/blocked/nonexistent/no-key, no oracle) | 401. New user_encryption_keys table (no private-key column). EncryptionKeySchema + PublicKeyResponseSchema in shared/privacy.ts.

### Block 2 — server-blind envelope (491cb85d)
- SERVER-BLIND hard AC: encrypted DM → ciphertext + sender_key_ref + envelope_version persisted, plaintext content NULL; server stores no readable plaintext. Migration relaxes dm content NOT NULL→nullable + adds ciphertext cols + DEFINES tombstone (none today). Backward-compat plaintext path for keyless peers. Idempotency + soft-delete apply to ciphertext. Gateway passthrough (never decrypts).

### Block 3 — client crypto + honest indicator (3fb88f44)
- Web Crypto keygen, private key browser-only (never sent), register public key. Encrypt outgoing to peer key / decrypt incoming; cache peer keys. HONEST INDICATOR (ship-blocker, fails closed): lock ONLY when provably encrypted; plaintext-fallback → not-encrypted, never a false padlock. Key-loss/no-multi-device v1 (honest degrade, no crash). B-3 pins the algorithm.

## LOAD-BEARING (T-8 + P-4 security-scope gate): server-blind invariant; honest fail-closed indicator; visibility-gated key fetch; migration builds tombstone/nullable.

## P-4 corrections (binding, folded into the DB spec)
1. Peer-key GET gates on **who_can_dm** (not profile_visibility) — uniform 404 preserved.
2. user_encryption_keys.user_id = **text** FK to users.id (not uuid).
3. listConversations preview → "Encrypted message" placeholder on NULL content.
4. Group DMs out of scope for encryption in leg-3a (plaintext-fallback + honest not-encrypted).
5. algorithm bounded z.enum (400); reject encrypted+plaintext-both; T-8 no-key→404 no-oracle row; reuse dexie for key store.
