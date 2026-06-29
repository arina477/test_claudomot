# Wave 6 — B-5 Verify
CI-only change (ci.yml). lint clean; existing 6 jobs untouched structurally. Compiled artifact locally booted to /health 200 (the probe's own positive case). The probe's real proof = the PR CI run (C-1). No app code → no unit/typecheck delta.
```yaml
lint: pass
app_code_changed: false
local_compiled_boot: pass (/health 200)
real_proof: PR CI boot-probe job (C-1)
```
