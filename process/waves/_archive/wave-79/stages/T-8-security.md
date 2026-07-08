# T-8 — Security (wave-79) — CROWN JEWEL

**Wave:** M13 leg-3a — server-blind E2E DM encryption. **wave_type includes `auth`** (crypto/privacy, security-critical) → fires FULL probe set. P-4 security-scope tightened gate applied at spec time.
**Pattern:** B — Active-execution (live prod probes + CI integration proof).
**api:** https://api-production-b93e.up.railway.app · Fixtures A (21984eb2…) / B (da74148e…), header-mode Bearer.
**applicable_probes:** [server_blind, who_can_dm_gate + uniform_404, honest_indicator, no_private_key_leak, csrf/origin, rate_limit, timing_oracle, secret_grep]

---

## 1. SERVER-BLIND (LIVE + CI) — the load-bearing invariant
**Verdict: PROVEN.** Two independent evidence lines:

- **LIVE (T-5 B2):** A sent an encrypted DM to B; the authoritative server API `GET /dm/conversations/5f62052f…/messages` returns that message with **`content: ""` and ciphertext present (`hasCipher:true`)** — the server holds ONLY the envelope. B's client decrypted it locally to `E2E-PROBE-SECRET-K7Qx9M`. The outgoing `POST …/messages` body carried `{ciphertext, senderKeyRef, envelopeVersion}` with **no `content`**; the plaintext probe string never appeared on the wire or in the server response.
- **CI integration proof** (`dm-encryption.integration.spec.ts`, real postgres:16, T-4): encrypted send → **separate-connection SELECT** shows `content IS NULL`, `ciphertext IS NOT NULL`; full-table scan `WHERE content IS NOT NULL` → 0; `listMessages` returns content NULL for the encrypted row.

**App-DB-access limitation (honest):** `$CLAUDOMAT_DB_URL` is the BRAIN db, not the StudyHall app db; a direct read-only `SELECT content FROM dm_messages` against prod was not reachable from the brain host. The server-blind assertion is therefore evidenced by (a) the live server API returning `content:""` + ciphertext for the encrypted message (a real prod round-trip) and (b) the CI integration spec's separate-connection real-Postgres read-back proving `content IS NULL`. No fabricated app-DB PASS.

## 2. who_can_dm GATE + UNIFORM 404 (LIVE) — no oracle
**Verdict: PROVEN.** Gate is `who_can_dm` (DmService.canDm / enforceWhoCanDm seam), NOT profile_visibility (P-4 karen correction 1). Live matrix (A as viewer, B target):

| Case | Setup | Result |
|---|---|---|
| permitted | B who_can_dm=everyone + key present | **200** PublicKeyResponse |
| A: not-permitted + key present | B who_can_dm=nobody, key IS registered (visible-but-no-dm) | **404** `{"message":"Encryption key not found","error":"Not Found","statusCode":404}` |
| C: nonexistent target | random uuid | **404** — BYTE-IDENTICAL body |
| C2: malformed non-uuid target | `not-a-uuid-@@@` | **404** — BYTE-IDENTICAL body (NOT 500 — satisfies T-8 principle 2) |
| unauth | no token | **401** `{"message":"unauthorised"}` |

All not-permitted cases return the **byte-identical** body `{"message":"Encryption key not found","error":"Not Found","statusCode":404}` — no oracle distinguishing "blocked" from "nonexistent" from "no-key" from "malformed". Gate flip verified live (nobody→404, everyone→200). Self-fetch always permitted (B fetches own key → 200 even under gate). Case D (permitted-but-no-key) byte-identical proven in CI (no live keyless-permitted fixture available; CI `toStrictEqual` covers it).

## 3. HONEST INDICATOR fails closed (LIVE) — anti-security-theater
**Verdict: PROVEN.** (T-5 B3 + T-6.) The sole lock affordance `data-testid="e2e-lock-affordance"` (emerald filled shield-check, rgb(16,185,129), "End-to-end encrypted") rendered:
- **count = 1** on the encrypted A↔B DM header;
- **0** on 29 historical plaintext messages;
- **0** on a server channel (live negative control).
No padlock ever shown on a non-encrypted surface. Group-DM / no-key-peer conversation was NOT live-constructible (single-recipient DM dialog only) → honesty verified via DOM assertion + server-channel negative control + the CI indicator-honesty unit spec (lock absent in every non-encrypted state). Live-constructibility of a group/plaintext DM noted as a gap for a future leg.

## 4. NO PRIVATE-KEY LEAK (LIVE) — proven
**Verdict: PROVEN.** (T-5 A1.) Private key is a non-extractable CryptoKey in IndexedDB (`extractable:false`); `crypto.subtle.exportKey('pkcs8', privateKey)` **threw InvalidAccessError** — cannot be serialized to the wire even by injected code. PUT /profile/encryption-key body carried ONLY `{publicKey, algorithm}`. Zero private-key markers (`privateKey`/`private_key`/`pkcs8`/`"d":`) in any request body, query, or header. PublicKeyResponse contains no `email` and no private material (T-3 shape check + CI `not.toHaveProperty('email')`).

## 5. B-6 CRYPTO FOLLOW-UPS (F3 / F5 / F8) — live probes
- **F5 (key-fetch timing oracle):** NO oracle. 20× not-permitted (nobody) median ~0.103s vs 20× permitted median ~0.100s — no systematic timing difference between not-permitted and permitted/no-key. Uniform 404 path is timing-flat. **F5 resolved (no oracle observed live).**
- **F8 (rate-limit absence):** RESOLVED — a ThrottlerGuard IS active on the key-fetch endpoint. Rapid-fire requests tripped **429 `"ThrottlerException: Too Many Requests"`** (no internal state leaked — no redis keys, no limit numbers); the window reset correctly (200 after ~65s). **F8 resolved (rate-limit present).**
- **F3 (server senderKeyRef validation):** not directly probeable live without a crafted client; senderKeyRef is passed through by the server (server-blind — it does not interpret it). Observed live senderKeyRef == sender's own registered public key. Carried to V-2 as an informational follow-up (server currently does not validate senderKeyRef against the sender's registered key; low risk since the server is blind and the client re-fetches on decrypt failure).

## Action 5 — Secret grep (ALWAYS runs)
`git diff 0fa0f5f~1..0fa0f5f -- '*.ts' '*.tsx' '*.env*' | grep -iE 'api_key|secret|token|password|bearer'` → **0 matches** after excluding legitimate field identifiers (publicKey, senderKeyRef, idempotencyKey, encryption-key route, schema validation messages). No credential committed.

## Action 2/CSRF note (honest)
The PUT (state-changing) accepted a foreign-`Origin` request when authenticated via **Bearer header** — this is EXPECTED and safe: header-based auth is structurally CSRF-immune (an attacker's browser cannot attach a Bearer it does not hold). The browser path uses SuperTokens SameSite cookies + an anti-csrf token (T-5 observed the anti-csrf token on writes). No CSRF finding.

## Findings
- **F-T8-1 (info, V-2 / future leg):** group-DM / no-key-peer conversation not live-constructible this wave (single-recipient DM dialog) → honest-indicator fail-closed on group threads verified structurally (CI + DOM) but not via a live group. Group E2E is deferred (P-4 correction 4). Recommend a live group/plaintext-fallback fixture next leg.
- **F-T8-2 (low, V-2):** server does not validate `senderKeyRef` against the sender's registered public key (B-6 F3). Low risk under the server-blind model (server never interprets the envelope; client re-fetches peer key on decrypt failure). Record for a future hardening pass.
- (F-T5-1 auth-guard race carried from T-5 — medium.)

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [server_blind, who_can_dm_gate_uniform_404, honest_indicator, no_private_key_leak, csrf_origin, rate_limit, timing_oracle, secret_grep]
server_blind: {live: "GET /dm messages returns content:'' + hasCipher:true for encrypted msg; plaintext never on wire", ci: "separate-connection SELECT content IS NULL, ciphertext NOT NULL"}
who_can_dm_matrix: {permitted: 200, nobody_plus_key: 404, nonexistent: 404, malformed: 404, unauth: 401, byte_identical: true, self_bypass: 200}
honest_indicator: {emerald_lock_count_encrypted: 1, on_plaintext_history: 0, on_server_channel: 0, fails_closed: true}
no_private_key_leak: {extractable: false, export_pkcs8: "InvalidAccessError", wire_markers: 0, response_has_email: false}
timing_oracle_f5: "no oracle — not-permitted ~0.103s vs permitted ~0.100s, no systematic delta"
rate_limit_f8: "ThrottlerGuard active — 429 ThrottlerException, no state leak, window resets ~65s"
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: info, category: honest_indicator, description: "group/no-key-peer DM not live-constructible; fail-closed verified via CI+DOM not live group", remediation: "add live group/plaintext fixture next leg"}
  - {severity: low, category: envelope_integrity, description: "server does not validate senderKeyRef vs sender registered key (B-6 F3)", remediation: "future hardening; low risk under server-blind model"}
```
