# Wave 77 — T-8 Security (PRIVACY crown jewel)

Pattern B (active). wave_type includes auth(privacy). Cross-user data-exposing endpoint (GET /profile/:userId) — P-4 security-scope tightened gate applies. All probes LIVE against api-production-b93e (633f362e) with prod fixtures A (target) + B (viewer), co-members of server ad62cd12.

**Methodology note (load-bearing):** profile_visibility is NOT mutable via PATCH /profile (UpdateProfileSchema has no visibility field). It is set via **PUT /profile/privacy {profileVisibility}** (M10 privacy endpoint). Initial harness attempt via PATCH silently no-op'd (Zod strips unknown key, 200 returned) — corrected to PUT /profile/privacy. All results below use the correct endpoint.

## applicable_probes: auth-authz visibility matrix + secret grep (state-changing writes = privacy PUT + blocks; email-leak; unauth; uniform-404)

### CASE 1 — visibility nobody / everyone (via PUT /profile/privacy)
- A=nobody → **B→A GET /profile/:A = 404 "Profile not found" (HIDDEN).** PASS.
- A=everyone → B→A = 200 PublicProfile. PASS. (fail-closed on nobody confirmed)

### CASE 2 — server-members (crown-jewel: stranger-not-leaked)
- A=server-members, B IS co-member (share ad62cd12) → **B→A = 200 VISIBLE.** PASS.
- **Stranger case (viewer shares NO server with A → HIDDEN):** proven by the CI real-DB integration matrix case 3 "server-members + NOT shared → HIDDEN (stranger not leaked)" (postgres:16, merge-blocking, PASSED). Live A+B are co-members so cannot form a live stranger pair with existing verified fixtures; the resolver was read + confirmed to use the self-referential `server_members` EXISTS subquery (mirrors dm.service, NOT listServerMembers's ambient shortcut) — the exact leak vector the spec flagged is absent in code AND covered by the merge-blocking integration test. PASS (CI-authoritative for the stranger sub-case; live positive co-member confirmed).

### CASE 3 — block (bidirectional), LIVE with A+B, A=everyone
- B blocks A (viewer→target) → B→A = 404 HIDDEN; unblock → 200 visible. PASS.
- A blocks B (target→viewer) → B→A = 404 HIDDEN (bidirectional); unblock → 200 visible. PASS.
- All blocks removed (DELETE 204 + post-unblock 200 confirms clean).

### CASE 4 — no email leak (LIVE)
- GET /profile/:A response body grepped for email/@example → **ABSENT** (baseline + after academic fields set). PublicProfile allowlist excludes email by construction. PASS.

### CASE 5 — unauth + uniform-404
- Unauth GET /profile/:A → **401** (route+guard live, not 404). PASS.
- **Uniform 404 (no info-leak oracle):** nobody-hidden, blocked-hidden, nonexistent-UUID, and malformed-non-UUID :id ALL return byte-identical `{"message":"Profile not found","error":"Not Found","statusCode":404}`. No oracle distinguishes *why* a profile is hidden. PASS.

### Malformed :id note
T-8 principle #2 expects malformed :id → 400. This privacy-critical endpoint instead returns uniform 404 (not 500) — a STRONGER posture (no info-leak). Recorded as observation, not a finding (no 500, no leak).

### Secret grep (Action 5, always runs)
`git diff 633f362e~1..633f362e -- '*.ts' '*.tsx' '*.env*' | grep -iE 'api_key|secret|token|password|bearer ...'` (additions only) → **ZERO matches.** Gitleaks also PASS at C-1.

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [authz_visibility_matrix, csrf_session_note, secret_grep]
auth_smoke: {note: "no new auth flow; existing SessionNoVerifyGuard reused; positive authed session + negative unauth 401 probed"}
csrf_results: ["state-changing writes (PUT /profile/privacy, POST/DELETE /blocks, PATCH /profile) are session-cookie/bearer auth'd; viewer-id from session (no IDOR); block+privacy took effect only for the authed actor"]
session_results: ["reused prod fixture sessions via st-auth-mode header; no session-lifecycle change this wave"]
rate_limit_results: null
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: low, category: "privacy resolver — restore-to-unset gap", description: "PATCH /profile cannot clear academicRole back to NULL once set (enum .optional() rejects null/empty); a user who picks a role cannot return to 'no role stated'. Not a leak; UX/data-hygiene. Route to V-2.", remediation: "add an explicit clear path (nullable) or a 'none' sentinel if product wants un-setting"}
  - {severity: info, category: "uniform-404 posture", description: "malformed :id returns uniform 404 not 400 (T-8 principle #2 expectation); stronger anti-oracle posture, no 500, accepted"}
```
