# Wave 79 — B-6 /review output (crypto adversarial)

Scope: CLEAN — server-blind E2E DM encryption, matches intent. Primitives VERIFIED sound (non-extractable key, random-IV AES-GCM, ECDH-P256, server-blind content NULL, XOR write boundary, self-only PUT, uniform-404 body).

## Findings (adversarial crypto reviewer) → triage
| # | Sev | Finding | Disposition |
|---|---|---|---|
| F2 | **High** | Recipient derived shared secret from envelope-embedded senderKeyRef, not the author's server-registered key → spoofed key decrypts + shows lock (sender-auth gap) | **FIXED** B-3 re-entry dc7132e: decrypt binds to author's server key (resolvePeerKey(authorId)); mismatched senderKeyRef → cannot-decrypt (dm-crypto.ts:189). Re-review CLOSED. |
| F4 | **High** | Key regeneration as a decrypt side-effect → transient key-unavailability silently rotates+re-registers → permanent history loss + downgrade | **FIXED** dc7132e: removed side-effecting regen; missing key → cannot-decrypt, no rotation (useDmEncryption.ts:237); keypairRef race resolved (single keypairPromiseRef). Re-review CLOSED. |
| F7 | **High** | Delivered-row indicator state from live capability, not actual send outcome → plaintext row could show lock in a race | **FIXED** dc7132e: proof-based labeling via sentModeRef (actual OutgoingCrypto.mode) (useDm.ts:250-255). Re-review CLOSED. |
| F6 | Med | Stale peer-key cache on rotation | **FIXED** dc7132e: force-refetch on decrypt failure (bounded, no loop). |
| F1 | P1 | "End-to-end encrypted" overclaims given v1 server-trusted key distribution (no safety numbers) | **Accepted v1 bound + honest copy** (dc7132e tooltip states keys exchanged via server, no malicious-server-defense implication). Documented in product-decisions. |
| F3 | P2 | Server doesn't validate senderKeyRef == author's registered key (defense-in-depth) | **Non-blocking → V-2 follow-up** (server-side complement to F2's client fix). |
| F5 | P3 | who_can_dm key-fetch timing oracle (not-permitted vs no-key vs has-key by latency/query-count) | **Non-blocking → V-2/T-8** (body+status uniform; timing is a weak oracle; cheap fix = always run getKeyFor before branching). |
| F8 | P3 | No rate-limit on GET /profile/:userId/encryption-key (enumeration + timing amplification) | **Non-blocking → V-2** (add @Throttle like DM read routes). |

Head-builder Phase-1 obs (non-blocking → T-block): putEncryptionKey return-type mismatch (no impact); silent plaintext-fallback on key-reg failure (honest indicator shows not-encrypted); deleted_at tombstone added but read-filtering not yet wired (pre-existing DM gap).

Re-review recommendation: **MERGE-READY** — F2/F4/F7 each enforced by a cited fail-closed line; crypto core + no-plaintext-leak + non-extractable-key intact; residual = a peer-key negative-cache perf nit (no security impact).

Post-fix: repo typecheck 4/4; biome clean (393); crypto/dm 26/26; full web 728/729 (1 = study-timer pre-existing timing flake, passes in isolation).
