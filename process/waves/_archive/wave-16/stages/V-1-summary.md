# Wave 16 — V-1 Summary
- **Karen APPROVE** — 6/6 VERIFIED. E2E genuinely real (not coverage-theater): real /login sign-in → storageState; real modal create; asserts new server in rail + #general against live selectors (ServerRail:197/58, CreateServerModal:290, ChannelSidebar:99). Ran 4/4 green in CI (run 28437054848). Anti-flake (0 waitForTimeout). Creds NOT committed (only secrets ref; e2e/.auth gitignored). No gold-plating.
- **jenny APPROVE** — all 5 ACs MATCH, no drift. Sign-in→create→assert rail+#general; authed storageState harness; anti-flake; unique name; CI-green + smoke kept unauthenticated (separate project). Single happy-path, no product code, closes wave-7 carry; journey marks create-server E2E-covered (v0.12). Test-infra, no M3-feature claim.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: []   # 0 blocking; carries → V-2
```
