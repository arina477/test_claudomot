# Wave 51 — T-block findings aggregate

| # | Stage | Severity | Location | Description | Evidence |
|---|---|---|---|---|---|
| F-1 | T-5 | medium (non-blocking) | AppShell DM↔server toggle (return path) | first-click-swallowed exiting DM surface via a server-rail icon; adjacent DM↔server race (likely pre-existing, not this wave's gate/onDmHome change); recoverable 2nd click | T-5-tester-1.md (d2s-backtoserver.png) |
