import * as Sentry from '@sentry/nestjs';

// Guard: do not init Sentry during unit tests — keeps test output clean and
// avoids side-effects from OTel hooks in Jest. In all other environments
// (dev, staging, production) the SDK runs; when SENTRY_DSN is absent it
// no-ops transparently (no events sent, no crash).
if (process.env.NODE_ENV !== 'test') {
  Sentry.init({
    // dsn omitted — SDK auto-reads process.env.SENTRY_DSN.
    // When unset the SDK no-ops (credential-independent build).

    // environment omitted — SDK auto-reads process.env.SENTRY_ENVIRONMENT.

    // Tracing disabled — omit tracesSampleRate entirely (do NOT set 0).

    // dataCollection key omitted — adding it (even {}) opts into permissive
    // capture for all categories (SDK doc gotcha #5). Conservative default.

    sendDefaultPii: false,

    // Defense-in-depth PII scrub: strip user identity fields and request
    // body/cookies before any event leaves the process. This is load-bearing
    // per the PII contract (AC: no student emails / message bodies / tokens).
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
}
