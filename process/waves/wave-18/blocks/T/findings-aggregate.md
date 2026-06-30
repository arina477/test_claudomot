# Wave 18 — T-block findings aggregate (V-2 input)
## Resolved this block
- F-1 (was HIGH): thread realtime fan-out unproven → CLOSED at T-5 live two-client wire probe (B receives thread:reply:created/deleted; no-leak; delete-decrement). 
- IDOR (was Critical, B-6): ratified fixed at T-8 (parent-derived authz, 3 tests, live 401).
## Non-blocking → V-2 disposition
- F-2 (Med): 3 thread Zod schemas lack dedicated safeParse units. → V-2 (cheap unit add).
- F-4 (Med): no real-PG thread integration spec — wave-17 pg-harness.ts makes it cheap. → V-2 (fold into 02fa8011 consumer or a follow-on).
- F-3 (Low): affordance test-id query nit (shipped DOM has correct roles).
- F-CARRY-2: Playwright MCP chrome-channel-blocked host-side → realtime verified via socket.io wire probe (canonical path). Infra, not a wave defect.
- M-2/M-3 (B-6): relative-time cosmetic; M-3 prod test-data accumulation (no DELETE /servers/:id). L-1..L-4 accepted.
- 9 pre-existing wave-14 biome warnings → task 4e994e96.
## L-2 principle candidates (promotion owned by L-2/karen, ≤1/file/wave)
- T-5: realtime fan-out proven only by a distinct 2nd client receiving via real routing; a sender's own echo is not delivery.
- T-2: every gateway @OnEvent fan-out handler needs ≥ a mocked server.to(room).emit room-targeting unit test.
- T-5-infra: StudyHall realtime-verification path is the socket.io wire probe, not headless browser (Playwright chrome-channel-blocked every wave).
