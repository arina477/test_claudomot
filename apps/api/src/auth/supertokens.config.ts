import { eq } from 'drizzle-orm';
import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import Session from 'supertokens-node/recipe/session';
import { db } from '../db/index';
import { users } from '../db/schema/index';
import type { EmailService } from '../email/email.service';
import type { UsersService } from '../users/users.service';

// Guard against accidental double-init (e.g. if a future refactor calls this
// from both bootstrap() and a module). The SDK itself throws on double-init, so
// this provides a clear message instead of a cryptic SDK error.
let _initialized = false;

export function initSuperTokens(usersService: UsersService, emailService: EmailService): void {
  if (_initialized) return;
  _initialized = true;

  supertokens.init({
    framework: 'express',
    appInfo: {
      appName: 'StudyHall',
      apiDomain: process.env.API_ORIGIN ?? 'http://localhost:3000',
      websiteDomain: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
      apiBasePath: '/auth',
    },
    supertokens: {
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI ?? 'http://localhost:3567',
      // exactOptionalPropertyTypes: omit apiKey entirely when undefined rather than passing undefined
      ...(process.env.SUPERTOKENS_API_KEY !== undefined
        ? { apiKey: process.env.SUPERTOKENS_API_KEY }
        : {}),
    },
    recipeList: [
      EmailPassword.init({
        override: {
          functions: (original) => ({
            ...original,
            signUp: async (input) => {
              const result = await original.signUp(input);
              if (result.status === 'OK') {
                // G-1: insert users row inside the signUp override.
                // If the DB insert fails, the thrown error propagates and
                // the request fails — no orphan auth user proceeds.
                await usersService.createUserIfNotExists({
                  id: result.user.id,
                  email: result.user.emails[0] ?? '',
                });
              }
              return result;
            },
            // RE-AUTH BLOCK door (i): signIn override.
            //
            // After the original signIn returns OK we look up the local users
            // row. If deleted_at IS NOT NULL the account has been soft-deleted;
            // we return WRONG_CREDENTIALS_ERROR so the login is rejected without
            // leaking deletion status to the caller. This closes the "fresh
            // login attempt after deletion" path independently of the session
            // door below.
            signIn: async (input) => {
              const result = await original.signIn(input);
              if (result.status === 'OK') {
                const rows = await db
                  .select({ deleted_at: users.deleted_at })
                  .from(users)
                  .where(eq(users.id, result.user.id))
                  .limit(1);

                if (rows[0]?.deleted_at !== null && rows[0]?.deleted_at !== undefined) {
                  return { status: 'WRONG_CREDENTIALS_ERROR' };
                }
              }
              return result;
            },
          }),
        },
        emailDelivery: {
          override: (original) => ({
            ...original,
            sendEmail: async (input) => {
              // input.type === 'PASSWORD_RESET' — only one variant for EmailPassword
              await emailService.sendEmail({
                to: input.user.email,
                subject: 'Reset your StudyHall password',
                html: `<p>Reset your password: <a href="${input.passwordResetLink}">${input.passwordResetLink}</a></p>`,
              });
            },
          }),
        },
      }),
      EmailVerification.init({
        mode: 'REQUIRED',
        emailDelivery: {
          override: (original) => ({
            ...original,
            sendEmail: async (input) => {
              // input.type === 'EMAIL_VERIFICATION'
              await emailService.sendEmail({
                to: input.user.email,
                subject: 'Verify your StudyHall email',
                html: `<p>Verify your email address: <a href="${input.emailVerifyLink}">${input.emailVerifyLink}</a></p>`,
              });
            },
          }),
        },
      }),
      Session.init({
        // ── wave-84 (BOARD Option B): explicit header transport ──────────────
        // getTokenTransferMethod: () => 'header' makes the accepted cross-origin
        // transport EXPLICIT rather than relying on the SDK default of 'any'
        // (which would honour whatever the frontend sends). web and api are
        // different SITES under the up.railway.app public suffix, so cookie-mode
        // session tokens would be cross-site (SameSite=None) and unreliable
        // (Safari ITP / Chrome 3p-cookie deprecation). Header transport is
        // SuperTokens' recommended mode for different-domain SPAs.
        //
        // NOTE (SDK verified against supertokens-node@24.0.2 TypeInput): v24 has
        // NO `tokenTransferMethod` init option — the transport is controlled via
        // this `getTokenTransferMethod` callback returning 'header' | 'cookie' |
        // 'any'. Returning 'header' here pins the server to header transport,
        // matching the frontend's Session.init({ tokenTransferMethod: 'header' }).
        getTokenTransferMethod: () => 'header',
        //
        // ── Access-token TTL + refresh-token rotation ────────────────────────
        // The XSS token-reuse window is shrunk by a SHORT access-token validity.
        // IMPORTANT (SDK verified): supertokens-node@24.0.2 Session.init has NO
        // `accessTokenValidity` option — access-token / refresh-token validity is
        // a SuperTokens CORE setting, configured on the self-hosted core service
        // (the `supertokens` Railway service) via the `ACCESS_TOKEN_VALIDITY`
        // env var (seconds; core default 3600). wave-84 sets ACCESS_TOKEN_VALIDITY
        // = 900 (15 min) on the core service at deploy (C-block), NOT here in the
        // SDK. This code comment documents the coupled requirement so the two are
        // not drifted apart.
        //
        // Refresh-token ROTATION is enforced by the core BY DEFAULT (rotate-on-use
        // with reuse detection): a refresh token is single-use — once the new
        // access/refresh pair is used, the old refresh token is invalidated. No
        // SDK option disables it and none is added here, so rotation stays ON.
        //
        // SameSite=None is required when the web frontend and api are on different
        // Railway subdomains (web-production-*.up.railway.app vs
        // api-production-*.up.railway.app). Cross-site requests (including
        // credentialed XHR/fetch with credentials:'include') will not attach
        // SameSite=Lax cookies — the browser silently drops them, breaking every
        // authenticated request. SameSite=None requires Secure=true (HTTPS).
        // (Retained defence-in-depth for any residual cookie use; header transport
        // is the primary path.)
        //
        // In local dev both origins are localhost so SameSite=Lax works and
        // avoids needing HTTPS on loopback. CROSS_ORIGIN_PROD is set on the
        // Railway api service to signal the cross-origin prod topology.
        cookieSameSite:
          process.env.NODE_ENV === 'production' && process.env.CROSS_ORIGIN_PROD === 'true'
            ? 'none'
            : 'lax',
        cookieSecure: process.env.NODE_ENV === 'production',
        // RE-AUTH BLOCK door (ii): session-verify override.
        //
        // We override getSession AND refreshSession so BOTH the access-token
        // verify path AND the refresh-token rotation path check deleted_at.
        //
        // Why getSession covers the verify path:
        //   Every authenticated NestJS request passes through verifySession()
        //   (in SessionNoVerifyGuard and AuthGuard), which internally calls
        //   getSession. Overriding getSession means every verify attempt for a
        //   deleted user raises UNAUTHORISED and the request is rejected with 401.
        //
        // Why refreshSession covers the refresh path:
        //   When an access token expires the client POSTs /auth/session/refresh.
        //   SuperTokens calls refreshSession internally. Without this override a
        //   deleted user holding a valid refresh token could silently obtain a new
        //   access token and continue operating. Overriding refreshSession closes
        //   that window independently — even if the revoke in deleteAccount's
        //   revokeAllSessionsForUser already invalidated the specific tokens, the
        //   override is a defence-in-depth check that fires on any future rotation
        //   attempt (e.g., tokens issued by a replayed pre-deletion refresh).
        override: {
          functions: (original) => ({
            ...original,
            getSession: async (input) => {
              const session = await original.getSession(input);
              if (session) {
                const userId = session.getUserId();
                const rows = await db
                  .select({ deleted_at: users.deleted_at })
                  .from(users)
                  .where(eq(users.id, userId))
                  .limit(1);

                if (rows[0]?.deleted_at !== null && rows[0]?.deleted_at !== undefined) {
                  throw new Session.Error({
                    message: 'Account has been deleted',
                    type: Session.Error.UNAUTHORISED,
                    payload: { clearTokens: true },
                  });
                }
              }
              return session;
            },
            refreshSession: async (input) => {
              const session = await original.refreshSession(input);
              const userId = session.getUserId();
              const rows = await db
                .select({ deleted_at: users.deleted_at })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

              if (rows[0]?.deleted_at !== null && rows[0]?.deleted_at !== undefined) {
                throw new Session.Error({
                  message: 'Account has been deleted',
                  type: Session.Error.UNAUTHORISED,
                  payload: { clearTokens: true },
                });
              }
              return session;
            },
          }),
        },
      }),
    ],
  });
}
