# Wave 79 — B-3 Frontend (client crypto + honest indicator) — task 3fb88f44 — commit 38757f9

react-specialist. Matched adopted design/e2e-indicator.html (6 fail-closed states).

## Crypto
- `features/crypto/dm-crypto.ts` (ECDH-P256 + AES-GCM), `features/crypto/keystore.ts` (dexie keypair), `shell/useDmEncryption.ts` (lifecycle+resolve), `shell/dmEncryptionState.ts` (6-state model), `shell/DmEncryptionIndicator.tsx`.
- Modified: auth/api.ts (+putEncryptionKey/getPeerEncryptionKey), features/sync/db.ts (v6 encryptionKeys table), useDm.ts (encrypt-send/decrypt-receive), DmThread.tsx+DmHome.tsx (indicator), icons.tsx (shield-check-fill/lock-open/shield-slash/key).
- **Private key extractable=false** → SubtleCrypto refuses export → CANNOT enter a request body (structural, not a promise). Only base64 SPKI public key registered. Per-message random 12-byte IV; envelope = base64(JSON{iv,ct}) + senderKeyRef(sender's own pubkey, recipient derives) + envelopeVersion:1. Decrypt returns {ok:false} on failure — never throws.

## Honest indicator fails closed (guards)
- Emerald filled shield (data-testid e2e-lock-affordance) is the ONLY lock, renders ONLY for state 'encrypted'. resolveConversation sets 'encrypted' ONLY after a peer key is provably fetched+imported; 404/error→'plaintext'; group(>2)→'group'; mount→'loading'. Per-message row 'encrypted' ONLY when a real ciphertext envelope decrypts; failed decrypt→'cannot-decrypt' (calm, no crash, no plaintext).

## Tests (19 new, through real DM parent)
- dm-crypto.test.ts (9), dm-encryption-indicator.test.tsx (7), dm-encryption-flow.test.tsx (3). Anti-security-theater: lock ABSENT in every non-encrypted state, present only when encrypted; wire body is envelope (no plaintext) for keyed peer, plaintext for 404 peer, NO private key ever on the wire; key-loss→cannot-decrypt no crash.

## Results
- web **722 passed** (52 files); web+api typecheck clean; biome ci clean (392 files). /simplify applied.
- **Deviations (all ACCEPTED — sound):** (1) encryption at wire boundary not outbox (offline outbox = device-local, same trust boundary as private key; transform to envelope just before POST — PRESERVES offline-first wedge); (2) senderKeyRef=sender's own public key (recipient needs it to derive shared secret — correct crypto); (3) biome-formatted one pre-existing dm.ts import-wrap (zero semantic).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/features/crypto/dm-crypto.ts, apps/web/src/features/crypto/keystore.ts, apps/web/src/shell/useDmEncryption.ts, apps/web/src/shell/dmEncryptionState.ts, apps/web/src/shell/DmEncryptionIndicator.tsx, apps/web/src/auth/api.ts, apps/web/src/features/sync/db.ts, apps/web/src/features/sync/types.ts, apps/web/src/shell/useDm.ts, apps/web/src/shell/DmThread.tsx, apps/web/src/shell/DmHome.tsx, apps/web/src/shell/icons.tsx]
designs_consumed: [design/e2e-indicator.html]
deviations: [{change: "wire-boundary encryption", adjudication: accepted}, {change: "senderKeyRef=own pubkey", adjudication: accepted}, {change: "biome format dm.ts", adjudication: accepted}]
simplify_applied: true
```
