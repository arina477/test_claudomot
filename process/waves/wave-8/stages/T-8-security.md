# Wave 8 — T-8 Security (active — MANDATORY; invites = access-control surface)
```yaml
test_pattern: active
applicable_probes: [auth_smoke, csrf, session, rate_limit, secret_grep, access_control]
results:
  - "Invite-code entropy: CSPRNG randomBytes(16)→base64url (~128-bit), non-enumerable; both invites.code + servers.invite_code. Unit: code shape + uniqueness. Non-guessable (no sequential id surface — UUID PKs)."
  - "Public preview (GET /invites/:code): minimal {server:{id,name,memberCount}} ONLY — NO channels/members/presence/owner. Live-verified (C-2 throwaway probe: 200-minimal; invalid→404). The D-block caught + stripped the mockup's leak."
  - "Verified join (POST /invites/:code/join): AuthGuard verify-required (EmailVerification REQUIRED). Live: unauthed→401. unverified→403 (per the wave-7 gate pattern). createInvite member-gated→403 non-member, 401 unauthed (live)."
  - "Atomic max_uses: conditional UPDATE...WHERE uses<max_uses RETURNING + throw-on-zero-rows rolls back member insert (per-row lock serializes concurrent joiners → exactly one wins on max_uses=1). Concurrency test (loser→404+rollback). TOCTOU fixed (92cc0f3)."
  - "Re-join idempotent: ON CONFLICT(server_id,user_id) DO NOTHING; uses NOT incremented on re-join (carry-forward B; tested)."
  - "Secret grep (wave-8 diff): clean."
findings:
  - {severity: info, category: test-fixture, description: "authed-join not live-probed (no persistent verified prod fixture) → tracked 4a2ad286; covered by 179 tests + CI integration"}
  - {severity: info, category: invite-mgmt, description: "revoked column exists but no revoke endpoint/UI this wave (schema-forward; join honors revoked) — later bundle"}
```
T-8 PASS: access-control surface secured (CSPRNG non-enumerable codes, minimal public preview, verified-join, atomic max_uses, idempotent re-join) — live + unit verified. No critical/high.
