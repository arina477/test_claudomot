# Wave 84 — T-block review artifacts

**Block:** T (Test) · **Wave topic:** session-token XSS-hardening (header transport + short TTL + cross-origin CSP) · **Block exit gate:** T-9 · **Status:** in-progress

## Stage deliverables
| Stage | Deliverable | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | PR #103+#104 CI green (lint+typecheck) |
| T-2 | stages/T-2-unit.md | ci-verified | done | api 821 + web 785 (incl. 21 CSP tests) green in CI |
| T-3 | stages/T-3-contract.md | — | skipped | no contract surface |
| T-4 | stages/T-4-integration.md | active | done | csp.test (21) + supertokens config tests |
| T-5 | stages/T-5-e2e.md | active | done | web smoke PASS |
| T-6 | stages/T-6-layout.md | — | skipped | no visual change |
| T-7 | stages/T-7-perf.md | — | skipped | not heavy |
| T-8 | stages/T-8-security.md | active | done | LIVE PASS: 0 CSP violations, header+900s TTL, all origins work |
| T-9 | stages/T-9-journey.md | active | done | APPROVED; regen skipped |

## Block-specific context
- **wave_type:** [auth]
- **Stages skipped:** T-3 (no contract), T-6 (no visual), T-7 (not heavy)
- **THE critical gate: T-8** — the CSP is live but B-6 couldn't live-verify it. T-8 MUST prove on the deployed web app: 0 CSP-violation console errors, login works (header transport + 900s TTL), attachments+avatars load (Tigris CSP-allowed), voice connects (LiveKit CSP-allowed), all 4 Socket.IO WS namespaces connect (api wss CSP-allowed), cross-origin credentialed fetch works.
- **Open item from C-2:** e2e delete-any-message.spec.ts non-required realtime/auth flake (not wave-caused).

## Gate verdict log
<T-9> APPROVED (attempt 1) — load-bearing CSP proof (T-8, live) sufficient; 0 violations + every app origin proven CSP-permitted; AC2 900s TTL + header transport confirmed live. Journey regen skipped (no UI/route change). e2e delete-message flake carried (pre-existing, not wave-caused).

## Status / block-exit handoff
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-4, T-5, T-8, T-9]
stages_skipped:       [T-3 (no contract surface), T-6 (no visual change), T-7 (not heavy)]
findings_total:       1
findings_critical:    0
findings_aggregate:   process/waves/wave-84/blocks/T/findings-aggregate.md
journey_map_commit:   ""    # regen skipped — no UI/route change
ready_for_verify:     true
gate_status:          gate-passed
```

## T-block exit handoff
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-4, T-5, T-8, T-9]
stages_skipped:       [T-3 (no contract), T-6 (no visual), T-7 (not heavy)]
findings_total:       1
findings_critical:    0
notes:                "1 LOW pre-existing PWA icon (024a1483). Load-bearing CSP risk DISPROVEN live (0 violations, all origins work). Header transport + 900s TTL verified on deployed binary. + carried non-required e2e realtime flake (not wave-caused)."
ready_for_verify:     true
```
