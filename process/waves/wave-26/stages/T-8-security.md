# Wave 26 — T-8 Security — SKIPPED (auth probes); secret-grep clean
wave_type not `auth`. The fix added `userId` to ProfileResponse (a session-derived id the client already had via session; NOT a secret, NOT a new auth/session/CSRF surface — the profile endpoint's authz is unchanged, session-gated). No new auth boundary. Secret-grep on the wave diff: **0 matches**. XSS: no new user-content render (the dot is a styled span, not user text). → skip auth probes; secret-grep clean.
```yaml
test_pattern: active
skipped: true
auto_promoted: false
applicable_probes: [secret_grep]
secret_grep_findings: []
findings: []
```
