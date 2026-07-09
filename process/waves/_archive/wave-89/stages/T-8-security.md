# Wave 89 — T-8 Security (SKIPPED)
Not an auth/payments/sessions/CSRF wave. Client-only a11y focus behavior; the client-side over-length guard still prevents an invalid PATCH (patchProfile not called on the error path — verified). No new attack surface. Enabling the button does not bypass server validation (server Zod still authoritative).
```yaml
skipped: true
reason: not auth/payments/sessions; client-only; server validation unchanged
findings: []
```
