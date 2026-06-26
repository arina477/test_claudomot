<!--
DISTILLATION NOTES (agent-creator Stage 2, applied 2026-06-26):
  Source: Gemini Deep Research fast run timed out (>~6min budget); content
  skeleton-synthesized per agent-creator.md RESILIENCE clause from the rendered
  brief + executor domain-prompt + tech_surface spec + StudyHall project context
  (command-center/dev/architecture/sdks.md §1 SuperTokens + _library.md Security
  + Auth dataflow). No Gemini grounding artifacts to strip (none present).
  research_status: skeleton-synthesized.
  Final structure: §1 (~300 words), §2 (15 always-do), §3 (15 never-do), §4 (9 anti-patterns).
  Refresh via `claudomat sync` once a research archive exists.
-->

# Domain Pack — supertokens-integration (SuperTokens self-hosted auth executor)

## §1 KNOWLEDGE BASELINE

SuperTokens splits into the self-hosted Core (a standalone service with its own Postgres) and SDKs: `supertokens-node` in the NestJS backend and `supertokens-auth-react` in the Vite/React SPA. `supertokens-node` connects to Core via `connectionURI` + `apiKey`; StudyHall uses the EmailPassword + EmailVerification + Session recipes. Core runs as a separate Railway service on the private network; `SUPERTOKENS_API_KEY` is self-generated at deploy, never committed. Session auth is cookie-based: short-lived access JWT (≈15 min) + rotating refresh token in httpOnly + Secure + SameSite=Lax cookies. SameSite=Lax (not Strict) is deliberate so the invite-link → login → auto-redeem top-level navigation works.

In NestJS, `supertokens.middleware()` must be mounted before the route handlers and CORS must run before it with `credentials: true` and an explicit origin allowlist (not `*`). The `verifySession()` guard validates the session and attaches `userId` to the request. SuperTokens manages refresh transparently via the `/auth/session/refresh` route the SDK exposes — application code does not roll its own refresh. The Core, not `NotificationsModule`, sends verification + password-reset email (configured with Resend/SMTP on the Core service).

Two non-HTTP trust boundaries matter. Socket.IO: validate the session on the WebSocket upgrade in `io.use()` middleware (with `withCredentials: true` so the cookie rides the upgrade), or accept a short-lived JWT in the handshake `auth` payload for PWA/cross-origin; reject unauthenticated sockets immediately, never on first message. LiveKit: `VoiceModule` mints the room access token server-side only after a session + RBAC check — the LiveKit secret never reaches the client. The `users.id` row is created to match Core's user UUID at signup. All SDK errors are `SuperTokensError` subtypes, wrapped at the `AuthModule` boundary into typed StudyHall error codes; session errors map to 401 `SESSION_EXPIRED` / `INVALID_SESSION`.

## §2 ALWAYS-DO RULES

- Mount `supertokens.middleware()` before application routes and after CORS in the NestJS bootstrap.
  Why: wrong order makes session routes 404 or skips cookie handling.
- Configure CORS with `credentials: true` and an explicit `ALLOWED_ORIGINS` allowlist plus SuperTokens' exposed headers.
  Why: without credentialed CORS the browser drops the session cookie.
- [STABLE] Store session tokens only in httpOnly + Secure cookies, never in localStorage or JS-readable storage.
  Why: localStorage tokens are stealable by any XSS payload.
- Set `cookieSameSite: "lax"` and `cookieDomain` to the shared app domain.
  Why: Strict breaks invite-link top-level navigation; a wrong domain detaches the cookie.
- Initialize SuperTokens once at app bootstrap with EmailPassword + EmailVerification + Session recipes.
  Why: re-init or missing recipes causes runtime recipe-not-found errors.
- Wrap every `supertokens-node` call in try/catch and map `SuperTokensError` to a typed StudyHall error code.
  Why: leaking SDK-internal errors couples callers to SuperTokens shapes.
- Create the `users` row with the same UUID Core returns at signup.
  Why: a mismatched id breaks every FK that joins app data to the auth user.
- Gate protected actions behind the EmailVerification claim where the flow requires a verified email.
  Why: unverified accounts performing privileged actions defeats verification.
- Validate the SuperTokens session on the Socket.IO upgrade via `io.use()`, attaching `socket.data.userId`.
  Why: validating on first message lets an unauthenticated socket connect first.
- Open the browser Socket.IO connection with `withCredentials: true`.
  Why: without it the session cookie is not sent on the WS upgrade.
- Mint LiveKit room tokens server-side only, after `verifySession()` + RBAC.
  Why: client-side token minting would expose the LiveKit API secret.
- Let the SDK's `/auth/session/refresh` route handle refresh-token rotation; never hand-roll refresh.
  Why: custom refresh logic reintroduces fixation and rotation bugs the SDK already solves.
- [STABLE] Keep anti-CSRF protection enabled for cookie-based sessions.
  Why: cookie auth without CSRF defense is exploitable cross-site.
- Read all Core connection config (`connectionURI`, `apiKey`, `cookieDomain`) from `ConfigService` env vars.
  Why: hard-coded Core URLs break across local/preview/prod and leak the api key.
- Configure SuperTokens Core (not NotificationsModule) with Resend/SMTP for verification + reset email.
  Why: routing auth-critical email through the app path duplicates and desyncs delivery.

## §3 NEVER-DO RULES

- Never store the access or refresh token in localStorage, sessionStorage, or a non-httpOnly cookie.
  Why: any XSS then exfiltrates the session.
- Never set `cookieSameSite: "strict"` for this app.
  Why: Strict blocks the invite-link → login → auto-redeem top-level navigation.
- Never use `cors({ origin: "*" })` together with credentialed sessions.
  Why: wildcard origin with credentials is rejected by browsers and breaks auth.
- Never validate the WebSocket session on first message instead of on upgrade.
  Why: the socket is already connected and can act before validation.
- Never expose `LIVEKIT_API_SECRET` or `SUPERTOKENS_API_KEY` to the frontend bundle.
  Why: a leaked secret lets anyone mint tokens or call Core's admin API.
- Never commit `SUPERTOKENS_API_KEY` to the repo or `.env.example`.
  Why: it is a deploy-time secret; committing it is a credential leak.
- Never implement a custom refresh-token endpoint alongside the SDK's.
  Why: two refresh paths cause rotation races and silent logout loops.
- Never call SuperTokens recipe functions outside `AuthModule`.
  Why: scattered SDK imports break the single-owner boundary and error mapping.
- Never skip the email-verification gate on flows that require a verified address.
  Why: signup feature 1 depends on verification; skipping ships unverified accounts.
- Never trust a `userId` from the request body or query for auth.
  Why: it is forgeable; only the verified session's userId is trustworthy.
- Never run `supertokens.middleware()` after the route handlers.
  Why: the session/refresh routes never get a chance to run.
- Never disable anti-CSRF to "fix" a cross-origin cookie problem.
  Why: it trades a config bug for a CSRF vulnerability; fix CORS/SameSite instead.
- [STABLE] Never reuse a session token after privilege elevation without a fresh session.
  Why: failing to rotate on elevation enables session fixation.
- Never point `cookieDomain` at a domain that does not cover both API and web origins.
  Why: the cookie is dropped and every authed request 401s.
- Never log full session tokens or password values, even at debug level.
  Why: token/password in logs is a breach waiting to happen.

## §4 ANTI-PATTERNS TO FLAG

- Name: Token in localStorage
  Description: client stores the access/refresh token in JS-readable storage.
  Example: `localStorage.setItem('accessToken', token)`
  Detection signal: any `localStorage`/`sessionStorage` write of an auth token in the SPA.

- Name: Wildcard credentialed CORS
  Description: CORS origin `*` with `credentials: true`.
  Example: `app.enableCors({ origin: '*', credentials: true })`
  Detection signal: `origin: '*'` co-located with `credentials: true`.

- Name: WS auth on message
  Description: socket validated inside an event handler instead of `io.use()` upgrade.
  Example: `socket.on('msg', () => { if (!valid) socket.disconnect() })`
  Detection signal: session check inside a message listener rather than connection middleware.

- Name: Client-side LiveKit token
  Description: LiveKit `AccessToken` constructed in browser code.
  Example: `new AccessToken(apiKey, apiSecret, ...)` in an `apps/web` file.
  Detection signal: `livekit-server-sdk` or `AccessToken` imported in frontend code.

- Name: Hand-rolled refresh
  Description: a custom `/refresh` controller alongside the SDK's route.
  Example: `@Post('refresh') refresh() { /* manual token swap */ }`
  Detection signal: a refresh endpoint in `AuthModule` not delegating to SuperTokens.

- Name: SameSite=Strict
  Description: session cookie set to Strict, breaking invite-link navigation.
  Example: `cookieSameSite: 'strict'` in SuperTokens init.
  Detection signal: `'strict'` in the Session recipe config.

- Name: Leaked SDK error
  Description: raw `SuperTokensError` surfaced to the client.
  Example: `catch (e) { throw e }` in an auth controller.
  Detection signal: SuperTokens error returned without mapping to a StudyHall code.

- Name: SDK import sprawl
  Description: `supertokens-node` imported in a non-Auth module.
  Example: `import Session from 'supertokens-node/recipe/session'` in `MessagingModule`.
  Detection signal: SuperTokens package imported outside `AuthModule`.

- Name: Body-sourced userId
  Description: authorization keyed off `req.body.userId`.
  Example: `RbacService.can(req.body.userId, ...)`
  Detection signal: a `userId` read from body/query feeding an auth/RBAC check.

## §5 INTEGRATION SIGNALS

- backend-developer — `AuthModule` wiring, guards, middleware order, error mapping.
- security-engineer — cookie/SameSite/CSRF review, WS-upgrade auth, LiveKit token-bridge audit, secret handling.
- node-specialist — `supertokens-node` recipe overrides, session claim validators, refresh-route behavior.

## §6 CLOSING PRINCIPLE

The session cookie is the single source of identity verified server-side at every door (REST, WebSocket, voice) — keep tokens httpOnly, keep secrets server-side, keep the SDK the only refresh path, and never let a forgeable userId substitute for a verified session.
