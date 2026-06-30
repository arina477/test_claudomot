# Wave 20 — T-block findings aggregate (V-2 input)
## Ratified this block
- WEDGE: exactly-once + in-order offline send PROVEN (T-4, mutation-sensitive fake-indexeddb tests, not theater). rule-4 on ?after= RATIFIED (T-8, real guard.spec + live 401).
## Non-blocking → V-2
- M1 (Med): POST-succeeds-but-delete-fails crash window untested (mechanism correct — server ON CONFLICT dedups the re-POST; add a test).
- M3 (Med): catch-up reads ONE page (no nextCursor loop) → >50-msg offline window relies on socket replay; squarely in 2nd-M4-wave scope.
- L1-L4 (B-6 accepted): dexie-txn-clean, private-mode-null lightly-tested, no-enqueue-dedup, conditional-tombstone-assertion.
## Known carries
- 9 pre-existing wave-14 biome warnings (task 4e994e96).
- 6 re-homed M3 tech-debt tasks now under M4 backlog (invite-rotation, real-PG tier, presence perf/debt, mention parity, author-presence-dots).
- Playwright chrome-channel-absent (recurring; task 67881a58) — wedge proven via fake-indexeddb + CI e2e + live API smoke.
- prod test-data accumulation (no DELETE /servers/:id).
