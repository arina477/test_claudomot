# Wave 20 — V-2 Triage
## Fast-fix queue (1) — the jenny cursor-format drift
| id | severity | summary | disposition |
|---|---|---|---|
| cursor-format-drift | Medium | client seeds lastSeenCursorRef with raw createdAt ISO, not the opaque nextCursor → ?after= 400 → catch-up leg dead (socket fallback masks it). A claimed deliverable (forward catch-up, seed 92d85e0e) is non-functional on the client. | **V-3 FAST-FIX** (frontend, <20 LOC): seed lastSeenCursorRef from result.nextCursor (the opaque cursor); add a real-cursor round-trip test (client cursor decodes server-side). The server forward cursor is correct; only the client seeding is wrong. |
## Non-blocking (→ accepted / future)
- M1 (Med): POST-succeeds-delete-fails window untested (server dedups). M3 (Med): catch-up one-page no-loop (2nd-M4-wave; note: once cursor-format fixed, the loop is the next increment). L1-L4 accepted. 9 biome warnings (4e994e96). 6 re-homed M3 tech-debt (M4 backlog). Playwright chrome-absent (67881a58).
```yaml
findings_blocking: []
fast_fix_queue: [cursor-format-drift]
b_block_re_entry_required: []
```
