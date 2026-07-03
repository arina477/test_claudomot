# Wave 41 — T-8 Security (active — moderation authz, CRITICAL) — ALL PASS
penetration-tester, live prod, fixtures A+B. 0 critical/high/medium/low.
1. Non-mod → 403 on POST + DELETE timeout (gate before state change).
2. Educator timeout → 200 {mutedUntil}; roster reflects mutedUntil.
3. **Mute-gate BOTH paths:** muted member → 403 on channel message AND thread reply (B-6 reply-bypass fix verified live; shared assertNotMuted).
4. **Delete-any rank guard:** moderator deletes regular member's message → 204; OWNER's message → 403 (owner's msg intact). B-6 spec-drift fix verified.
5. **Timeout rank guard:** timeout owner → 403; timeout self → 403 (fire after permission check).
6. **No IDOR/leak:** per-server scoped (cross-server 403); actor from session (body-injected ids ignored); mutedUntil DTO = bare ISO timestamp (no email/session).
7. Secret grep (git diff main~6..main) → 0 hardcoded creds.
State restored: timeout cleared, throwaway moderator role deleted, test messages soft-deleted. Persistent (no server DELETE endpoint): 1 throwaway empty owner-only server 157329db (harmless, pre-existing API limitation).
```yaml
test_pattern: active
applicable_probes: [auth_smoke, session, rate_limit, secret_grep]
secret_grep_findings: []
findings: []
```
