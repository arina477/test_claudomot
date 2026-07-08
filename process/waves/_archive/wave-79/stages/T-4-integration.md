# T-4 — Integration (wave-79)

**Wave:** M13 leg-3a — server-blind E2E DM encryption.
**Pattern:** A — Verified-via-CI. Merge commit `0fa0f5f`; spec RAN green on real postgres:16 in CI run `28912467863` (C-1 coverage-theater guard confirmed it EXECUTED, not skipped).

## The crown-jewel proof: `apps/api/test/integration/dm-encryption.integration.spec.ts`
Read in full at T-4. Real-Postgres harness (`pg-harness` first import per CF-2; separate-connection SELECTs prove server-side truth, not just DTO). Groups + assertions:

### 1. SERVER-BLIND INVARIANT (491cb85d — load-bearing)
- `encrypted send persists ciphertext with content NULL`: after `dmService.sendMessage(convId, ALICE, {ciphertext, senderKeyRef, envelopeVersion})`, a **separate-connection** `SELECT content, ciphertext, sender_key_ref, envelope_version FROM dm_messages WHERE id=$1` → `content IS NULL`, `ciphertext = 'BASE64_AES_GCM_ENVELOPE…'`. Server stores NO plaintext.
- `no code path can read plaintext`: `listMessages` (read path) returns content NULL for the encrypted row; a full-table scan `WHERE conversation_id=$1 AND content IS NOT NULL` → count 0.
- `listConversations preview` → `lastMessage.content === "Encrypted message"` placeholder (P-4 karen 3 — no crash, no blank, no leak).

### 2. MUTUAL EXCLUSIVITY at write boundary (491cb85d)
- rejects BOTH content+ciphertext; rejects NEITHER; rejects PARTIAL envelope (ciphertext w/o senderKeyRef/version); ACCEPTS plaintext-only (backward-compat). All via `SendDmMessageSchema` → server-blindness enforced at the schema boundary.

### 3. PLAINTEXT FALLBACK (491cb85d)
- plaintext send persists `content` set, `ciphertext NULL` (no regression); separate-connection SELECT confirms.
- idempotent re-send of an encrypted envelope (same idempotencyKey) → single row (count 1).

### 4. KEY REGISTRY (60bda5be)
- store + read-back (`upsertKey`/`getKeyFor`); rotation → one row per user (count 1, publicKey='ROTATED_KEY'); **no-private-column** — `information_schema.columns WHERE table_name='user_encryption_keys'` contains `public_key`, and `.some(n => n.includes('private')) === false`.

### 5. KEY-FETCH VISIBILITY MATRIX (60bda5be, P-4 karen 1 — who_can_dm gate)
- `who_can_dm='everyone'` + key → 200 PublicKeyResponse; response has NO `email` prop and no `enc-bob@test.local` value (no email/private leak).
- `who_can_dm='server-members'` + shared server + key → 200.
- self-fetch always permitted (bypasses gate even with who_can_dm='nobody').
- **BYTE-IDENTICAL 404 (no oracle):** cases A (who_can_dm=nobody + key present), B (server-members but NOT shared), C (nonexistent target), D (permitted but no key) — all status 404 AND `caseA.message === caseB.message === caseC.message === caseD.message` (`toStrictEqual`). Proven against the REAL `ProfileController.getEncryptionKey` (the shape clients see).
- `canDm` seam: nobody→false, everyone→true, shared-server→true, not-shared→false.

## Action 4 — Boundary coverage trace
| B-0/B-2 boundary | Integration coverage |
|---|---|
| migration 0031 user_encryption_keys (user_id TEXT FK) | store/rotate/no-private-column via real table |
| migration 0032 dm_messages content→nullable + ciphertext/sender_key_ref/envelope_version/deleted_at | server-blind SELECT read-back |
| DmService.sendMessage server-blind write | separate-connection SELECT content NULL |
| DmService.canDm (enforceWhoCanDm seam) | canDm value matrix + 404 no-oracle |
| EncryptionKeyService | store/rotate/getKeyFor |
| ProfileController.getEncryptionKey | real controller exercised in 404 matrix |
| listConversations NULL-content preview | "Encrypted message" placeholder |

Every schema/service boundary the wave introduced is exercised against real Postgres — no mock-the-DB, no mock-the-SUT. This is the T-8 server-blind evidence base (see T-8 Action 1).

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [user_encryption_keys-table, dm_messages-envelope-cols, DmService.sendMessage, DmService.canDm, EncryptionKeyService, ProfileController.getEncryptionKey, listConversations-null-preview]
ci_evidence:
  - "C-1 test job 28912467863 green; dm-encryption.integration.spec.ts RAN on real postgres:16 (coverage-theater guard confirmed executed)"
  - "server-blind invariant proven via separate-connection SELECT: content NULL, ciphertext NOT NULL"
  - "byte-identical uniform-404 matrix (cases A/B/C/D toStrictEqual) against real ProfileController"
  - "no-private-column asserted via information_schema; rotation → one row; plaintext fallback + idempotency"
active_run_output: ""
infrastructure_gap_recorded: false
findings: []
```
