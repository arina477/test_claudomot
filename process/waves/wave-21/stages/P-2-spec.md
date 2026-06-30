# Wave 21 — P-2 Spec (pointer)
**Source of truth:** tasks.description of seed c1dbee64. wave_type multi-spec (3 blocks), floor-EXEMPT (wave-16 legit-small-increment), design_gap FALSE (D skips).
- c1dbee64: useConnectionState hook (derive online/reconnecting/offline from getSocketState + window events) → replace AppHome.tsx:39 hardcode → live dot via the shipped ConnectionStateIndicator. No new component/design.
- 94e41695: runDrainAndCatchup LOOPS getMessagesAfter until nextCursor null (opaque cursor, wave-20 V-3 fix) — recovers ALL missed pages; dedup-by-id; bounded max-iter guard; no data loss.
- 2fe6b517: tests — connection-state transitions (connect/disconnect/reconnecting/offline/flap) + multi-page catch-up (3-page window all recovered, dedup, terminate, max-iter) via wave-20 fake-indexeddb harness.
**Reuses** shipped ConnectionStateIndicator + getSocketState(3-state) + Dexie/outbox/?after= — no rebuild (rule 1). **OUT:** new design, non-message connection-state, animations.
