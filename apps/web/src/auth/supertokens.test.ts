/**
 * supertokens.test.ts — wave-84 B-3: web Session.init transport posture.
 *
 * Asserts the frontend SuperTokens Session.init sets tokenTransferMethod:'header'
 * (BOARD Option B — explicit header transport for the different-site web/api
 * topology). The frontend is the side that SELECTS the transport, so this option
 * being present is what pins the app to header mode.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sessionInit = vi.fn((cfg?: unknown) => cfg);
const emailPasswordInit = vi.fn((_cfg?: unknown) => ({}));
const emailVerificationInit = vi.fn((_cfg?: unknown) => ({}));
const superTokensInit = vi.fn();

vi.mock('supertokens-auth-react', () => ({
  default: { init: (cfg: unknown) => superTokensInit(cfg) },
}));
vi.mock('supertokens-auth-react/recipe/emailpassword', () => ({
  default: { init: (cfg: unknown) => emailPasswordInit(cfg) },
}));
vi.mock('supertokens-auth-react/recipe/emailverification', () => ({
  default: { init: (cfg: unknown) => emailVerificationInit(cfg) },
}));
vi.mock('supertokens-auth-react/recipe/session', () => ({
  default: { init: (cfg: unknown) => sessionInit(cfg) },
}));

import { initSuperTokens } from './supertokens';

beforeEach(() => {
  sessionInit.mockClear();
  superTokensInit.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('web initSuperTokens', () => {
  it("Session.init is called with tokenTransferMethod: 'header'", () => {
    initSuperTokens();
    expect(sessionInit).toHaveBeenCalledTimes(1);
    expect(sessionInit).toHaveBeenCalledWith(
      expect.objectContaining({ tokenTransferMethod: 'header' }),
    );
  });

  it('registers all three recipes (EmailPassword, EmailVerification, Session)', () => {
    initSuperTokens();
    expect(superTokensInit).toHaveBeenCalledTimes(1);
    const cfg = superTokensInit.mock.calls[0]?.[0] as { recipeList: unknown[] };
    expect(cfg.recipeList).toHaveLength(3);
  });
});
