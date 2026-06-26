# Architecture — Security branch (StudyHall)

> Branch authored at v6 against `founder-stage.md: self-use-mvp` → **MVP security mode**.
> Scope: auth flow end-to-end + session management + secrets handling + input validation +
> basic channel-level RBAC + WS/LiveKit connection auth + file-upload validation + the
> student privacy-controls module (feature 16) from a security lens. Anything heavier
> (full STRIDE, data-residency, consent architecture, M2M least-privilege, audit-log schema,
> advanced rate limiting) is **deferred to H2** — see `## Risk / open items`.

## Summary

StudyHall's MVP security posture rests on one identity provider and one trust boundary.
**SuperTokens (self-hosted on Railway — Core + its own Postgres, reachable only over the
Railway private network)** is the single source of truth for who a user is. Every other
surface — the NestJS REST API, the Socket.IO realtime layer, LiveKit voice/video token
issuance, and Railway Buckets pre-signed uploads — is a **relying party** that verifies a
SuperTokens-issued session before granting access. There is exactly one way to become
authenticated (a SuperTokens session) and every protected entry point re-verifies it
server-side; the client is never trusted for identity or authorization.

The session model is **JWT access token + rotating refresh token**, with the SPA using
SuperTokens' frontend SDK so that tokens live in **httpOnly, Secure, SameSite cookies**
(not `localStorage`) for the browser surface, and **short-lived JWTs passed in the WS
handshake / Bearer header** for the realtime and media surfaces that cannot rely on cookies
cleanly. Authorization is two-tier: SuperTokens answers *authentication* (valid session →
`userId`); StudyHall's own **server-side RBAC** answers *authorization* (is this `userId`
allowed to read/post in this channel, manage this server, issue this LiveKit token).

Secrets are platform-env-only and generated, never committed. Input is validated at every
boundary with **Zod schemas shared client↔server** via `@anatine/zod-nestjs`. File uploads
go through validated **pre-signed URLs to Railway Buckets** with type/size enforcement.

The deliberately small surface is the point: a self-use MVP earns its security from
*correctly wiring one identity provider into every door*, not from breadth of controls.

## Inventory

Security-relevant assets, boundaries, and controls in MVP scope.

### Identity & sessions
| Asset | Owner | MVP control |
|---|---|---|
| SuperTokens Core | Railway service (private network) | Reachable only via Railway private DNS; not publicly exposed; its own Postgres |
| Session (access JWT + refresh) | SuperTokens FE/BE SDK | httpOnly+Secure+SameSite cookies (browser); short-lived JWT in handshake/Bearer (WS/LiveKit) |
| `userId` claim | SuperTokens | Verified server-side on every protected request — never read from client-supplied body |
| Email verification state | SuperTokens EmailVerification recipe | Gate on verified-email before joining/posting (see Conventions) |

### Trust boundaries (where verification happens)
| Boundary | Entry point | What is verified |
|---|---|---|
| REST API | NestJS `verifySession()` guard | Valid SuperTokens session → `userId` on request context |
| Realtime | Socket.IO `io.use()` handshake middleware | Session/JWT verified on WS **upgrade**, before any namespace join |
| Voice/video | NestJS LiveKit-token endpoint | Session verified, then RBAC check, then a scoped LiveKit JWT is minted server-side |
| File upload | NestJS pre-sign endpoint | Session + RBAC + file metadata (type/size) validated before a pre-signed PUT URL is issued |

### Authorization model (RBAC, server-side)
| Object | Roles (MVP) | Enforced where |
|---|---|---|
| Server (guild) | owner, member | NestJS service-layer guard + DB membership row |
| Channel | derived from server role + channel-level grants (feature 10) | NestJS service-layer check per read/post action; mirrored on Socket.IO room join |
| Server settings (roles/members/ban) | owner only (owner safeguards) | NestJS guard; owner cannot be removed/demoted by non-owner |

### Validation surfaces
| Surface | Schema source | Mechanism |
|---|---|---|
| REST DTOs | `@studyhall/shared` Zod schemas | `@anatine/zod-nestjs` → NestJS DTO + pipe |
| Socket.IO event payloads | same shared Zod schemas | `schema.parse()` in the event handler before side effects |
| File metadata (name/type/size) | shared Zod schema | validated at pre-sign endpoint |
| Client forms | same shared Zod schemas | client-side parse for UX; **never** the authoritative check |

### Secrets (platform env vars only)
| Secret | Source | Where set |
|---|---|---|
| SuperTokens Core API key | generated (`openssl rand -base64 32`) | Railway env (Core + API services) |
| LiveKit API key/secret | LiveKit (self-host) or LiveKit Cloud console | Railway env (API service) |
| Railway Buckets / S3 credentials | Railway-issued | Railway env (API service) |
| Postgres connection strings | Railway-managed | Railway env (private network) |
| Resend API key (email — feature 1 verify + invites) | Resend console | Railway env (API service) |
| App-level signing secrets (invite codes, etc.) | generated | Railway env |

## Conventions

Binding rules for any wave that touches a security boundary.

1. **One identity, verified server-side at every door.** Never trust a `userId`, role,
   or membership claim from the client body, query, or socket payload. Derive identity only
   from the SuperTokens session/JWT verified at the boundary; derive authorization only from
   a server-side DB lookup.

2. **`verifySession()` guard on every protected REST route.** Public routes are an explicit
   allowlist (landing, auth endpoints, invite *preview*). Everything else carries the guard.
   Email-verification-gated actions (joining a server, posting) additionally check the
   EmailVerification claim.

3. **Authenticate the WS upgrade, not the first message.** Socket.IO uses an `io.use()`
   middleware that verifies the SuperTokens session/JWT during the **handshake** and attaches
   `userId` to `socket.data`. A socket that fails verification is rejected at upgrade; no
   namespace, room, or event handler ever runs for an unauthenticated socket. Re-check RBAC
   on every `room.join` (channel membership) — handshake auth proves *who*, not *where they
   may go*.

4. **LiveKit tokens are minted server-side, scoped, and short-lived.** The client never
   holds the LiveKit API secret and never mints its own token. Flow: client calls the NestJS
   LiveKit-token endpoint → guard verifies session → RBAC checks the user may enter that voice
   channel → server mints a LiveKit JWT scoped to exactly that room with a short TTL → returned
   to client. Room name is derived server-side from the channel, never accepted from the client.

5. **Validate at the boundary with shared Zod.** Every REST DTO and every Socket.IO event
   payload is parsed against a `@studyhall/shared` Zod schema before any side effect. The same
   schema is imported client-side for form UX, but the server parse is the authoritative gate.
   Reject on parse failure with a typed error; never coerce-and-continue.

6. **File uploads: validate metadata, then pre-sign; never proxy bytes through the API for
   trust.** Client requests an upload → server validates session + RBAC + (filename, MIME type
   against an allowlist, declared size against a cap) → server issues a single-use, expiring
   pre-signed PUT URL to Railway Buckets scoped to a server-chosen key. Enforce a size cap and
   a content-type allowlist (images + common doc types for MVP). Treat all stored files as
   untrusted on the way back out (serve attachments with `Content-Disposition` / correct
   `Content-Type`, never inline-execute).

7. **Secrets are generated and env-only.** Generate with `openssl rand -base64 32` (or
   `crypto.randomBytes`) and set via the Railway platform. Never commit a secret; never log a
   token, session, or key. `.env.example` carries names + placeholders only.

8. **Cookies for the browser, Bearer/handshake for the rest.** Browser REST traffic uses
   SuperTokens' httpOnly+Secure+SameSite cookie mode (CSRF handled by SuperTokens' anti-CSRF
   token for cookie-based sessions). Surfaces that can't ride cookies cleanly (WS handshake,
   LiveKit token request) use a short-lived JWT obtained from the session. Don't store session
   tokens in `localStorage`.

9. **Privacy controls are authorization rules, not just UI (feature 16).** "Who-can-DM",
   profile-field visibility, and account-data view are enforced server-side at the query that
   produces the data, not hidden client-side. See `## Stack-specific decisions`.

## Reusability principles

Patterns to build once and reuse across every wave so security stays consistent and cheap.

- **A single `AuthenticatedGuard` / `verifySession` wrapper** in the NestJS app, applied
  declaratively. New protected endpoints inherit it; you never re-implement session checks.
- **A single `requireMembership(userId, serverId)` / `requireChannelAccess(userId, channelId, action)`
  authorization helper** in the service layer. All RBAC decisions funnel through it so the
  policy lives in one place and is unit-testable. REST and Socket.IO both call it.
- **One Socket.IO handshake-auth middleware**, registered on every namespace. New namespaces
  (presence, typing, messaging) inherit upgrade-time auth for free.
- **One `mintLiveKitToken(userId, channelId)` server function** that is the *only* code path
  that touches the LiveKit secret. All voice features call it.
- **Shared Zod schemas in `@studyhall/shared`** are the single contract: import the same schema
  on client (UX), REST DTO (`@anatine/zod-nestjs`), and Socket.IO handler. Add a schema once;
  both sides stay in lockstep.
- **One `presignUpload(userId, context, fileMeta)` helper** that bundles RBAC + metadata
  validation + pre-sign. Every attachment/avatar flow routes through it.
- **A `requireVerifiedEmail` claim check** composed onto the gated actions, reused wherever
  verification is a precondition.

The reuse goal: every new feature gets identity, authz, validation, and upload safety by
*calling existing helpers*, not by writing new security code — which is what keeps a
self-use MVP from accumulating bespoke, untested auth paths.

## Cross-references

- `command-center/dev/stack-decisions.md` — LOCKED stack (SuperTokens self-hosted on Railway,
  NestJS, Vite+React SPA, Socket.IO, LiveKit, Railway Buckets, Drizzle/Postgres).
- `command-center/product/feature-list.md` — features 1 (auth), 6 (invites), 9 (attachments),
  10 (RBAC), 11 (member mgmt), 13 (voice/video), 16 (privacy controls); 24 (compliance, H2).
- `command-center/product/founder-stage.md` — `self-use-mvp`; the basis for MVP security mode
  and every H2 deferral below.
- `command-center/artifacts/user-journey-map.md` — auth pages (`/signup`, `/login`,
  `/verify`, `/forgot-password`, `/reset-password`), `/servers/:id/voice/:channelId` (LiveKit),
  `/servers/:id/settings` (RBAC), `/settings/privacy` (feature 16), `/invite/:code`.
- **Companion architecture branches (author later, this branch assumes them):**
  - *Modules/Services branch* — owns the offline sync engine; this branch only notes that the
    **outbox flush re-authenticates on reconnect** (a flushed message is re-validated and
    re-authorized server-side; offline composition does not bypass RBAC).
  - *DevOps branch* — owns Railway private-network topology, TLS termination, Sentry (scrub
    tokens), and the Redis decision (which is also where any future rate-limiting lands — H2).
  - *SDK branch* — confirms LiveKit self-host vs cloud and promotes Resend to MVP for
    verification + invite email.

## Stack-specific decisions

**SuperTokens recipes (MVP).** Use the **EmailPassword + EmailVerification + Session** recipes.
This covers the full feature-1 auth flow end-to-end:
- *Signup* → EmailPassword `signUp`; SuperTokens stores the password hash (Argon2/bcrypt — its
  default, we do not roll our own).
- *Email verify* → EmailVerification sends a tokenized link (via Resend) → `/verify` consumes it
  → claim flips. Gated actions check the verified claim.
- *Login* → EmailPassword `signIn` → Session created (cookies set).
- *Password reset* → EmailPassword `createResetPasswordToken` → emailed link → `/reset-password`
  → `resetPasswordUsingToken`. Reset invalidates existing sessions per SuperTokens default.
- *Session refresh* → SuperTokens FE SDK transparently calls the refresh endpoint on access-token
  expiry, **rotating** the refresh token; the SPA's interceptor handles 401→refresh→retry. We do
  not hand-roll refresh logic.

**SPA cookie-vs-header strategy.** Browser REST uses SuperTokens **cookie-based sessions**
(httpOnly + Secure + SameSite=Lax/Strict, anti-CSRF token) — the recommended mode for a
first-party SPA and the safest against XSS token theft. For the **non-cookie surfaces**
(Socket.IO handshake, LiveKit token request) the SPA obtains a **short-lived JWT** from the
session (SuperTokens' JWT feature / session access token) and presents it in the handshake
`auth` payload / `Authorization: Bearer`. Rationale: cookies don't ride cleanly through the
LiveKit SDK or cross-origin WS in all desktop/PWA contexts, so a scoped short-lived JWT is the
clean bridge — while the bulk of traffic keeps the XSS-resistant httpOnly cookie.

**Socket.IO auth wiring.** `io.use(async (socket, next) => { verify session/JWT from
socket.handshake → attach userId to socket.data → next() | next(err) })` on **every** namespace.
Verification happens at the **upgrade**, so an unauthenticated socket never reaches a handler.
`room.join(channel)` re-runs `requireChannelAccess` — handshake proves identity, the join proves
authorization. Presence/typing/messaging namespaces all inherit the same middleware.

**LiveKit token issuance.** The NestJS endpoint is the only minter. Sequence:
`verifySession → requireChannelAccess(userId, voiceChannelId, 'join') →
AccessToken(apiKey, apiSecret, { identity: userId, ttl: short }).addGrant({ roomJoin: true,
room: serverDerivedRoomName })`. The LiveKit secret lives only in API-service env. The client
receives only the scoped, expiring JWT — never the secret, never an unscoped token.

**Input validation bridge.** `@studyhall/shared` exports Zod schemas; `@anatine/zod-nestjs`
turns them into NestJS DTOs + validation pipes for REST. Socket.IO handlers `schema.parse()`
the event payload directly. One schema, both transports, plus client-side form UX from the
same import.

**File uploads.** Pre-signed PUT to Railway Buckets (S3-compatible). Server validates
(session, RBAC, MIME allowlist, size cap), generates a server-controlled object key, and issues
a single-use expiring URL. Downloads served with correct `Content-Type` and
`Content-Disposition` so an uploaded file can't be coerced into executing in another user's
browser. Avatars (feature 2) and message attachments (feature 9) share `presignUpload`.

**Privacy-controls module — security lens (feature 16, `/settings/privacy`).** MVP privacy is
three server-enforced authorization rules, not a compliance program:
- *Profile-field visibility* — visibility flags checked at the query that serves another user's
  profile; hidden fields are never sent over the wire, not merely hidden in the client.
- *Who-can-DM* — DMs are H2 (feature 21), so MVP stores the preference and enforces it at the
  (future) DM-create boundary; the setting surface exists now, the enforcement point lands with
  DMs. Documented so it isn't mistaken for a no-op.
- *Account-data view* — a read-only "your account data" view backed by a server endpoint scoped
  to the requesting session's own `userId` (a user can only ever fetch their own data).
Full data-export / data-delete / consent / audit-log is **feature 24 → H2** (see Risk).

## Risk / open items

**Explicitly deferred to H2 per `founder-stage.md: self-use-mvp` (MVP security mode).** These
are intentionally *not* built now; building them would over-engineer a single-user pre-validation
MVP. Each must be revisited when the app expands to external student cohorts or a paying
school/partner (which would also promote feature 24 from H2 to H1):

1. **Full STRIDE threat model** — MVP relies on the focused trust-boundary table in `## Inventory`
   rather than a complete per-component STRIDE decomposition. Cite: `self-use-mvp`.
2. **Data-residency matrix** — no jurisdiction/region mapping of where user data lives; single
   Railway region for MVP. Cite: `self-use-mvp`.
3. **Consent architecture** — no consent capture/versioning/withdrawal flows (part of feature
   24). Privacy stubs (`/privacy`, `/terms`) remain stubs. Cite: `self-use-mvp`.
4. **M2M least-privilege** — service-to-service auth currently leans on the Railway private
   network + shared env secrets; no per-service scoped credentials or workload identity yet.
   Cite: `self-use-mvp`.
5. **Audit-log schema** — no append-only security/audit event log (part of feature 24).
   Cite: `self-use-mvp`.
6. **Advanced rate limiting** — no per-user/per-IP throttling, brute-force lockout tuning beyond
   SuperTokens defaults, or abuse heuristics. Lands with the Redis decision in the DevOps branch.
   Cite: `self-use-mvp`.

**Open items to resolve in their owning branches (not security gaps, but security-adjacent
decisions this branch depends on):**
- LiveKit **self-host vs Cloud** affects where the LiveKit secret lives and the network trust
  boundary — resolved in the SDK branch.
- **Redis** introduction is the natural home for any future rate-limiting and for session/refresh
  scaling — flagged in the DevOps branch.
- **Resend** promotion to MVP is a hard dependency for email verification + invites (feature 1/6)
  — flagged in `stack-decisions.md` cascading updates; without it, the verify/reset flow can't
  complete.
- **Offline outbox + auth** — confirm with the Modules/Services branch that reconnect flush
  re-authenticates and re-authorizes each queued message server-side (no offline RBAC bypass).
