# Wave 5 — V-2 Triage
Karen REJECT on a7667fb7 (node-20 residual deprecations) — Low but a literal AC miss → V-3 FAST-FIX (cheap action bumps). jenny APPROVE. No other blocking.
| Finding | Source | Bucket | Disposition |
|---|---|---|---|
| node-20 residual (pnpm/action-setup@v4 + gitleaks@v2 deprecations) | Karen REJECT | blocking (AC-miss) → fast-fix | V-3: bump to node24-compatible versions; if gitleaks has no node24 release, document as unavoidable exception. Clears a7667fb7. |
| enforce_admins=false → admin direct-push (6b4ed53) | both LOW | non-blocking | flag → L/retro; queue follow-up to set enforce_admins=true (if it doesn't break bot merge) |
| throttler contract-text vs hand-rolled Express | Karen note | noise | behavior correct; doc-only; tidy in spec if revisited |
| avatar live-upload | C-2 | non-blocking | tracked 84e09891 (founder bucket) |
```yaml
findings_blocking: [a7667fb7-node20 → V-3 fast-fix]
findings_non_blocking: [enforce_admins-follow-up, throttler-doc, 84e09891]
fast_fix_queue: [a7667fb7-node20-deprecations]
```

## V-3 fast-fix RESOLVED: a7667fb7 node-20
PR#15 (6c5dee8): pnpm/action-setup@v4→v6 + gitleaks-action@v2→v3 (both node24). CI-verified: ZERO Node-20 deprecation annotations on the merged run (28375927303), all 6 jobs green. No upstream-blocked exceptions. Karen's REJECT (a7667fb7 AC "annotations no longer appear") is now MET. Re-verification = the merged CI run's annotation状态 (deterministic CI evidence) + the V-3 head-verifier independent gate.
