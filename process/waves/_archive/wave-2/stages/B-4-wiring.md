# Wave 2 — B-4 Wiring
AppModule imports AuthModule + MeModule (+ existing Health). main.ts: SuperTokens middleware mounted (only middleware → order correct), CORS with credentials + WEB_ORIGIN allowlist + supertokens.getAllCORSHeaders(), global SupertokensExceptionFilter (NestJS filter pattern, not express errorHandler). DbModule lazy pool. Done within B-2 (supertokens-integration). Repo typecheck + build green end-to-end. No B-2↔B-3 drift (B-3 skipped).
```yaml
wiring_complete: true
appmodule_imports: [AuthModule, MeModule, HealthModule]
main_ts: "ST middleware + CORS(credentials,WEB_ORIGIN,getAllCORSHeaders) + global ST exception filter"
```
