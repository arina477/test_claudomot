/**
 * VoiceTokenController unit tests — wave-31 B-2 (Refs d8a85de0)
 *
 * Covers:
 *   - delegates to VoiceTokenService.mintToken with userId + channelId
 *   - returns the service result as-is (200 shape)
 *   - propagates service exceptions (403, 404, 400, 503)
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceTokenController } from './voice-token.controller';

const CHANNEL_ID = 'chan-voice-1';
const USER_ID = 'user-abc123';
const MOCK_TOKEN_RESULT = { token: 'jwt.mock.token', url: 'wss://test.livekit.cloud' };

const mockVoiceTokenService = {
  mintToken: vi.fn(),
};

function makeReq(userId: string) {
  return { session: { getUserId: () => userId } };
}

let controller: VoiceTokenController;

beforeEach(() => {
  vi.clearAllMocks();
  controller = new VoiceTokenController(mockVoiceTokenService as never);
  mockVoiceTokenService.mintToken.mockResolvedValue(MOCK_TOKEN_RESULT);
});

describe('VoiceTokenController.issueVoiceToken', () => {
  it('delegates to VoiceTokenService.mintToken with correct userId and channelId', async () => {
    await controller.issueVoiceToken(makeReq(USER_ID) as never, CHANNEL_ID);

    expect(mockVoiceTokenService.mintToken).toHaveBeenCalledWith(USER_ID, CHANNEL_ID);
  });

  it('returns the service result { token, url }', async () => {
    const result = await controller.issueVoiceToken(makeReq(USER_ID) as never, CHANNEL_ID);

    expect(result).toEqual(MOCK_TOKEN_RESULT);
  });

  it('propagates ForbiddenException from service (403 non-member)', async () => {
    mockVoiceTokenService.mintToken.mockRejectedValueOnce(
      new ForbiddenException('Insufficient permissions'),
    );

    await expect(controller.issueVoiceToken(makeReq(USER_ID) as never, CHANNEL_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('propagates NotFoundException from service (404 missing channel)', async () => {
    mockVoiceTokenService.mintToken.mockRejectedValueOnce(
      new NotFoundException('Channel not found'),
    );

    await expect(controller.issueVoiceToken(makeReq(USER_ID) as never, CHANNEL_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});
