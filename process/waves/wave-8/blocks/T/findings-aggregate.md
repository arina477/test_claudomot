# Wave 8 — T findings (→ V-2/L)
1. (T-8, info) authed-join not live-probed (no verified prod fixture → 4a2ad286).
2. (T-8, info) revoked column exists, no revoke endpoint/UI (schema-forward; later bundle).
3. (T-5, significant) new public /invite/:code route has NO Playwright e2e (security paths unit+integration+live-covered) → fixture-fill + route smoke at next prod-test wave.
