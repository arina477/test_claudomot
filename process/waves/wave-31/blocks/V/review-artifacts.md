# Wave 31 — V-block review artifacts
**Block:** V (Verify) | **Wave topic:** M6 voice token-mint + client (LIVE; live-connect creds-deferred) | **Block exit gate:** V-3 | **Status:** gate-passed

## Stages
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| V-1 | stages/V-1-{karen,jenny,summary}.md | done | karen APPROVE + jenny APPROVE (live; M6 first-slice) |
| V-2 | stages/V-2-triage.md | done | 0 blocking; F31-404-403 spec reconciled (V-3); MEDIUM→4a92327c; LOWs L-1/L-2 |
| V-3 | stages/V-3-fast-fix.md | done | head-verifier APPROVED; 404→403 spec reconciled (0 code); gate-passed |

## Context
- T findings: F-31-T-1 (MEDIUM, pre-existing malformed-UUID→500, tracked 4a92327c); F-31-T-2/T-3 (LOW, 404→403 reconciliation → L-1); F-31-T-4 (LOW, test-discipline).
- 404→403: missing-channel now returns uniform 403 (default-deny, the fixed P1 enumeration-leak) — the spec's 404 AC is superseded; reconcile at L-1 (spec doc + controller-spec + JSDoc/client).
- Live-voice-connect deferred (LIVEKIT creds not set).

## Carries
- V-2: F-31-T-1 → bug-security (tracked 4a92327c). L-1: 404→403 reconciliation.
- N-block: M6 has open non-seed tasks (78f51968 occupancy split + siblings) — M6 continues (multi-wave), not closing.
