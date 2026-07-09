# Wave 88 — T-8 Security (SECURITY wave — fires)

This wave IS a security fix (DM crypto-integrity defense-in-depth), so T-8 is the primary verification layer. Evidence is CI-executed (not synthetic).

## Security properties verified
1. **Server-side rejection of a mismatched senderKeyRef — PROVEN.** CI integration (#109, real Postgres): a send whose senderKeyRef != the author's registered public key throws BadRequestException with ZERO rows persisted (side-effect-free rejection). Unit AC2 asserts no insert + no dm.message emit. Load-bearing verified (revert-the-throw fails only this case).
2. **Fail-OPEN — no lockout / no privilege denial for keyless senders — PROVEN.** A sender with no registered key sends successfully (CI integration + unit AC3). Covers keyless senders + the register-then-send race. A fail-CLOSED design would have DoS'd legitimate keyless sends — correctly avoided.
3. **Server-blind E2E model preserved — VERIFIED.** The check compares two PUBLIC key strings (senderKeyRef = sender's base64 SPKI public key; user_encryption_keys.public_key is public). No plaintext, private key, or ciphertext interior is accessed (head-builder + karen P-4 confirmed; the select projects public_key only).
4. **Unspoofable identity — VERIFIED.** The check keys off the session-derived `callerId` (req.session.getUserId()), never a client-supplied field. superRefine forces senderKeyRef to accompany ciphertext, so no path persists sender_key_ref while skipping the isEncrypted guard (head-builder B-6).
5. **No privilege escalation.** The check only RESTRICTS (rejects mismatched sends) — it cannot grant any capability. Write-path only; reads unaffected.
6. **Legitimate post-rotation send NOT rejected — PROVEN.** CI T-8 case: rotate key A→B, send with the current key B is ACCEPTED (the feared over-strict-validation failure mode is neutralized by UNIQUE(user_id) single-key + upsert-replace).

## P-4 carry-forward — client handling of the new mismatch-400
The web DM send (`useDm.ts` sendDmMessage, optimistic pending→failed, :610 catch) surfaces a send rejection as a VISIBLE failed-send state — NOT a silent drop. Acceptable: the mismatch-400 only triggers for a stale client after key rotation (rare edge), and the user sees the failure and can retry (retry re-fetches/re-registers). An auto-re-register-on-keyref-mismatch retry would be a marginal UX enhancement (recorded as a low observation, non-blocking — not filed given the thin backlog + rare trigger + already-visible failure).

## Verdict
No security finding blocks. The fix strengthens the DM trust surface without introducing a new failure mode (fail-open + post-rotation acceptance verified). Wave-88's own security surface is clean.
```yaml
skipped: false
test_pattern: active-ci
security_properties_verified: [mismatch-rejected, fail-open, server-blind, unspoofable-callerId, no-privilege-escalation, post-rotation-accepted]
client_handling: "mismatch-400 surfaces as visible failed-send (not silent); auto-re-register enhancement noted non-blocking"
findings: []
```
