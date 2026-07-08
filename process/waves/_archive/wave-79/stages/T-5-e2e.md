# T-5 — E2E (wave-79)

**Wave:** M13 leg-3a — server-blind E2E DM encryption.
**Pattern:** B — Active-execution (live Playwright, deployed prod).
**Web:** https://web-production-bce1a8.up.railway.app · **api:** https://api-production-b93e.up.railway.app
**Testers:** 2 ui-comprehensive-tester (A-side send+wire-inspection; B-side decrypt+indicator-honesty). Browser contexts left OPEN (rule 5 honored — no browser_close). Note: all playwright-N MCP tools resolved to one shared Chrome profile, so the pair ran serialized on the same profile; identity verified via /me after each nav; results unaffected.

## Scenario verdicts (each maps to an AC)

| id | criterion_ref | verdict | evidence |
|---|---|---|---|
| T5-A1 | 3fb88f44 AC1: keygen on first use; public key registered; private never sent | PASS | IndexedDB `studyhall.encryptionKeys[self]` created on first DM use; PUT /profile/encryption-key body = `{"publicKey":"MFkwEw…roEA==","algorithm":"ECDH-P256-AES-GCM"}` (public only); privateKey is CryptoKey `extractable:false` — `subtle.exportKey('pkcs8')` THREW InvalidAccessError; zero private-key markers in any body/query/header |
| T5-A2 | 3fb88f44 AC2 + 491cb85d: outgoing DM is a ciphertext envelope, no plaintext | PASS | POST /dm/conversations/5f62052f…/messages body = `{"ciphertext":"eyJpdiI…","senderKeyRef":"<A pubkey>","envelopeVersion":1,"idempotencyKey":"…"}` — NO `content` field; probe string `E2E-PROBE-SECRET-K7Qx9M` absent from raw body, decoded envelope (`{iv,ct}` AES-GCM), and inner ct; senderKeyRef == A's registered public key |
| T5-B1 | 3fb88f44 AC1 (peer side) | PASS | B login → DM home → PUT /profile/encryption-key 200 on first use; thread opens, no crash |
| T5-B2 | 3fb88f44 AC2: peer decrypts + reads plaintext | PASS | B read decrypted plaintext `E2E-PROBE-SECRET-K7Qx9M`; server GET /dm/conversations/:id/messages returns that msg `content:""` + hasCipher:true (server holds only envelope; client decrypts locally) — LIVE server-blind confirmation |
| T5-B3 | 3fb88f44 AC3: honest indicator, emerald ONLY for encrypted | PASS | e2e-lock-affordance count=1 (encrypted DM header, emerald rgb(16,185,129), "End-to-end encrypted"); 0 locks on 29 historical plaintext msgs; 0 locks on a server channel (negative control). Group/no-key-peer conversation NOT live-constructible (single-recipient DM dialog only) → verified via DOM assertion instead of a live group |

## Key live proofs (crown-jewel-adjacent)
1. **Private key NEVER on the wire** — architecturally enforced (non-extractable CryptoKey; export throws). Zero markers in any request.
2. **Outgoing envelope is ciphertext** — `{ciphertext, senderKeyRef, envelopeVersion}`, no plaintext content; plaintext probe never leaked.
3. **Peer decrypts** — B rendered the exact plaintext; server stores `content:""`/ciphertext (server-blind LIVE).
4. **Indicator fails closed** — emerald lock ONLY on the encrypted DM; absent on plaintext history + server channels.

## Findings
- **F-T5-1 (medium, V-2):** client-side auth-guard race on DM route — entering Direct Messages right after login sometimes bounces the SPA to marketing `/` as if logged out, though GET /me returns 200 (session cookie valid) and re-nav to /app recovers with no re-login. Transient 401 during the concurrent DM-load burst (GET /dm/conversations + PUT /profile/encryption-key + socket.io polling) flips isAuthenticated. Not a real session invalidation; a first-time user could perceive a spurious logout. Triage tag: `frontend/auth-guard-race`.

```yaml
test_pattern: active
skipped: false
testers_spawned: 2
scenarios:
  - {id: T5-A1, criterion_ref: 3fb88f44-AC1, verdict: PASS, evidence_path: t5-a1-dm-home-keypair-registered.png}
  - {id: T5-A2, criterion_ref: 3fb88f44-AC2, verdict: PASS, evidence_path: t5-a2-probe-sent-encrypted-state.png}
  - {id: T5-B1, criterion_ref: 3fb88f44-AC1, verdict: PASS, evidence_path: b1-dm-view.png}
  - {id: T5-B2, criterion_ref: 3fb88f44-AC2, verdict: PASS, evidence_path: b2-decrypted-probe-and-emerald-lock.png}
  - {id: T5-B3, criterion_ref: 3fb88f44-AC3, verdict: PASS, evidence_path: b2-decrypted-probe-and-emerald-lock.png}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: medium, scenario: T5-B(all), description: "client-side auth-guard race on DM route bounces SPA to / on transient DM-load 401 despite valid session; recovers on re-nav. tag frontend/auth-guard-race"}
```
