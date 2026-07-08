/**
 * dmEncryptionState.ts — the honest, fail-closed indicator state model (wave-79).
 *
 * These are the ONLY six states the E2E indicator may ever render (matching the
 * adopted design at design/e2e-indicator.html). The cardinal rule (SHIP-BLOCKER):
 * the ENCRYPTED state — the ONLY one that shows a lock/shield affordance — may
 * appear ONLY when there is PROOF the message was a real ciphertext envelope.
 * Every other path (no peer key, group DM, key-fetch error, undecryptable,
 * still-loading) resolves to a NON-lock state. Absent proof of encryption →
 * never a padlock.
 */

export type DmEncryptionState =
  // State 1 — provably encrypted (real ciphertext envelope). The ONLY lock state.
  | 'encrypted'
  // State 2 — plaintext fallback (peer has no key / key-fetch 404). Not encrypted.
  | 'not-encrypted-plaintext'
  // State 3 — group DM (>2 participants; out of scope for encryption). Not encrypted.
  | 'not-encrypted-group'
  // State 4 — an encrypted envelope we cannot decrypt on this device (key lost / new device).
  | 'cannot-decrypt'
  // State 5 — establishing / loading. Component DEFAULTS here on mount — never a lock.
  | 'loading';

/**
 * Conversation-level capability, resolved once per open conversation:
 *   - 'loading'   — still resolving the peer key (indeterminate; header shows loading).
 *   - 'encrypted' — 1:1 with a usable peer key → outgoing sends are encrypted.
 *   - 'plaintext' — 1:1 but peer has no usable key (404 / key-fetch error) → plaintext send.
 *   - 'group'     — >2 participants → out of scope for encryption → plaintext send.
 */
export type ConversationCryptoCapability = 'loading' | 'encrypted' | 'plaintext' | 'group';

/** Map the conversation-level capability to the header badge indicator state. */
export function headerStateFor(cap: ConversationCryptoCapability): DmEncryptionState {
  switch (cap) {
    case 'loading':
      return 'loading';
    case 'encrypted':
      return 'encrypted';
    case 'group':
      return 'not-encrypted-group';
    default:
      // plaintext (peer keyless) AND key-fetch-error both fail closed to here.
      return 'not-encrypted-plaintext';
  }
}
