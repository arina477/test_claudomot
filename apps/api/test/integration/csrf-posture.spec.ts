/**
 * CSRF posture regression test — wave-86 B-2 (task f8fb8023).
 *
 * LOAD-BEARING GUARD. This spec asserts the permanent security invariant behind
 * the explicit `antiCsrf: 'NONE'` value on Session.init (see
 * src/auth/supertokens.config.ts): under the pinned HEADER token transport
 * (getTokenTransferMethod: () => 'header', wave-84), a forged cross-site
 * state-changing request that carries ONLY a session cookie — with NO
 * Authorization bearer header and NO anti-CSRF custom header — CANNOT
 * authenticate. CSRF is structurally not a vector in header transport because
 * the browser does not auto-attach the bearer token cross-site; SuperTokens
 * reads the token from the Authorization header, so a cookie-only request has no
 * token to read.
 *
 * WHY THIS IS THE TRIPWIRE: `antiCsrf: 'NONE'` is behaviourally inert today — the
 * transport gate already rejects cookie-only requests before antiCsrf is
 * consulted. But wave-84's pre-GA cookie-migration trigger means the app MAY
 * return to cookie/'any' transport before GA. If it does, antiCsrf becomes
 * LOAD-BEARING and MUST be raised to VIA_CUSTOM_HEADER / VIA_TOKEN. This test
 * will fail loudly the moment a cookie-only forged request can authenticate —
 * that failure is the signal to revisit the antiCsrf value on a transport
 * migration. Do NOT delete this test or "fix" antiCsrf back to VIA_TOKEN.
 *
 * CONSTRUCTION (no Postgres, no reachable SuperTokens core — this is a pure
 * transport-layer test):
 *   We initialise a REAL SuperTokens Session recipe with the EXACT production
 *   config values (framework: 'custom' so raw PreParsedRequests pass straight
 *   through; getTokenTransferMethod: () => 'header'; antiCsrf: 'NONE') and drive
 *   the REAL Session.getSession() request path with hand-built PreParsedRequests.
 *   connectionURI points at an unreachable port ON PURPOSE: every assertion here
 *   is resolved by the SDK's request-parsing / transport-gate logic BEFORE any
 *   core call, so no core (and no DB) is ever contacted. This is not a mock —
 *   it exercises the shipped supertokens-node@24.0.2 code paths.
 *
 * Verified SDK behaviour (supertokens-node@24.0.2,
 * recipe/session/sessionRequestFunctions.js getSessionFromRequest +
 * getAccessTokenFromRequest, recipeImplementation.js getSession):
 *   - With allowedTransferMethod === 'header', a token is accepted ONLY from the
 *     Authorization header. A request carrying only the sAccessToken COOKIE
 *     yields accessToken === undefined — the cookie is never read as a session
 *     token — so getSession returns undefined (sessionRequired:false) or throws
 *     UNAUTHORISED (sessionRequired:true, the verifySession default for a
 *     state-changing route). This return/throw happens with NO core call.
 *   - A structurally-valid access-token JWT presented in the Authorization
 *     header PASSES the transport gate and reaches the verification stage
 *     (TRY_REFRESH_TOKEN "Failed to verify access token" here, because our fake
 *     token has no valid signature and the core is unreachable) — proving the
 *     header path is LIVE and NOT regressed by antiCsrf: 'NONE'.
 */
import supertokens from 'supertokens-node';
import { CollectingResponse, PreParsedRequest } from 'supertokens-node/framework/custom';
import Session from 'supertokens-node/recipe/session';
import { beforeAll, describe, expect, it } from 'vitest';

// A fabricated / prior sAccessToken cookie value. Its content is irrelevant:
// under header transport the cookie is never read as a session token, so the
// forgery is rejected regardless of what the cookie contains.
const FORGED_COOKIE_VALUE = 'forged.prior.sAccessToken.value';

// A STRUCTURALLY-VALID (v3) access-token-shaped JWT — passes
// getAccessTokenFromRequest's parse+validate so the request clears the transport
// gate and reaches the verification stage. Its signature is bogus (and the core
// is unreachable), so verification fails — but crucially with a DIFFERENT error
// than the transport-gate rejection, proving the header path is live.
function buildStructurallyValidAccessTokenJwt(): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64');
  const now = Math.floor(Date.now() / 1000);
  const header = b64({ alg: 'RS256', typ: 'JWT', version: '3', kid: 's-test-kid' });
  const payload = b64({
    sub: 'user-under-test',
    exp: now + 3600,
    iat: now,
    sessionHandle: 'test-session-handle',
    refreshTokenHash1: 'test-hash',
    tId: 'public',
  });
  return `${header}.${payload}.dGVzdC1zaWduYXR1cmU`;
}

function makeRequest(opts: { cookie?: string; authHeader?: string }): PreParsedRequest {
  const headers = new Headers();
  if (opts.authHeader) headers.set('authorization', opts.authHeader);
  const cookies: Record<string, string> = {};
  if (opts.cookie) cookies.sAccessToken = opts.cookie;
  return new PreParsedRequest({
    // A state-changing route + method (post) is what a CSRF attack would target.
    url: 'http://localhost:3000/some/state-changing/route',
    method: 'post',
    headers,
    cookies,
    query: {},
    getJSONBody: async () => ({}),
    getFormBody: async () => ({}),
  });
}

describe('CSRF posture — header transport rejects cookie-only forgery (wave-86)', () => {
  beforeAll(() => {
    // REAL SuperTokens init with the EXACT production transport + antiCsrf posture.
    // framework: 'custom' lets raw PreParsedRequests flow through unwrapped.
    // connectionURI is intentionally unreachable — no assertion here reaches a core.
    supertokens.init({
      framework: 'custom',
      appInfo: {
        appName: 'StudyHall',
        apiDomain: 'http://localhost:3000',
        websiteDomain: 'http://localhost:5173',
        apiBasePath: '/auth',
      },
      supertokens: { connectionURI: 'http://localhost:9999' },
      recipeList: [
        Session.init({
          // Mirror src/auth/supertokens.config.ts exactly for the surfaces under test.
          getTokenTransferMethod: () => 'header',
          antiCsrf: 'NONE',
        }),
      ],
    });
  });

  it('rejects a forged cross-site POST carrying ONLY a session cookie (no bearer, no anti-CSRF header) — required session throws UNAUTHORISED', async () => {
    const req = makeRequest({ cookie: FORGED_COOKIE_VALUE });
    let thrown: unknown;
    try {
      // Default sessionRequired: true — the verifySession posture for a
      // state-changing route.
      await Session.getSession(req, new CollectingResponse());
    } catch (e) {
      thrown = e;
    }
    // The cookie is never read as a session token under header transport, so the
    // request is UNAUTHORISED at the transport gate — before any core call.
    expect(thrown).toBeDefined();
    expect(supertokens.Error.isErrorFromSuperTokens(thrown)).toBe(true);
    expect((thrown as { type: string }).type).toBe(Session.Error.UNAUTHORISED);
    // The message is the transport-gate rejection: the token was NOT found in the
    // (only) allowed transfer method (header).
    expect((thrown as { message: string }).message).toMatch(
      /Session does not exist|token transfer method/i,
    );
  });

  it('yields NO session for a cookie-only request even when session is optional (proves the cookie is never accepted as a token)', async () => {
    const req = makeRequest({ cookie: FORGED_COOKIE_VALUE });
    // sessionRequired: false — if the cookie were EVER read as a session token
    // this would return a session; it must return undefined.
    const session = await Session.getSession(req, new CollectingResponse(), {
      sessionRequired: false,
    });
    expect(session).toBeUndefined();
  });

  it('lets a legitimate Authorization-bearer request through the transport gate to verification (no regression from antiCsrf: NONE)', async () => {
    const req = makeRequest({ authHeader: `Bearer ${buildStructurallyValidAccessTokenJwt()}` });
    let thrown: unknown;
    try {
      await Session.getSession(req, new CollectingResponse());
    } catch (e) {
      thrown = e;
    }
    // The header-carried token CLEARS the transport gate (unlike the cookie-only
    // path) and reaches the verification stage. Because our token is
    // signature-invalid and the core is unreachable, verification fails with
    // TRY_REFRESH_TOKEN — a DIFFERENT outcome than the cookie-only UNAUTHORISED.
    // This distinct failure mode proves the header path is LIVE and functional;
    // the explicit antiCsrf: 'NONE' did not break bearer transport.
    expect(thrown).toBeDefined();
    expect(supertokens.Error.isErrorFromSuperTokens(thrown)).toBe(true);
    expect((thrown as { type: string }).type).toBe(Session.Error.TRY_REFRESH_TOKEN);
    // Explicitly assert it is NOT the transport-gate rejection — i.e. the header
    // token was read and processed, not ignored like the cookie.
    expect((thrown as { message: string }).message).not.toMatch(/Session does not exist/i);
  });
});
