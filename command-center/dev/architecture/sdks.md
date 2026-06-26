# Architecture Branch: SDKs / Third-party Integrations

branch: sdks
authored: 2026-06-26
stage: self-use-mvp
stack_lock: NestJS · Postgres/Drizzle · Socket.IO · LiveKit · SuperTokens · Railway · Resend

---

## Summary

StudyHall integrates seven external SDKs and services across the self-use-mvp horizon. Five are active at MVP (SuperTokens, LiveKit, Socket.IO, Railway Buckets / AWS S3 SDK, Resend); one is added at first deploy (Sentry); one is deferred to H2 (Stripe). The scope here is the integration contract for each — auth mechanism, rate limits, error handling, cost model, migration path, and credential ownership — not the deep API surface. Per-SDK deep docs are written on demand at B-block and stored at `command-center/dev/SDK-Docs/<Name>/<name>.md`.

**Credential ownership summary (founder must provision):**

| SDK | Credential type | Founder action required |
|-----|----------------|------------------------|
| SuperTokens Core | None — self-hosted; generates its own API key | Generate `SUPERTOKENS_API_KEY` at Railway service deploy |
| LiveKit | `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` | Railway self-host: auto-generated at LiveKit server deploy. LiveKit Cloud: account-issued from console |
| Socket.IO | None — library, no external account | No founder action |
| Railway Buckets | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_ENDPOINT_URL` | Provisioned automatically by Railway when Bucket resource is created; copied from Railway dashboard |
| Resend | `RESEND_API_KEY` | Account-issued from resend.com console — founder must create account and generate key |
| Stripe | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Account-issued — deferred to H2 |
| Sentry | `SENTRY_DSN` | Account-issued from sentry.io console — founder must create project at first deploy |

---

## Inventory

### 1. SuperTokens (self-hosted auth Core)

**Horizon:** MVP  
**NestJS module:** `AuthModule`  
**NPM packages:** `supertokens-node` (backend), `supertokens-auth-react` (frontend)

**What it provides:** Signup, login, email verification, password reset, JWT issuance, refresh token rotation, session revocation. StudyHall uses the `EmailPassword` + `Session` recipes. SuperTokens Core runs as a separate Railway service connected to its own Railway Postgres instance; `supertokens-node` in the NestJS backend communicates with Core over Railway's private network.

**Auth mechanism:** SuperTokens Core exposes an HTTP management API authenticated with `SUPERTOKENS_API_KEY` (set as env var on the Core Railway service). `supertokens-node` uses `connectionURI` + `apiKey` from env to connect to Core. Session tokens are httpOnly cookies — no `localStorage` token storage. The client SDK (`supertokens-auth-react`) attaches cookies on every request automatically.

**Env vars:**

| Var | Owner | Notes |
|-----|-------|-------|
| `SUPERTOKENS_CONNECTION_URI` | Set by deployer | Private-network URL of the Core Railway service (e.g. `http://supertokens.railway.internal:3567`) |
| `SUPERTOKENS_API_KEY` | Self-generated at Core deploy | Railway service env; do NOT put in `.env.example` — injected at deploy time |
| `SUPERTOKENS_COOKIE_DOMAIN` | Set by deployer | The Railway app domain (e.g. `.studyhall.up.railway.app`) |

**Rate limits:** SuperTokens Core has no built-in rate limiting for the management API; the NestJS throttler (`10 req/min` on auth routes) guards the public auth surface. Core imposes no hard API-key rate limit on private-network calls at self-hosted scale.

**Error-handling pattern:** `supertokens-node` throws typed errors (`SuperTokensError`). `AuthModule` wraps all SuperTokens SDK calls in try/catch and maps to NestJS `HttpException` with structured error codes. Errors from the `Session` recipe (invalid session, session expired) are surfaced as `401 UNAUTHORIZED` with code `SESSION_EXPIRED` or `INVALID_SESSION`. Password reset / email verification errors map to specific `400` codes per the error enum in `@studyhall/shared/errors.ts`.

**Cost model:** Self-hosted — no per-MAU or API-call fees. Infrastructure cost is the Railway service running Core + a second Postgres instance. Estimated Railway cost: ~$5–10/month for the Core service on the hobby plan at self-use-mvp scale.

**Migration path if deprecated:** SuperTokens is open-source. Migration to Auth.js (Next-Auth v5) or Clerk is the most likely path. The `AuthModule` wraps all SuperTokens SDK calls behind a NestJS service interface; no other module touches the SuperTokens SDK directly. Migration requires rewriting `AuthModule` only. The `users.id` FK pattern (matched to the auth provider's user UUID) is provider-agnostic — swapping providers requires a one-time UUID remapping migration if the new provider generates different IDs.

**Credential ownership:** `SUPERTOKENS_API_KEY` is self-generated during Core Railway service deploy — no founder console action required. `SUPERTOKENS_CONNECTION_URI` and `SUPERTOKENS_COOKIE_DOMAIN` are configuration values set by the deployer at Railway env var configuration time.

**Deep-doc location (authored on demand at B-block):** `command-center/dev/SDK-Docs/SuperTokens/supertokens.md`

---

### 2. LiveKit (WebRTC SFU for voice/video study rooms)

**Horizon:** MVP (feature 13)  
**NestJS module:** `VoiceModule`  
**NPM packages:** `livekit-server-sdk` (backend room management + token issuance), `@livekit/components-react` (frontend)

**What it provides:** WebRTC SFU for voice/video. `VoiceModule` does not run media — it creates rooms via the LiveKit Server SDK and issues short-lived JWT access tokens. Clients connect directly to LiveKit over WebRTC; the NestJS backend is never in the media path.

**Auth mechanism:** The LiveKit Server SDK authenticates to LiveKit using `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` (env vars). Room access tokens issued to clients are JWT signed with the API secret. Token payload includes participant identity (`userId`), room name, and grant permissions (can_publish, can_subscribe). Token TTL: 4 hours; the frontend refreshes before expiry by calling `POST /api/v1/channels/:id/voice/token`.

**Env vars:**

| Var | Owner | Notes |
|-----|-------|-------|
| `LIVEKIT_URL` | Set at deploy | WebSocket URL of LiveKit server (e.g. `wss://livekit.railway.internal` for self-host, or `wss://<project>.livekit.cloud` for cloud) |
| `LIVEKIT_API_KEY` | Depends on deployment path (see below) | Used by `livekit-server-sdk` |
| `LIVEKIT_API_SECRET` | Depends on deployment path (see below) | Used for JWT signing |

**Self-host vs LiveKit Cloud — decision gate (flag for v6b):**

| Path | How API key is obtained | Monthly cost at self-use-mvp | Railway ops overhead |
|------|------------------------|------------------------------|----------------------|
| **Railway self-hosted** | Auto-generated when LiveKit server Railway service is deployed | ~$5–15/month for the LiveKit Railway service | Requires configuring TURN/STUN (critical for NAT traversal), LiveKit server Railway service, port 7881 TCP exposure |
| **LiveKit Cloud free tier** | Account-issued from `cloud.livekit.io` console — founder must create account | Free up to 100 participant-minutes/month; ~$0.006/participant-minute after that | Zero ops — cloud-managed |

**Recommendation for self-use-mvp:** LiveKit Cloud free tier. A single-class cohort using voice rooms for study sessions will stay well under 100 participant-minutes/month for the first weeks of use. Self-hosting on Railway is the right move when the free tier is regularly exceeded or when a Railway-only cost model is required. The SDK call is identical across both paths; only `LIVEKIT_URL` changes. The decision should be confirmed at v6b when the founder's Railway plan is known.

**Rate limits:** LiveKit Cloud free tier: 100 concurrent participants, 100 participant-minutes/month. No hard API rate limits on the management API at this scale. Self-hosted: no limits beyond Railway service resource constraints.

**Error-handling pattern:** `livekit-server-sdk` throws `LivekitError` with a numeric code. `VoiceModule` catches and maps to NestJS exceptions:
- Room not found → `404 VOICE_ROOM_NOT_FOUND`
- Token issuance failure (bad API key/secret) → `500 VOICE_TOKEN_ERROR` (internal; do not surface API key details)
- Rate limit exceeded (cloud) → `429 VOICE_RATE_LIMIT`
- Any SDK error on `RoomServiceClient` → log at error level with structured fields, return `503 VOICE_SERVICE_UNAVAILABLE`

**Cost model:** LiveKit Cloud — free tier sufficient for MVP; pay-as-you-go thereafter (~$0.006/participant-minute for audio, ~$0.015 for video). Self-hosted on Railway — fixed monthly service cost regardless of usage; no per-minute fee.

**Migration path if deprecated:** LiveKit is open-source (Apache 2.0). The `VoiceModule` isolates all LiveKit SDK calls; migration to a different SFU (mediasoup, Janus) or to Daily.co / Whereby requires rewriting `VoiceModule` only. The `voice_sessions` table stores no LiveKit-internal IDs, only StudyHall-native `channel_id` + `user_id` pairs — schema migration is not required.

**Credential ownership:** Railway self-host — self-generated at service deploy. LiveKit Cloud — **founder must create account at `cloud.livekit.io` and provide `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET`**.

**Deep-doc location (authored on demand at B-block):** `command-center/dev/SDK-Docs/LiveKit/livekit.md`

---

### 3. Socket.IO (realtime transport)

**Horizon:** MVP (features 7, 8, 12, 14)  
**NestJS module:** `RealtimeGatewayModule`  
**NPM packages:** `socket.io` (server), `socket.io-client` (client)

**What it provides:** Bidirectional WebSocket transport for message delivery, presence, typing indicators, and outbox flush. Socket.IO is a library dependency, not a managed SaaS — there is no external account, no API key, and no cost model beyond infrastructure.

**Integration contract (server side):** `RealtimeGatewayModule` initializes a Socket.IO server attached to the NestJS HTTP server via `IoAdapter`. Three namespaces: `/messaging`, `/presence`, `/typing`. All three are authenticated via a connection middleware that validates the SuperTokens session cookie and attaches `socket.data.userId`. Unauthenticated connections are disconnected immediately.

**Integration contract (client side):** The React SPA initializes three `io()` connections (one per namespace) on application mount, with `withCredentials: true` (required for SuperTokens cookie forwarding). Connection lifecycle is managed by a React context provider. The offline-sync engine (feature 12) observes the `connect` / `disconnect` events on the `/messaging` socket to trigger outbox flush and catch-up fetch.

**Env vars:** None (Socket.IO is co-located with the NestJS server). CORS origin for Socket.IO is read from `ALLOWED_ORIGINS`, the same env var used for HTTP CORS.

**Rate limits:** `5 concurrent connections per user` enforced in the Socket.IO connection middleware (count checked against the `Map<userId, socketId[]>` presence store). No external rate limit API.

**Error-handling pattern:** Socket.IO errors are handled via the `error` event on the client and the `handleConnection` exception handler on the server gateway. Connection failures surface in the client's connection-state UI (feature 12 — "offline indicator"). Event-emission errors within the server gateway are caught per-listener; errors in `EventEmitter2` listeners are wrapped in try/catch per services.md R-6. No `socket.io` admin API or dashboard is used at MVP.

**Cost model:** None — open-source library. Infrastructure cost is embedded in the NestJS Railway service.

**Migration path:** The `RealtimeGatewayModule` is the single Socket.IO initialization point. Migration to native WebSockets or Ably/Pusher requires rewriting the gateway module and the client connection context only. All other modules publish via `EventEmitter2`; they do not import `socket.io` directly.

**Credential ownership:** None required.

**Deep-doc location (authored on demand at B-block):** `command-center/dev/SDK-Docs/SocketIO/socket-io.md`

---

### 4. Railway Buckets / AWS S3 SDK (object storage)

**Horizon:** MVP (features 2, 9)  
**NestJS module:** `FilesModule`  
**NPM packages:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

**What it provides:** S3-compatible object storage for avatars and message attachments. Railway Buckets is Tigris-backed and exposes a full S3-compatible API. `FilesModule` uses the AWS S3 SDK v3 to generate pre-signed PUT URLs (uploaded directly by the client — server is never in the file upload path) and to validate object existence post-upload.

**Auth mechanism:** Standard AWS Signature Version 4 (SigV4). The S3 client is initialized with `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_ENDPOINT_URL` (the Railway Buckets endpoint URL, e.g. `https://fly.storage.tigris.dev`). The bucket name is set via `STORAGE_BUCKET_NAME`. Pre-signed URLs are generated with a 15-minute expiry for uploads. No IAM roles or instance profiles — credential-based auth only.

**Env vars:**

| Var | Owner | Notes |
|-----|-------|-------|
| `AWS_ACCESS_KEY_ID` | Railway Bucket resource provisioning | Copied from Railway dashboard after Bucket is created |
| `AWS_SECRET_ACCESS_KEY` | Railway Bucket resource provisioning | Same |
| `AWS_ENDPOINT_URL` | Railway Bucket resource provisioning | Tigris endpoint URL |
| `AWS_REGION` | Set by deployer | Required by AWS SDK; use `auto` for Tigris |
| `STORAGE_BUCKET_NAME` | Set by deployer | The Railway Bucket name |
| `STORAGE_CDN_URL` | Set by deployer | CDN URL prefix for serving stored files (Railway Bucket public URL) |

**Rate limits:** Railway Buckets / Tigris: no documented hard rate limits at self-use-mvp scale. AWS SDK default retry behavior (3 retries, exponential backoff) is applied. File size limits are enforced at the application layer by `FilesModule`: 10 MB per attachment, 2 MB per avatar (validated in the pre-signed URL request handler before issuing the URL).

**Error-handling pattern:** AWS SDK v3 throws `S3ServiceException` subclasses. `FilesModule` catches:
- `NoSuchKey` on existence validation → `404 FILE_NOT_FOUND`
- `AccessDenied` → `500 STORAGE_ACCESS_ERROR` (log credential issue; do not surface details)
- Pre-signed URL generation failure → `500 STORAGE_PRESIGN_ERROR`
- Any unhandled `S3ServiceException` → `503 STORAGE_UNAVAILABLE`

Pre-signed URL expiry race (client attempts upload after the 15-minute window): the client receives a `403` from S3 directly and must re-request a URL from `FilesModule` — the React uploader handles this retry automatically.

**Cost model:** Railway Buckets pricing (Tigris-backed): egress is free within Railway's network. Storage: ~$0.021/GB-month. At self-use-mvp scale (single cohort, avatar + attachment uploads) total storage cost is negligible (< $1/month). CDN egress for public files is included.

**Migration path if deprecated:** The AWS S3 SDK v3 is provider-agnostic for S3-compatible endpoints. Migrating from Railway Buckets to Cloudflare R2, AWS S3, or Backblaze B2 requires changing `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `STORAGE_BUCKET_NAME` only. No code changes — the SDK call is identical.

**Credential ownership:** `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are provisioned automatically by Railway when a Bucket resource is created and attached to the project. **Founder copies them from the Railway dashboard** — no external account required.

**Deep-doc location (authored on demand at B-block):** `command-center/dev/SDK-Docs/RailwayBuckets/railway-buckets.md`

---

### 5. Resend (transactional email)

**Horizon:** MVP (features 1, 6, 14) — promoted from MVP-candidate  
**NestJS module:** `NotificationsModule`  
**NPM packages:** `resend`

**What it provides:** Transactional email delivery for:
- Feature 1: email verification on signup, password reset links
- Feature 6: server invite emails (when a member is invited by email address, not just invite link)
- Feature 14: assignment due-date reminder emails (daily cron from `AssignmentsModule` → `NotificationsModule` → Resend)

Resend is promoted to MVP status (confirmed in `stack-decisions.md` § "Resend promoted to MVP") because email verification is required for feature 1, which is a hard dependency of the auth flow. Without it, new users cannot verify their email address.

**Auth mechanism:** API key bearer token. The `resend` SDK is initialized with `RESEND_API_KEY`. All API calls are HTTPS to `api.resend.com`. No OAuth or webhook secret for sending; a webhook secret (`RESEND_WEBHOOK_SECRET`) is used only if delivery-failure webhooks are configured (optional at MVP).

**Env vars:**

| Var | Owner | Notes |
|-----|-------|-------|
| `RESEND_API_KEY` | **Account-issued — founder must provision** | From resend.com dashboard after account creation |
| `RESEND_FROM_ADDRESS` | Set by deployer | Verified sending domain, e.g. `noreply@studyhall.app` — domain must be verified in Resend dashboard |
| `RESEND_WEBHOOK_SECRET` | Optional — account-issued if webhooks enabled | Not required at MVP |

**Domain verification:** Resend requires DNS records (MX / SPF / DKIM) to be added to the sending domain. This is a founder action — the domain DNS is founder-controlled. At MVP with no custom domain, `onboarding@resend.dev` can be used for the first deploy; must be replaced before first external cohort.

**Rate limits:** Resend free plan: 100 emails/day, 3,000/month. Sufficient for self-use-mvp (single cohort, < 50 members). The paid `Pro` plan ($20/month) increases to 50,000/month. `NotificationsModule` should batch assignment reminder emails to minimize daily count; individual user emails (verify, reset, invite) are user-triggered and low-frequency.

**Error-handling pattern:** The `resend` SDK returns `{ data, error }` — no thrown exceptions. `NotificationsModule` checks `error !== null` on every call:
- `{ error: { name: 'validation_error' } }` → log warning + do not retry (bad address; surface to the admin console at H2)
- `{ error: { name: 'rate_limit_exceeded' } }` → log error + enqueue for retry after 1 hour (in-memory retry at MVP; BullMQ at H2)
- `{ error: { name: 'internal_server_error' } }` → log error + retry up to 3 times with exponential backoff
- Email delivery failures (bounces, spam) → handled via Resend webhooks (optional at MVP; recommended before external cohort)

Email sends are **fire-and-forget for non-critical paths** (assignment reminders). For auth-critical emails (verification, password reset), the SuperTokens Core handles email delivery internally via its own SMTP/Resend integration — see SuperTokens docs for configuring an email provider on Core. `NotificationsModule` handles only StudyHall-native notification emails (invites, reminders).

**Cost model:** Free tier for MVP. Pro plan at $20/month if volume exceeds 3,000 emails/month — unlikely at self-use-mvp.

**Migration path if deprecated:** The `resend` SDK wraps a single HTTP API. Migration to SendGrid, Postmark, or AWS SES requires replacing the `resend` package with the target SDK and updating `NotificationsModule`'s email-dispatch service only. Email templates are authored as React components using `@react-email/components`; those are provider-agnostic and migrate unchanged.

**Credential ownership:** `RESEND_API_KEY` is **account-issued — founder must create a Resend account at resend.com and generate an API key**. `RESEND_FROM_ADDRESS` requires domain DNS verification (founder action).

**Deep-doc location (authored on demand at B-block):** `command-center/dev/SDK-Docs/Resend/resend.md`

---

### 6. Stripe (payments)

**Horizon:** H2 (feature 22 — freemium billing) — deferred  
**NestJS module:** (not yet created — will be `BillingModule` at H2)  
**NPM packages:** `stripe` (backend), `@stripe/stripe-js` + `@stripe/react-stripe-js` (frontend) — not installed until H2

**What it provides:** Subscription billing for the freemium model (feature 22). Planned scope at H2: server-level paid tiers (storage quota, call participant limits, admin tools). The exact tier structure is undefined at self-use-mvp stage.

**Auth mechanism:** API key bearer token (`STRIPE_SECRET_KEY`). Webhook signature verification using `STRIPE_WEBHOOK_SECRET`. The Stripe Node SDK is initialized with the secret key; webhook handlers use `stripe.webhooks.constructEvent()` with the webhook secret to verify payload signatures.

**Env vars (H2 only — not in `.env.example` until H2 milestone):**

| Var | Owner | Notes |
|-----|-------|-------|
| `STRIPE_SECRET_KEY` | **Account-issued — founder must provision** | From Stripe dashboard |
| `STRIPE_PUBLISHABLE_KEY` | **Account-issued** | Used by frontend Stripe.js |
| `STRIPE_WEBHOOK_SECRET` | **Account-issued** | From Stripe webhook endpoint registration |
| `STRIPE_PRICE_ID_*` | Set by deployer | One per billing tier; created in Stripe dashboard |

**Rate limits:** Stripe API: 100 reads/second, 100 writes/second in live mode. Entirely sufficient for any StudyHall scale.

**Error-handling pattern:** At H2, the Stripe Node SDK throws `Stripe.errors.StripeError` subclasses. Standard pattern: catch `StripeCardError` (decline — surface to user), `StripeInvalidRequestError` (bad params — log + 400), `StripeAuthenticationError` (bad key — log + alert), `StripeRateLimitError` (backoff + retry). Webhook endpoint must return `200` within 30 seconds or Stripe retries; idempotent webhook handlers are mandatory.

**Cost model:** Stripe charges 2.9% + $0.30 per successful card transaction. No monthly platform fee. Applicable only when paid tiers are live (H2).

**Migration path if deprecated:** Stripe has strong market position; migration is unlikely but possible to Paddle, Lemon Squeezy, or RevenueCat. The `BillingModule` (H2) should isolate all Stripe SDK calls behind a `PaymentService` interface — swap the service implementation, not the whole module.

**Credential ownership:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are all **account-issued from the Stripe dashboard — founder must provision at H2 milestone kickoff**.

**Deep-doc location (authored on demand at H2 B-block):** `command-center/dev/SDK-Docs/Stripe/stripe.md`

---

### 7. Sentry (error tracking)

**Horizon:** Add at first deploy  
**NestJS module:** Integrated at `AppModule` bootstrap level (not a feature module)  
**NPM packages:** `@sentry/nestjs`, `@sentry/react` (frontend)

**What it provides:** Exception capture, error grouping, stack traces with source maps, performance tracing, and alerting. Added at first Railway deploy — not during local development, but before the first real user session (i.e., before the founder uses the deployed app on Railway).

**Auth mechanism:** DSN (Data Source Name) — a project-specific URL issued by Sentry. The DSN contains the Sentry project key and endpoint. No separate API key or secret for basic error reporting. The `@sentry/nestjs` SDK initializes with the DSN and automatically captures unhandled exceptions and promise rejections. The `@sentry/react` SDK captures client-side errors and React render errors via `Sentry.init()`.

**Env vars:**

| Var | Owner | Notes |
|-----|-------|-------|
| `SENTRY_DSN` | **Account-issued — founder must provision** | From sentry.io project settings |
| `SENTRY_ENVIRONMENT` | Set by deployer | `production` on Railway; `development` locally (Sentry disabled locally — only active in deployed environments) |
| `SENTRY_RELEASE` | Set by CI at build time | Git SHA or tag; enables source map association |

**Sentry is disabled in local development.** `Sentry.init()` is called conditionally: only when `SENTRY_DSN` is set and `NODE_ENV !== 'test'`. This prevents test noise and avoids sending local errors to the production project.

**Rate limits:** Sentry free plan: 5,000 errors/month, 10,000 performance transactions/month. Sufficient for self-use-mvp. The Developer plan ($26/month) increases limits significantly if needed.

**Error-handling pattern:** `@sentry/nestjs` integrates with the NestJS exception filter. Unhandled exceptions are captured automatically. For structured, intentional captures (e.g., a caught error that is handled but should still be tracked), use `Sentry.captureException(err, { extra: { userId, traceId } })`. PII policy: user `id` (UUID) may be attached to Sentry events; email addresses must NOT be attached (GDPR / privacy posture). Set `Sentry.setUser({ id: userId })` only — no `email`, no `username`.

**Cost model:** Free plan for MVP. No credit card required for the free tier.

**Migration path if deprecated:** Sentry is the dominant player; migration is unlikely. If needed: Axiom, Highlight.run, or Datadog APM. The Sentry SDK is wrapped in a thin logger utility in the NestJS app — `src/common/logger/sentry.logger.ts` — so migration touches one file.

**Credential ownership:** `SENTRY_DSN` is **account-issued — founder must create a Sentry project at sentry.io and copy the DSN**. This is a deploy-time action (before first Railway deployment), not a build-time action.

**Deep-doc location (authored on demand at B-block):** `command-center/dev/SDK-Docs/Sentry/sentry.md`

---

## Conventions

**One module owns one SDK.** No SDK client is initialized in more than one NestJS module. The owning module is the sole import point for the SDK package and holds the only instance of the client. Other modules that need SDK functionality call the owning module's exported service.

| SDK | Owning module | Exported service |
|-----|--------------|-----------------|
| SuperTokens | `AuthModule` | `AuthService`, `JwtAuthGuard`, `CurrentUser` decorator |
| LiveKit | `VoiceModule` | `VoiceTokenService` |
| Socket.IO | `RealtimeGatewayModule` | (emits via `EventEmitter2` — not exported as a service) |
| AWS S3 / Railway Buckets | `FilesModule` | `FilesService` (pre-signed URL issuance + confirmation) |
| Resend | `NotificationsModule` | `EmailService` |
| Stripe | `BillingModule` (H2) | `PaymentService` (H2) |
| Sentry | `AppModule` (global init) | (side-effectful init; no exported service) |

**SDK clients are NestJS providers.** Each SDK client is instantiated as a NestJS `@Injectable()` provider inside its owning module, initialized with env vars read through NestJS `ConfigService`. This ensures clean injection, testability (mock the provider in unit tests), and single initialization per process lifecycle.

**Env vars follow the pattern `<SDK_NAME>_<VAR>`** (e.g., `LIVEKIT_API_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`). The AWS SDK uses the conventional `AWS_*` prefix (required by the SDK itself).

**All SDK env vars are listed in `.env.example`** with placeholder values and comments indicating whether they are self-generated or account-issued. `.env.example` is committed; `.env` is gitignored. The `.env.example` is populated at v6b per `stack-decisions.md` § "Cascading updates".

**SDK version pinning.** All SDK packages are pinned to exact versions (no `^` or `~` in `package.json`) for MVP. Version bumps require an explicit PR and a re-read of the SDK's CHANGELOG. This is enforced by the Turborepo root `package.json` `overrides` field.

---

## Reusability principles

1. **SDK clients are injected, never imported directly outside the owning module.** If `MessagingModule` needs to issue a pre-signed URL, it calls `FilesService.getUploadUrl()` — it does not import `@aws-sdk/client-s3` itself. This is the enforcement mechanism for the "one module owns one SDK" convention.

2. **Error mapping happens at the SDK boundary, not at the call site.** Each owning module's service catches SDK-native errors (e.g., `S3ServiceException`, `LivekitError`) and translates them to StudyHall error codes (`@studyhall/shared/errors.ts`). Callers of `FilesService` or `VoiceTokenService` receive typed StudyHall errors, never SDK-internal types. This keeps SDK error shapes from leaking into business logic.

3. **Auth-critical email delivery is delegated to SuperTokens Core, not `NotificationsModule`.** SuperTokens Core handles verification and password-reset emails via its own email provider configuration. `NotificationsModule` / Resend handles only StudyHall-native notification emails (invites, reminders). This separates the auth-critical path from the notification path.

4. **Pre-signed URL generation is the only server-to-storage interaction at runtime.** The NestJS server never streams binary data through itself. Clients upload directly to Railway Buckets using the pre-signed URL; the server validates existence post-upload. This keeps the NestJS Railway service lightweight and avoids memory pressure from file buffers.

5. **Feature-flag new SDKs before their owning module is complete.** Stripe (`BillingModule`) and any H2 SDK should be gated behind a feature flag in `ConfigService` so a partial deploy does not accidentally expose incomplete billing logic. The flag is `FEATURE_BILLING_ENABLED=false` in `.env.example`; the `BillingModule` is registered conditionally in `AppModule`.

---

## Cross-references

| Topic | File |
|-------|------|
| Stack lock (locked SDK choices) | `command-center/dev/stack-decisions.md` |
| Services architecture (owning module definitions) | `command-center/dev/architecture/services.md` |
| Database architecture (tables SDK data touches) | `command-center/dev/architecture/databases.md` |
| Feature list (feature numbers referenced above) | `command-center/product/feature-list.md` |
| SDK research process + per-SDK deep-doc template | `claudomat-brain/rules/external-sdk-integration-rules.md` |
| Per-SDK deep docs (authored at B-block, on demand) | `command-center/dev/SDK-Docs/<Name>/<name>.md` |
| SDK registry | `command-center/dev/SDK-Docs/registry.md` |
| DevOps (env var injection, Railway service topology) | `command-center/dev/architecture/devops.md` (to be authored) |
| Security architecture (auth flow, CSRF, cookie policy) | `command-center/dev/architecture/security.md` |

---

## Stack-specific decisions

**SuperTokens session mode is cookie-based (httpOnly), not Bearer token.** This is a security choice documented in `services.md` § "Stack-specific decisions". It has a cross-SDK implication: Socket.IO connections must be made with `withCredentials: true` so the browser includes the SuperTokens session cookie on the WebSocket upgrade request. The Socket.IO connection middleware then validates the cookie against SuperTokens Core.

**LiveKit self-host vs cloud is deferred to v6b.** The `VoiceModule` implementation is identical for both paths — only `LIVEKIT_URL` changes. The v6b `.env.example` pass will set the placeholder to the Railway Cloud format as the default, with a comment noting the Railway self-host alternative. The LiveKit SDK doc (`command-center/dev/SDK-Docs/LiveKit/livekit.md`) must document both URL formats and their TURN/STUN implications when authored at B-block.

**SuperTokens handles its own email delivery for auth-critical flows.** When configuring SuperTokens Core on Railway, the Core service must be configured with either a built-in SMTP provider or Resend as the email delivery backend. This is a SuperTokens Core configuration step (not a `supertokens-node` code change) and is documented in the SuperTokens SDK doc at authoring time. The `RESEND_API_KEY` may be shared between SuperTokens Core's email config and `NotificationsModule` — or a separate Resend API key may be provisioned per service (two separate Resend API keys is preferred for cost attribution clarity).

**AWS SDK v3 is used, not v2.** Railway Buckets / Tigris is fully compatible with AWS SDK v3's modular client (`@aws-sdk/client-s3`) and presigner (`@aws-sdk/s3-request-presigner`). Do not use the monolithic `aws-sdk` v2 package — it is in maintenance mode and the bundle size is significantly larger. The v3 client is initialized with explicit `endpoint` override for Tigris compatibility.

**Sentry source maps are uploaded from CI, not from the build output directory.** The Sentry Vite plugin (`@sentry/vite-plugin`) is added to `apps/web/vite.config.ts` and uploads source maps during the CI build using `SENTRY_AUTH_TOKEN` (a CI-only secret, separate from `SENTRY_DSN`). Source maps are NOT committed to the repo and are NOT served publicly. The `SENTRY_AUTH_TOKEN` is set only in GitHub Actions secrets.

---

## Risk / open items

| ID | Item | Severity | Resolution point |
|----|------|----------|-----------------|
| R-SDK-1 | **LiveKit self-host vs cloud decision pending.** Self-hosting adds TURN/STUN configuration complexity on Railway; LiveKit Cloud adds per-minute cost and an account-issued credential. Decision gate: v6b `.env.example` pass. Default to LiveKit Cloud free tier for MVP unless founder specifies otherwise. | Medium | v6b |
| R-SDK-2 | **Resend domain verification is a founder DNS action.** Before the first deployed session, the founder must add SPF/DKIM/MX records for the sending domain. If no custom domain is ready at MVP, `onboarding@resend.dev` can be used as a temporary sending address, but it should not be used for external cohort onboarding. | Medium | At first Railway deploy |
| R-SDK-3 | **SuperTokens Core email delivery configuration.** SuperTokens Core must be configured with an email provider (Resend or SMTP) for email verification and password reset to work. This is a Core-side configuration step separate from the `supertokens-node` backend code. Documented in the SuperTokens deep-doc at B-block authoring. | High (blocks feature 1) | B-block for `AuthModule` |
| R-SDK-4 | **Sentry PII policy — no emails in error events.** The `Sentry.setUser()` call must include only `id` (UUID), never `email` or `username`. This must be enforced at code review for every `Sentry.captureException` call that includes user context. A lint rule or custom ESLint plugin is the H2 enforcement mechanism. | Medium | Enforced at B-6 code review |
| R-SDK-5 | **AWS SDK v3 `endpoint` override required for Tigris.** The Tigris S3-compatible endpoint requires the `endpoint` option to be set on `S3Client` initialization; without it the SDK defaults to AWS regional endpoints and requests fail. This is a known gotcha — documented in the Railway Buckets SDK doc at B-block. | Low (known, easy fix) | B-block for `FilesModule` |
| R-SDK-6 | **Stripe not installed until H2.** The `stripe` package must not appear in any `package.json` until the H2 `BillingModule` milestone. Accidental early installation (e.g. from a copy-paste) should be caught by the B-0 dep audit. The CI `pnpm audit` will not flag it as a security issue, but the architecture review gate (B-6) should reject any `stripe` import outside `BillingModule`. | Low | H2 milestone kickoff |
| R-SDK-7 | **Socket.IO in-memory presence store is not durable across Railway restarts.** Documented in services.md R-1. Restated here because it affects the Socket.IO integration contract: after a Railway service restart, all presence state is lost and clients must reconnect to re-establish presence. The reconnect flow (feature 12 offline sync) handles this transparently for the message channel, but presence indicators will flicker on restart. Acceptable at self-use-mvp. | Low (MVP) | H2 Redis adapter |
| R-SDK-8 | **Two Resend API keys vs one for SuperTokens Core + NotificationsModule.** Using a single key simplifies credential management but conflates auth-critical email delivery with notification email delivery in Resend's activity log. Using two keys (one for SuperTokens Core, one for `NotificationsModule`) improves cost attribution and makes it easier to rotate one without affecting the other. Recommend two separate keys; final decision at B-block for `AuthModule`. | Low | B-block `AuthModule` |
