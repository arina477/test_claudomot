# B-2 — Backend (wave-54)
Specialist: websocket-engineer. Commit d382aae.
- Created `apps/api/src/common/ws-errors.ts` — `WS_GENERIC_ERROR = 'Something went wrong'`.
- Swapped in-catch generic literals: study-timer.gateway.ts:190 (`'Internal error checking membership'` → WS_GENERIC_ERROR), messaging.gateway.ts:134 (`'Internal error checking channel access'` → WS_GENERIC_ERROR). **Forbidden: authz literals at :196/:138 UNCHANGED** (B-carry verified: grep=1 each).
- Regression-lock tests: study-timer.gateway.spec.ts (NEW, 7 cases), messaging.gateway.spec.ts (+3), presence.gateway.spec.ts (+3) — malformed non-UUID id → generic non-leaking + denied; valid-UUID non-member → specific Forbidden preserved (not genericized); member-flow regression.

## Deviations — adjudicated ALLOWED
1. study-room per-verb fallbacks left as-is (explicitly permitted; leak-safe via safeErrorMessage logic, more contextual than the generic constant). The (C) canonical string applies to the 2 gateways that had ad-hoc unknown-error literals; study-room's genericization is in LOGIC not string.
2. presence catch literals left (presence is Zod-.uuid()-protected upstream; catch only fires for real DB failures on validated uuids, not cast errors — regression test covers the Zod path).
Both minor, within scope, no P-4-finding contradiction.

```yaml
skipped: false
specialists_spawned: [websocket-engineer]
files_implemented: [common/ws-errors.ts, study-timer.gateway.ts, messaging.gateway.ts, study-timer.gateway.spec.ts, messaging.gateway.spec.ts, presence.gateway.spec.ts]
deviations:
  - {change: "study-room fallbacks unchanged", adjudication: allowed, why: "permitted; leak-safe via safeErrorMessage"}
  - {change: "presence catch literal unchanged", adjudication: allowed, why: "Zod-protected upstream; catch only on validated-uuid DB failures"}
simplify_applied: true
```
