# Wave 20 — P-block review artifacts
**Block:** P (Product) | **Wave topic:** M4 offline-first — idempotent send + IndexedDB store + outbox + test harness | **Gate:** P-4 | **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| P-0 | stages/P-0-frame.md | done (PROCEED w/ seed REFRAME — idempotency exists, bind-key+forward-cursor) |
| P-1 | stages/P-1-decompose.md | done |
| P-2 | tasks.description of 92d85e0e (+pointer) | done |
| P-3 | stages/P-3-plan.md | done |
| P-4 | blocks/P/gate-verdict.md | done | PASSED — head-product+karen+jenny APPROVE, Gemini UNAVAILABLE(degraded-pass) |
## Context
- FIRST M4 wave (offline-first reliability — the founder wedge). claimed: [92d85e0e (idempotent send), 7332a4b8 (IndexedDB store), 9a4ab31d (outbox/optimistic integration), e29f6566 (offline test harness)].
- **STALE-PREMISE FLAG (verify at P-0/P-1, wave-18 lesson):** seed 92d85e0e claims POST /api/messages "has no idempotency guarantee today" — but createMessage has ON CONFLICT(channel_id, idempotency_key) DO NOTHING since wave-13 (reused for threads/attachments). VERIFY the real state — the server may already be idempotent; if so the seed re-scopes to verify/harden the existing contract + add the ?after= keyset catch-up cursor (M4 scope) if absent. The genuinely-NEW work: client IndexedDB store (Dexie?) + outbox + reconnect-replay + connection-state indicator + offline-enabled composer.
- **P-BLOCK DEPENDENCY (sibling 7332a4b8):** new client-side store library (IndexedDB via Dexie? + fake-indexeddb for tests) → P-0 SDK-research item per external-sdk-integration-rules. Client-side only → NO founder cred-ask.
- design_gap: likely TRUE (connection-state indicator + pending/failed message UI — though connection-state may already exist from M3 presence; verify).
## Gate verdict log
<appended by head-product at P-4>
