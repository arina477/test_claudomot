# T-6 — Layout (wave-16) — SKIP

**Skip reason:** non-UI wave. wave_type = [infra, test]; the wave changes NO rendered UI — it tests the EXISTING
live create-server UI. No visual-regression surface was introduced. Per dispatcher skip rule (T-6 skips on non-UI
waves), T-6 does not fire.

```yaml
test_pattern: n/a
skipped: true
skip_reason: "no UI change — wave tests existing live UI; wave_type does not include ui/heavy"
findings: []
head_signoff: { verdict: APPROVED, stage: T-6, rationale: "Honest skip — no rendered-UI delta to diff." }
```
