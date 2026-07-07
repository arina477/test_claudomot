# T-7 — Perf (wave-69) [SKIPPED]
Skipped: not a heavy wave. wave_type = auth+ui+backend (not `heavy`). Moderate diff (~2 net service/UI files + reports table); no perf-sensitive surface (the owner-report-queue read is index-backed via reports_target_server_status_idx). No perf budget at risk.
```yaml
test_pattern: active
skipped: true
skip_reason: "not heavy; index-backed queue read; no perf-sensitive surface"
```
