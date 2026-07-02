# Sentry Reference

**Last verified:** 2026-07-02
**Official docs (NestJS):** https://docs.sentry.io/platforms/javascript/guides/nestjs/
**Official docs (React):** https://docs.sentry.io/platforms/javascript/guides/react/
**GitHub:** https://github.com/getsentry/sentry-javascript
**Installed version:** `@sentry/nestjs@^10.63.0` · `@sentry/react@^10.63.0`
**Install location:** `apps/api` (`@sentry/nestjs` + subpath `@sentry/nestjs/setup`) · `apps/web` (`@sentry/react`)

---

## Official API Surface

### `@sentry/nestjs` (server)
- `Sentry.init(options): void` — call ONCE from `apps/api/src/instrument.ts`, imported as the FIRST line of `main.ts` (before NestFactory / any other import). v8+ uses OpenTelemetry auto-instrumentation; init-after-import = silently no per-request spans.
- `Sentry.captureException(err, ctx?)`, `Sentry.captureMessage(msg, level?)`, `Sentry.setUser(user|null)`, `Sentry.setTag`, `Sentry.setContext`, `Sentry.flush(timeout?)`, `Sentry.close(timeout?)`.
- `@SentryExceptionCaptured()` (from `@sentry/nestjs`) — method decorator for the `catch()` of an EXISTING custom global `@Catch()` filter. **USE THIS for StudyHall** — the app already has `SupertokensExceptionFilter` (apps/api/src/auth/auth.exception.filter.ts). Decorate its `catch()` so Sentry captures without a competing filter.
- `SentryModule.forRoot()` (from `@sentry/nestjs/setup`) — add to `AppModule.imports`; registers per-request tracing interceptor.
- `SentryGlobalFilter` (from `@sentry/nestjs/setup`) — only when NO custom catch-all filter exists. **Do NOT add for StudyHall** (would compete with SupertokensExceptionFilter; use the decorator instead). Note: it does NOT capture `HttpException` (401/404/422 = control flow, not bugs).

### `@sentry/react` (browser)
- `Sentry.init(options)` — before `createRoot`. Browser SDK does NOT auto-read env vars → pass `dsn: import.meta.env.VITE_SENTRY_DSN` explicitly.
- `Sentry.ErrorBoundary` component (React 18) + `Sentry.withErrorBoundary(Comp, opts)` HOC. Props: `fallback`, `onError`, `beforeCapture`, `showDialog`.
- Default integrations auto-on (globalHandlers window.onerror/onunhandledrejection, breadcrumbs [URL+status, NOT bodies], httpContext, dedupe, inboundFilters, linkedErrors).
- NON-default (omit unless needed): `browserTracingIntegration()` (needs tracesSampleRate>0); **`replayIntegration()` — DO NOT ADD** (records DOM mutations → could capture chat message text; +50-90KB).

### Constructor options (key)
| Option | Default | Notes |
|---|---|---|
| `dsn` | `undefined` | Node auto-reads `process.env.SENTRY_DSN`; browser pass `import.meta.env.VITE_SENTRY_DSN`. Absent → safe no-op (no events, no crash). |
| `environment` | `'production'` | Node auto-reads `SENTRY_ENVIRONMENT`; browser pass `import.meta.env.MODE`. |
| `tracesSampleRate` | `undefined` (off) | OMIT to disable tracing (do not set 0). |
| `sampleRate` | `1.0` | error capture rate. |
| `sendDefaultPii` | `false` | deprecated v10 / removed v11. Never set true. Conservative default: no user identity/bodies/cookies. |
| `dataCollection` | absent | **Adding the key (even `{}`) opts INTO permissive defaults for ALL categories** — official React Quick Start pitfall. Prefer omitting the key entirely. If used: `userInfo:false, cookies:false, httpBodies:[]` (array, not `false`). |
| `beforeSend(event, hint) => Event\|null\|Promise` | — | fires for error/message events. Return null to drop. Defense-in-depth PII scrub. |

## Runtime literals
| Category | Value | Notes |
|---|---|---|
| Env — Node auto-read | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE` | from `process.env` when option omitted. |
| Env — browser (NOT auto-read) | `VITE_SENTRY_DSN` | Vite only exposes `VITE_`-prefixed via `import.meta.env`. `SENTRY_DSN` is silently `undefined` in the bundle. |
| Env — build-time only | `SENTRY_AUTH_TOKEN` | `@sentry/vite-plugin` source-map upload; NOT read at runtime. |
| DSN format | `https://<pubkey>@o<org>.ingest.sentry.io/<project>` | |
| Cookies | N/A — verified SDK does not set/read cookies | |
| JWT/JWE claims | N/A — verified SDK does not own | |
| Headers (tracing) | `sentry-trace`, `baggage` | only injected into outbound reqs when tracing enabled + target matches. |
| Header denylist (built-in) | values in headers named `auth`/`token`/`password`/`secret` → `[Filtered]` | |
| Error classes | N/A — `SentryError` internal only, never thrown to app | |
| `beforeSend` sig | `(event, hint) => Event\|null\|PromiseLike<Event\|null>` | `hint.originalException` = raw thrown value. |

## PII contract (load-bearing — AC: no student emails / message bodies / tokens)
- Conservative defaults (no `dataCollection` key, `sendDefaultPii:false`): NO user email/username/id/ip, NO request/response bodies, NO cookies, NO LLM content.
- Always captured (cannot disable w/o dropping event): request URL (scheme+host+path), error msg + type + stack (paths/lines/code context), breadcrumbs (console text, nav, XHR/fetch URL+status — NOT bodies), UA fingerprint, headers (auth/token/password/secret values `[Filtered]`).
- **StudyHall config = omit `dataCollection` + `sendDefaultPii:false` + `beforeSend` defense-in-depth:**
  ```ts
  beforeSend(event) {
    if (event.user) { delete event.user.email; delete event.user.username; delete event.user.ip_address; }
    if (event.request) { delete event.request.data; delete event.request.cookies; }
    return event;
  }
  ```

## No-op when DSN unset (credential-independent build)
- Node: `SENTRY_DSN` absent → no events, no crash (OTel hooks still install, minimal overhead). For zero overhead in tests: `if (process.env.NODE_ENV !== 'test') Sentry.init(...)`.
- Browser: `dsn: import.meta.env.VITE_SENTRY_DSN` unset → `undefined` → no events, no crash.

## Platform Compatibility (Railway)
- **Node (apps/api):** min Node 18.0.0, recommend 18.19.0+/20+ for full OTel coverage. NestJS peer `^8|9|10|11` (StudyHall v10 OK). CJS default → `import './instrument'` compiles to sync `require`, hooks install first; no `--import` flag needed. `@opentelemetry/api` bundled (no separate install). Railway env: `SENTRY_DSN`, `SENTRY_ENVIRONMENT=production`. Graceful shutdown: `await Sentry.close(2000)` on SIGTERM.
- **Vite React (apps/web):** MUST use `VITE_SENTRY_DSN` prefix in Railway web-service env. Core bundle ~28-35KB gz (no replay/tracing). Source maps optional via `@sentry/vite-plugin` (dev dep, plugin LAST in `plugins[]`, `SENTRY_AUTH_TOKEN` build-env only).

## Known Gotchas (top)
1. NestJS: `import './instrument'` MUST be first statement in main.ts (before any other import) or per-request spans silently absent.
2. `SentryModule`/`SentryGlobalFilter` come from `@sentry/nestjs/setup` (subpath), NOT `@sentry/nestjs`.
3. StudyHall has a custom global filter → use `@SentryExceptionCaptured()` on `SupertokensExceptionFilter.catch()`; do NOT add `SentryGlobalFilter`.
4. `SentryGlobalFilter` skips `HttpException` (control flow).
5. `dataCollection: {}` = permissive-all (React Quick Start pitfall) → omit the key.
6. `httpBodies` disable = `[]` array, not `false`.
7. `replayIntegration` (not default) must stay omitted (DOM chat capture).
8. `VITE_SENTRY_DSN` prefix required; bare `SENTRY_DSN` invisible in browser bundle.
9. `sendDefaultPii` deprecated v10 / removed v11.

## Documentation Links
- NestJS: https://docs.sentry.io/platforms/javascript/guides/nestjs/
- React: https://docs.sentry.io/platforms/javascript/guides/react/
- Options: https://docs.sentry.io/platforms/javascript/configuration/options/
- Filtering/beforeSend: https://docs.sentry.io/platforms/javascript/configuration/filtering/
- Data Collected: https://docs.sentry.io/platforms/javascript/data-management/data-collected/
- v9→v10 migration: https://docs.sentry.io/platforms/javascript/migration/v9-to-v10/

---

## Integration-Specific Findings
*(filled at L-1 after implementation)*
### Our adapter patterns
### Env var configuration on our platforms
### Bugs we hit and how we solved them
### What differed from the official docs
