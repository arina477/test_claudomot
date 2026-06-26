# Research Brief — Executor Sub-Agent for SuperTokens self-hosted auth integration

You are a research analyst preparing a knowledge brief for a Claude sub-agent that will EXECUTE SuperTokens self-hosted authentication work (build artifacts: code, queries, migrations, configs) in an autonomous SDLC pipeline. Output is consumed by an automated distillation pass that extracts five fixed sections. Sections missing from your output will fail distillation.

## Project Context
- Backend: NestJS
- Database: Postgres 16
- Frontend: Vite + React
- Deploy: railway
- Scale: self-use-mvp — single Railway modular-monolith NestJS service, one Postgres instance, SuperTokens Core as a separate Railway service on the private network with its own Postgres; single study cohort under ~30-50 concurrent users.
- SDKs: SuperTokens Node SDK (`supertokens-node`) backend, `supertokens-auth-react` frontend; alongside Socket.IO, LiveKit, Railway Buckets / AWS S3, Resend.
- Product: A dark-themed desktop study app for remote students — group servers, real-time chat, and drop-in voice/video study rooms with offline-first reliability — built to displace Discord for coursework.

## Domain
SuperTokens self-hosted auth Core on Railway: signup / login / email-verify / password-reset / session JWT + refresh, SameSite=Lax httpOnly cookie auth for the browser, Socket.IO WS-upgrade authentication and LiveKit access-token issuance bridged via the SuperTokens session. The `AuthModule` in NestJS wraps `supertokens-node` (EmailPassword + EmailVerification + Session recipes) behind a service interface; no other module imports the SDK. SuperTokens Core runs self-hosted on Railway over the private network (`connectionURI` + `apiKey`), with Core configured to send verification + password-reset email via Resend/SMTP. The browser uses httpOnly+Secure+SameSite=Lax cookies (Lax chosen so invite-link → login → auto-redeem top-level navigation works); WS connections use `withCredentials: true` with a short-lived JWT fallback for PWA/cross-origin; LiveKit room tokens are minted server-side after a session + RBAC check.

## Role Focus
Weight research toward: concrete patterns the agent will write for `supertokens-node` + NestJS integration; the `verifySession()` guard pattern, the SuperTokens NestJS middleware/`supertokens.middleware()` mounting order, recipe initialization, override APIs, session claim validators, cookie + CSRF/anti-CSRF behavior, refresh-token rotation, the `/auth/session/refresh` flow, error-handling for `SuperTokensError`, and the Socket.IO `io.use()` upgrade-time session validation. Cover version-specific gotchas across `supertokens-node` (current major), the self-hosted Core Docker image config, and `supertokens-auth-react` (current major) on Vite/React 19. Emphasize cookie-domain/SameSite/Secure correctness, CORS with credentials, and the LiveKit-token-bridge pattern.

De-prioritize: architecture/strategy guidance; verification techniques; marketing or use-case overviews.

## Required Output

Five sections, in order, each clearly headed (`§1`..`§5`). `§6` optional (overflow only).

### §1 KNOWLEDGE BASELINE — 200-400 words
What an expert must know to integrate self-hosted SuperTokens with NestJS + Vite/React + Socket.IO + LiveKit well in this stack. No history, no marketing, no filler.

### §2 ALWAYS-DO RULES — 12-25 rules; HARD CAP 25
Per rule:
- `<Single-sentence rule.>`
  Why: `<Single-sentence reason — concrete failure mode prevented.>`
  Source: `<link>`

Each rule must be enforceable by an automated agent reviewing code. Soft / aspirational rules rejected.

`[STABLE]` marker (mandatory): for rules sourced from material >5 years old that describe fundamentals which have not changed (e.g., session-fixation prevention, httpOnly cookie rationale, CSRF defense for cookie-auth), prefix the rule with `[STABLE] ` (with the trailing space).

### §3 NEVER-DO RULES — 12-25 rules; HARD CAP 25
Same format as §2 (including `[STABLE]`). Failure modes production auth systems actually hit (token in localStorage, missing email-verification gate, wrong SameSite, CORS without credentials, refresh-loop, middleware order), not theoretical risks. Each rule must answer: "what bug or breach does this prevent?"

### §4 ANTI-PATTERNS TO FLAG — 8-15 patterns
Per pattern:
- Name: `<short>`
  Description: `<1 line>`
  Example: `<code snippet OR concrete scenario>`
  Detection signal: `<how the agent recognizes it in code/config>`

### §5 AUTHORITATIVE REFERENCES — 10-20 sources
Tag each: `[PRACTITIONER]` | `[BOOK]` | `[OFFICIAL]` | `[VENDOR]`
Format: `[TAG] <link or title> — <what this covers>`
Exclude: SEO content, content farms, AI summaries, sources >5 years old for fast-moving tech.

### §6 ADDITIONAL — optional, only if §2 or §3 hit the 25 cap

## Source Quality
Practitioner content that captures HOW AUTH BREAKS in production is the highest-value signal. Prioritize: SuperTokens official docs + GitHub (`supertokens-node`, `supertokens-core`, NestJS example), SuperTokens Discord/blog, OWASP Session Management + Authentication cheat sheets, NestJS auth docs, and write-ups on cookie-based session auth + WebSocket auth + LiveKit server-token issuance.

## Recency
Default last 3 years. Older sources allowed only when the rule they support is marked `[STABLE]`.

## Length
6,000-12,000 words total.

## Deliverable
Single markdown document, headed `§1`..`§5` (and `§6` if used), formatted exactly as specified. No preamble, no closing summary, no human-facing commentary — consumed by an automated pass.
