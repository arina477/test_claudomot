import helmet from 'helmet';

/**
 * Shared helmet configuration for the StudyHall API (wave-83 B-2).
 *
 * Emits only the SAFE, flat, on-by-default security headers:
 *   - Strict-Transport-Security (HSTS): 180d, includeSubDomains, NO preload
 *     (preload is deliberately off for reversibility — preload lists are hard
 *     to exit).
 *   - X-Content-Type-Options: nosniff
 *   - X-Frame-Options: DENY
 *   - Referrer-Policy: strict-origin-when-cross-origin
 * plus removal of X-Powered-By (helmet's xPoweredBy middleware runs by default).
 *
 * LOAD-BEARING — EVERY cross-origin-affecting helmet default is explicitly
 * fenced OFF: CSP, CORP, COEP, COOP, and Origin-Agent-Cluster. StudyHall's
 * web (web-production-*) and api (api-production-*) are DIFFERENT Railway origins,
 * and helmet's defaults for these headers would silently break (or subtly
 * constrain) the cross-origin credentialed JSON fetch + SuperTokens
 * cookie/CORS/popup negotiation:
 *   - contentSecurityPolicy default (default-src 'self') blocks cross-origin.
 *   - crossOriginResourcePolicy default ('same-origin') blocks the web reading
 *     API responses cross-origin.
 *   - crossOriginEmbedderPolicy default would require CORP on every subresource.
 *   - crossOriginOpenerPolicy default ('same-origin') severs the browsing-context
 *     group between an opener and any popup/top-level navigation on the API origin
 *     — a latent break for any popup/OAuth/SuperTokens-window flow.
 *   - originAgentCluster default ('?1') is a process-isolation hint; harmless but
 *     fenced for consistency with the rest of the cross-origin set.
 * They MUST stay `false`.
 *
 * helmet is v8.2.0 — option names verified against the installed type defs:
 * `hsts` (alias of strictTransportSecurity), `noSniff` (alias of
 * xContentTypeOptions), `xFrameOptions: { action: 'deny' }`, `referrerPolicy`.
 *
 * Exported (not inlined in main.ts) so the security-headers spec asserts the
 * REAL production config, not a drifting copy.
 */
export function securityHeaders(): ReturnType<typeof helmet> {
  return helmet({
    // HSTS: 180 days (15552000s), includeSubDomains, preload OFF (reversibility).
    // includeSubDomains is safe on the current *.up.railway.app topology because
    // preload is off: it pins only subdomains OF the api host, not sibling
    // web-production-*. A future move to a custom apex domain must re-evaluate.
    hsts: { maxAge: 15_552_000, includeSubDomains: true, preload: false },
    // X-Content-Type-Options: nosniff
    noSniff: true,
    // X-Frame-Options: DENY
    xFrameOptions: { action: 'deny' },
    // Referrer-Policy: strict-origin-when-cross-origin
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // FENCED OFF — see module docstring. These break (or subtly constrain) the
    // cross-origin credentialed web→api flow. Do NOT enable without re-proving
    // CORS + the SuperTokens popup/cookie negotiation.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    // X-Powered-By removal is on by default (helmet.xPoweredBy); left implicit.
  });
}
