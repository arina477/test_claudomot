/**
 * PrivacyController unit tests — wave-35 privacy regression.
 *
 * Covers:
 *   - PUT /profile/privacy: invalid enum → 400 (BadRequestException), no service call
 *   - PUT /profile/privacy: missing required fields → 400
 *   - PUT /profile/privacy: valid body → 200, delegates to privacyService.updatePrivacy
 *   - PUT /profile/privacy: userId is derived from session (not body) — structural scoping proof
 *   - GET /profile/privacy: delegates to privacyService.getPrivacy
 *
 * NestJS DI (Test.createTestingModule) requires emitDecoratorMetadata which
 * esbuild/vitest does not emit, so services are wired via direct construction
 * with vi.fn() mocks — mirrors the pattern in profile.controller.spec.ts.
 */

import { BadRequestException } from '@nestjs/common';
import type { PrivacySettingsResponse } from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountDataService } from './account-data.service';
import type { AccountDeletionService } from './account-deletion.service';
import type { AppendPrivacyEventService } from './append-privacy-event.service';
import { PrivacyController } from './privacy.controller';
import type { PrivacyService } from './privacy.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal session-augmented request — mirrors SessionAugmentedRequest interface. */
function makeReq(userId = 'ctrl-user-1') {
  return { session: { getUserId: () => userId } };
}

const mockPrivacyResult: PrivacySettingsResponse = {
  profileVisibility: 'everyone',
  whoCanDm: 'everyone',
  showPresence: true,
};

const mockPrivacyUpdated: PrivacySettingsResponse = {
  profileVisibility: 'nobody',
  whoCanDm: 'server-members',
  showPresence: false,
};

function makeController() {
  const privacyService = {
    getPrivacy: vi.fn().mockResolvedValue(mockPrivacyResult),
    updatePrivacy: vi.fn().mockResolvedValue(mockPrivacyUpdated),
  };
  const accountDataService = {
    getAccountData: vi.fn().mockResolvedValue({
      profile: {
        userId: 'ctrl-user-1',
        email: 'ctrl@test.local',
        displayName: null,
        username: null,
        avatarUrl: null,
        accentColor: null,
      },
      memberships: [],
      activitySummary: { serversJoined: 0, accountCreatedAt: new Date().toISOString() },
    }),
    exportAccountData: vi.fn().mockResolvedValue({
      profile: {
        userId: 'ctrl-user-1',
        email: 'ctrl@test.local',
        displayName: null,
        username: null,
        avatarUrl: null,
        accentColor: null,
      },
      memberships: [],
      activitySummary: { serversJoined: 0, accountCreatedAt: new Date().toISOString() },
    }),
  };
  const accountDeletionService = {
    deleteAccount: vi.fn().mockResolvedValue({ status: 'deleted' }),
  };
  const appendPrivacyEventService = {
    listForActor: vi.fn().mockResolvedValue({ events: [] }),
  };
  const controller = new PrivacyController(
    privacyService as unknown as PrivacyService,
    accountDataService as unknown as AccountDataService,
    accountDeletionService as unknown as AccountDeletionService,
    appendPrivacyEventService as unknown as AppendPrivacyEventService,
  );
  return { controller, privacyService, accountDataService, accountDeletionService };
}

// ---------------------------------------------------------------------------
// PUT /profile/privacy — validation + delegation
// ---------------------------------------------------------------------------

describe('PrivacyController.updatePrivacy — PUT /profile/privacy', () => {
  let controller: PrivacyController;
  let privacyService: ReturnType<typeof makeController>['privacyService'];

  beforeEach(() => {
    ({ controller, privacyService } = makeController());
  });

  it('throws BadRequestException (400) for invalid profileVisibility enum value — no service call', async () => {
    await expect(
      controller.updatePrivacy(
        // biome-ignore lint/suspicious/noExplicitAny: test cast
        makeReq() as any,
        { profileVisibility: 'invalid-value', whoCanDm: 'everyone' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Schema validation must short-circuit before any service call
    expect(privacyService.updatePrivacy).not.toHaveBeenCalled();
  });

  it('throws BadRequestException (400) for invalid whoCanDm enum value — no service call', async () => {
    await expect(
      controller.updatePrivacy(
        // biome-ignore lint/suspicious/noExplicitAny: test cast
        makeReq() as any,
        { profileVisibility: 'everyone', whoCanDm: 'bad-value' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(privacyService.updatePrivacy).not.toHaveBeenCalled();
  });

  it('throws BadRequestException (400) when body is empty (both profileVisibility and whoCanDm are required)', async () => {
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: test cast
      controller.updatePrivacy(makeReq() as any, {}),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(privacyService.updatePrivacy).not.toHaveBeenCalled();
  });

  it('throws BadRequestException (400) when body is null', async () => {
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: test cast
      controller.updatePrivacy(makeReq() as any, null),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException (400) when whoCanDm is missing (only profileVisibility supplied)', async () => {
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: test cast
      controller.updatePrivacy(makeReq() as any, { profileVisibility: 'nobody' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(privacyService.updatePrivacy).not.toHaveBeenCalled();
  });

  it('returns 200 PrivacySettingsResponse for valid body and delegates to privacyService.updatePrivacy', async () => {
    const validBody = {
      profileVisibility: 'nobody',
      whoCanDm: 'server-members',
      showPresence: false,
    };

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.updatePrivacy(makeReq() as any, validBody);

    expect(result).toEqual(mockPrivacyUpdated);
    expect(privacyService.updatePrivacy).toHaveBeenCalledWith('ctrl-user-1', {
      profileVisibility: 'nobody',
      whoCanDm: 'server-members',
      showPresence: false,
    });
  });

  it('accepts all three valid profileVisibility enum values', async () => {
    for (const v of ['everyone', 'server-members', 'nobody'] as const) {
      const body = { profileVisibility: v, whoCanDm: 'everyone' as const, showPresence: true };
      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: test cast
        controller.updatePrivacy(makeReq() as any, body),
      ).resolves.toBeDefined();
    }
  });

  it('accepts all three valid whoCanDm enum values', async () => {
    for (const v of ['everyone', 'server-members', 'nobody'] as const) {
      const body = { profileVisibility: 'everyone' as const, whoCanDm: v, showPresence: true };
      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: test cast
        controller.updatePrivacy(makeReq() as any, body),
      ).resolves.toBeDefined();
    }
  });

  it('accepts both showPresence boolean values (true and false)', async () => {
    for (const v of [true, false] as const) {
      const body = {
        profileVisibility: 'everyone' as const,
        whoCanDm: 'everyone' as const,
        showPresence: v,
      };
      await expect(
        // biome-ignore lint/suspicious/noExplicitAny: test cast
        controller.updatePrivacy(makeReq() as any, body),
      ).resolves.toBeDefined();
    }
  });

  it('throws BadRequestException (400) for non-boolean showPresence — no service call', async () => {
    await expect(
      controller.updatePrivacy(
        // biome-ignore lint/suspicious/noExplicitAny: test cast
        makeReq() as any,
        { profileVisibility: 'everyone', whoCanDm: 'everyone', showPresence: 'yes' },
      ),
    ).rejects.toThrow(BadRequestException);
    expect(privacyService.updatePrivacy).not.toHaveBeenCalled();
  });

  it('throws BadRequestException (400) when showPresence is missing (full-replace schema)', async () => {
    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: test cast
      controller.updatePrivacy(makeReq() as any, {
        profileVisibility: 'everyone',
        whoCanDm: 'everyone',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(privacyService.updatePrivacy).not.toHaveBeenCalled();
  });

  it('derives userId from session (not from body) — structural session-scoping proof', async () => {
    const validBody = { profileVisibility: 'everyone', whoCanDm: 'everyone', showPresence: true };

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    await controller.updatePrivacy(makeReq('session-scoped-id-99') as any, validBody);

    // The userId passed to privacyService comes from session — not from body or URL
    expect(privacyService.updatePrivacy).toHaveBeenCalledWith('session-scoped-id-99', validBody);
  });
});

// ---------------------------------------------------------------------------
// GET /profile/privacy — delegation
// ---------------------------------------------------------------------------

describe('PrivacyController.getPrivacy — GET /profile/privacy', () => {
  it('returns PrivacySettingsResponse from privacyService.getPrivacy with session userId', async () => {
    const { controller, privacyService } = makeController();

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.getPrivacy(makeReq('reader-user-42') as any);

    expect(result).toEqual(mockPrivacyResult);
    expect(privacyService.getPrivacy).toHaveBeenCalledWith('reader-user-42');
  });
});

// ---------------------------------------------------------------------------
// GET /profile/data — IDOR defense: userId comes from session, not attacker input
// ---------------------------------------------------------------------------

describe('PrivacyController.getAccountData — GET /profile/data', () => {
  it('derives userId from session (not body/query) — structural IDOR proof', async () => {
    const { controller, accountDataService } = makeController();

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    await controller.getAccountData(makeReq('session-scoped-id-99') as any);

    // An attacker-supplied id in the request body/query cannot substitute the
    // session-scoped id — the controller reads only req.session.getUserId().
    expect(accountDataService.getAccountData).toHaveBeenCalledWith('session-scoped-id-99');
    expect(accountDataService.getAccountData).toHaveBeenCalledTimes(1);
  });

  it('returns AccountDataResponse from accountDataService.getAccountData', async () => {
    const { controller, accountDataService } = makeController();

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.getAccountData(makeReq('reader-user-42') as any);

    expect(result).toEqual(expect.objectContaining({ profile: expect.any(Object) }));
    expect(accountDataService.getAccountData).toHaveBeenCalledWith('reader-user-42');
  });
});

// ---------------------------------------------------------------------------
// GET /profile/data/export — IDOR defense: userId comes from session, not attacker input
// ---------------------------------------------------------------------------

describe('PrivacyController.exportAccountData — GET /profile/data/export', () => {
  it('derives userId from session (not body/query) — structural IDOR proof', async () => {
    const { controller, accountDataService } = makeController();

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    await controller.exportAccountData(makeReq('session-scoped-id-99') as any);

    // Mirror of the getAccountData IDOR proof — exportAccountData also reads
    // only req.session.getUserId(), preventing cross-account data export.
    expect(accountDataService.exportAccountData).toHaveBeenCalledWith('session-scoped-id-99');
    expect(accountDataService.exportAccountData).toHaveBeenCalledTimes(1);
  });

  it('returns AccountDataResponse from accountDataService.exportAccountData', async () => {
    const { controller, accountDataService } = makeController();

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.exportAccountData(makeReq('exporter-user-77') as any);

    expect(result).toEqual(expect.objectContaining({ profile: expect.any(Object) }));
    expect(accountDataService.exportAccountData).toHaveBeenCalledWith('exporter-user-77');
  });
});
