# Wave 78 — T-block findings aggregate

Canonical V-2 input. Findings surfaced with evidence; NOT fixed here (Iron Law).

| # | Stage | Severity | Location | Description | Evidence |
|---|---|---|---|---|---|
| 1 | T-3 | low | prod fixture (displayName) | The absent-field contract probe (case 3) required PATCHing a non-academicRole field; displayName was used and is min-length/non-null validated, so it could not be restored to its original `null`. Fixture A displayName now "Fixture A" (was null). Harmless self-declared test text; no A↔B block. **academicRole (the wave's field) restored exactly to "educator"** (confirmed twice: API + T-5 tester). | T-3 live matrix |
| 2 | T-5 | medium (infra, not app) | Playwright MCP harness | MCP instances share one Chrome profile dir (`mcp-chrome-for-testing-51e10da`) without `--isolated`; a 2-instance parallel swarm had playwright-2 blocked ("Browser is already in use"). Worked around by running the 2nd scenario sequentially on playwright-1. Not a StudyHall defect. Recommend `--isolated` / per-instance `--user-data-dir` for future T-5 swarms. | T-5 tester afb4b37c |
| 3 | T-5 | low (observational) | prod fixture state | Fixture A's server rail holds ~714 servers, mostly leftover `E2E <ts>` / `M3 Verify` test fixtures (createServer test path, no server-DELETE). Not wave-78; cleanup candidate. | T-5 tester a9de1356 |

**Blocking findings: 0.** All three are non-blocking (1 minor prod-state residue on the wave's own field's sibling, 2 infra/observational). No app defect found across T-1..T-8. Anti-oracle preserved + fail-closed proven live.
