/**
 * ws-auth — shared WebSocket upgrade authentication helper
 *
 * Factored from MessagingGateway so that every Socket.IO namespace can
 * enforce the same SuperTokens session + email-verification check without
 * duplicating the logic.
 *
 * Usage (in any gateway's afterInit):
 *
 *   afterInit(server: Server): void {
 *     installWsAuthMiddleware(server);
 *   }
 *
 * After the middleware passes, `socket.data.userId` is guaranteed to be set
 * to the verified SuperTokens userId string.
 *
 * Security invariants (preserved from the original MessagingGateway):
 *   1. Access token extracted from httpOnly cookie `sAccessToken` first
 *      (browser same-origin path), falling back to
 *      `socket.handshake.auth.accessToken` (cross-origin / native clients).
 *   2. Session verified via `Session.getSessionWithoutRequestResponse()` — the
 *      documented SDK API for non-HTTP transports; no CSRF risk on WS upgrade.
 *   3. Email-verification claim asserted via `session.assertClaims()` —
 *      defence-in-depth: an unverified user cannot hold a socket.
 *   4. Any failure (missing token, expired, unverified) → `next(new Error('Unauthorized'))`.
 */

import { parse as parseCookie } from 'cookie';
import type { Server, Socket } from 'socket.io';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import Session from 'supertokens-node/recipe/session';

/**
 * Install the Socket.IO `io.use()` middleware that authenticates every
 * incoming connection via SuperTokens session validation.
 *
 * @param server - The raw socket.io Server instance received in `afterInit`.
 */
export function installWsAuthMiddleware(server: Server): void {
  server.use(async (socket: Socket, next: (err?: Error) => void) => {
    try {
      // --- 1. Extract access token ---

      // Primary: parse sAccessToken from handshake cookie header.
      // SuperTokens stores the access token as an httpOnly cookie named
      // 'sAccessToken'. Browsers send cookies automatically on WS upgrade
      // from a same-origin or credentialed cross-origin context.
      let accessToken: string | undefined;

      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const parsed = parseCookie(cookieHeader);
        accessToken = parsed.sAccessToken;
      }

      // Fallback: client-passed token (for cross-origin contexts where cookies
      // may be blocked, or for native / non-browser clients).
      if (!accessToken) {
        const auth = socket.handshake.auth as Record<string, unknown>;
        if (typeof auth.accessToken === 'string' && auth.accessToken.length > 0) {
          accessToken = auth.accessToken;
        }
      }

      if (!accessToken) {
        next(new Error('Unauthorized'));
        return;
      }

      // --- 2. Verify session ---
      //
      // antiCsrfToken is undefined: no CSRF risk on WS upgrade (the upgrade
      // is a one-time authenticated handshake, not a form-submittable request).
      // (See auth/supertokens.config.ts Session.init antiCsrf:'NONE' — header
      // transport is structurally CSRF-safe; this residual cookie read is the
      // documented exception, safe because the handshake is not form-submittable.)
      const session = await Session.getSessionWithoutRequestResponse(accessToken, undefined);

      // --- 3. Validate email-verification claim ---
      //
      // assertClaims throws a SuperTokensError if the claim is not satisfied,
      // which we catch below and convert to next(new Error('Unauthorized')).
      await session.assertClaims([
        EmailVerification.EmailVerificationClaim.validators.isVerified(),
      ]);

      // --- 4. Attach userId to socket.data ---
      socket.data.userId = session.getUserId();

      next();
    } catch {
      // Any SuperTokensError (invalid/expired token, claim failure) or
      // unexpected error → reject the connection.
      next(new Error('Unauthorized'));
    }
  });
}
