/**
 * supertokens.config.spec.ts — wave-84 B-2: api Session.init transport posture.
 *
 * Asserts the backend SuperTokens Session.init pins header transport via
 * getTokenTransferMethod (BOARD Option B). supertokens-node@24 has NO
 * `tokenTransferMethod` init option — the transport is the getTokenTransferMethod
 * callback returning 'header' | 'cookie' | 'any'. This test captures the config
 * object passed to Session.init and proves the callback returns 'header'.
 *
 * Test type: unit — the supertokens-node modules are mocked so no core service
 * is required (supertokens.init would otherwise register config against the core
 * connectionURI).
 */

import { describe, expect, it, vi } from 'vitest';

const sessionInit = vi.fn((cfg?: unknown) => cfg);
const emailPasswordInit = vi.fn((cfg?: unknown) => cfg);
const emailVerificationInit = vi.fn((cfg?: unknown) => cfg);
const supertokensInit = vi.fn();

vi.mock('supertokens-node', () => ({ default: { init: (cfg: unknown) => supertokensInit(cfg) } }));
vi.mock('supertokens-node/recipe/emailpassword', () => ({
  default: { init: (cfg: unknown) => emailPasswordInit(cfg) },
}));
vi.mock('supertokens-node/recipe/emailverification', () => ({
  default: { init: (cfg: unknown) => emailVerificationInit(cfg) },
}));
vi.mock('supertokens-node/recipe/session', () => {
  class STError extends Error {
    static UNAUTHORISED = 'UNAUTHORISED';
  }
  return {
    default: {
      init: (cfg: unknown) => sessionInit(cfg),
      Error: STError,
    },
  };
});

import { initSuperTokens } from './supertokens.config';

type SessionConfig = {
  getTokenTransferMethod?: (input: unknown) => string;
};

function captureSessionConfig(): SessionConfig {
  sessionInit.mockClear();
  // Minimal stubs — the overrides are not exercised in this unit test.
  const usersService = { createUserIfNotExists: vi.fn() } as never;
  const emailService = { sendEmail: vi.fn() } as never;
  initSuperTokens(usersService, emailService);
  return (sessionInit.mock.calls[0]?.[0] ?? {}) as SessionConfig;
}

describe('api initSuperTokens — Session.init', () => {
  it('sets getTokenTransferMethod returning "header"', () => {
    const cfg = captureSessionConfig();
    expect(typeof cfg.getTokenTransferMethod).toBe('function');
    expect(
      cfg.getTokenTransferMethod?.({
        req: {},
        forCreateNewSession: true,
        userContext: {},
      }),
    ).toBe('header');
  });
});
