# Wave 83 — B-2 Backend (supertokens-integration)
```yaml
files:
  - apps/api/src/main.ts (modify: register helmet after trust-proxy, before enableCors)
  - apps/api/src/common/security-headers.ts (new: helmet v8 config, exported so tests assert real shape)
  - apps/api/src/common/generic-throttler.guard.ts (new: GenericThrottlerGuard extends ThrottlerGuard, overrides throwThrottlingException -> generic 429)
  - apps/api/src/app.module.ts (modify: APP_GUARD -> GenericThrottlerGuard)
  - apps/api/test/integration/security-headers.spec.ts (new: 10 cases, DB-free)
helmet_config: "hsts{maxAge 15552000,includeSubDomains,preload:false} + noSniff + xFrameOptions{deny} + referrerPolicy{strict-origin-when-cross-origin}; CSP/CORP/COEP all false; x-powered-by removed (helmet default)"
middleware_order: "WS adapter -> trust proxy -> helmet -> enableCors(credentials) -> exception filter -> authRateLimiter -> listen. helmet only SETS flat headers; preflight 204 + CORS intact (traced via express:router debug)."
throttler: "GenericThrottlerGuard overrides throwThrottlingException -> HttpException({statusCode:429,message:'Too Many Requests'}); Retry-After preserved by base handleRequest; Express authRateLimiter untouched (AC9)."
tests: "10/10 pass (headers present, CSP/CORP/COEP absent, x-powered-by absent, 429 generic + Retry-After, CORS preflight intact)"
commit: 8a1129a5
deviations: none (plan labeled B-3; implemented as B-2 backend — same config-only scope; native fetch instead of supertest to avoid adding @types/supertest)
```
