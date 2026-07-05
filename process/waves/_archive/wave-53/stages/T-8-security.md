# T-8 — Security (wave-53) — Pattern B (active, live prod)

Fired: wave_type includes `auth` (study-room gateway sits behind `installWsAuthMiddleware`; the finding is a security info-disclosure). Live probes run by penetration-tester against `https://api-production-b93e.up.railway.app` (`/study-room` Socket.IO namespace), authenticated as prod fixture A.

## Applicable probes (subset matrix)
- **Info-disclosure verification (the fix)** — primary, live.
- **Action 5 Secret grep** — always. **0 real matches** (the grep hits are benign test-fixture strings asserting non-leak: a fake `'internal DB blowup — secret query details here'` the test proves is NOT forwarded; and a comment referencing SupertokensExceptionFilter). No credential committed.
- Auth-smoke / CSRF / session / rate-limit: N/A — the fix did not modify auth flows, state-changing endpoints' CSRF posture, session lifecycle, or rate limits (it's error-handling + input-validation on existing WS verbs).

## Live probe results (all PASS)
| Probe | Input | Result |
|---|---|---|
| 1 Info-disclosure | non-UUID serverId `not-a-uuid` / `'; DROP TABLE server_members;--` / `123` | **PASS** — all → generic `Invalid payload: serverId required`; asserted ABSENT: `invalid input syntax`, `server_members`, `22P02`, column/SQL text, caller userId. Parse-layer rejection (no DB round-trip; no rooms emitted). |
| 2 Behavior preserved | valid-UUID non-member serverId | **PASS** — `You are not a member of this server` (ForbiddenException passthrough, NOT genericized) |
| 3 Regression | fixture member serverId `ad62cd12…` | **PASS** — `study-room:rooms {rooms:[]}` (legitimate flow unbroken) |
| 4 Auth gate | no-session connect | **PASS** — `connect_error: Unauthorized` (auth gate not weakened) |

**Deployed-code confirmation:** live commit `9c114d0` contains the `isUuid` guard on all 4 parsers + `safeErrorMessage`.

## Findings
- **wave-52 T-8 F-1 (Medium, info-disclosure) → CLOSED (Fixed)** on live prod. The fix is strictly stronger than a message-scrub: malformed input never reaches the DB (userId echo also gone). No new vulnerabilities introduced. No open findings.

Full evidence: `process/waves/wave-53/stages/T-8-evidence/pentest-report.md`.

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [info_disclosure, secret_grep]
auth_smoke: null
csrf_results: null
session_results: null
rate_limit_results: null
secret_grep_findings: []
fix_up_cycles: 0
findings: []
live_probe: "4/4 PASS against prod; wave-52 F-1 info-disclosure CONFIRMED CLOSED"
```
