# Wave 79 — T-block findings aggregate

Canonical V-2 input. Findings appended incrementally as the block runs.
Severity scale: critical | high | medium | low | info.

## T-5 E2E
- **F-T5-1 (medium)** — client-side auth-guard race on the DM route: entering Direct Messages right after login intermittently bounces the SPA to marketing `/` as if logged out, while GET /me returns 200 (SuperTokens session cookie still valid) and re-navigation to /app recovers with no re-login. Caused by a transient 401 during the concurrent DM-load burst (GET /dm/conversations + PUT /profile/encryption-key + socket.io polling) flipping isAuthenticated. Not a real session invalidation; first-time users could perceive a spurious logout. Evidence: two independent testers observed it. Triage tag: `frontend/auth-guard-race`. V-2 to classify blocking vs bug-design.

## T-8 Security (crown jewel)
- **F-T8-1 (info)** — group-DM / no-key-peer conversation not live-constructible this wave (single-recipient DM dialog only). Honest-indicator fail-closed on group/plaintext threads verified structurally (CI indicator-honesty spec + live DOM assertion + server-channel negative control) but NOT via a live group thread. Group E2E is deferred per P-4 correction 4. Recommend a live group/plaintext-fallback fixture next leg. V-2: likely accept (deferred scope).
- **F-T8-2 (low)** — server does not validate `senderKeyRef` against the sender's registered public key (carries B-6 F3). Low risk under the server-blind model: the server never interprets the envelope and the client re-fetches the peer key on decrypt failure. Record for a future hardening pass. V-2: likely bug-security tag (non-blocking).
- **Positive resolutions (record, not findings):** B-6 F5 (timing oracle) — NOT present live (uniform ~0.10s across permitted/not-permitted/no-key). B-6 F8 (rate-limit absence) — RESOLVED, ThrottlerGuard active (429, no state leak, window resets). Secret grep clean.

