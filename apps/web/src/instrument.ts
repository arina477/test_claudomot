import * as Sentry from '@sentry/react';

// Browser SDK does NOT auto-read env vars — pass VITE_-prefixed vars explicitly
// (bare SENTRY_DSN is silently undefined in the Vite bundle — SDK doc gotcha #8).
// When VITE_SENTRY_DSN is unset, dsn resolves to undefined → SDK no-ops transparently
// (no events sent, no crash) — credential-independent build REQUIRED.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  // Tracing disabled — omit tracesSampleRate entirely (do NOT set 0).
  // browserTracingIntegration omitted — tracing is off.
  // replayIntegration omitted — records DOM mutations → could capture chat message
  // text (SDK doc gotcha #7; +50-90 KB bundle cost).
  // dataCollection key omitted — adding it (even {}) opts into permissive capture
  // for all categories (SDK doc gotcha #5). Conservative default = omit entirely.

  sendDefaultPii: false,

  // Defense-in-depth PII scrub: strip user identity fields and request body/cookies
  // before any event leaves the browser. Load-bearing per the PII contract
  // (AC: no student emails / message bodies / tokens).
  beforeSend(event) {
    if (event.user) {
      // biome-ignore lint/performance/noDelete: exactOptionalPropertyTypes — `= undefined` fails TS2412; delete is the correct removal semantics here
      delete event.user.email;
      // biome-ignore lint/performance/noDelete: exactOptionalPropertyTypes — same as above
      delete event.user.username;
      // biome-ignore lint/performance/noDelete: exactOptionalPropertyTypes — same as above
      delete event.user.ip_address;
    }
    if (event.request) {
      // biome-ignore lint/performance/noDelete: exactOptionalPropertyTypes — same as above
      delete event.request.data;
      // biome-ignore lint/performance/noDelete: exactOptionalPropertyTypes — same as above
      delete event.request.cookies;
    }
    return event;
  },
});
