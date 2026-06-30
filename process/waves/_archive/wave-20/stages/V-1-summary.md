# Wave 20 — V-1 Summary
- **Karen APPROVE** — 7/7 VERIFIED. Exactly-once+in-order spine REAL (stable-key-once outbox.ts:64; sequential oldest-first+id-tiebreak :164-200; STOP-on-failure :195-198; re-entrancy guard _drainInFlight :107/139-147; tests mutation-sensitive — key2PostCount=0/3-drains, interleave, concurrent). Idempotency NOT rebuilt (M3 ON CONFLICT unchanged + lock-test). Forward cursor ASC keyset (mirrors listThreadReplies). rule-4 on ?after= (ChannelMessageGuard + real guard.spec; tautological test deleted). Dexie store real + outbox-backs-optimistic. Single send path. No gold-plating; live ?after= 401. 2 Low notes (drain-without-socket relies on catch-up; MAX_ATTEMPTS=3 hardcoded).
- **jenny APPROVE + 1 MEDIUM DRIFT** — all ACs MATCH EXCEPT AC4 catch-up: **client seeds lastSeenCursorRef with a RAW createdAt ISO string (useMessages.ts:146,216,235,295), NOT the server's opaque base64(created_at|id) cursor → ?after= decodeCursor returns null → 400 silently swallowed → the ?after= catch-up leg NEVER succeeds in prod; socket message:new replay is the working fallback.** No test catches it (web mocks getMessagesAfter; server test uses a server-encoded cursor). Gating AC (exactly-once+in-order) + idempotency unaffected. Spine-first split clean; reframe consistent; no scope creep; M4 not claimed complete.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE (1 medium drift → V-2 fast-fix)
findings: [cursor-format-drift (Medium — ?after= catch-up dead on client)]
```
