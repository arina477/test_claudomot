# Wave-64 T-block manifest
Wave type: ui + offline-behavior (Dexie v4 blob cache + object-URL wire-in). Merge 1744de8; web deployed SUCCESS.
| Stage | Layer | Pattern | Evidence | Status |
|---|---|---|---|---|
| T-1 | static | A (CI) | CI lint+typecheck SUCCESS | pass |
| T-2 | unit | A (CI) | CI test SUCCESS; web 539/539 incl attachment-blob-cache 12 (**v3→v4 preservation**) + attachment-image-cache 7 (**object-URL revoke**) | pass |
| T-3 | contract | — | SKIP: no API/shared shape change (reuses attachment.url; CachedAttachmentBlob client type) | skipped |
| T-4 | integration | — | SKIP: no server/DB change; Dexie v4 client, fake-indexeddb-tested | skipped |
| T-5 | e2e | B (active) | LIVE offline probe PASS: cached blob->blob: object-URL renders offline; non-cached fetch breaks (falsification); Dexie live v4 8-stores, cached row real Blob | pass |
| T-6 | layout | — | SKIP: no new UI/layout (reuses message-attachment render surfaces) | skipped |
| T-7 | perf | — | SKIP: not heavy (10MiB cap; best-effort non-blocking write-through) | skipped |
| T-8 | security | — | SKIP: no auth/session/rate-limit surface (attachment bytes already user-authorized; CORS-open verified) | skipped |
| T-9 | journey+gate | B (gate) | head-tester APPROVED (Attempt 1); both named exit criteria load-bearing+green; regen skip-with-reason | pass |
## Status
test_block_status: complete
stages_run: [T-1, T-2, T-5, T-9]
stages_skipped: [T-3, T-4, T-6, T-7, T-8]
findings_total: 0
findings_critical: 0
journey_map_commit: ""
ready_for_verify: true
Status: gate-passed
stages_skipped: [T-3, T-4, T-6, T-7, T-8]
