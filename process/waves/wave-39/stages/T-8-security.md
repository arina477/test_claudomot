# Wave 39 — T-8 Security (active — session surface: logout)
Wave_type includes auth (logout/session). Applicable probe: session (logout). Result (live, see T-5-e2e.md T-8 row):
- Log out → POST /auth/signout 200 → redirect /login. **Session server-side revoked:** same GET /profile returns 200 while authed, **401 after logout**; /app bounces to public landing; httpOnly session tokens cleared. SuperTokens signOut revokes the session (not just client-side).
- No new endpoint / no secret-grep surface (frontend-only; no creds in diff — confirmed clean).
```yaml
test_pattern: active
applicable_probes: [session, secret_grep]
session_results: ["logout signout 200 + /login redirect; GET /profile 200 authed->401 after; /app bounces; httpOnly cleared"]
secret_grep_findings: []
findings: []
```
