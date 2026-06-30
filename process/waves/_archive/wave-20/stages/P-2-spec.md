# Wave 20 — P-2 Spec (pointer)
**Source of truth:** tasks.description of seed 92d85e0e. wave_type multi-spec (4 blocks). design_gap FALSE (D skips).
- 92d85e0e: server — document/lock the EXISTING ON CONFLICT idempotency as the binding exactly-once contract + NEW forward GET ?after= keyset cursor (reuse listThreadReplies ASC; non-member 403). No schema change.
- 7332a4b8: Dexie StudyHallDB (messages/channels cache + outbox tables, [state+createdAt] drain idx); cache-on-fetch reads; lazy/guarded init + injectable IDBFactory.
- 9a4ab31d: composer routes through the durable Dexie outbox (offline-enabled, no separate path); reconnect drains OLDEST-FIRST SEQUENTIALLY → idempotent replay (exactly-once) + reconcile; catch-up via ?after=.
- e29f6566: fake-indexeddb unit + integration tests — the GATING exactly-once+in-order+no-data-loss proof (per-test IDBFactory isolation).
**SDK:** dexie@4 + fake-indexeddb@6 (SDK-Docs/Dexie). No founder ask. **OUT:** connection-state/pending-UI/catch-up-UI (2nd M4 wave); CRDT/service-worker/multi-device.
