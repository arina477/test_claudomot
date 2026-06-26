# SuperTokens Reference

**Last verified:** 2026-06-26
**Official docs:** https://supertokens.com/docs/emailpassword/introduction
**GitHub:** https://github.com/supertokens/supertokens-node
**Installed version:** 24.0.2 (supertokens-node, current major v24 series)
**Install location:** apps/api (NestJS backend)

Frontend SDK (companion): `supertokens-auth-react` or `supertokens-web-js` in apps/web. This doc covers the Node backend SDK and self-hosted Core; see §Platform Compatibility for the frontend SDK notes.

---

## Official API Surface

*(from official docs and supertokens-node GitHub source — what the SDK provides)*

### Public classes / functions

#### `supertokens` (default import from `"supertokens-node"`)

- `supertokens.init(config: TypeInput): void` — Initialize once at bootstrap. Must be called before any recipe function or middleware. Calling more than once throws.
- `supertokens.middleware(): RequestHandler` — Express/NestJS middleware that intercepts all SuperTokens SDK routes (auth endpoints). Must be mounted **before** application route handlers and **after** CORS in the bootstrap sequence.
- `supertokens.getAllCORSHeaders(): string[]` — Returns the list of header names the SDK requires in `allowedHeaders` (and, for header-based auth, `exposedHeaders`). Returns: `["anti-csrf", "rid", "fdi-version", "authorization", "st-auth-mode"]` plus any recipe-specific additions.
- `supertokens.getUser(userId, userContext?): Promise<User | undefined>` — Fetch a user by primary user ID. Replaces recipe-level `getUserById` (removed in v16).
- `supertokens.deleteUser(userId, userContext?): Promise<{ status: "OK" }>` — Hard-delete a user (all recipes + sessions).
- `supertokens.getUserCount(includeRecipeIds?, tenantId?, userContext?): Promise<number>`

Source: `lib/ts/supertokens.ts` — `https://github.com/supertokens/supertokens-node/blob/master/lib/ts/supertokens.ts`

#### `Session` (import from `"supertokens-node/recipe/session"`)

- `Session.init(config?: TypeInput): RecipeListFunction` — Add to `recipeList`. See constructor options.
- `Session.createNewSession(req, res, recipeUserId, accessTokenPayload?, sessionDataInDatabase?, userContext?): Promise<SessionContainerInterface>`
- `Session.getSession(req, res, options?, userContext?): Promise<SessionContainerInterface | undefined>`
- `Session.refreshSession(req, res, userContext?): Promise<SessionContainerInterface>`
- `Session.revokeSession(sessionHandle, userContext?): Promise<boolean>`
- `Session.revokeAllSessionsForUser(userId, revokeAcrossAllTenants?, tenantId?, userContext?): Promise<string[]>`
- `Session.getAllSessionHandlesForUser(userId, tenantId?, userContext?): Promise<string[]>`
- `Session.mergeIntoAccessTokenPayload(sessionHandle, accessTokenPayloadUpdate, userContext?): Promise<void>`
- `Session.validateClaimsForSessionHandle(sessionHandle, overrideGlobalClaimValidators?, userContext?): Promise<ValidateClaimsResult>`

Source: `lib/ts/recipe/session/index.ts`

#### `verifySession` (import from `"supertokens-node/recipe/session/framework/express"`)

- `verifySession(options?: VerifySessionOptions): RequestHandler` — Express middleware that validates the session on each request, attaches the `SessionContainerInterface` at `req.session`, and handles token refresh and error responses automatically. Used as a NestJS guard.

Source: `lib/ts/recipe/session/framework/express.ts`

#### `EmailPassword` (import from `"supertokens-node/recipe/emailpassword"`)

- `EmailPassword.init(config?: TypeInput): RecipeListFunction`
- `EmailPassword.signUp(tenantId, email, password, session?, userContext?): Promise<SignUpResult>` — Returns `{ status: "OK", user, session } | { status: "EMAIL_ALREADY_EXISTS_ERROR" } | { status: "SIGN_UP_NOT_ALLOWED", reason }`.
- `EmailPassword.signIn(tenantId, email, password, session?, userContext?): Promise<SignInResult>` — Returns `{ status: "OK", user, session } | { status: "WRONG_CREDENTIALS_ERROR" } | { status: "SIGN_IN_NOT_ALLOWED", reason }`.
- `EmailPassword.createResetPasswordToken(tenantId, userId, email?, userContext?): Promise<{ status: "OK" | "UNKNOWN_USER_ID_ERROR", token? }>`
- `EmailPassword.resetPasswordUsingToken(tenantId, token, newPassword, userContext?): Promise<ResetPasswordResult>`
- `EmailPassword.updateEmailOrPassword(input): Promise<UpdateEmailResult>`

Source: `lib/ts/recipe/emailpassword/index.ts`

#### `EmailVerification` (import from `"supertokens-node/recipe/emailverification"`)

- `EmailVerification.init(config: TypeInput): RecipeListFunction` — Requires `mode: "REQUIRED" | "OPTIONAL"`.
- `EmailVerification.sendEmailVerificationEmail(tenantId, userId, recipeUserId, email?, userContext?): Promise<{ status: "OK" | "EMAIL_ALREADY_VERIFIED_ERROR" }>`
- `EmailVerification.verifyEmailUsingToken(tenantId, token, attemptAccountLinking?, userContext?): Promise<VerifyEmailResult>`
- `EmailVerification.isEmailVerified(recipeUserId, email?, userContext?): Promise<boolean>`
- `EmailVerification.revokeEmailVerificationTokens(tenantId, userId, recipeUserId?, email?, userContext?): Promise<{ status: "OK" }>`
- `EmailVerificationClaim` — Exported claim object for use in `overrideGlobalClaimValidators`. Claim key: `"st-ev"`. Boolean value (`true` = verified).
  - `EmailVerificationClaim.validators.isVerified(refetchTimeOnFalseInSeconds?, maxAgeInSeconds?): SessionClaimValidator`

Source: `lib/ts/recipe/emailverification/index.ts`, `lib/ts/recipe/emailverification/emailVerificationClaim.ts`

### Constructor options

#### `supertokens.init(config)` — full shape

```typescript
supertokens.init({
  framework: "express",    // default; NestJS uses Express adapter
  appInfo: {
    appName: string,          // required — display name (e.g. "StudyHall")
    apiDomain: string,        // required — backend origin (e.g. "https://api.studyhall.up.railway.app")
    websiteDomain: string,    // required — frontend origin (e.g. "https://studyhall.up.railway.app")
    apiBasePath: string,      // optional — default "/auth"
    websiteBasePath: string,  // optional — default "/auth"
  },
  supertokens: {
    connectionURI: string,    // required — Core URL (e.g. "http://supertokens:3567")
    apiKey?: string,          // required when Core has API_KEYS set
  },
  recipeList: [
    EmailPassword.init({ ... }),
    EmailVerification.init({ mode: "REQUIRED" | "OPTIONAL" }),
    Session.init({ ... }),
  ],
});
```

Note: The `supertokens` sub-object (not the top-level) carries `connectionURI` + `apiKey`. Common mistake: placing them at the top level.

Source: `lib/ts/types.ts` — `https://github.com/supertokens/supertokens-node/blob/master/lib/ts/types.ts`

#### `Session.init(config)` — relevant options

```typescript
Session.init({
  cookieSecure?: boolean,          // default: true when apiDomain is https://
  cookieSameSite?: "strict" | "lax" | "none",
  // default computed: "lax" when same top-level domain + same protocol;
  //                   "none" when cross-domain or protocol mismatch
  cookieDomain?: string,           // default: undefined (scoped to exact hostname)
  olderCookieDomain?: string,      // migration aid when changing cookieDomain
  antiCsrf?: "VIA_TOKEN" | "VIA_CUSTOM_HEADER" | "NONE",
  // default: "VIA_TOKEN" when cookieSameSite="none"; "NONE" otherwise
  accessTokenPath?: string,        // default: "/"
  getTokenTransferMethod?: (input) => "header" | "cookie" | "any",
  // default: "any" — SDK negotiates based on st-auth-mode request header
  exposeAccessTokenToFrontendInCookieBasedAuth?: boolean, // default: false
  getCookieNameForTokenType?: (req, tokenType, userContext) => string,
  // additive since v21.1.0 — allows overriding default cookie names per request
  errorHandlers?: ErrorHandlers,
  override?: {
    functions?: (original: RecipeInterface) => RecipeInterface,
    apis?: (original: APIInterface) => APIInterface,
  },
})
```

Source: `lib/ts/recipe/session/types.ts`, `lib/ts/recipe/session/utils.ts`

#### `verifySession(options)` — VerifySessionOptions

```typescript
verifySession({
  sessionRequired?: boolean,               // default: true — set false for optional auth
  antiCsrfCheck?: boolean,                 // override per-route anti-CSRF enforcement
  checkDatabase?: boolean,                 // default: false — check Core DB on each verify
  overrideGlobalClaimValidators?: (
    globalValidators: SessionClaimValidator[],
    session: SessionContainerInterface,
    userContext: UserContext
  ) => Promise<SessionClaimValidator[]> | SessionClaimValidator[],
})
```

Source: `lib/ts/recipe/session/types.ts`

### Methods with signatures

#### SessionContainerInterface (the `req.session` object after verifySession)

```typescript
session.getUserId(userContext?): string
session.getRecipeUserId(userContext?): RecipeUserId
session.getTenantId(userContext?): string
session.getSessionHandle(): string
session.getAccessToken(): string
session.getAccessTokenPayload(userContext?): Record<string, any>
session.assertClaims(claimValidators, userContext?): Promise<void>
session.fetchAndSetClaim(claim, userContext?): Promise<void>
session.setClaimValue(claim, value, userContext?): Promise<void>
session.getClaimValue(claim, userContext?): Promise<T | undefined>
session.removeClaim(claim, userContext?): Promise<void>
session.mergeIntoAccessTokenPayload(accessTokenPayloadUpdate, userContext?): Promise<void>
session.revokeSession(userContext?): Promise<void>
```

### Runtime literals table

Values the SDK emits or reads at runtime. Hardcoding any of these wrong = silent 100% prod failure. Each row cites SDK source-of-truth.

**Source abbreviations used below:**
- `session/constants.ts` = `lib/ts/recipe/session/constants.ts`
- `global/constants.ts` = `lib/ts/constants.ts`
- `ev/claim.ts` = `lib/ts/recipe/emailverification/emailVerificationClaim.ts`
- `session/utils.ts` = `lib/ts/recipe/session/utils.ts`
- `ep/constants.ts` = `lib/ts/recipe/emailpassword/constants.ts`
- `session/error.ts` = `lib/ts/recipe/session/error.ts`
- `ep/types.ts` = `lib/ts/recipe/emailpassword/types.ts`
- `ev/types.ts` = `lib/ts/recipe/emailverification/types.ts`

---

#### Env var names (SDK reads or Core expects)

| Variable | Scope | Value / Notes | Source |
|---|---|---|---|
| `SUPERTOKENS_CONNECTION_URI` | apps/api (convention) | SDK reads via `ConfigService` in `AuthModule.forRoot()`; passed as `connectionURI` in init — SDK does NOT auto-read this env var, it must be passed explicitly | StudyHall convention (`_library.md`) |
| `SUPERTOKENS_API_KEY` | apps/api (convention) | Passed as `apiKey` in init; must match one value in Core's `API_KEYS` | StudyHall convention |
| `SUPERTOKENS_COOKIE_DOMAIN` | apps/api (convention) | Passed as `cookieDomain` in `Session.init()`; must cover both api + web origins (e.g. `.studyhall.up.railway.app`) | StudyHall convention (`_library.md`) |
| `API_KEYS` | Core service | Comma-separated; the API key(s) Node SDK authenticates with | hub.docker.com (Core Docker image) |
| `POSTGRESQL_CONNECTION_URI` | Core service | Full Postgres connection string for Core's own DB | hub.docker.com |
| `POSTGRESQL_USER` | Core service | Alternative to URI form | hub.docker.com |
| `POSTGRESQL_PASSWORD` | Core service | Alternative to URI form | hub.docker.com |
| `POSTGRESQL_HOST` | Core service | Alternative to URI form | hub.docker.com |
| `POSTGRESQL_PORT` | Core service | Alternative to URI form | hub.docker.com |

No legacy aliases documented. The Node SDK does not auto-read env vars for `connectionURI` or `apiKey` — they must be passed explicitly in `supertokens.init()`. Core env var `API_KEYS` has been stable across all documented versions.

---

#### Cookie names

| Cookie | Exact name | Dev vs Prod | `__Secure-` / `__Host-` prefix | Source |
|---|---|---|---|---|
| Access token | `sAccessToken` | Same name in both | No prefix applied (names are literal) | `session/constants.ts` — `ACCESS_TOKEN_COOKIE_NAME = "sAccessToken"` |
| Refresh token | `sRefreshToken` | Same name in both | No prefix applied | `session/constants.ts` — `REFRESH_TOKEN_COOKIE_NAME = "sRefreshToken"` |
| `sIdRefreshToken` | **Removed** — not present in v24 or any v16+ source | N/A | N/A | `session/constants.ts` (absent) |

What changes between dev and prod is the `Secure` flag (false on HTTP, true on HTTPS — controlled by `cookieSecure`) and potentially `SameSite=None` requiring `Secure=true` — not the cookie names themselves.

Custom names: the `getCookieNameForTokenType` config option (added v21.1.0) allows per-request overrides. StudyHall does not use this option.

---

#### Cookie attributes (SDK-computed defaults)

| Attribute | Default logic | When | Source |
|---|---|---|---|
| `Secure` | `true` when `apiDomain` starts with `https://`; `false` otherwise | — | `session/utils.ts` |
| `SameSite` | `"lax"` when api and web share the same top-level domain (e.g. both `.railway.app`) + same protocol; `"none"` when cross-domain or protocol mismatch | StudyHall sets `"lax"` explicitly in `Session.init()` — see Known Gotchas | `session/utils.ts` |
| `HttpOnly` | Always `true` for `sRefreshToken`; `false` for `sAccessToken` by default (configurable via `exposeAccessTokenToFrontendInCookieBasedAuth`) | — | `session/cookieAndHeaders.ts` |
| `Path` | `"/"` for access token; `apiBasePath + "/session/refresh"` for refresh token | Refresh token scoped to the refresh path | `session/cookieAndHeaders.ts` |
| Expiry | Access token: session-duration (short-lived, ~15 min); Refresh token: 1 year from creation (changed from 100 years in v19.0.0) | v19.0.0 breaking change | CHANGELOG v19.0.0 |

---

#### HTTP headers

| Header (exact name) | Direction | Purpose | Source |
|---|---|---|---|
| `rid` | Request (frontend → backend) | Recipe ID for routing in FDI < 1.20; still supported for backward compat in v24 | `global/constants.ts` — `HEADER_RID = "rid"` |
| `fdi-version` | Request (frontend → backend) | FDI version negotiation | `global/constants.ts` — `HEADER_FDI = "fdi-version"` |
| `anti-csrf` | Request (frontend → backend) | Anti-CSRF token (cookie-based auth with `antiCsrf: "VIA_TOKEN"`) | `session/constants.ts` — `antiCsrfHeaderKey = "anti-csrf"` |
| `st-auth-mode` | Request (frontend → backend) | Client-declared token transfer mode: `"cookie"` or `"header"` | `session/constants.ts` — `authModeHeaderKey = "st-auth-mode"` |
| `authorization` | Request (frontend → backend) | Bearer token in header-based auth mode (`"Bearer <accessToken>"`) | `session/constants.ts` — `authorizationHeaderKey = "authorization"` |
| `front-token` | Response (backend → frontend) | Base64-encoded JSON `{ uid, ate, up }`: userId, access-token-expiry, access-token-payload (the frontend-readable non-sensitive portion) | `session/cookieAndHeaders.ts` |
| `st-access-token` | Response (header mode) | Access token when `getTokenTransferMethod` returns `"header"` | `session/cookieAndHeaders.ts` |
| `st-refresh-token` | Response (header mode) | Refresh token when `getTokenTransferMethod` returns `"header"` | `session/cookieAndHeaders.ts` |
| `cdi-version` | Backend → Core (internal) | Core-Driver Interface version sent by Node SDK to Core | `lib/ts/querier.ts` |

CORS `allowedHeaders` must include all request headers above that the frontend sends. `supertokens.getAllCORSHeaders()` returns the list automatically.

For header-based auth (not the default for StudyHall), `exposedHeaders` must additionally include `front-token`, `st-access-token`, `st-refresh-token`, `anti-csrf`.

---

#### JWT / session claims

| Claim key | Type | When present | Source |
|---|---|---|---|
| `sub` | `string` | v3+ tokens — primary user ID | `session/accessToken.ts` |
| `sessionHandle` | `string` | all versions | `session/accessToken.ts` |
| `exp` | `number` (epoch s) | v3+ | `session/accessToken.ts` |
| `iat` | `number` (epoch s) | v3+ | `session/accessToken.ts` |
| `rsub` | `string` | v5+ — recipe user ID; falls back to `sub` if absent | `session/accessToken.ts` |
| `tId` | `string` | v4+ — tenant ID; defaults to `"public"` if absent | `session/accessToken.ts` |
| `stt` | `number` | current — token type: must be `0` (access) | `session/accessToken.ts` |
| `refreshTokenHash1` | `string` | internal — hash of refresh token | `session/accessToken.ts` |
| `parentRefreshTokenHash1` | `string` | optional — rotation parent hash | `session/accessToken.ts` |
| `antiCsrfToken` | `string` | optional — embedded anti-CSRF token | `session/accessToken.ts` |
| `st-ev` | `{ v: boolean, t: number }` | Email verification claim — `v: true` = verified, `t` = last-verified timestamp | `ev/claim.ts` — `key = "st-ev"` |

Protected claims (cannot be overwritten by application code): `sub`, `iat`, `exp`, `sessionHandle`, `parentRefreshTokenHash1`, `refreshTokenHash1`, `antiCsrfToken`, `rsub`, `tId`, `stt`.

Custom application claims are stored in the JWT alongside these. Set via `session.mergeIntoAccessTokenPayload()` or at `createNewSession()` time.

---

#### Default paths / callbacks

| Description | Default path | Configurable via | Source |
|---|---|---|---|
| `apiBasePath` | `/auth` | `appInfo.apiBasePath` | `lib/ts/types.ts` |
| `websiteBasePath` | `/auth` | `appInfo.websiteBasePath` | `lib/ts/types.ts` |
| Sign up | `POST /auth/signup` | — | `ep/constants.ts` — `SIGN_UP_API = "/signup"` |
| Sign in | `POST /auth/signin` | — | `ep/constants.ts` — `SIGN_IN_API = "/signin"` |
| Sign out | `POST /auth/signout` | — | `session/constants.ts` — `SIGNOUT_API_PATH = "/signout"` |
| Session refresh | `POST /auth/session/refresh` | — | `session/constants.ts` — `REFRESH_API_PATH = "/session/refresh"` |
| Email verify (token) | `POST /auth/user/email/verify/token` | — | `lib/ts/recipe/emailverification/constants.ts` |
| Email verify (check/consume) | `GET/POST /auth/user/email/verify` | — | `lib/ts/recipe/emailverification/constants.ts` |
| Password reset token | `POST /auth/user/password/reset/token` | — | `ep/constants.ts` — `GENERATE_PASSWORD_RESET_TOKEN_API` |
| Password reset | `POST /auth/user/password/reset` | — | `ep/constants.ts` — `PASSWORD_RESET_API` |
| Email exists (current) | `GET /auth/emailpassword/email/exists` | — | `ep/constants.ts` — `SIGNUP_EMAIL_EXISTS_API` |
| Email exists (legacy) | `GET /auth/signup/email/exists` | legacy compat | `ep/constants.ts` — `SIGNUP_EMAIL_EXISTS_API_OLD` |
| Core health | `GET http://core:3567/hello` | — | Core API |
| Core version | `GET http://core:3567/apiversion` | — | Core API — used by Node SDK at startup for CDI negotiation |
| Core default port | `3567` | `PORT` env on Core service | Docker image |

The session refresh path (`/auth/session/refresh`) is critical — the SDK's frontend automatically calls it on access token expiry. Never create a custom route at this path; let the SDK own it.

---

#### Error codes / classes

**Session errors (thrown as `Session.Error` instances, catch by `err.type`):**

| `err.type` | When | Payload |
|---|---|---|
| `Session.Error.TRY_REFRESH_TOKEN` | Access token expired/invalid; frontend should call `/auth/session/refresh` | `{ message: string }` |
| `Session.Error.UNAUTHORISED` | Session doesn't exist or was revoked; user must re-login | `{ message: string; clearTokens?: boolean }` |
| `Session.Error.TOKEN_THEFT_DETECTED` | Refresh token used after rotation (possible theft) | `{ sessionHandle, userId, recipeUserId }` |
| `Session.Error.INVALID_CLAIMS` | Session valid but claim validator failed (e.g. email not verified) | `{ claimValidationErrors: ClaimValidationError[] }` |
| `Session.Error.CLEAR_DUPLICATE_SESSION_COOKIES` | Multiple session cookies detected (v17.1.0+) | `{ message: string }` |

Source: `session/error.ts`

**EmailPassword status values (returned in response body `status` field — not thrown):**

| Status | When |
|---|---|
| `"OK"` | Success |
| `"WRONG_CREDENTIALS_ERROR"` | `signIn` — wrong email or password |
| `"EMAIL_ALREADY_EXISTS_ERROR"` | `signUp` — email taken |
| `"RESET_PASSWORD_INVALID_TOKEN_ERROR"` | `resetPasswordUsingToken` — token invalid or expired |
| `"UNKNOWN_USER_ID_ERROR"` | User not found by ID |
| `"PASSWORD_POLICY_VIOLATED_ERROR"` | Password fails configured policy |
| `"SIGN_IN_NOT_ALLOWED"` | Account-linking restriction (v16+) |
| `"SIGN_UP_NOT_ALLOWED"` | Account-linking restriction (v16+) |
| `"PASSWORD_RESET_NOT_ALLOWED"` | Account-linking restriction |
| `"EMAIL_CHANGE_NOT_ALLOWED_ERROR"` | Email change blocked |

Source: `ep/types.ts`

**EmailVerification status values:**

| Status | When |
|---|---|
| `"OK"` | Success |
| `"EMAIL_ALREADY_VERIFIED_ERROR"` | Already verified |
| `"EMAIL_VERIFICATION_INVALID_TOKEN_ERROR"` | Token invalid or expired |
| `"EMAIL_DOES_NOT_EXIST_ERROR"` | User has no email |
| `"UNKNOWN_USER_ID_ERROR"` | User not found |

Source: `ev/types.ts`

**Base SuperTokensError types:**

| Type | String value |
|---|---|
| `SuperTokensError.BAD_INPUT_ERROR` | `"BAD_INPUT_ERROR"` |
| `SuperTokensError.UNKNOWN_ERROR` | `"UNKNOWN_ERROR"` |

Source: `lib/ts/error.ts`

---

#### Version negotiation strings

| String | Where | Value (v24) | Source |
|---|---|---|---|
| FDI version header name | `fdi-version` request header | Sent by frontend SDK (e.g. `"1.18"`, `"2.0"`, `"3.0"`) | `global/constants.ts` — `HEADER_FDI` |
| CDI version supported | `cdi-version` request header to Core | `"5.4"` (v24.0.2) | `lib/ts/version.ts` — `cdiSupported: ["5.4"]` |
| SDK version | `lib/ts/version.ts` | `"24.0.2"` | `lib/ts/version.ts` — `version = "24.0.2"` |
| Minimum Core version (for CDI 5.4) | Core must speak CDI 5.4 | Core >= ~9.6 | CHANGELOG progression: v22=CDI5.3 (Core>=9.3), v24=CDI5.4 |
| Core API version endpoint | `GET /apiversion` | Returns supported CDI versions; SDK uses max intersection | `lib/ts/querier.ts` |

---

#### Log line formats

N/A — verified SDK does not own a log format. The SDK does not emit structured JSON logs through the application logger. Core emits its own logs internally; the Node SDK does not define a structured log format for application use.

---

## Platform Compatibility

### Railway (self-hosted Core + API service)

**SuperTokens Core service on Railway:**

- Docker image: `registry.supertokens.io/supertokens/supertokens-postgresql` (use a pinned version tag, not `latest`)
- Default port: `3567`
- Required Railway env vars on the Core service:
  - `POSTGRESQL_CONNECTION_URI` — Core's own dedicated Postgres connection string (separate from the app Postgres)
  - `API_KEYS` — one or more comma-separated secret keys; must match `apiKey` in `supertokens.init()` on the API service
- Core is reachable from the API service via Railway private DNS: `http://supertokens.railway.internal:3567`
- Core must NOT be exposed publicly. Railway private network (`railway.internal`) provides isolation.
- `connectionURI` in the API service's init: `http://supertokens.railway.internal:3567` (note: HTTP is fine on the private network; TLS termination is at the Railway ingress).

**API service (NestJS) env vars on Railway:**
```
SUPERTOKENS_CONNECTION_URI=http://supertokens.railway.internal:3567
SUPERTOKENS_API_KEY=<matches Core API_KEYS>
SUPERTOKENS_COOKIE_DOMAIN=.studyhall.up.railway.app
```

**Cookie domain on Railway:**
Both the API service (`api.studyhall.up.railway.app`) and the web service (`studyhall.up.railway.app`) are subdomains of `.studyhall.up.railway.app`. Setting `cookieDomain: ".studyhall.up.railway.app"` makes the session cookie readable by both services. The leading dot is required for subdomain matching.

**Core version pinning:** Pin the Core Docker image to a specific version matching the CDI version required by the installed `supertokens-node`. For v24.0.2 (CDI 5.4), use a Core image that supports CDI 5.4. Do not use `latest` in production — Core upgrades can change the CDI version and require a coordinated SDK upgrade.

### Node.js / NestJS runtime

**NestJS bootstrap order (critical):**

```typescript
// main.ts
const app = await NestFactory.create(AppModule);

// 1. CORS first — must run before any SuperTokens middleware or route handlers
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS!.split(','),
  allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  credentials: true,
  // For header-based token transfer, add:
  // exposedHeaders: [...supertokens.getAllCORSHeaders(), 'front-token']
});

// 2. SuperTokens middleware second — after CORS, before routes
// This is handled via AuthModule's MiddlewareConsumer (see AuthModule section below)

await app.listen(3000);
```

**AuthModule structure:**

```typescript
@Module({})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply SuperTokens middleware to ALL routes before any application handler
    consumer.apply(AuthMiddleware).forRoutes('*');
  }

  static forRoot({ connectionURI, apiKey, appInfo, cookieDomain }): DynamicModule {
    supertokens.init({
      framework: 'express',
      appInfo,
      supertokens: { connectionURI, apiKey },
      recipeList: [
        EmailPassword.init({}),
        EmailVerification.init({ mode: 'REQUIRED' }),
        Session.init({
          cookieDomain,
          cookieSameSite: 'lax',
          cookieSecure: true,
        }),
      ],
    });
    return { module: AuthModule, providers: [], exports: [] };
  }
}
```

**verifySession guard:**

```typescript
import { verifySession } from 'supertokens-node/recipe/session/framework/express';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    let err: unknown;
    const resp = ctx.getResponse<Response>();
    await verifySession()(ctx.getRequest(), resp, (res: unknown) => { err = res; });
    if (resp.headersSent) throw new Error('RESPONSE_SENT');
    if (err) throw err;
    return true;
  }
}
```

**Accessing userId in a controller:**

```typescript
// After AuthGuard runs, session is available at req.session
const session = req.session as SessionContainerInterface;
const userId = session.getUserId();
```

### Vite / React SPA frontend (apps/web)

**Frontend SDK options:**

- `supertokens-auth-react` — full pre-built UI + session management. Provides `<SuperTokensWrapper>`, routing components, and session hooks. Best fit for StudyHall (pre-built auth UI reduces wave scope).
- `supertokens-web-js` — headless session management only (no UI). Use if building custom auth UI from scratch.

**Initialization (supertokens-auth-react):**

```typescript
import SuperTokens from 'supertokens-auth-react';
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword';
import EmailVerification from 'supertokens-auth-react/recipe/emailverification';
import Session from 'supertokens-auth-react/recipe/session';

SuperTokens.init({
  appInfo: {
    appName: 'StudyHall',
    apiDomain: import.meta.env.VITE_API_URL,
    websiteDomain: import.meta.env.VITE_WEB_URL,
    apiBasePath: '/auth',
    websiteBasePath: '/auth',
  },
  recipeList: [
    EmailPassword.init({ ... }),
    EmailVerification.init({ mode: 'REQUIRED' }),
    Session.init(),
  ],
});
```

**Session reading (frontend):**

```typescript
import Session from 'supertokens-auth-react/recipe/session';

const sessionExists = await Session.doesSessionExist();
const userId = await Session.getUserId();
const accessTokenPayload = await Session.getAccessTokenPayloadSecurely();
```

The frontend SDK reads session information from the `front-token` response header (Base64-encoded, set by the backend on every response). The `sAccessToken` cookie itself is `HttpOnly: false` in cookie mode by default — accessible to JS — but `sRefreshToken` is always HttpOnly. StudyHall should NOT read the access token value directly; use the SDK's methods.

**Socket.IO / WS auth (withCredentials):**

The Socket.IO client must send `withCredentials: true` on the connection options for the session cookie to be sent with the WS upgrade request. Without this, the `io.use()` middleware on the server will not receive the session cookie and will reject all connections.

```typescript
import { io } from 'socket.io-client';
const socket = io(VITE_API_URL, {
  withCredentials: true,
  path: '/socket.io',
  auth: { token: accessToken }, // JWT fallback for cross-origin/PWA
});
```

---

## Known Gotchas

*(from official docs, GitHub source, and CHANGELOG — not our integration)*

**1. SameSite=Lax is correct for StudyHall; do not change to Strict.**
The default SameSite is computed (`"lax"` for same-TLD). StudyHall must set it explicitly to `"lax"` in `Session.init()`. `SameSite=Strict` breaks invite-link → login → auto-redeem top-level navigation (the cookie is not sent on cross-site navigations from email links). `SameSite=None` requires `Secure=true` and enables cross-site requests from any origin. `"lax"` is the correct choice.
Source: Architecture `_library.md` § Resolved decision 17; `session/utils.ts` default logic.

**2. CORS must be configured before `supertokens.middleware()` in the bootstrap order.**
If CORS is applied after the SuperTokens middleware, the middleware's error responses (e.g. 401 TRY_REFRESH_TOKEN) will not include `Access-Control-Allow-Origin` headers, causing the browser to treat them as network errors instead of readable 401s, and the frontend SDK's refresh loop will fail silently.
Source: NestJS example — `main.ts`, `auth.module.ts` mounting order.

**3. `getAllCORSHeaders()` is for `allowedHeaders`, not `exposedHeaders`, in cookie mode.**
The official NestJS example only specifies `allowedHeaders`. For header-based auth mode (`st-auth-mode: header`), you additionally need `exposedHeaders` to include `front-token`, `st-access-token`, `st-refresh-token`. StudyHall uses cookie mode — but if the fallback JWT path (WS upgrade) is used, ensure `front-token` is in `exposedHeaders` so the frontend SDK can read it to populate the access token payload.
Source: `session/cookieAndHeaders.ts`; NestJS example `main.ts`.

**4. `supertokens.init()` must be called exactly once.**
Calling it again (e.g., in a test setup that re-creates the module) throws. In tests, mock the module or call `supertokens.init()` in a global `beforeAll` and reset state between tests using the SDK's test utilities.
Source: `lib/ts/supertokens.ts` — init guard.

**5. `verifySession` import path is framework-specific.**
Import from `"supertokens-node/recipe/session/framework/express"`, NOT from `"supertokens-node/recipe/session"`. The `session` index does not export `verifySession`; using the wrong import silently breaks the guard.
Source: `lib/ts/recipe/session/framework/express.ts`

**6. `sIdRefreshToken` cookie is removed — do not reference it.**
Legacy cookie present in versions before v16. Any code that checks for or clears `sIdRefreshToken` is dead code in v16+. The CHANGELOG does not specify the exact removal version, but the constant is absent from all v16–v24 source files.
Source: `session/constants.ts` (absent).

**7. Core version must support the CDI version required by the Node SDK version.**
supertokens-node v24 requires CDI 5.4. Deploying an older Core that only speaks CDI 5.2 will cause the Node SDK to fail at startup when it queries `/apiversion` and finds no compatible version. Always upgrade Core and the Node SDK together.
Source: `lib/ts/version.ts` — `cdiSupported: ["5.4"]`; CHANGELOG v22.0.0 (CDI 5.3), v21.0.0 (CDI 5.2).

**8. Refresh token cookie is scoped to the refresh path, not `/`.**
The `sRefreshToken` cookie has `Path` set to `<apiBasePath>/session/refresh` (e.g., `/auth/session/refresh`), not `/`. This is intentional to limit the scope of the credential. It means the refresh token is only sent on the refresh request — other requests only carry the access token. Do not try to read the refresh token on other routes.
Source: `session/cookieAndHeaders.ts` — `REFRESH_TOKEN_COOKIE_NAME` path setting.

**9. Email verification mode `"REQUIRED"` globally gates all `verifySession()` calls.**
When `EmailVerification.init({ mode: "REQUIRED" })` is used (StudyHall's config), the `isVerified` claim validator is registered globally. Every `verifySession()` call will reject unverified users with `INVALID_CLAIMS` (HTTP 403). This is correct for StudyHall's feature 1 flow. If you need to allow unverified users on some routes (e.g., `/verify`), use `verifySession({ overrideGlobalClaimValidators: () => [] })` on those specific routes to strip the email verification validator.
Source: `lib/ts/recipe/emailverification/recipe.ts` — `addClaimValidatorFromOtherRecipe`.

**10. Anti-CSRF is automatic in cookie mode; do not disable it.**
When `SameSite=None`, the SDK defaults to `antiCsrf: "VIA_TOKEN"`. With `SameSite=Lax`, the SDK defaults to `antiCsrf: "NONE"` (Lax provides inherent CSRF protection for top-level navigation). Do not set `antiCsrf: "NONE"` manually when the actual SameSite is `"none"` — that disables CSRF protection. For `SameSite=Lax`, the default behavior is correct and does not require explicit configuration.
Source: `session/utils.ts` — `antiCsrfType` default logic.

**11. `withCredentials: true` is mandatory on the Socket.IO client.**
Without this, the session cookie is not sent on the WebSocket upgrade request, and the `io.use()` middleware cannot verify the session. The connection will be rejected with an authentication error before any handler runs. This is not optional — it must be set even in same-origin configurations on some browsers.
Source: Architecture `_library.md` § Resolved decision 8; security.md § Convention 3.

**12. Validate the session on the WS upgrade (`io.use()`), never on the first message.**
The `io.use()` middleware runs before any namespace or event handler. Using a message listener to validate is an anti-pattern — an unauthenticated socket can send messages before the first validation fires. Reject at upgrade time.
Source: security.md § Convention 3; `_library.md` § Security.

**13. Never hand-roll the refresh endpoint.**
The SDK's `POST /auth/session/refresh` route is the only correct refresh path. Custom refresh implementations reintroduce token rotation race conditions and session fixation vulnerabilities. The frontend SDK calls this automatically on 401 responses.
Source: security.md § Convention (implied); SDK design.

**14. Access token expiry was changed in v19.0.0: 100 years → 1 year.**
If upgrading from a version before v19, existing refresh tokens with 100-year expiry will still be valid; new sessions get 1-year refresh tokens. This is not a breaking change but note it for session lifecycle expectations.
Source: CHANGELOG v19.0.0.

---

## Documentation Links

- Getting started (EmailPassword): https://supertokens.com/docs/emailpassword/introduction
- Backend setup (Express): https://supertokens.com/docs/emailpassword/quickstart/backend-setup
- NestJS integration guide: https://supertokens.com/docs/emailpassword/nestjs/setting-up-backend
- Session recipe reference: https://supertokens.com/docs/session/introduction
- EmailVerification recipe: https://supertokens.com/docs/emailpassword/common-customizations/email-verification/about
- Self-hosted Core (Docker / PostgreSQL): https://supertokens.com/docs/emailpassword/pre-built-ui/setup/core/with-docker
- API reference: https://supertokens.com/docs/emailpassword/references/api-reference
- Protecting routes (email verification claim): https://supertokens.com/docs/emailpassword/common-customizations/email-verification/protecting-routes
- Session tokens + cookies: https://supertokens.com/docs/session/common-customizations/sessions/cookies-and-session-tokens
- Changelog (CRITICAL — read before upgrading): https://github.com/supertokens/supertokens-node/blob/master/CHANGELOG.md
- GitHub: https://github.com/supertokens/supertokens-node
- Core Docker Hub: https://hub.docker.com/r/supertokens/supertokens-postgresql
- GitHub Issues (session auth): https://github.com/supertokens/supertokens-node/issues?q=label%3Asession

---

## Integration-Specific Findings

*(added during/after implementation — what StudyHall learned)*

### Our adapter patterns

*(to be filled at B-block and L-1 Docs of wave 2)*

### Env var configuration on our platforms

*(to be filled after deploy)*

### Bugs we hit and how we solved them

*(to be filled during B-block)*

### What differed from the official docs

*(to be filled after implementation)*
