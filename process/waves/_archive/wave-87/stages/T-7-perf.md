# Wave 87 — T-7 Perf (SKIPPED)
Not a heavy wave. The change adds one indexed SELECT (roles by server_id + is_default, LIMIT 1) inside the existing join transaction — negligible cost, no perf budget at risk.
```yaml
skipped: true
reason: not a heavy wave; single indexed lookup added
findings: []
```
