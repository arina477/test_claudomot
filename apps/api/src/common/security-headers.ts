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
 * LOAD-BEARING — the CSP / CORP / COEP trio is explicitly fenced OFF. StudyHall's
 * web (web-production-*) and api (api-production-*) are DIFFERENT Railway origins,
 * and helmet's defaults for these three headers would silently break the
 * cross-origin credentialed JSON fetch + SuperTokens cookie/CORS negotiation:
 *   - contentSecurityPolicy default (default-src 'self') blocks cross-origin.
 *   - crossOriginResourcePolicy default ('same-origin') blocks the web reading
 *     API responses cross-origin.
 *   - crossOriginEmbedderPolicy default would require CORP on every subresource.
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
    hsts: { maxAge: 15_552_000, includeSubDomains: true, preload: false },
    // X-Content-Type-Options: nosniff
    noSniff: true,
    // X-Frame-Options: DENY
    xFrameOptions: { action: 'deny' },
    // Referrer-Policy: strict-origin-when-cross-origin
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // FENCED OFF — see module docstring. These break the cross-origin
    // credentialed web→api flow. Do NOT enable without re-proving CORS.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    // X-Powered-By removal is on by default (helmet.xPoweredBy); left implicit.
  });
}
