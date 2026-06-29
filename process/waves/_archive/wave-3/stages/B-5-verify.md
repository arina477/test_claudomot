# Wave 3 — B-5 Verify
- typecheck (4 projects): pass. build (turbo): pass. lint (biome): pass. test:ci (vitest): pass — 27/27 (web AppShell 10 + auth-pages 17; api specs).
- Live dev-server smoke deferred (supertokens-auth-react needs the live backend + a browser; the SuperTokens core is on Railway private net). Component render verified via RTL (SDK mocked). Real browser E2E = T-5 (against the live deploy after C-2).
```yaml
lint: pass
typecheck: pass
build: pass
unit_tests: pass (27/27)
smoke: deferred-to-deploy (browser E2E at T-5)
```
