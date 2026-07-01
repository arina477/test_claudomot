# Wave 32 — T-2 Unit (Pattern A — CI-verified)
- **C-1 evidence:** test:ci green on 45b08c3 (Postgres v16 containers). api 449/449 + web 296/296.
- **New unit coverage:** voice-participants.service.spec.ts (18: member→list, non-member→403-before-load, non-voice→400, empty/TwirpError→0, null/empty display_name→fallback, creds-unset→503, explicit-creds construction) + controller.spec (6: delegation + 401/403/400/503 propagation) + voice-occupancy.test.tsx (27: 4 states, +N overflow, bounded-poll teardown, AbortController coalescing, fail-soft).
- **Adequacy:** every AC has a unit assertion; the security gate ORDER is asserted (non-member → db.select + RoomServiceClient NOT called).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test:ci run 28554411114 green: api 449 + web 296"]
findings: []
```
