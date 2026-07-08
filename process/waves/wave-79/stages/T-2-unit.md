# T-2 — Unit (wave-79)

**Wave:** M13 leg-3a — server-blind E2E DM encryption.
**Pattern:** A — Verified-via-CI. Merge commit `0fa0f5f`.

## Action 1 — CI evidence
C-1 verdict PASS. **test** job required, pass (1m59s) on CI run `28912467863` / HEAD `e18b114` (squashed to `0fa0f5f`). Per C-1: web 722 + shared 41 + api 811 specs, plus the new dm-encryption integration spec on postgres:16. No flake re-run needed (study-timer.test.tsx did not trip). 0 fix-up cycles.

## Action 2 — Coverage audit (new modules → new tests)
Every new/changed production module in the diff has a dedicated or covering unit/spec file:

| Module (prod) | Covering test |
|---|---|
| packages/shared/src/privacy.ts (EncryptionKeySchema, PublicKeyResponseSchema) | exercised in profile.controller.spec + integration spec (schema safeParse of key material, bounded z.enum) |
| packages/shared/src/dm.ts (SendDmMessageSchema envelope + nullable content) | dm-encryption.integration.spec (mutual-exclusivity: both/neither/partial → reject; plaintext-only → accept) + dm.test.tsx |
| apps/api/src/profile/encryption-key.service.ts (upsertKey/getKeyFor) | integration spec — store+read-back, rotation (one row per user), no-private-column |
| apps/api/src/profile/profile.controller.ts (getEncryptionKey) | profile.controller.spec.ts + integration visibility matrix |
| apps/api/src/dm/dm.service.ts (sendMessage server-blind, canDm seam) | integration spec — content NULL + ciphertext persisted, canDm gate values |
| apps/web/src/features/crypto/dm-crypto.ts (ECDH+AES-GCM) | dm-crypto.test.ts — encrypt→decrypt round-trip |
| apps/web/src/features/crypto/keystore.ts (dexie private-key store) | covered via useDmEncryption.test.tsx flow |
| apps/web/src/shell/useDmEncryption.ts | useDmEncryption.test.tsx (F2 keygen-first-use, F4 fetch-peer-key, F6 fallback) |
| apps/web/src/shell/DmEncryptionIndicator.tsx (6 states) | dm-encryption-indicator.test.tsx — HONESTY: lock affordance ONLY on 'encrypted' |
| apps/web/src/shell/useDm.ts, DmThread.tsx, DmHome.tsx | dm.test.tsx + dm-encryption-flow.test.tsx (send-envelope, decrypt-incoming, plaintext-fallback) |

Coverage is adequate: the security-critical seams (server-blind write, no-oracle 404, crypto round-trip, indicator honesty) each have direct unit/integration assertions, not just smoke.

## Action 3 — Flake observation
C-1 `fix_up_cycles: 0`, no flake re-runs. No new flakes. study-timer.test.tsx (a known past flaker) did not trip this run.

## Action 4 — Discipline note
- Client crypto is tested by real Web-Crypto round-trip (encrypt then decrypt, assert plaintext recovered) — not a mock of SubtleCrypto. Correct: mocking the SUT would prove nothing.
- Indicator honesty is asserted structurally: the sole `data-testid="e2e-lock-affordance"` renders ONLY for state `encrypted` (isLock:true); every other state renders a non-lock glyph. This is the anti-security-theater guard as a unit assertion.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: CI run 28912467863 green, web 722 + shared 41 + api 811 + dm-encryption integration on postgres:16"
modules_audited: [privacy.ts, dm.ts (shared), encryption-key.service.ts, profile.controller.ts, dm.service.ts, dm-crypto.ts, keystore.ts, useDmEncryption.ts, DmEncryptionIndicator.tsx, useDm.ts, DmThread.tsx, DmHome.tsx]
new_flakes: []
findings: []
```
