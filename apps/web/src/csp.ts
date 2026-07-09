/**
 * csp.ts — Content-Security-Policy for the StudyHall web SPA (wave-84 B-3).
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
 * a Vite transformIndexHtml plugin so VITE_API_ORIGIN (baked at build time) is
 * threaded into connect-src per environment — prod build gets the prod api
 * origin, a local build gets localhost. A static hand-written meta could not
 * read the env, so the plugin is what makes connect-src correct in every env.
 *
 * Meta-tag CSP cannot express frame-ancestors / report-uri; those are not
 * needed here (the api sets X-Frame-Options via helmet in wave-83, and the app
 * is not framed). Every directive below is derived EMPIRICALLY against the real
 * Vite prod build (see the per-directive notes), not guessed.
 */

/**
 * Build the CSP policy string for a given api origin.
 *
 * @param apiOrigin  The VITE_API_ORIGIN value baked into the build (e.g.
 *   `https://api-production-b93e.up.railway.app` or `http://localhost:3001`).
 *   When empty/undefined (dev fallback where fetch is same-origin via the Vite
 *   proxy) only 'self' is emitted for the api directives.
 */
export function buildCsp(apiOrigin: string | undefined): string {
  // Normalise: strip trailing slash so directive tokens are clean.
  const api = (apiOrigin ?? '').trim().replace(/\/+$/, '');

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
  // (Socket.IO WS upgrade). Deduped + empties dropped.
  const connectSrc = ["'self'", api, wsOrigin].filter(Boolean);

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
    // Images: self (PWA icons), data: (inline SVG/data URIs), blob: (local
    // attachment previews via URL.createObjectURL in MessageComposer), and the
    // api origin (avatars / served attachments).
    ["img-src 'self' data: blob:", api]
      .filter(Boolean)
      .join(' '),
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

/**
 * Vite plugin: inject the CSP as a <meta http-equiv="Content-Security-Policy">
 * into index.html at build (and dev-serve) time, with connect-src derived from
 * the resolved VITE_API_ORIGIN for the active mode.
 */
export function cspMetaPlugin() {
  return {
    name: 'studyhall-csp-meta',
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        const apiOrigin = process.env.VITE_API_ORIGIN;
        const policy = buildCsp(apiOrigin);
        const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
        // Insert immediately after <head> so the policy applies to everything
        // that follows (fonts, scripts, styles).
        return html.replace(/<head>/i, `<head>\n    ${tag}`);
      },
    },
  };
}
