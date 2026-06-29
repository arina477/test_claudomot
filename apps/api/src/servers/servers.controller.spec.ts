import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ServerDetail, ServerResponse, ServerSummary } from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServersController } from './servers.controller';

// ---------------------------------------------------------------------------
// Minimal request helper
// ---------------------------------------------------------------------------

function makeReq(userId = 'user-abc') {
  return { session: { getUserId: () => userId } };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockServerResponse: ServerResponse = {
  id: 'server-1',
  name: 'Study Hall',
  ownerId: 'user-abc',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockSummaries: ServerSummary[] = [
  { id: 'server-1', name: 'Study Hall', ownerId: 'user-abc' },
];

const mockDetail: ServerDetail = {
  server: { id: 'server-1', name: 'Study Hall', ownerId: 'user-abc' },
  categories: [
    {
      id: 'cat-1',
      name: 'General',
      position: 0,
      channels: [{ id: 'ch-1', name: 'general', type: 'text', isPrivate: false, position: 0 }],
    },
  ],
};

// ---------------------------------------------------------------------------
// Controller factory — bypasses NestJS DI (vitest does not emit decoratorMetadata)
// ---------------------------------------------------------------------------

function makeController() {
  const serversService = {
    createServer: vi.fn<() => Promise<ServerResponse>>(),
    findMyServers: vi.fn<() => Promise<ServerSummary[]>>(),
    findServerDetail: vi.fn<() => Promise<ServerDetail>>(),
  };
  // biome-ignore lint/suspicious/noExplicitAny: test mock — full type not needed
  const controller = new ServersController(serversService as any);
  return { controller, serversService };
}

// ---------------------------------------------------------------------------
// POST /servers
// ---------------------------------------------------------------------------

describe('ServersController.createServer', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns 201 ServerResponse for valid input', async () => {
    serversService.createServer.mockResolvedValue(mockServerResponse);

    const result = await controller.createServer(makeReq(), { name: 'Study Hall' });

    expect(result).toEqual(mockServerResponse);
    expect(serversService.createServer).toHaveBeenCalledWith('user-abc', 'Study Hall');
  });

  it('trims whitespace from name via Zod', async () => {
    serversService.createServer.mockResolvedValue(mockServerResponse);

    await controller.createServer(makeReq(), { name: '  Study Hall  ' });

    // CreateServerSchema uses .trim(), so service receives the trimmed name
    expect(serversService.createServer).toHaveBeenCalledWith('user-abc', 'Study Hall');
  });

  it('throws BadRequestException (400) for missing name', async () => {
    await expect(controller.createServer(makeReq(), {})).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException (400) for empty string name', async () => {
    await expect(controller.createServer(makeReq(), { name: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException (400) for name exceeding 100 chars', async () => {
    await expect(controller.createServer(makeReq(), { name: 'a'.repeat(101) })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException (400) when body is not an object', async () => {
    await expect(controller.createServer(makeReq(), null)).rejects.toThrow(BadRequestException);
  });
});

// ---------------------------------------------------------------------------
// GET /servers
// ---------------------------------------------------------------------------

describe('ServersController.listServers', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns list of ServerSummary for the calling user', async () => {
    serversService.findMyServers.mockResolvedValue(mockSummaries);

    const result = await controller.listServers(makeReq());

    expect(result).toEqual(mockSummaries);
    expect(serversService.findMyServers).toHaveBeenCalledWith('user-abc');
  });

  it('returns empty array when user has no servers', async () => {
    serversService.findMyServers.mockResolvedValue([]);

    const result = await controller.listServers(makeReq());

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /servers/:id
// ---------------------------------------------------------------------------

describe('ServersController.getServerDetail', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns ServerDetail for a member', async () => {
    serversService.findServerDetail.mockResolvedValue(mockDetail);

    const result = await controller.getServerDetail(makeReq(), 'server-1');

    expect(result).toEqual(mockDetail);
    expect(serversService.findServerDetail).toHaveBeenCalledWith('user-abc', 'server-1');
  });

  it('propagates NotFoundException (404) from service', async () => {
    serversService.findServerDetail.mockRejectedValue(new NotFoundException('Server not found'));

    await expect(controller.getServerDetail(makeReq(), 'ghost-server')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('propagates ForbiddenException (403) from service', async () => {
    serversService.findServerDetail.mockRejectedValue(
      new ForbiddenException('Not a member of this server'),
    );

    await expect(controller.getServerDetail(makeReq(), 'server-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
