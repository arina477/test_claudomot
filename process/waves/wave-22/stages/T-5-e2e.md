# Wave 22 — T-5 E2E
```yaml
verdict: PASS (layer covered) + live-MCP-flow SKIPPED (non-blocking)
note: "CI e2e job green at C-1 = layer covered. Live organizer-post→member-due-sorted→mark-done NOT run (Playwright MCP chrome absent, recurring). Covered by unit (388+215) + real-PG integration + CI-e2e + the C-2 API smoke (GET /servers/<uuid>/assignments → 401, control 404). Disposition F22-T-5."
```
