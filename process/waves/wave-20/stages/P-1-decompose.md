# Wave 20 — P-1 Decompose
## Max-size rubric (no trip)
| Measure | Est | Threshold | Pass |
|---|---|---|---|
| Files | ~22-30 (server: bind-key + forward-cursor route/service/contract; client: features/sync Dexie schema + outbox + cached-reads + composer integration + connection wiring; tests: fake-indexeddb unit + integration) | >60 | ✓ |
| Net LOC | ~2800-3800 | >5000 | ✓ |
## Wave type + floor
- claimed = [92d85e0e (idempotent-contract harden + forward-cursor), 7332a4b8 (IndexedDB store), 9a4ab31d (outbox integration), e29f6566 (test harness)] → 4 → **multi-spec**. Floor (>2500 LOC OR ≥6 specs): ~2800-3800 > 2500 → above floor (mvp-thinner OK, no split).
## Verdict: PROCEED (multi-spec)
## design_gap_flag: FALSE (spine wave — logic/store/tests; the connection-state indicator + pending/failed UI + catch-up-history UI are the DEFERRED 2nd M4 wave per mvp-thinner. The M3 optimistic pending/failed message states already exist + suffice for the outbox spine; no NEW design surface this wave. D-block SKIPS.)
## P-block dependency (sibling 7332a4b8): NEW client store deps — **dexie** (IndexedDB wrapper) + **fake-indexeddb** (test shim). → P-2 SDK-research per external-sdk-integration-rules.md (SDK-Docs/Dexie/). CLIENT-SIDE only → NO founder cred-ask. The only new deps.
## Carries (from P-0 REFRAME): server idempotency EXISTS (don't rebuild — bind-key + forward ?after= cursor reusing listThreadReplies ASC pattern); gating AC = exactly-once + in-order on reconnect (fake-indexeddb-proven); spine-only (UI deferred to 2nd M4 wave).
