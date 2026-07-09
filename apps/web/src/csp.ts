/**
 * csp.ts — Content-Security-Policy for the StudyHall web SPA (wave-84 B-3/B-6).
 *
 * WHY a CSP at all: the app keeps the SuperTokens session tokens in header
 * transport (BOARD Option B — different-site web/api under up.railway.app make
 * cross-site cookies unreliable). Header transport means the access token is
 * JS-readable, so an injected script could read + exfiltrate it. The CSP is the
 * primary compensating control: it (a) blocks injected/external <script> that
 * isn't self-hosted, and (b) constrains connect-src so even a token that leaks
 * can only be POSTed back to origins we explicitly allow.
 *
 * WHY a build-time meta tag (not a response header): the deployed web app is
 * served by `serve -s apps/web/dist` (apps/web/Dockerfile) — a static file
 * server with no CSP-header hook we control. A <meta http-equiv> tag in the
 * served index.html applies the policy in the document itself. We inject it via
 * a Vite transformIndexHtml plugin so the build-time VITE_* origins (baked at
 * build time) are threaded into connect-src/img-src per environment — prod
 * build gets the prod origins, a local build gets localhost. A static
 * hand-written meta could not read the env, so the plugin is what makes the
 * policy correct in every env.
 *
 * WHY these specific external origins (B-6 REWORK — adversarial review found the
 * B-3 policy only allowed the api origin + Google Fonts, silently BLOCKING three
 * core features in prod):
 *   - Tigris object storage (VITE_STORAGE_ORIGIN): attachments + uploads +
 *     avatars. Attachment GETs are presigned Tigris URLs
 *     (useCachedAttachmentImage.fetch), uploads PUT direct to Tigris
 *     (MessageComposer.fetch), and avatars 302-redirect from
 *     {api}/users/:id/avatar to a presigned Tigris URL — Chromium enforces
 *     img-src against the REDIRECT TARGET, so the storage origin must be in BOTH
 *     img-src (avatar/attachment <img>) and connect-src (fetch GET/PUT).
 *   - LiveKit voice signaling (VITE_LIVEKIT_URL): VoiceStudyRoom's <LiveKitRoom
 *     serverUrl={url}> opens a wss connection to the server's LIVEKIT_URL — a
 *     separate *.livekit.cloud host. Missing from connect-src → voice rooms
 *     never connect. media-src blob:/mediastream: covers the WebRTC audio/
 *     screen-share media elements the SDK sources.
 *   - Sentry ingest (parsed from VITE_SENTRY_DSN): when the DSN is set, the SDK
 *     POSTs events to https://<hash>.ingest.<region>.sentry.io — that origin
 *     must be in connect-src or error reporting is blocked. When the DSN is
 *     unset the SDK no-ops and no Sentry origin is emitted.
 *
 * Meta-tag CSP cannot express frame-ancestors / report-uri; those are not
 * needed here (the api sets X-Frame-Options via helmet in wave-83, and the app
 * is not framed). Every directive below is derived EMPIRICALLY against the real
 * Vite prod build (see the per-directive notes), not guessed.
 */

/**
 * Extra build-time origins threaded into the policy (all optional — each is only
 * emitted when its env var is set at build time).
 */
export interface CspExtraOrigins {
  /** Tigris object-storage public origin, e.g. `https://fly.storage.tigris.dev`
   *  (VITE_STORAGE_ORIGIN). Added to BOTH img-src and connect-src. */
  storageOrigin?: string | undefined;
  /** LiveKit signaling wss URL, e.g. `wss://studyhall.livekit.cloud`
   *  (VITE_LIVEKIT_URL). Added to connect-src. */
  livekitUrl?: string | undefined;
  /** Sentry DSN (VITE_SENTRY_DSN). The ingest origin is parsed out of it and
   *  added to connect-src; a malformed/empty DSN contributes nothing. */
  sentryDsn?: string | undefined;
}

/**
 * Parse the Sentry ingest origin out of a DSN.
 *
 * A DSN looks like `https://<publicKey>@<host>/<projectId>`, where <host> is the
 * ingest host the browser SDK POSTs to (e.g.
 * `o123.ingest.us.sentry.io`). We emit the scheme+host origin only. Returns ''
 * for an empty/undefined/unparseable DSN (SDK no-ops → nothing to allow).
 */
export function sentryOriginFromDsn(dsn: string | undefined): string {
  const raw = (dsn ?? '').trim();
  if (!raw) {
    return '';
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return '';
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
}

/** Normalise an origin token: trim + strip any trailing slash. */
function normaliseOrigin(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '');
}

/**
 * Build the CSP policy string for a given api origin + extra build-time origins.
 *
 * @param apiOrigin  The VITE_API_ORIGIN value baked into the build (e.g.
 *   `https://api-production-b93e.up.railway.app` or `http://localhost:3001`).
 *   When empty/undefined (dev fallback where fetch is same-origin via the Vite
 *   proxy) only 'self' is emitted for the api directives. NOTE: a production
 *   `vite build` with an empty apiOrigin is a fatal misconfiguration and is
 *   rejected by cspMetaPlugin (throws) — the self-only fallback here is only
 *   valid for dev-serve / undefined-origin unit cases.
 * @param extra  Optional Tigris storage / LiveKit / Sentry origins.
 */
export function buildCsp(apiOrigin: string | undefined, extra: CspExtraOrigins = {}): string {
  // Normalise: strip trailing slash so directive tokens are clean.
  const api = normaliseOrigin(apiOrigin);
  const storageOrigin = normaliseOrigin(extra.storageOrigin);
  const livekitUrl = normaliseOrigin(extra.livekitUrl);
  const sentryOrigin = sentryOriginFromDsn(extra.sentryDsn);

  // Derive the WebSocket origin from the api https origin: Socket.IO handshakes
  // over https (XHR polling) then UPGRADES to wss for the 4 namespaces
  // (/messaging /presence /study-timer /study-room). connect-src MUST include
  // BOTH — https for the polling handshake + REST fetch, wss for the WS upgrade.
  // Missing wss silently blocks every realtime namespace.
  let wsOrigin = '';
  if (api.startsWith('https://')) {
    wsOrigin = `wss://${api.slice('https://'.length)}`;
  } else if (api.startsWith('http://')) {
    wsOrigin = `ws://${api.slice('http://'.length)}`;
  }

  // connect-src: 'self' (same-origin proxy in dev) + the api https origin
  // (REST + SuperTokens /auth + Socket.IO handshake) + the api wss origin
  // (Socket.IO WS upgrade) + the Tigris storage origin (presigned GET/PUT for
  // attachments/uploads/avatars) + the LiveKit wss origin (voice signaling) +
  // (when the DSN is set) the Sentry ingest origin (error POSTs). Deduped +
  // empties dropped.
  const connectSrc = dedupe(["'self'", api, wsOrigin, storageOrigin, livekitUrl, sentryOrigin]);

  // img-src: self (PWA icons), data: (inline SVG/data URIs), blob: (local
  // attachment previews via URL.createObjectURL in MessageComposer), the api
  // origin (avatar-redirect entrypoint / served assets), AND the Tigris storage
  // origin — Chromium enforces img-src against the 302 redirect TARGET of
  // {api}/users/:id/avatar (a presigned Tigris URL), and attachment <img> src
  // point straight at presigned Tigris URLs.
  const imgSrc = dedupe(["'self'", 'data:', 'blob:', api, storageOrigin]);

  // media-src: LiveKit renders inbound audio/screen-share through <audio>/<video>
  // elements sourced from WebRTC MediaStreams (mediastream:) and object URLs
  // (blob:). Without this, the default-src 'self' would block voice playback.
  const mediaSrc = dedupe(["'self'", 'blob:', 'mediastream:']);

  const directives: string[] = [
    // Lock everything not otherwise specified to same-origin.
    "default-src 'self'",
    // Scripts: only self-hosted bundle chunks (Vite emits hashed /assets/*.js +
    // /registerSW.js, all same-origin). NO 'unsafe-inline' for scripts — that
    // would defeat the anti-injection purpose of the whole control.
    "script-src 'self'",
    // Styles: self-hosted CSS bundle + the Google Fonts stylesheet
    // (fonts.googleapis.com). 'unsafe-inline' is required because the app uses
    // React inline style={{...}} attributes throughout (FormField, AuthLayout,
    // VerifyEmailBanner, …) and Tailwind/Vite inject runtime <style>; CSP
    // governs inline style attributes + <style> blocks. 'unsafe-inline' for
    // STYLE is low-risk (no script execution) and standard for Tailwind SPAs.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts: self + the Geist woff2 files from fonts.gstatic.com.
    "font-src 'self' https://fonts.gstatic.com",
    // Images: self / data: / blob: / api / Tigris storage (avatars + attachments).
    `img-src ${imgSrc.join(' ')}`,
    // Media: LiveKit audio/screen-share (WebRTC mediastream + blob object URLs).
    `media-src ${mediaSrc.join(' ')}`,
    // XHR/fetch/WebSocket/EventSource targets — the load-bearing directive.
    `connect-src ${connectSrc.join(' ')}`,
    // PWA service worker (registerSW.js -> /sw.js) is same-origin.
    "worker-src 'self'",
    // PWA manifest.webmanifest is same-origin.
    "manifest-src 'self'",
    // Defence-in-depth: no <base> hijack, no plugins.
    "base-uri 'self'",
    "object-src 'none'",
  ];

  return directives.join('; ');
}

/** Drop empty tokens and de-duplicate while preserving first-seen order. */
function dedupe(tokens: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of tokens) {
    if (token && !seen.has(token)) {
      seen.add(token);
      out.push(token);
    }
  }
  return out;
}

/**
 * Vite plugin: inject the CSP as a <meta http-equiv="Content-Security-Policy">
 * into index.html at build (and dev-serve) time, with the api / storage /
 * LiveKit / Sentry origins derived from the resolved VITE_* env for the active
 * mode.
 *
 * @param isProdBuild  True for a production `vite build` (command === 'build').
 *   In that case an empty VITE_API_ORIGIN is a fatal misconfiguration — a
 *   self-only policy would brick the deployed SPA (no REST, no realtime, no
 *   storage). The plugin THROWS to fail the build loudly rather than silently
 *   ship a broken policy. During dev-serve / test the fallback is tolerated.
 */
export function cspMetaPlugin(isProdBuild = false) {
  return {
    name: 'studyhall-csp-meta',
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        const apiOrigin = process.env.VITE_API_ORIGIN;

        if (isProdBuild && !normaliseOrigin(apiOrigin)) {
          throw new Error(
            'CSP build error: VITE_API_ORIGIN is empty at production build time. ' +
              'A self-only Content-Security-Policy would block the api, realtime, ' +
              'and storage — bricking the deployed SPA. Set VITE_API_ORIGIN (and ' +
              'VITE_STORAGE_ORIGIN / VITE_LIVEKIT_URL) as build-time env before ' +
              '`vite build`.',
          );
        }

        const policy = buildCsp(apiOrigin, {
          storageOrigin: process.env.VITE_STORAGE_ORIGIN,
          livekitUrl: process.env.VITE_LIVEKIT_URL,
          sentryDsn: process.env.VITE_SENTRY_DSN,
        });
        const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
        // Insert immediately after <head> so the policy applies to everything
        // that follows (fonts, scripts, styles).
        return html.replace(/<head>/i, `<head>\n    ${tag}`);
      },
    },
  };
}
