/**
 * VoiceParticipantsController unit tests — wave-32 B-2 (M6 occupancy)
 *
 * Covers:
 *   - delegates to VoiceParticipantsService.listParticipants with userId + channelId
 *   - returns the service result as-is (200 shape)
 *   - propagates service exceptions (403 non-member, 400 non-voice, 503 creds-unset)
 *
 * Note: the controller is a pure pass-through — it re-throws whatever the
 * service throws. A missing channel returns 403 (uniform default-deny), never
 * 404, so there is no 404 path to assert here.
 */

import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceParticipantsController } from './voice-participants.controller';

const CHANNEL_ID = 'chan-voice-1';
const USER_ID = 'user-abc123';

const MOCK_PARTICIPANTS_RESULT = {
  count: 2,
  participants: [
    { userId: 'user-abc123', displayName: 'Alice' },
    { userId: 'user-xyz789', displayName: 'Bob' },
  ],
};

const mockVoiceParticipantsService = {
  listParticipants: vi.fn(),
};

function makeReq(userId: string) {
  return { session: { getUserId: () => userId } };
}

let controller: VoiceParticipantsController;

beforeEach(() => {
  vi.clearAllMocks();
  controller = new VoiceParticipantsController(mockVoiceParticipantsService as never);
  mockVoiceParticipantsService.listParticipants.mockResolvedValue(MOCK_PARTICIPANTS_RESULT);
});

describe('VoiceParticipantsController.listVoiceParticipants', () => {
  it('delegates to VoiceParticipantsService.listParticipants with correct userId and channelId', async () => {
    await controller.listVoiceParticipants(makeReq(USER_ID) as never, CHANNEL_ID);

    expect(mockVoiceParticipantsService.listParticipants).toHaveBeenCalledWith(USER_ID, CHANNEL_ID);
  });

  it('returns the service result { count, participants }', async () => {
    const result = await controller.listVoiceParticipants(makeReq(USER_ID) as never, CHANNEL_ID);

    expect(result).toEqual(MOCK_PARTICIPANTS_RESULT);
  });

  it('returns { count: 0, participants: [] } for empty/absent room', async () => {
    mockVoiceParticipantsService.listParticipants.mockResolvedValueOnce({
      count: 0,
      participants: [],
    });

    const result = await controller.listVoiceParticipants(makeReq(USER_ID) as never, CHANNEL_ID);

    expect(result).toEqual({ count: 0, participants: [] });
  });

  it('propagates ForbiddenException from service (403 non-member)', async () => {
    mockVoiceParticipantsService.listParticipants.mockRejectedValueOnce(
      new ForbiddenException('Insufficient permissions'),
    );

    await expect(
      controller.listVoiceParticipants(makeReq(USER_ID) as never, CHANNEL_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  it('propagates BadRequestException from service (400 non-voice channel)', async () => {
    mockVoiceParticipantsService.listParticipants.mockRejectedValueOnce(
      new BadRequestException('Participants can only be listed for voice channels'),
    );

    await expect(
      controller.listVoiceParticipants(makeReq(USER_ID) as never, CHANNEL_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('propagates ServiceUnavailableException from service (503 creds unset)', async () => {
    mockVoiceParticipantsService.listParticipants.mockRejectedValueOnce(
      new ServiceUnavailableException('Voice service is not configured'),
    );

    await expect(
      controller.listVoiceParticipants(makeReq(USER_ID) as never, CHANNEL_ID),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
