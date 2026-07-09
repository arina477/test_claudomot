# Wave 84 — B-2 Backend (supertokens-integration)
```yaml
files: [apps/api/src/auth/supertokens.config.ts, apps/api/src/auth/supertokens.config.spec.ts]
change: "Session.init: added getTokenTransferMethod: () => 'header' (v24 API — spec's assumed `tokenTransferMethod` init key does NOT exist backend-side; verified vs supertokens-node@24.0.2 types). Explicit header posture (was 'any' default)."
access_token_validity: "NOT settable in SDK v24 — it's a CORE service env var ACCESS_TOKEN_VALIDITY (default 3600). Documented in code comment; CARRY-FORWARD to C-block: set ACCESS_TOKEN_VALIDITY=900 on the supertokens core Railway service + redeploy (AC2 not live until then)."
refresh_rotation: "confirmed default-on (single-use + reuse detection); no disabling override; documented."
tests: "supertokens.config.spec.ts (1): getTokenTransferMethod() === 'header'"
```
