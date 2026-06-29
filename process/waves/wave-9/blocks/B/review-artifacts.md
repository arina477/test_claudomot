# Wave 9 — B-block review artifacts (multi-spec, commit-per-spec; order 8a→8b→revoke)
**Block:** B · **Wave topic:** M2 invite-completion · **Gate:** B-6 · **Status:** in-progress
| Stage | Status | Notes |
|---|---|---|
| B-0 | done | branch wave-9-m2-invite-completion; claimed 3; no schema (invites+invite_code exist) |
| B-0..B-2 | done | backend (123 tests); 8a script + 8b expose + revoke |
| B-3 | done | frontend (73 web) 3859b61 |
| B-5 | done | full green; pushed |
| B-6 | pending | gate |
## CARRY (P-4): 8a = app-side backfill SCRIPT (randomBytes base64url + 23505 retry, WHERE NULL, NOT pgcrypto/auto-migrate). 8b = share modal default to permanent invite_code (member-expose in server detail). revoke = POST /invites/:code/revoke (AuthGuard; owner_id OR invites.created_by → 403 else; revoked=true; revoked→404 already filtered wave-8; idempotent). Build order 8a→8b→revoke. In ServersModule (arch #3). T-8: 8a re-run no-op+23505; revoke 403; revoked→404 both; 8b no ad-hoc row on open. Design: invite-share.html (permanent-default + revoke list). PUSH after each stage.
