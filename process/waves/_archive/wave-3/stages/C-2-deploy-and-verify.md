# Wave 3 — C-2 Deploy & verify — PASS
Both services redeployed against main@b3efa82, SUCCESS. Live verification:
- web https://web-production-bce1a8.up.railway.app/ → 200; /login → 200 (SPA serves client routes — auth pages live).
- api /health → 200, clean boot (ERR_MODULE_NOT_FOUND resolved).
- GET /me no session → 401; fresh /auth/signup → 200 + users row; GET /me w/ session → 200 {emailVerified:false} (per-route verify-exemption works); GET /profile → 200 {displayName:null}; PATCH /profile → 200 {displayName:"T"}. Auth front-door working end-to-end.
```yaml
ci_stage_verdict: PASS
verdict_source: railway
deploy_targets:
  - {service: web, state: SUCCESS, url: "https://web-production-bce1a8.up.railway.app"}
  - {service: api, state: SUCCESS, url: "https://api-production-b93e.up.railway.app"}
verified: ["web SPA+routes 200", "api /health 200", "/me 401 noauth", "signup→users row", "/me 200 unverified (exemption)", "/profile GET+PATCH 200"]
pending: ["full click-verify-link browser E2E → T-5", "Resend domain a1299e88 (sandbox: owner-only delivery)"]
canary_status: skipped (self-use-mvp)
```
