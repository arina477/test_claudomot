# Wave 2 — B-5 Verify
- lint (biome): exit 0, 0 errors, 0 warnings (fixed: bracket→dot env access in db/index.ts + drizzle.config.ts; biome-ignore noConsoleLog on seed CLI; unsafeParameterDecoratorsEnabled for NestJS).
- typecheck (tsc project refs): exit 0 (4 projects).
- build (turbo shared→api→web): exit 0.
- test:ci (vitest): exit 0 — web 10/10, api health spec pass.
- **dev-server smoke: DEFERRED** — the api boot calls supertokens.init against SUPERTOKENS_CONNECTION_URI (http://supertokens.railway.internal:3567, Railway private network) which is unreachable from the brain sandbox; a local boot would fail at the core handshake. Real boot smoke happens at C-2 deploy (api on Railway, where the private core + Postgres are reachable). Environment-bound, not a code defect (mirrors wave-1's PORT smoke limitation).
```yaml
lint: pass
typecheck: pass
build: pass
unit_tests: pass
smoke: deferred-to-deploy
smoke_reason: "supertokens core on Railway private network, unreachable from sandbox"
```
