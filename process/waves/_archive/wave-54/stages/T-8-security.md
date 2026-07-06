# T-8 — Security (wave-54) — Pattern B (active, live prod)
Fired (auth-boundary WS surface). penetration-tester probed live prod (97c8e99), authenticated as fixture A.
## Applicable probes
- Info-disclosure regression verification (primary, live) + secret-grep (always, 0 real matches — benign test sqlLeakTokens array only).
## Live probe results — 5/5 PASS
| Probe | Result |
|---|---|
| study-timer malformed serverId | **PASS** — 'Something went wrong' (generic); leak-tokens absent (invalid input syntax/server_members/column/SQL/userId); denied |
| study-timer valid-UUID non-member | **PASS** — 'Forbidden: not a member of this server' (authz PRESERVED, not genericized) |
| messaging malformed channelId | **PASS** — 'Something went wrong'; no leak; denied |
| messaging valid-UUID non-viewable | **PASS** — 'Forbidden: cannot view channel' (authz PRESERVED) |
| member happy path | **PASS** — timer DTO delivered |
**Info-disclosure class CONFIRMED CLOSED + authz denials PRESERVED on live prod.** The B-carry (WS_GENERIC_ERROR must not collapse Forbidden denials) verified LIVE. No findings.
Evidence: process/waves/wave-54/stages/T-8-evidence/pentest-report.md.
```yaml
test_pattern: active
skipped: false
applicable_probes: [info_disclosure_regression, secret_grep]
secret_grep_findings: []
findings: []
live_probe: "5/5 PASS on prod; class stays closed; authz denials preserved"
```
