# Wave 52 — T-block findings aggregate

| # | Stage | Severity | Location | Description | Evidence |
|---|---|---|---|---|---|
| F-1 | T-8 | low (non-blocking, info-disclosure) | study-room.gateway.ts ~372 catch | non-UUID serverId leaks raw Drizzle error (table/column + own userId) via catch; request STILL denied; not an auth bypass; same class as wave-23 non-UUID pattern. UUID-validate/generic-map. | T-8-tester-idor.md |
