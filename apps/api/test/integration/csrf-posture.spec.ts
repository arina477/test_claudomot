/**
 * CSRF posture regression test — wave-86 B-2 (task f8fb8023), B-6 strengthened.
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
 * B-6 STRENGTHENING (why this is a REAL tripwire, not just green today):
 *   1. THE FORGED COOKIE IS A STRUCTURALLY-VALID access-token JWT (not the old
 *      garbage string). A malformed cookie is dropped by
 *      getAccessTokenFromRequest's parse+validate under EVERY transport, so it
 *      would keep assertion-1 green even if someone flipped the transport pin to
 *      'any' — i.e. the old test did NOT actually prove the header pin is what
 *      rejects the forgery. With a structurally-VALID cookie, the header pin is
 *      the ONLY reason the cookie is not read: flip the pin to 'any' and the same
 *      cookie WOULD be read and reach verification (a DIFFERENT error, not the
 *      transport-gate UNAUTHORISED). See the 'any'-transport control block below,
 *      which asserts exactly that — so a pin flip makes an assertion FAIL.
 *   2. THE TRANSPORT + antiCsrf VALUES ARE IMPORTED FROM PROD (CSRF_POSTURE in
 *      supertokens.config.ts), not hand-copied. A prod transport-method change
 *      breaks this test automatically instead of leaving a stale green mirror.
 *
 * CONSTRUCTION (no Postgres, no reachable SuperTokens core — this is a pure
 * transport-layer test):
 *   We initialise a REAL SuperTokens Session recipe with the EXACT production
 *   config values (framework: 'custom' so raw PreParsedRequests pass straight
 *   through; getTokenTransferMethod + antiCsrf sourced from the shared
 *   CSRF_POSTURE const) and drive the REAL Session.getSession() request path with
 *   hand-built PreParsedRequests. connectionURI points at an unreachable port ON
 *   PURPOSE: every assertion here is resolved by the SDK's request-parsing /
 *   transport-gate logic BEFORE any core call, so no core (and no DB) is ever
 *   contacted. This is not a mock — it exercises the shipped
 *   supertokens-node@24.0.2 code paths.
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
 *   - With allowedTransferMethod === 'any', the SAME cookie IS read: a
 *     structurally-valid access-token JWT in the cookie CLEARS the transport gate
 *     and reaches verification (TRY_REFRESH_TOKEN here — bogus signature, core
 *     unreachable). This is the control that proves the header pin is what
 *     rejects the cookie in the header block above.
 *   - A structurally-valid access-token JWT presented in the Authorization
 *     header PASSES the transport gate and reaches the verification stage
 *     (TRY_REFRESH_TOKEN "Failed to verify access token" here, because our fake
 *     token has no valid signature and the core is unreachable) — proving the
 *     header path is LIVE and NOT regressed by antiCsrf: 'NONE'.
 */
import supertokens from 'supertokens-node';
import { CollectingResponse, PreParsedRequest } from 'supertokens-node/framework/custom';
import Session from 'supertokens-node/recipe/session';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CSRF_POSTURE } from '../../src/auth/supertokens.config';

// Enable the SDK's testing backdoor so the internal reset() functions are
// permitted between the two transport-variant init blocks below (they throw
// unless TEST_MODE === 'testing'). Scoped to this process; this is the only
// integration spec that initialises SuperTokens, so it does not affect others.
process.env.TEST_MODE = 'testing';

/**
 * Tear the SuperTokens singleton fully down so a second init (a different
 * transport pin) can run in the SAME vitest process (integration specs share one
 * fork — vitest.integration.config.ts pool.singleFork). The public wrapper does
 * NOT expose reset(); the standard SuperTokens test-suite pattern is to call the
 * internal recipe reset() functions. We reset the recipe we explicitly init
 * (Session) plus the recipes the SDK AUTO-initialises (AccountLinking,
 * MultiTenancy, UserMetadata), then the core SuperTokens singleton (which also
 * resets OAuth2/OpenId/JWT/Querier). Reset order: recipes first, singleton last.
 */
function resetSuperTokens(): void {
  const resetOne = (mod: string) => {
    // Deep internal build path — no published types; reset() is the SDK's own
    // test-only teardown (permitted because TEST_MODE === 'testing' above).
    const r = (require(mod).default as { reset?: () => void }).reset;
    if (typeof r === 'function') r();
  };
  resetOne('supertokens-node/lib/build/recipe/session/recipe');
  resetOne('supertokens-node/lib/build/recipe/accountlinking/recipe');
  resetOne('supertokens-node/lib/build/recipe/multitenancy/recipe');
  resetOne('supertokens-node/lib/build/recipe/usermetadata/recipe');
  resetOne('supertokens-node/lib/build/supertokens');
}

// A STRUCTURALLY-VALID (v3) access-token-shaped JWT. Used BOTH as the forged
// cookie value AND as the legitimate bearer token. Being structurally valid is
// LOAD-BEARING: it survives getAccessTokenFromRequest's parse+validate, so
// whether it is read at all is decided PURELY by the transport gate — not by a
// malformed-token drop. Under 'header' transport the cookie is still never read
// (transport gate); under 'any' the same cookie IS read (control block). Its
// signature is bogus (and the core is unreachable), so verification fails with
// TRY_REFRESH_TOKEN — a DIFFERENT error than the transport-gate UNAUTHORISED,
// which is exactly what lets us distinguish "cookie ignored" from "cookie read".
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

// A single structurally-valid token reused as both the forged cookie and the
// legitimate bearer, so the ONLY variable between the header block's rejection
// and the 'any' block's acceptance is the transport pin.
const FORGED_COOKIE_VALUE = buildStructurallyValidAccessTokenJwt();

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

function initSuperTokensWith(tokenTransferMethod: 'header' | 'cookie' | 'any'): void {
  supertokens.init({
    framework: 'custom',
    appInfo: {
      appName: 'StudyHall',
      apiDomain: 'http://localhost:3000',
      websiteDomain: 'http://localhost:5173',
      apiBasePath: '/auth',
    },
    // Intentionally unreachable — no assertion here reaches a core.
    supertokens: { connectionURI: 'http://localhost:9999' },
    recipeList: [
      Session.init({
        getTokenTransferMethod: () => tokenTransferMethod,
        // antiCsrf sourced from PROD — the value under guard.
        antiCsrf: CSRF_POSTURE.antiCsrf,
      }),
    ],
  });
}

describe('CSRF posture — header transport rejects cookie-only forgery (wave-86)', () => {
  beforeAll(() => {
    // REAL SuperTokens init with the EXACT production transport + antiCsrf posture,
    // sourced from the shared CSRF_POSTURE const so a prod transport change breaks
    // this suite. framework: 'custom' lets raw PreParsedRequests flow through
    // unwrapped; connectionURI is intentionally unreachable.
    //
    // CSRF_POSTURE.tokenTransferMethod is 'header' in prod. If prod flips it to
    // 'any', the first two assertions below FAIL — the structurally-valid cookie
    // would then be READ (reaching verification / TRY_REFRESH_TOKEN) instead of
    // ignored (UNAUTHORISED at the transport gate). That is the tripwire firing.
    initSuperTokensWith(CSRF_POSTURE.tokenTransferMethod);
  });

  afterAll(() => {
    // Tear down the singleton so the 'any'-transport control block can re-init.
    resetSuperTokens();
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
    // The (structurally-valid) cookie is never read as a session token under
    // header transport, so the request is UNAUTHORISED at the transport gate —
    // before any core call. Under 'any' transport this same cookie would instead
    // be READ and fail later with TRY_REFRESH_TOKEN, so this assertion is
    // header-pin-dependent: a flip to 'any' breaks it.
    expect(thrown).toBeDefined();
    expect(supertokens.Error.isErrorFromSuperTokens(thrown)).toBe(true);
    expect((thrown as { type: string }).type).toBe(Session.Error.UNAUTHORISED);
    // The message is the transport-gate rejection: the token was NOT found in the
    // (only) allowed transfer method (header) — NOT a verification failure.
    expect((thrown as { message: string }).message).toMatch(
      /Session does not exist|token transfer method/i,
    );
    // Explicitly assert it did NOT reach verification. Under 'any' transport the
    // valid cookie WOULD reach verification and this negative assertion would
    // FAIL — pinning the header pin's load-bearing role.
    expect((thrown as { type: string }).type).not.toBe(Session.Error.TRY_REFRESH_TOKEN);
  });

  it('yields NO session for a cookie-only request even when session is optional (proves the cookie is never accepted as a token)', async () => {
    const req = makeRequest({ cookie: FORGED_COOKIE_VALUE });
    // sessionRequired: false — if the cookie were EVER read as a session token
    // this would attempt verification (throwing TRY_REFRESH_TOKEN, as the 'any'
    // control proves); under header transport it must return undefined instead.
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

/**
 * CONTROL BLOCK — proves the header pin is LOAD-BEARING.
 *
 * This block re-inits SuperTokens with the SAME structurally-valid cookie but
 * transport pinned to 'any' (the SDK default, and the value a pre-GA cookie
 * migration would restore). Under 'any', the cookie IS read as a session token
 * and reaches verification — failing with TRY_REFRESH_TOKEN, NOT the
 * transport-gate UNAUTHORISED seen under 'header'.
 *
 * Together with the header block above, this is the tripwire: the ONLY thing
 * that changes the cookie-only forgery from "read → TRY_REFRESH_TOKEN" to
 * "ignored → UNAUTHORISED" is the transport pin. So a prod flip of
 * CSRF_POSTURE.tokenTransferMethod from 'header' to 'any' (or 'cookie') makes the
 * header block's assertions FAIL — which is exactly the signal that antiCsrf must
 * be revisited (raised from 'NONE' to VIA_CUSTOM_HEADER / VIA_TOKEN).
 */
describe("CSRF posture — control: under 'any' transport the SAME cookie IS read (header pin is load-bearing)", () => {
  beforeAll(() => {
    initSuperTokensWith('any');
  });

  afterAll(() => {
    resetSuperTokens();
  });

  it("reads the structurally-valid cookie under 'any' transport — reaches verification (TRY_REFRESH_TOKEN), NOT the transport-gate UNAUTHORISED", async () => {
    const req = makeRequest({ cookie: FORGED_COOKIE_VALUE });
    let thrown: unknown;
    try {
      await Session.getSession(req, new CollectingResponse());
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeDefined();
    expect(supertokens.Error.isErrorFromSuperTokens(thrown)).toBe(true);
    // Under 'any' transport the cookie is READ and reaches verification: the
    // failure is TRY_REFRESH_TOKEN (bogus signature / unreachable core), the
    // SAME outcome as the legitimate bearer path — proving the cookie was NOT
    // gated out. Contrast the header block, where the identical cookie yields
    // UNAUTHORISED at the transport gate. This is the load-bearing difference the
    // header pin provides.
    expect((thrown as { type: string }).type).toBe(Session.Error.TRY_REFRESH_TOKEN);
    expect((thrown as { type: string }).type).not.toBe(Session.Error.UNAUTHORISED);
  });
});
